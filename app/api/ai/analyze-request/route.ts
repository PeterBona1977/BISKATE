import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Setup Gemini - The Nuclear Option
const getModel = async () => {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  ].filter(Boolean) as string[]

  if (keys.length === 0) throw new Error("No AI API keys found")

  const modelNames = ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-flash-latest", "gemini-1.0-pro"]
  let lastError = null

  for (const apiKey of keys) {
    const genAI = new GoogleGenerativeAI(apiKey)
    for (const name of modelNames) {
      try {
        console.log(`[AI_DEBUG] analyze-request: Testing key ${apiKey.substring(0, 6)}... with model ${name}`)
        const model = genAI.getGenerativeModel({ model: name }, { apiVersion: 'v1' })
        // Test the model with a minimal prompt
        await model.generateContent("ping")
        console.log(`[AI_DEBUG] analyze-request: Success with model ${name}`)
        return model
      } catch (e) {
        console.warn(`[AI_DEBUG] analyze-request: Failed (${apiKey.substring(0, 6)} / ${name}):`, e)
        lastError = e
      }
    }
  }
  throw lastError || new Error("No supported Gemini models found")
}

interface AnalysisResult {
  category: string
  urgency: "low" | "medium" | "high"
  estimatedBudget: string
  suggestedProviders: string[]
  nextSteps: string[]
}

interface AIResponse {
  response: string
  analysis?: AnalysisResult
  isServiceRequest: boolean
  extractedData?: {
    title?: string
    description?: string
    category?: string
    price?: number
    location?: string
    estimated_duration?: number
    duration_unit?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory = [] } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required and must be a string" }, { status: 400 })
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set")
      // Fallback to mock if no key, but we should inform the user
    }

    const systemPrompt = `
      You are the Biskate Voice Assistant, a helpful Portuguese/English speaking AI. 
      Your goal is to assist users in describing a gig (job/service) they need.
      
      BE HELPFUL AND CONCISE. Speak naturally, like a human assistant.
      
      Extract the following data if present:
      - title: A short title for the gig
      - description: A detailed description
      - category: One of [Electrician, Plumber, Cleaning, Painting, Gardening, Transport, Technology, Others]
      - price: Numerical value in Euro
      - location: City or area
      - estimated_duration: Number
      - duration_unit: One of [hours, days, weeks]

      Respond in JSON format:
      {
        "response": "Your natural speech response to the user",
        "isServiceRequest": boolean,
        "extractedData": { ... },
        "analysis": {
          "category": "...",
          "urgency": "low/medium/high",
          "estimatedBudget": "€...",
          "suggestedProviders": ["..."],
          "nextSteps": ["..."]
        }
      }
      
      If the user is just saying hello, respond naturally and ask how you can help them find a service.
    `

    const prompt = `
      System: ${systemPrompt}
      User current message: ${message}
      Context: User is using voice to interact. Keep it conversational.
    `

    const model = await getModel()
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Clean up JSON if Gemini wraps it in markdown blocks
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const cleanedJson = jsonMatch ? jsonMatch[0] : responseText

    try {
      const aiResponse = JSON.parse(cleanedJson) as AIResponse
      return NextResponse.json(aiResponse)
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", responseText)
      return NextResponse.json({
        response: responseText,
        isServiceRequest: false
      })
    }

  } catch (error) {
    console.error("AI API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

