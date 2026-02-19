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

    const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"]
    const apiVersions = ["v1beta", "v1"]

    let lastError = null

    for (const apiKey of keys) {
        // 1. Try to list models to find the real allowed names
        try {
            for (const ver of ["v1beta", "v1"]) {
                const listUrl = `https://generativelanguage.googleapis.com/${ver}/models?key=${apiKey}`
                const listRes = await fetch(listUrl)
                if (listRes.ok) {
                    const listData = await listRes.json()
                    const available = listData.models?.map((m: any) => m.name.replace("models/", "")) || []

                    // Prioritize flash 1.5
                    const bestModel = available.find((m: string) => m === "gemini-1.5-flash") ||
                        available.find((m: string) => m.includes("1.5-flash")) ||
                        available.find((m: string) => m.includes("1.5-pro")) ||
                        available[0]

                    if (bestModel) {
                        cachedConfig = { apiKey, model: bestModel, apiVersion: ver }
                        return cachedConfig
                    }
                }
            }
        } catch (e) {
            // ignore listing error
        }

        // 2. Fallback to exhaustive trial
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
                        const errorData = await res.json().catch(() => ({}))
                        lastError = new Error(`Gemini API Error [${name}/${ver}]: ${res.status} - ${errorData.error?.message || "Not Found"}`)
                    }
                } catch (err: any) {
                    lastError = err
                }
            }
        }
    }

    throw lastError || new Error("All Gemini connection attempts failed. Please check your API Key and Google AI Studio permissions.")
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
                    temperature: 0.2,
                    topP: 0.8,
                    topK: 40,
                }
            })
        })

        if (!res.ok) {
            const errText = await res.text()
            if (res.status === 404) cachedConfig = null // Invalidate cache on 404
            throw new Error(`Gemini REST API Error (${res.status}): ${errText}`)
        }

        const result = await res.json()
        if (!result.candidates || result.candidates.length === 0) {
            throw new Error("Gemini returned no candidates")
        }

        return result.candidates[0].content.parts[0].text
    } catch (err) {
        if (err instanceof Error && err.message.includes("404")) {
            cachedConfig = null
        }
        throw err
    }
}
