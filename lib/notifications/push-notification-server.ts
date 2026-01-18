import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { FCMEdgeClient, FCMServiceAccount } from "@/lib/fcm/edge-client"

interface FirebaseConfig {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
    serverKey?: string
    serviceAccountJson?: string
}

export class PushNotificationServiceServer {

    /**
     * Envia notificação push para todos os dispositivos ativos de um utilizador via FCM V1
     * Fully compatible with Cloudflare Edge Runtime (uses REST API + 'jose')
     */
    static async sendToUser(
        userId: string,
        title: string,
        body: string,
        data: Record<string, any> = {}
    ): Promise<{ success: number; failed: number }> {
        try {
            console.log(`📲 Preparing to send push notification to user ${userId} (V1 Edge-Compatible)`)

            // 1. Fetch active user tokens
            const supabase = getSupabaseAdmin()
            const { data: tokens, error: tokenError } = await supabase
                .from("user_device_tokens")
                .select("token, id")
                .eq("user_id", userId)
                .eq("is_active", true)

            if (tokenError) {
                console.error("❌ Error fetching device tokens:", tokenError)
                return { success: 0, failed: 0 }
            }

            if (!tokens || tokens.length === 0) {
                console.log(`ℹ️ No active device tokens found for user ${userId}`)
                return { success: 0, failed: 0 }
            }

            // 2. Fetch Firebase Configuration
            const { data: configData, error: configError } = await supabase
                .from("platform_integrations")
                .select("config, is_enabled")
                .eq("service_name", "firebase")
                .single()

            if (configError || !configData || !configData.is_enabled) {
                console.warn("⚠️ Firebase not configured or disabled")
                return { success: 0, failed: 0 }
            }

            const firebaseConfig = configData.config as FirebaseConfig

            if (!firebaseConfig.serviceAccountJson) {
                console.warn("⚠️ Service Account JSON missing. Cannot use FCM V1 API.")
                return { success: 0, failed: 0 }
            }

            let serviceAccount: FCMServiceAccount
            try {
                serviceAccount = typeof firebaseConfig.serviceAccountJson === 'string'
                    ? JSON.parse(firebaseConfig.serviceAccountJson)
                    : firebaseConfig.serviceAccountJson
            } catch (e) {
                console.error("❌ Invalid Service Account JSON:", e)
                return { success: 0, failed: 0 }
            }

            console.log(`found ${tokens.length} tokens for user ${userId}`)

            let successCount = 0
            let failedCount = 0
            const failedTokenIds: string[] = []

            // 3. Send using FCMEdgeClient (REST API)
            // We use Promise.all to send efficiently in parallel since REST API sends individually usually,
            // or we could check if batch endpoint is easy. Standard V1 is individual messages commonly.
            // But we can just loop.

            const results = await Promise.all(tokens.map(async (t) => {
                const message = {
                    token: t.token,
                    notification: {
                        title,
                        body
                    },
                    data: data,
                    webpush: {
                        fcm_options: {
                            link: process.env.NEXT_PUBLIC_APP_URL || "https://gighub.pages.dev"
                        }
                    }
                }

                try {
                    const result = await FCMEdgeClient.send(message, serviceAccount)
                    if (result.success) {
                        return { success: true }
                    } else {
                        return { success: false, error: result.error, tokenId: t.id }
                    }
                } catch (err) {
                    return { success: false, error: err, tokenId: t.id }
                }
            }))

            results.forEach(r => {
                if (r.success) {
                    successCount++
                } else {
                    failedCount++
                    const err = r.error as any
                    console.error(`FCM error for token ${r.tokenId}:`, err?.message || err)

                    // Simple error code mapping for REST API
                    // 404 = UNREGISTERED, 400 = INVALID_ARGUMENT usually
                    // We can check error message strings or status codes if passed

                    if (err?.code === 404 ||
                        err?.status === 'UNREGISTERED' ||
                        (err?.message && err.message.includes('Registration token has been unregistered'))) {
                        failedTokenIds.push(r.tokenId!)
                    }
                    else if (err?.code === 400 || err?.status === 'INVALID_ARGUMENT') {
                        failedTokenIds.push(r.tokenId!)
                    }
                }
            })

            // Deactivate invalid tokens
            if (failedTokenIds.length > 0) {
                await supabase
                    .from("user_device_tokens")
                    .update({ is_active: false })
                    .in("id", failedTokenIds)
                console.log(`Deactivated ${failedTokenIds.length} invalid tokens`)
            }

            console.log(`✅ Push notifications sent: ${successCount} success, ${failedCount} failed`)
            return { success: successCount, failed: failedCount }

        } catch (error) {
            console.error("❌ Error in sendToUser:", error)
            return { success: 0, failed: 0 }
        }
    }
}
