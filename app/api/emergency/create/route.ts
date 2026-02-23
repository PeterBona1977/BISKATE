import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { notificationService } from "@/lib/notifications/notification-service"
import { sendEmailByTrigger } from "@/lib/email/client"

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

        // Safely parse serviceId to prevent UUID caste errors and Foreign Key violations
        const cleanServiceId = !serviceId || serviceId === "null" || serviceId.length !== 36 ? null : serviceId;

        // 1. Create Request in DB (using ADMIN client to bypass RLS)
        let emergencyRequest;
        let createError;

        const payload = {
            client_id: user.id,
            category,
            service_id: cleanServiceId, // Use cleaned ID
            description,
            lat,
            lng,
            address: address || "Local",
            status: 'pending'
        };

        const res1 = await supabaseAdmin.from("emergency_requests").insert(payload).select().single();

        // 23503 = foreign_key_violation (often happens if AI sends an ID that doesn't exist in categories table)
        // 22P02 = invalid_text_representation (invalid UUID format)
        if (res1.error && (res1.error.code === '23503' || res1.error.code === '22P02')) {
            console.log("⚠️ DB Constraint Failed (Foreign Key or UUID format) for service_id. Retrying with NULL service_id.");
            payload.service_id = null; // Strip the ID
            const res2 = await supabaseAdmin.from("emergency_requests").insert(payload).select().single();
            emergencyRequest = res2.data;
            createError = res2.error;
        } else {
            emergencyRequest = res1.data;
            createError = res1.error;
        }

        if (createError) {
            console.error("🚨 DATABASE ERROR creating emergency request:")
            console.error("Error Message:", createError.message)
            console.error("Error Details:", createError.details)
            console.error("Error Hint:", createError.hint)
            console.error("Error Code:", createError.code)
            console.error("Full Error Object:", JSON.stringify(createError, null, 2))

            return NextResponse.json({
                error: "Failed to create request",
                details: createError.message,
                code: createError.code
            }, { status: 500 })
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

            const hasMatchingSkill = !cleanServiceId || (p.skills && Array.isArray(p.skills) && p.skills.includes(cleanServiceId))

            const distance = calculateDistance(lat, lng, p.last_lat, p.last_lng)
            const inRadius = distance <= (p.provider_service_radius || 20)

            console.log(`   - Provider ${p.email}: Skill=${hasMatchingSkill}, Dist=${distance.toFixed(1)}km, Radius=${p.provider_service_radius}km. Match=${hasMatchingSkill && inRadius}`)

            debugLog.push({
                email: p.email,
                eligible: hasMatchingSkill && inRadius,
                details: { hasMatchingSkill, distance, inRadius }
            })

            return hasMatchingSkill && inRadius
        }) || []

        console.log(`✅ ${eligibleProviders.length} providers passed filtering.`)

        // 3. Send Notifications via Admin Client
        const notifications = eligibleProviders.map(provider => ({
            user_id: provider.id,
            user_type: "provider", // CRITICAL: Filtered by frontend
            title: "🚨 URGENTE: Novo Pedido de Emergência!",
            message: `Serviço de ${category} próximo de si. Responda imediatamente!`,
            type: "emergency", // Use 'emergency' type for specialized UI
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

            // 4. Send Emails via Resend (Server Side Action)
            // Trigger parallel email dispatch to all matching providers
            const emailPromises = eligibleProviders.map((provider: any) =>
                sendEmailByTrigger({
                    to: provider.email,
                    trigger: "emergency_request_new",
                    variables: {
                        user_name: provider.full_name,
                        category: category,
                        address: address || "Localização atual partilhada no Mapa",
                        action_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/provider/emergency`
                    }
                })
            )

            // Execute emails rapidly in the background without waiting 
            // for all of them to finish to keep response times low
            Promise.allSettled(emailPromises).catch(console.error)
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
