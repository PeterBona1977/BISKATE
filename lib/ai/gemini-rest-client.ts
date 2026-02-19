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
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
        "gemini-1.5-pro-latest",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.0-pro"
    ]
    const apiVersions = ["v1beta", "v1"]

    let lastError = null
    let foundAnyModels: string[] = []

    for (const apiKey of keys) {
        // 1. Try to list models (The most reliable way)
        try {
            for (const ver of apiVersions) {
                const listUrl = `https://generativelanguage.googleapis.com/${ver}/models?key=${apiKey}`
                const listRes = await fetch(listUrl)
                if (listRes.ok) {
                    const listData = await listRes.json()
                    const available = listData.models?.map((m: any) => m.name.replace("models/", "")) || []
                    foundAnyModels = [...new Set([...foundAnyModels, ...available])]

                    const bestMatch = available.find((m: string) => m.includes("1.5-flash-latest")) ||
                        available.find((m: string) => m.includes("1.5-flash")) ||
                        available.find((m: string) => m === "gemini-pro") ||
                        available[0]

                    if (bestMatch) {
                        cachedConfig = { apiKey, model: bestMatch, apiVersion: ver }
                        return cachedConfig
                    }
                }
            }
        } catch (e) { /* continue */ }

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
                        lastError = new Error(`Attempt [${name}/${ver}] failed: ${res.status} - ${errData.error?.message || "Unknown"}`)
                    }
                } catch (err: any) {
                    lastError = err
                }
            }
        }
    }

    const debugInfo = foundAnyModels.length > 0 ? `Available in key: ${foundAnyModels.join(", ")}` : "No models found in ListModels."
    throw lastError || new Error(`All Gemini connection attempts failed. ${debugInfo}`)
}

export async function generateGeminiContent(prompt: string, config?: GeminiConfig) {
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
            if (res.status === 404) cachedConfig = null // Trigger re-discovery
            throw new Error(`Gemini Error (${res.status} at ${finalConfig.model}/${finalConfig.apiVersion}): ${errText}`)
        }

        const result = await res.json()
        if (!result.candidates || result.candidates.length === 0) {
            throw new Error("Gemini returned no candidates")
        }

        const text = result.candidates[0].content.parts[0].text
        if (!text) throw new Error("Gemini returned empty text")

        return text
    } catch (err) {
        if (err instanceof Error && err.message.includes("404")) {
            cachedConfig = null // Invalidate cache
        }
        throw err
    }
}
