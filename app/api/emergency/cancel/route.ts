import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "edge"
export const dynamic = "force-dynamic"

/**
 * POST /api/emergency/cancel
 * Body: { requestId, reason, cancelledBy: 'client' | 'provider' }
 *
 * Rules:
 * - Provider cancels → refund travel_fee to client, notify client + offer to find another
 * - Client cancels, status = 'accepted' (not yet in_progress) → refund travel_fee
 * - Client cancels, status = 'in_progress' | 'arrived' → charge travel_fee to provider
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { requestId, reason, cancelledBy } = await req.json()
        if (!requestId || !reason || !cancelledBy) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        // Fetch current request
        const { data: request, error: fetchErr } = await supabaseAdmin
            .from("emergency_requests")
            .select("id, status, client_id, provider_id, travel_fee, category")
            .eq("id", requestId)
            .single()

        if (fetchErr || !request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 })
        }

        const alreadyEnRoute = ["in_progress", "arrived"].includes(request.status)

        // Determine travel fee fate
        let travelFeeStatus = "refunded" // default: refund
        if (cancelledBy === "client" && alreadyEnRoute) {
            travelFeeStatus = "charged" // client cancels while provider en route → charge
        }

        // Update request
        await supabaseAdmin
            .from("emergency_requests")
            .update({
                status: "cancelled",
                cancelled_by: cancelledBy,
                cancellation_reason: reason,
                travel_fee_status: travelFeeStatus,
                service_fee_status: "refunded", // any held service fee is always refunded on cancel
            })
            .eq("id", requestId)

        // Build notifications
        const notifications: any[] = []

        if (cancelledBy === "provider") {
            // Notify client: provider cancelled → refund + offer to find another
            notifications.push({
                user_id: request.client_id,
                title: "⚠️ Técnico Cancelou",
                message: `O técnico cancelou a emergência de ${request.category}. A taxa de deslocação foi devolvida. Deseja procurar outro técnico?`,
                type: "emergency_cancelled",
                data: { action_url: `/dashboard/emergency/${requestId}`, offer_retry: true }
            })
        } else {
            // Notify provider
            if (request.provider_id) {
                const msgExtra = travelFeeStatus === "charged"
                    ? "A taxa de deslocação foi cobrada, dado que já estava em trajeto."
                    : "A taxa de deslocação foi devolvida ao cliente."
                notifications.push({
                    user_id: request.provider_id,
                    title: "⚠️ Cliente Cancelou",
                    message: `O cliente cancelou a emergência de ${request.category}. ${msgExtra}`,
                    type: "emergency_cancelled",
                    data: { action_url: `/dashboard/provider/emergency` }
                })
            }
        }

        for (const notif of notifications) {
            await supabaseAdmin.from("notifications").insert({
                ...notif,
                read: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
        }

        return NextResponse.json({
            success: true,
            travelFeeStatus,
            message: travelFeeStatus === "charged"
                ? "Cancelamento confirmado. A taxa de deslocação foi cobrada."
                : "Cancelamento confirmado. A taxa de deslocação foi devolvida."
        })

    } catch (e: any) {
        console.error("Cancel API error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
