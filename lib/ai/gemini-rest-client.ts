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

    const modelNames = ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-flash-latest"]
    const apiVersions = ["v1", "v1beta"]

    let lastError = null

    for (const apiKey of keys) {
        for (const name of modelNames) {
            for (const ver of apiVersions) {
                try {
                    const url = `https://generativelanguage.googleapis.com/${ver}/models/${name}:generateContent?key=${apiKey}`
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
                    })

                    if (res.ok) {
                        const data = await res.json()
                        if (data.candidates) {
                            cachedConfig = { apiKey, model: name, apiVersion: ver }
                            return cachedConfig
                        }
                    }
                } catch (err: any) {
                    lastError = err
                }
            }
        }
    }

    throw lastError || new Error("All Gemini connection attempts failed")
}

export async function generateGeminiContent(prompt: string, config?: GeminiConfig) {
    const finalConfig = config || await getWorkingGeminiConfig()
    const url = `https://generativelanguage.googleapis.com/${finalConfig.apiVersion}/models/${finalConfig.model}:generateContent?key=${finalConfig.apiKey}`

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
        throw new Error(`Gemini REST API Error (${res.status}): ${errText}`)
    }

    const result = await res.json()
    if (!result.candidates || result.candidates.length === 0) {
        throw new Error("Gemini returned no candidates")
    }

    return result.candidates[0].content.parts[0].text
}
