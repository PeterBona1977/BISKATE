import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
    try {
        const { lat, lng, address } = await req.json()
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

        if (!apiKey) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 })
        }

        let url = ""
        if (lat !== undefined && lng !== undefined) {
            url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
        } else if (address) {
            url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        } else {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
        }

        const response = await fetch(url)
        const data = await response.json()

        if (data.status === "OK" && data.results && data.results.length > 0) {
            const result = data.results[0]
            return NextResponse.json({
                address: result.formatted_address,
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
            })
        } else {
            console.error("❌ Google Geocoding API Error Response:", JSON.stringify(data))
            return NextResponse.json({
                error: data.status,
                message: data.error_message || "Geocoding failed",
                raw: data
            }, { status: 400 })
        }
    } catch (error) {
        console.error("❌ Geocoding API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
