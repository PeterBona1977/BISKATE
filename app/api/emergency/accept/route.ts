import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { notificationService } from "@/lib/notifications/notification-service"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { requestId, providerId } = await request.json()

        if (!requestId || !providerId) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
        }

        console.log(`✅ [Emergency Accept] Client ${user.id} accepting provider ${providerId} for request ${requestId}`)

        // 1. Get the quote first to know amount
        const { data: response } = await supabaseAdmin
            .from("emergency_responses")
            .select("quote_details, emergency:emergency_requests(client_id, category)")
            .eq("emergency_id", requestId)
            .eq("provider_id", providerId)
            .single()

        if (!response) {
            return NextResponse.json({ error: "Response not found" }, { status: 404 })
        }

        const requestData = response.emergency as any

        // 2. Update the request with the chosen provider bypassing RLS
        const { error: requestError } = await supabaseAdmin
            .from("emergency_requests")
            .update({
                provider_id: providerId,
                status: "accepted",
                accepted_at: new Date().toISOString(),
            })
            .eq("id", requestId)
            .neq("status", "accepted")

        if (requestError) {
            console.error("❌ Failed to update emergency request:", requestError)
            return NextResponse.json({ error: "Failed to update request", details: requestError }, { status: 500 })
        }

        // 3. Update the chosen response status
        await supabaseAdmin
            .from("emergency_responses")
            .update({ status: 'accepted' })
            .eq("emergency_id", requestId)
            .eq("provider_id", providerId)

        // 4. Reject other responses
        const { data: otherResponses } = await supabaseAdmin
            .from("emergency_responses")
            .update({ status: 'rejected' })
            .eq("emergency_id", requestId)
            .neq("provider_id", providerId)
            .select("provider_id")

        // 5. Build notifications
        const notifications = []
        notifications.push({
            user_id: providerId,
            title: "✅ Proposta Aceite!",
            message: `O cliente aceitou a sua proposta para a emergência de ${requestData.category}. Desloque-se ao local!`,
            type: "emergency_accepted",
            user_type: "provider",
            data: {
                action_url: `/dashboard/provider/emergency/${requestId}`
            }
        })

        if (otherResponses && otherResponses.length > 0) {
            otherResponses.forEach(r => {
                notifications.push({
                    user_id: r.provider_id,
                    title: "❌ Proposta Recusada",
                    message: `O cliente escolheu outro prestador para a emergência de ${requestData.category}.`,
                    type: "warning",
                    user_type: "provider",
                    data: {
                        action_url: `/dashboard/provider/emergency`
                    }
                })
            })
        }

        // Send notifications using Admin Client directly to bypass RLS limitations just in case
        for (const notif of notifications) {
            await supabaseAdmin.from("notifications").insert({
                ...notif,
                read: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
        }

        // Emit an email if possible, but the user receives the DB notification immediately.

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Emergency Accept API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
