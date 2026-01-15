
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    const email = 'pmbonanca@gmail.com'

    const { data: p, error: pErr } = await supabaseAdmin
        .from("profiles")
        .select(`
        id, email, is_online, is_provider, 
        last_lat, last_lng, provider_service_radius,
        plan_limits:plan (features)
    `)
        .eq('email', email)
        .single()

    if (pErr) return NextResponse.json({ error: "Profile not found", details: pErr })

    // Simulate a request at common Lisbon coords (similar to what I injected)
    const reqLat = 38.8
    const reqLng = -9.1

    const R = 6371
    const dLat = (p.last_lat - reqLat) * (Math.PI / 180)
    const dLon = (p.last_lng - reqLng) * (Math.PI / 180)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(reqLat * (Math.PI / 180)) * Math.cos(p.last_lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    const results = {
        email: p.email,
        is_online: p.is_online,
        is_provider: p.is_provider,
        coords: { lat: p.last_lat, lng: p.last_lng },
        dist_km: dist,
        radius_km: p.provider_service_radius,
        in_radius: dist <= (p.provider_service_radius || 20),
        has_emergency_feature: p.plan_limits?.features?.emergency_calls === true,
        full_plan_data: p.plan_limits
    }

    return NextResponse.json(results)
}
