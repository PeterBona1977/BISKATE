import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { notificationService } from "@/lib/notifications/notification-service"

// Helper for Haversine distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { category, serviceId, description, lat, lng, address } = body

        if (!category || !lat || !lng) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        console.log(`🚨 Generating Emergency: ${category} at ${lat},${lng}`)

        // 1. Create Request in DB (using ADMIN client to bypass RLS)
        const { data: emergencyRequest, error: createError } = await supabaseAdmin
            .from("emergency_requests")
            .insert({
                client_id: user.id,
                category,
                service_id: serviceId,
                description,
                lat,
                lng,
                address,
                status: 'pending'
            })
            .select()
            .single()

        if (createError) {
            console.error("Error creating emergency request:", createError)
            return NextResponse.json({ error: "Failed to create request", details: createError }, { status: 500 })
        }

        // 2. Find Providers (using ADMIN client to bypass RLS)
        // We look for online providers with a location set
        const { data: nearbyProviders, error: providerError } = await supabaseAdmin
            .from("profiles")
            .select(`
                id, 
                email, 
                full_name,
                skills,
                last_lat,
                last_lng,
                provider_service_radius,
                plan_limits:plan (features)
            `)
            .eq("is_online", true)
            .eq("is_provider", true)
            .not("last_lat", "is", null)
            .not("last_lng", "is", null)

        if (providerError) {
            console.error("Error fetching providers:", providerError)
            // Even if broadcast fails, return the request so UI can show "Created"
            return NextResponse.json({ data: emergencyRequest, warning: "Failed to fetch providers" })
        }

        const debugLog: any[] = []

        console.log(`🔍 Broadcast: Found ${nearbyProviders?.length || 0} online providers with location.`)

        const eligibleProviders = nearbyProviders?.filter((p: any) => {
            const plan = p.plan_limits as any
            const features = plan?.features
            const hasEmergencyFeature = features && features.emergency_calls === true

            const hasMatchingSkill = !serviceId || serviceId === "null" || (p.skills && Array.isArray(p.skills) && p.skills.includes(serviceId))

            const distance = calculateDistance(lat, lng, p.last_lat, p.last_lng)
            const inRadius = distance <= (p.provider_service_radius || 20)

            console.log(`   - Provider ${p.email}: Feature=${hasEmergencyFeature}, Skill=${hasMatchingSkill}, Dist=${distance.toFixed(1)}km, Radius=${p.provider_service_radius}km. Match=${hasEmergencyFeature && hasMatchingSkill && inRadius}`)

            debugLog.push({
                email: p.email,
                eligible: hasEmergencyFeature && hasMatchingSkill && inRadius,
                details: { hasEmergencyFeature, hasMatchingSkill, distance, inRadius }
            })

            return hasEmergencyFeature && hasMatchingSkill && inRadius
        }) || []

        console.log(`✅ ${eligibleProviders.length} providers passed filtering.`)

        // 3. Send Notifications via Admin Client
        const notifications = eligibleProviders.map(provider => ({
            user_id: provider.id,
            user_type: "provider", // CRITICAL: Filtered by frontend
            title: "🚨 URGENTE: Novo Pedido de Emergência!",
            message: `Serviço de ${category} próximo de si. Responda imediatamente!`,
            type: "error", // Use 'error' style for red emergency look
            data: {
                action_url: `/dashboard/provider/emergency`,
                emergency_id: emergencyRequest.id
            },
            read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }))

        if (notifications.length > 0) {
            const { error: notifyError } = await supabaseAdmin
                .from("notifications")
                .insert(notifications)

            if (notifyError) {
                console.error("Error sending notifications:", notifyError)
                debugLog.push(`Notify Error: ${notifyError.message}`)
            }
        }

        return NextResponse.json({
            data: emergencyRequest,
            broadcastCount: eligibleProviders.length,
            debugLog // Return logs to client
        })

    } catch (error) {
        console.error("Emergency API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
