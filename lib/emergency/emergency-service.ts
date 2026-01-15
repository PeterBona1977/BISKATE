import { supabase } from "@/lib/supabase/client"
import { notificationService } from "@/lib/notifications/notification-service"

export interface EmergencyResponse {
    id: string
    emergency_id: string
    provider_id: string
    status: 'pending' | 'accepted' | 'rejected'
    quote_details: {
        price_per_hour: number
        min_hours: number
        eta: string
    }
    created_at: string
    provider?: any // Profile data
}

export interface EmergencyRequest {
    id: string
    client_id: string
    provider_id: string | null
    category: string
    service_id: string | null
    description: string | null
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
    lat: number
    lng: number
    address: string | null
    price_multiplier: number
    created_at: string
    responses?: EmergencyResponse[]
}

export class EmergencyService {
    /**
     * Create a new emergency request and broadcast to nearby providers
     */
    static async createEmergencyRequest(data: {
        clientId: string
        category: string
        serviceId?: string | null
        description?: string
        lat: number
        lng: number
        address?: string
    }): Promise<{ data: EmergencyRequest | null; error: any }> {
        try {
            const { data: request, error } = await supabase
                .from("emergency_requests")
                .insert({
                    client_id: data.clientId,
                    category: data.category,
                    service_id: data.serviceId,
                    description: data.description,
                    lat: data.lat,
                    lng: data.lng,
                    address: data.address,
                })
                .select()
                .single()

            if (error) throw error

            // Find nearby online providers (within 20km approx) that have emergency_calls enabled in their plan
            // We use a join with plan_limits to filter by features
            const radius = 0.2
            const { data: nearbyProviders, error: providerError } = await supabase
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
                .eq("role", "provider")
                .not("last_lat", "is", null)
                .not("last_lng", "is", null)
            // .gte("last_lat", data.lat - radius)
            // .lte("last_lat", data.lat + radius)
            // .gte("last_lng", data.lng - radius)
            // .lte("last_lng", data.lng + radius)

            if (providerError) {
                console.error("❌ Error finding providers:", providerError)
            } else if (nearbyProviders) {
                console.log(`📍 Found ${nearbyProviders.length} potential providers nearby. Filtering...`)

                // Filter by feature in JS
                const eligibleProviders = nearbyProviders.filter((p: any) => {
                    const features = p.plan_limits?.features
                    const hasEmergencyFeature = features && features.emergency_calls === true

                    // If a serviceId is specified, only notify providers who have that skill
                    const hasMatchingSkill = !data.serviceId || (p.skills && p.skills.includes(data.serviceId))

                    // Distance Check
                    const distance = this.calculateDistance(data.lat, data.lng, p.last_lat, p.last_lng)
                    const isWithinRadius = distance <= (p.provider_service_radius || 20)

                    console.log(`👤 Provider ${p.email} (${p.id}):`)
                    console.log(`   - Emergency Feature: ${hasEmergencyFeature} (${JSON.stringify(features)})`)
                    console.log(`   - Matching Skill: ${hasMatchingSkill} (Req: ${data.serviceId}, Skills: ${p.skills})`)
                    console.log(`   - Distance: ${distance.toFixed(2)}km (Max: ${p.provider_service_radius || 20}km)`)
                    console.log(`   - Is Eligible: ${hasEmergencyFeature && hasMatchingSkill && isWithinRadius}`)

                    return hasEmergencyFeature && hasMatchingSkill && isWithinRadius
                })

                if (eligibleProviders.length === 0) {
                    console.log("ℹ️ No eligible providers (with emergency feature) found nearby.")
                } else {
                    console.log(`✅ Broadcasting to ${eligibleProviders.length} providers.`)
                }

                // Broadcast to eligible providers
                for (const provider of eligibleProviders) {
                    await notificationService.createNotification({
                        user_id: provider.id,
                        title: "🚨 EMERGENCY CALL!",
                        message: `New emergency request for ${data.category} near you. Immediate response needed.`,
                        type: "error",
                        action_url: `/dashboard/emergency/${request.id}/respond`,
                    })
                }
            }

            return { data: request, error: null }
        } catch (err) {
            console.error("❌ Error creating emergency:", err)
            return { data: null, error: err }
        }
    }

