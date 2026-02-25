import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "edge"
export const dynamic = "force-dynamic"

/**
 * POST /api/emergency/assessment/respond
 * Client responds to provider's on-site assessment.
 * Body: { assessmentId, emergencyId, accept: boolean, declineReason?: string }
 *
 * Rules:
 * - accept = true  → hold service_fee on card → status: service_accepted
 * - accept = false → close service (no service charge), travel_fee stays charged
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { assessmentId, emergencyId, accept, declineReason } = await req.json()
        if (!assessmentId || !emergencyId || accept === undefined) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        const { data: request } = await supabaseAdmin
            .from("emergency_requests")
            .select("id, provider_id, client_id, category, service_fee")
            .eq("id", emergencyId)
            .single()

        if (!request || request.client_id !== user.id) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 })
        }

        if (accept) {
            // Simulate authorization hold on service fee
            await supabaseAdmin.from("emergency_assessments").update({
                status: "accepted",
                client_response: "accepted"
            }).eq("id", assessmentId)

            await supabaseAdmin.from("emergency_requests").update({
                status: "service_accepted",
                service_fee_status: "held"
            }).eq("id", emergencyId)

            // Notify provider
            await supabaseAdmin.from("notifications").insert({
                user_id: request.provider_id,
                title: "✅ Serviço Aceite!",
                message: `O cliente aceitou o orçamento de €${Number(request.service_fee).toFixed(2)} para a emergência. Pode iniciar o serviço!`,
                type: "emergency_accepted",
                read: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                data: { action_url: `/dashboard/provider/emergency/${emergencyId}` }
            })

        } else {
            // Client declines → close service, no service charge
            await supabaseAdmin.from("emergency_assessments").update({
                status: "declined",
                client_response: "declined",
                client_decline_reason: declineReason || ""
            }).eq("id", assessmentId)

            await supabaseAdmin.from("emergency_requests").update({
                status: "completed",          // close the emergency
                service_fee_status: "refunded",
                travel_fee_status: "charged"  // travel fee stays charged
            }).eq("id", emergencyId)

            await supabaseAdmin.from("notifications").insert({
                user_id: request.provider_id,
                title: "❌ Orçamento Recusado",
                message: `O cliente recusou o orçamento para a emergência de ${request.category}. A deslocação foi cobrada. Serviço encerrado.`,
                type: "warning",
                read: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                data: { action_url: `/dashboard/provider/emergency` }
            })
        }

        return NextResponse.json({ success: true, accepted: accept })

    } catch (e: any) {
        console.error("Assessment respond API error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
