import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { NotificationServiceServer } from "@/lib/notifications/notification-service-server"

export async function GET(request: NextRequest) {
    // Basic security: check for a cron secret if provided in env
    // For local dev, we skip this or use a simple check
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log("⏰ Running Verification Retry Cron Job...")

        // 1. Find users unverified for more than 12 hours
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()

        const { data: users, error } = await supabaseAdmin
            .from("profiles")
            .select("id, email, full_name, verification_attempts, last_verification_sent_at")
            .eq("email_verified", false)
            .lt("last_verification_sent_at", twelveHoursAgo)
            .lt("verification_attempts", 4) // Stop after admin is notified (attempt 3 -> 4)

        if (error) throw error

        console.log(`🔍 Found ${users?.length || 0} users needing verification retry.`)

        const results = []

        for (const userProfile of (users || [])) {
            const currentAttempts = userProfile.verification_attempts || 1

            if (currentAttempts < 3) {
                // RESEND LOGIC
                console.log(`📧 Resending verification to: ${userProfile.email} (Attempt ${currentAttempts + 1})`)

                // Generate new link
                const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                    type: "signup",
                    email: userProfile.email,
                    options: {
                        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/confirm`
                    },
                })

                if (linkError) {
                    console.error(`❌ Error generating link for ${userProfile.email}:`, linkError.message)
                    continue
                }

                let verificationLink = linkData.properties?.action_link
                verificationLink += `&userId=${userProfile.id}`

                // Trigger reminder notification
                await NotificationServiceServer.triggerNotification("verification_reminder", {
                    userId: userProfile.id,
                    userName: userProfile.full_name || userProfile.email.split("@")[0],
                    userEmail: userProfile.email,
                    verification_link: verificationLink,
                    attempt: currentAttempts + 1
                })

                // Update attempts and timestamp
                await supabaseAdmin
                    .from("profiles")
                    .update({
                        verification_attempts: currentAttempts + 1,
                        last_verification_sent_at: new Date().toISOString()
                    })
                    .eq("id", userProfile.id)

                results.push({ email: userProfile.email, action: 'resent', attempt: currentAttempts + 1 })

            } else if (currentAttempts === 3) {
                // ADMIN ALERT LOGIC
                console.log(`🚨 Notifying admin: Manual verification needed for ${userProfile.email}`)

                await NotificationServiceServer.triggerNotification("admin_manual_verification", {
                    userId: userProfile.id,
                    userName: userProfile.full_name || userProfile.email.split("@")[0],
                    userEmail: userProfile.email,
                })

                // Mark as 4 so we don't notify admin again
                await supabaseAdmin
                    .from("profiles")
                    .update({ verification_attempts: 4 })
                    .eq("id", userProfile.id)

                results.push({ email: userProfile.email, action: 'admin_notified' })
            }
        }

        return NextResponse.json({
            success: true,
            processed: users?.length || 0,
            details: results
        })

    } catch (err) {
        console.error("❌ Cron Job Error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
