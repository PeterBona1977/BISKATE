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

            // Strict Filtering: Find providers who offer services in this category
            // 1. Get Category ID if not service provided
            let targetServiceIds: string[] = []

            if (data.serviceId) {
                targetServiceIds = [data.serviceId]
            } else if (data.category) {
                // Find category ID
                const { data: catData } = await supabase
                    .from("categories")
                    .select("id")
                    .eq("name", data.category)
                    .single()

                if (catData) {
                    // Find all services in this category (via subcategories)
                    const { data: subData } = await supabase
                        .from("subcategories")
                        .select("id")
                        .eq("category_id", catData.id)

                    if (subData && subData.length > 0) {
                        const subIds = subData.map(s => s.id)
                        const { data: servData } = await supabase
                            .from("services")
                            .select("id")
                            .in("subcategory_id", subIds)

                        if (servData) {
                            targetServiceIds = servData.map(s => s.id)
                        }
                    }
                }
            }

            // 2. Find providers with these services
            let targetProviderIds: string[] = []
            if (targetServiceIds.length > 0) {
                const { data: provServices } = await supabase
                    .from("provider_services")
                    .select("provider_id")
                    .in("service_id", targetServiceIds)

                if (provServices) {
                    targetProviderIds = [...new Set(provServices.map(ps => ps.provider_id))]
                }
            }

            console.log(`🎯 Targeting ${targetProviderIds.length} providers for category ${data.category}`)

            // 3. Find nearby online providers (within 20km approx) that have emergency_calls enabled
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
                // If we found specific providers, filter by ID
                .in("id", targetProviderIds.length > 0 ? targetProviderIds : ['no_matches_found_placeholder'])

            if (providerError) {
                console.error("❌ Error finding providers:", providerError)
            } else if (nearbyProviders) {
                console.log(`📍 Found ${nearbyProviders.length} potential providers nearby. Filtering by radius...`)

                // Filter by feature and radius in JS
                const eligibleProviders = nearbyProviders.filter((p: any) => {
                    const features = p.plan_limits?.features
                    const hasEmergencyFeature = features && features.emergency_calls === true

                    // Distance Check
                    const distance = this.calculateDistance(data.lat, data.lng, p.last_lat, p.last_lng)
                    const isWithinRadius = distance <= (p.provider_service_radius || 20)

                    return hasEmergencyFeature && isWithinRadius
                })

                if (eligibleProviders.length === 0) {
                    console.log("ℹ️ No eligible providers found nearby.")
                } else {
                    console.log(`✅ Broadcasting to ${eligibleProviders.length} providers.`)
                }

                // Broadcast to eligible providers
                // We use a Promise.all to send notifications in parallel
                await Promise.all(eligibleProviders.map(provider =>
                    notificationService.createNotification({
                        user_id: provider.id,
                        title: "🚨 EMERGENCY CALL!",
                        message: `New emergency request for ${data.category}. Immediate response needed.`,
                        type: "error",
                        action_url: `/dashboard/emergency/${request.id}/respond`,
                    })
                ))
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
        const { data: request } = await supabase
            .from("emergency_requests")
            .select("client_id, category")
            .eq("id", data.requestId)
            .single()

        const response = await supabase
            .from("emergency_responses")
            .insert({
                emergency_id: data.requestId,
                provider_id: data.providerId,
                quote_details: data.quote,
                status: 'pending'
            })
            .select()
            .single()

        if (request) {
            await notificationService.createNotification({
                user_id: request.client_id,
                title: "🚨 Nova Proposta de Emergência",
                message: `Um prestador respondeu ao seu pedido de ${request.category}.`,
                type: "info",
                user_type: "client",
                action_url: `/dashboard/emergency/${data.requestId}`
            })
        }

        return response
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

    static async clientAcceptProvider(requestId: string, providerId: string) {
        console.log(`💰 DEBITING CLIENT: Quote accepted for ${requestId}. Provider: ${providerId}`)

        const response = await fetch('/api/emergency/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, providerId })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to accept provider on server');
        }

        return { success: true }
    }

    /**
     * Cancel an emergency request
     */
    static async cancelEmergency(requestId: string) {
        // Check current status first
        const { data: req } = await supabase
            .from("emergency_requests")
            .select("status, provider_id, category, client_id")
            .eq("id", requestId)
            .single()

        if (req?.status === 'accepted' || req?.status === 'in_progress') {
            throw new Error("Cannot cancel an accepted emergency job without support intervention. Fee applies.")
        }

        const result = await supabase
            .from("emergency_requests")
            .update({ status: 'cancelled' })
            .eq("id", requestId)

        // Notify providers who responded
        const { data: responses } = await supabase
            .from("emergency_responses")
            .select("provider_id")
            .eq("emergency_id", requestId)

        if (responses && responses.length > 0) {
            await Promise.all(responses.map(r =>
                notificationService.createNotification({
                    user_id: r.provider_id,
                    title: "🚫 Emergência Cancelada",
                    message: `O cliente cancelou o pedido de emergência (${req?.category}).`,
                    type: "emergency_cancelled",
                    user_type: "provider"
                })
            ))
        }

        return result
    }

    /**
     * Mark emergency as completed
     */
    static async completeEmergency(requestId: string) {
        const { data: req } = await supabase
            .from("emergency_requests")
            .select("client_id, category, provider_id")
            .eq("id", requestId)
            .single()

        const result = await supabase
            .from("emergency_requests")
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq("id", requestId)

        if (req) {
            // Notify client
            await notificationService.createNotification({
                user_id: req.client_id,
                title: "🏁 Emergência Concluída",
                message: `O prestador marcou o serviço de ${req.category} como concluído.`,
                type: "success",
                user_type: "client",
                action_url: `/dashboard/emergency/${requestId}`
            })
        }

        return result
    }

    /**
     * Get or create a conversation for an emergency
     */
    static async getOrCreateConversation(requestId: string, clientId: string, providerId: string) {
        // 1. Try to find existing conversation linked to emergency_id and this provider
        const { data: existing } = await supabase
            .from("conversations")
            .select("id")
            .eq("emergency_id", requestId)
            .eq("provider_id", providerId)
            .maybeSingle()

        if (existing) return { data: existing, error: null }

        // 2. Create new conversation
        const { data: newConv, error: createError } = await supabase
            .from("conversations")
            .insert({
                emergency_id: requestId,
                client_id: clientId,
                provider_id: providerId,
                status: 'active'
            })
            .select("id")
            .single()

        if (createError) {
            console.error("Error creating conversation:", createError)
            return { data: null, error: createError }
        }

        // 3. Add participants
        const { error: partError } = await supabase
            .from("conversation_participants")
            .insert([
                { conversation_id: newConv.id, user_id: clientId },
                { conversation_id: newConv.id, user_id: providerId }
            ])

        if (partError) {
            console.error("Error adding participants:", partError)
        }

        return { data: newConv, error: null }
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
