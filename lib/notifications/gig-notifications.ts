import { supabase } from "@/lib/supabase/client"

export class GigNotificationService {
    /**
     * Notifies providers who offer services matching the new gig's category.
     * @param gig The newly created gig object
     */
    static async notifyMatchingProviders(gig: {
        id: string
        title: string
        category: string // This is expected to be the category ID
        subcategory?: string // This is expected to be the subcategory/service ID
        price: number
        location?: string
        lat?: number
        lng?: number
    }) {
        try {
            // 1. Identify the target category ID (service level)
            // If we use the 2-dropdown system, 'subcategory' field likely holds the Service ID (Level 2 or 3).
            // If 'subcategory' is empty, we fall back to 'category'.
            const targetCategoryId = gig.subcategory || gig.category

            if (!targetCategoryId) {
                console.warn("GigNotificationService: No category ID found for gig", gig.id)
                return
            }

            console.log(`Searching for providers with skill: ${targetCategoryId}`)

            // 2. Find providers who have this category ID in their 'skills' array
            // Note: 'skills' is a text[] (or jsonb array) in profiles.
            // We need to use the containment operator @> or check if the array contains the value.
            // Since it's likely a JSONB or Text array, we can use .contains().

            const { data: providers, error: providersError } = await supabase
                .from("profiles")
                .select("id, email, full_name, notification_preferences, last_lat, last_lng, provider_service_radius")
                .eq("is_provider", true)
                .contains("skills", [targetCategoryId])

            if (providersError) {
                console.error("Error finding matching providers:", providersError)
                return
            }

            if (!providers || providers.length === 0) {
                console.log("No matching providers found for this gig.")
                return
            }

            // 4. Filter by radius if gig has coordinates
            const filteredProviders = providers.filter(provider => {
                if (!gig.lat || !gig.lng || !provider.last_lat || !provider.last_lng) {
                    return true // Notify anyway if we don't have geo data
                }

                const distance = this.calculateDistance(gig.lat, gig.lng, provider.last_lat, provider.last_lng)
                const radius = provider.provider_service_radius || 20 // Default 20km

                return distance <= radius
            })

            if (filteredProviders.length === 0) {
                console.log("No providers found within their service radius.")
                return
            }

            console.log(`Found ${filteredProviders.length} matching providers within radius. Sending notifications...`)

            // 5. Create notifications for each provider
            const notifications = filteredProviders.map((provider) => ({
                user_id: provider.id,
                title: "Novo Gig Disponível! 🚀",
                message: `Um novo gig "${gig.title}" foi publicado na sua área de especialidade. Verifique agora!`,
                type: "gig_alert",
                read: false, // Default is false
                // metadata: { gig_id: gig.id } // If metadata column exists and supports it
            }))

            const { error: notifyError } = await supabase
                .from("notifications")
                .insert(notifications)

            if (notifyError) {
                console.error("Error creating notifications:", notifyError)
            } else {
                console.log(`Successfully sent ${notifications.length} notifications.`)
            }

            // TODO: Integration with Email (Resend) and Push Notifications would go here.
            // This requires server-side API routes or Cloud Functions for security and performance,
            // but for this client-side demo/prototype, we are just creating the DB records.

        } catch (error) {
            console.error("Unexpected error in notifyMatchingProviders:", error)
        }
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
