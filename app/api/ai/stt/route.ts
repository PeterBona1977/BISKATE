import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

/**
 * API Route for Google Cloud Speech-to-Text (REST)
 * Provides 100% reliability by processing audio on the server-side.
 */
export async function POST(request: NextRequest) {
    try {
        const { audio, languageCode = "pt-PT" } = await request.json()

        if (!audio) {
            return NextResponse.json({ error: "Missing audio data" }, { status: 400 })
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY

        if (!apiKey) {
            console.error("❌ Missing Google API Key for STT")
            return NextResponse.json({ error: "API Key not configured" }, { status: 500 })
        }

        // Endpoint for Google Cloud Speech-to-Text
        const url = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`

        const requestBody = {
            config: {
                encoding: "WEBM_OPUS",
                sampleRateHertz: 48000,
                languageCode: languageCode,
                enableAutomaticPunctuation: true,
                model: "latest_long"
            },
            audio: {
                content: audio // Base64 string
            }
        }

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error("❌ Google STT API Error:", errorData)
            return NextResponse.json(
                { error: errorData.error?.message || "STT API Failed" },
                { status: response.status }
            )
        }

        const data = await response.json()

        // Extract the best transcription
        const transcription = data.results
            ?.map((result: any) => result.alternatives[0].transcript)
            .join("\n") || ""

        return NextResponse.json({ transcription })

    } catch (error: any) {
        console.error("❌ STT API Exception:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