    /**
     * Update provider online status and location
     */
    static async updateProviderStatus(
        providerId: string,
        isOnline: boolean,
        location?: { lat: number; lng: number }
    ) {
        const updates: any = { is_online: isOnline, last_active: new Date().toISOString() }
        if (location) {
            updates.last_lat = location.lat
            updates.last_lng = location.lng
        }

        return supabase.from("profiles").update(updates).eq("id", providerId)
    }

    /**
     * Provider responds to the emergency (Stage 1 of the new flow)
     */
    static async respondToEmergency(data: {
        requestId: string
        providerId: string
        quote: {
            price_per_hour: number
            min_hours: number
            eta: string
        }
    }) {
        return supabase
            .from("emergency_responses")
            .insert({
                emergency_id: data.requestId,
                provider_id: data.providerId,
                quote_details: data.quote,
                status: 'pending'
            })
    }

    /**
     * Get all responses for an emergency
     */
    static async getResponses(requestId: string) {
        return supabase
            .from("emergency_responses")
            .select("*, provider:profiles(*)")
            .eq("emergency_id", requestId)
    }

    /**
     * Client accepts a specific provider (Stage 2 of the new flow)
     */
    static async clientAcceptProvider(requestId: string, providerId: string) {
        // 1. Update the request with the chosen provider
        const { error: requestError } = await supabase
            .from("emergency_requests")
            .update({
                provider_id: providerId,
                status: "accepted",
                accepted_at: new Date().toISOString(),
            })
            .eq("id", requestId)

        if (requestError) throw requestError

        // 2. Update the chosen response status
        await supabase
            .from("emergency_responses")
            .update({ status: 'accepted' })
            .eq("emergency_id", requestId)
            .eq("provider_id", providerId)

        // 3. Reject other responses
        await supabase
            .from("emergency_responses")
            .update({ status: 'rejected' })
            .eq("emergency_id", requestId)
            .neq("provider_id", providerId)

        return { success: true }
    }

    /**
     * Cancel an emergency request
     */
    static async cancelEmergency(requestId: string) {
        return supabase
            .from("emergency_requests")
            .update({ status: 'cancelled' })
            .eq("id", requestId)
    }

    /**
     * Get or create a conversation for an emergency
     */
    static async getOrCreateConversation(requestId: string, clientId: string, providerId: string) {
        // Try to find existing conversation for this emergency context
        const { data: existing } = await supabase
            .from("conversations")
            .select("id")
            .eq("gig_id", requestId) // Using gig_id as the emergency context
            .eq("client_id", clientId)
            .eq("provider_id", providerId)
            .single()

        if (existing) return { data: existing, error: null }

        // Create new
        return supabase
            .from("conversations")
            .insert({
                gig_id: requestId,
                client_id: clientId,
                provider_id: providerId,
                status: 'active'
            })
            .select("id")
            .single()
    }

    /**
     * Provider accepts the emergency (LEGACY - for first-come-first-served if kept)
     */
    static async acceptEmergency(requestId: string, providerId: string) {
        return supabase
            .from("emergency_requests")
            .update({
                provider_id: providerId,
                status: "accepted",
                accepted_at: new Date().toISOString(),
            })
            .eq("id", requestId)
            .eq("status", "pending")
    }

    /**
     * Subscribe to client-side updates (tracking provider)
     */
    static subscribeToTracking(requestId: string, callback: (payload: any) => void) {
        return supabase
            .channel(`emergency_tracking:${requestId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "emergency_requests",
                    filter: `id=eq.${requestId}`,
                },
                (payload) => callback(payload.new)
            )
            .subscribe()
    }

    /**
     * Provider heartbeat/location update
     */
    static async updateLiveLocation(providerId: string, lat: number, lng: number) {
        return supabase
            .from("profiles")
            .update({
                last_lat: lat,
                last_lng: lng,
                last_active: new Date().toISOString(),
            })
            .eq("id", providerId)
    }

    /**
     * Haversine formula to calculate distance between two points in km
     */
    private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371 // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1)
        const dLon = this.deg2rad(lon2 - lon1)
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const d = R * c // Distance in km
        return d
    }

    private static deg2rad(deg: number): number {
        return deg * (Math.PI / 180)
    }
}
