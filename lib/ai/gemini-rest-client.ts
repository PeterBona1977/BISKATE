/**
 * Gemini REST Client Utility
 * Exhaustively tries multiple API keys and models using direct fetch
 * to bypass library-specific Edge Runtime issues.
 */

export interface GeminiConfig {
    apiKey: string
    model: string
    apiVersion: string
}

let cachedConfig: GeminiConfig | null = null

export async function getWorkingGeminiConfig(): Promise<GeminiConfig> {
    if (cachedConfig) return cachedConfig

    const keys = [
        process.env.GEMINI_API_KEY,
        process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    ].filter(Boolean) as string[]

    const modelNames = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.5-flash-8b",
        "gemini-pro",
        "gemini-1.0-pro"
    ]
    const apiVersions = ["v1", "v1beta"]

    let lastError = null
    let foundAnyModels: string[] = []

    for (const apiKey of keys) {
        // 0. High-Priority Trial: v1 + gemini-1.5-flash (Most stable)
        try {
            const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
            })
            if (res.ok) {
                cachedConfig = { apiKey, model: "gemini-1.5-flash", apiVersion: "v1" }
                return cachedConfig
            }
        } catch (e) { /* continue */ }

        // 1. Try to list models (The most reliable way)
        for (const listVer of ["v1", "v1beta"]) {
            try {
                const listUrl = `https://generativelanguage.googleapis.com/${listVer}/models?key=${apiKey}`
                const listRes = await fetch(listUrl)
                if (listRes.ok) {
                    const listData = await listRes.json()
                    const available = listData.models?.map((m: any) => m.name.replace("models/", "")) || []
                    if (available.length > 0) {
                        foundAnyModels = [...new Set([...foundAnyModels, ...available])]

                        const bestMatch = available.find((m: string) => m === "gemini-1.5-flash") ||
                            available.find((m: string) => m === "gemini-1.5-pro") ||
                            available.find((m: string) => m.includes("1.5-flash-latest")) ||
                            available.find((m: string) => m.includes("1.5-flash")) ||
                            available.find((m: string) => m.includes("1.5-pro")) ||
                            available.find((m: string) => m.includes("1.0-pro")) ||
                            available[0]

                        if (bestMatch) {
                            cachedConfig = { apiKey, model: bestMatch, apiVersion: listVer }
                            return cachedConfig
                        }
                    }
                }
            } catch (e) { /* continue */ }
        }

        // 2. Fallback to brute force trials
        for (const ver of apiVersions) {
            for (const name of modelNames) {
                try {
                    const url = `https://generativelanguage.googleapis.com/${ver}/models/${name}:generateContent?key=${apiKey}`
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
                    })

                    if (res.ok) {
                        cachedConfig = { apiKey, model: name, apiVersion: ver }
                        return cachedConfig
                    } else {
                        const errData = await res.json().catch(() => ({}))
                        const msg = errData.error?.message || "Not Found"
                        lastError = new Error(`Gemini [${name}/${ver}] failed: ${res.status} - ${msg}`)
                    }
                } catch (err: any) {
                    lastError = err
                }
            }
        }
    }

    const debugInfo = foundAnyModels.length > 0
        ? `Discovered ${foundAnyModels.length} models, but all failed to generate content. (${foundAnyModels.slice(0, 5).join(", ")}...)`
        : "No models were discovered with any of your API keys. Please verify your GEMINI_API_KEY in the Cloudflare/Vercel dashboard."

    throw lastError || new Error(`Universal Gemini Discovery Failed. ${debugInfo}`)
}

export async function generateGeminiContent(prompt: string, config?: GeminiConfig) {
    let attempts = 0
    let lastErr: any = null

    while (attempts < 3) {
        attempts++
        let finalConfig: GeminiConfig
        try {
            finalConfig = config || await getWorkingGeminiConfig()
        } catch (err) {
            throw err
        }

        const url = `https://generativelanguage.googleapis.com/${finalConfig.apiVersion}/models/${finalConfig.model}:generateContent?key=${finalConfig.apiKey}`

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        topP: 0.95,
                        maxOutputTokens: 1024
                    }
                })
            })

            if (!res.ok) {
                const errText = await res.text()
                // If it's a 404/403/429, invalidate cache and try again with discovery
                if (res.status === 404 || res.status === 403 || res.status === 429) {
                    console.warn(`Gemini [${finalConfig.model}/${finalConfig.apiVersion}] failed (${res.status}). Retrying discovery...`)
                    cachedConfig = null
                    lastErr = new Error(`Gemini Error (${res.status} at ${finalConfig.model}): ${errText}`)
                    continue // Try next attempt with new discovery
                }
                throw new Error(`Gemini Runtime Error (${res.status} at ${finalConfig.model}): ${errText}`)
            }

            const result = await res.json()
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text
            if (!text) throw new Error("Gemini returned empty or malformed data")

            return text
        } catch (err: any) {
            if (err.message.includes("404") || err.message.includes("403") || err.message.includes("429")) {
                cachedConfig = null
                lastErr = err
                continue
            }
            throw err
        }
    }

    throw lastErr || new Error("Failed to generate content after multiple model fallbacks.")
}
