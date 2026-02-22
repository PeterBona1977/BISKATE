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
        process.env.GOOGLE_GENERATIVE_AI_API_KEY
    ].filter(Boolean) as string[]

    if (!keys || keys.length === 0) {
        throw new Error("GEMINI_API_KEY is completely missing from process.env. If you are developing locally, you MUST restart your terminal (ctrl+c and 'npm run dev') for .env.local changes to apply. If you are in production (Cloudflare/Vercel), you must add GEMINI_API_KEY to the project settings dashboard.")
    }

    const modelNames = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.5-flash-8b",
        "gemini-pro",
        "gemini-1.0-pro"
    ]
    const apiVersions = ["v1beta", "v1"]

    let lastError: Error | null = null
    let criticalError: Error | null = null
    let foundAnyModels: string[] = []

    for (const apiKey of keys) {
        // 0. High-Priority Trial: v1beta + gemini-2.0-flash, then v1beta + gemini-1.5-flash
        for (const [tryVer, tryModel] of [["v1beta", "gemini-2.0-flash"], ["v1beta", "gemini-1.5-flash"], ["v1", "gemini-1.5-flash"]]) {
            try {
                const url = `https://generativelanguage.googleapis.com/${tryVer}/models/${tryModel}:generateContent?key=${apiKey}`
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
                })
                if (res.ok) {
                    cachedConfig = { apiKey, model: tryModel, apiVersion: tryVer }
                    return cachedConfig
                } else if (res.status === 403) {
                    const errData = await res.json().catch(() => ({}))
                    const msg = errData.error?.message || "Forbidden"
                    console.error(`Gemini Key Trial Failed: ${apiKey.substring(0, 10)}... Status: 403 - ${msg}`)
                    if (msg.includes("leaked") || msg.includes("API key not valid")) {
                        criticalError = new Error(`Gemini API Key Error: ${msg}`)
                        break // Try next key
                    }
                }
            } catch (e) { /* continue */ }
        }

        // 1. Try to list models (The most reliable way)
        let listSuccess = false
        for (const listVer of ["v1beta", "v1"]) {
            try {
                const listUrl = `https://generativelanguage.googleapis.com/${listVer}/models?key=${apiKey}`
                const listRes = await fetch(listUrl)
                if (listRes.ok) {
                    const listData = await listRes.json()
                    const available = listData.models?.map((m: any) => m.name.replace("models/", "")) || []
                    if (available.length > 0) {
                        listSuccess = true
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
                } else if (listRes.status === 403) {
                    const errData = await listRes.json().catch(() => ({}))
                    const msg = errData.error?.message || "Forbidden"
                    if (msg.includes("leaked") || msg.includes("API key not valid")) {
                        criticalError = new Error(`Gemini API Key Error: ${msg}`)
                        break // Don't try other version for this bad key
                    }
                }
            } catch (e) { /* continue */ }
        }

        // If ListModels failed due to critical error on this key, skip brute force for this key
        if (criticalError && criticalError.message.includes(apiKey.substring(0, 5))) continue
        // Note: apiKey isn't in error message usually, but loop logic handles "continue" 

        // 2. Fallback to brute force trials
        // Only try brute force if ListModels didn't crash with a definite API key error
        if (!listSuccess && !criticalError) {
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

                            // Check for critical errors here too
                            if (res.status === 403 && (msg.includes("leaked") || msg.includes("API key not valid"))) {
                                criticalError = new Error(`Gemini API Key Error: ${msg}`)
                                // Break inner loops to next key
                                break
                            }
                        }
                    } catch (err: any) {
                        lastError = err
                    }
                }
                if (criticalError) break // Break version loop
            }
        }
        if (criticalError && !criticalError.message.includes("not found")) {
            // If we found a critical error like leaked key, we probably shouldn't rely on generic 404s from other keys being useful, 
            // but strictly speaking we should try all keys. 
            // We continue to next key (outer loop)
        }
    }

    // If we have a critical error (like Key Leaked), throw that instead of the last random 404
    if (criticalError) {
        throw criticalError
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
