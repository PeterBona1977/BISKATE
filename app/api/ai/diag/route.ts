import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
    const keys = [
        { name: "GEMINI_API_KEY", value: process.env.GEMINI_API_KEY },
        { name: "GOOGLE_GENERATIVE_AI_API_KEY", value: process.env.GOOGLE_GENERATIVE_AI_API_KEY },
        { name: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", value: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY }
    ].filter(k => k.value)

    const results: any[] = []

    for (const key of keys) {
        const masked = `${key.value?.substring(0, 8)}...${key.value?.substring(key.value!.length - 4)}`
        const keyResult: any = { name: key.name, key: masked, endpoints: [] }

        for (const ver of ["v1", "v1beta"]) {
            try {
                const url = `https://generativelanguage.googleapis.com/${ver}/models?key=${key.value}`
                const res = await fetch(url)
                if (res.ok) {
                    const data = await res.json()
                    const models = data.models?.map((m: any) => m.name.replace("models/", "")) || []
                    keyResult.endpoints.push({ ver, status: "OK", models })
                } else {
                    const txt = await res.text()
                    keyResult.endpoints.push({ ver, status: res.status, error: txt })
                }
            } catch (e: any) {
                keyResult.endpoints.push({ ver, status: "ERROR", error: e.message })
            }
        }
        results.push(keyResult)
    }

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        envKeysFound: keys.length,
        results
    })
}
