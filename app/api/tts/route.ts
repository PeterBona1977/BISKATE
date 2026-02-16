import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

/**
 * API Route for Google Cloud Text-to-Speech
 * More reliable than server actions for production deployments
 */
export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json()

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Invalid text parameter" },
                { status: 400 }
            )
        }

        // Use Maps API key (which is unrestricted) for TTS
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY

        if (!apiKey) {
            console.error("❌ Missing Google API Key for TTS")
            return NextResponse.json(
                { error: "API Key not configured" },
                { status: 500 }
            )
        }

        // Endpoint for Google Cloud Text-to-Speech
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`

        // Configuration for "Gemini-quality" (Neural2)
        const requestBody = {
            input: {
                text: text
            },
            voice: {
                languageCode: "pt-PT",
                name: "pt-PT-Neural2-A", // 'A' is usually female, 'B' is male
                ssmlGender: "FEMALE"
            },
            audioConfig: {
                audioEncoding: "MP3",
                speakingRate: 1.0,
                pitch: 0
            }
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error("❌ Google TTS API Error:", errorData)
            return NextResponse.json(
                { error: errorData.error?.message || "TTS API Failed" },
                { status: response.status }
            )
        }

        const data = await response.json()

        // data.audioContent is the base64 encoded string
        return NextResponse.json({ audioContent: data.audioContent })

    } catch (error) {
        console.error("❌ TTS API Exception:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
