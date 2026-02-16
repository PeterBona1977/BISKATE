'use server'

/**
 * Server Action to generate speech using Google Cloud Text-to-Speech API
 * Uses the high-quality Neural2 voices ("Gemini quality")
 * 
 * NOTE: This server action may fail with 405 errors in some deployment environments.
 * For production, consider using the /api/tts API route instead.
 */
export async function generateSpeech(text: string): Promise<{ audioContent: string | null; error?: string }> {
    try {
        // Bypass this server action and delegate to API route for better compatibility
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://biskate.eu'}/api/tts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error("❌ TTS API Error:", errorData)
            return { audioContent: null, error: errorData.error || "TTS API Failed" }
        }

        const data = await response.json()
        return { audioContent: data.audioContent }

    } catch (error) {
        console.error("❌ generateSpeech Exception:", error)
        return { audioContent: null, error: "Internal Server Error" }
    }
}
