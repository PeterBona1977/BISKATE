import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "edge"
export const dynamic = "force-dynamic"

/**
 * POST /api/emergency/complete
 * Provider declares the service finished or failed.
 * Body: { emergencyId, assessmentId, success: boolean, failureReason?, agreeRefund?: boolean, disputeReason? }
 *
 * Rules:
 * - success = true → both travel_fee + service_fee become charged → status: completed
 * - success = false + agreeRefund = true → service_fee refunded, travel_fee charged
 * - success = false + agreeRefund = false → status: disputed (platform deliberates)
 *   travel_fee always charged. Service fee stays held until platform resolves.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { emergencyId, assessmentId, success, failureReason, agreeRefund, disputeReason } = await req.json()

        if (!emergencyId || success === undefined) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        const { data: request } = await supabaseAdmin
            .from("emergency_requests")
            .select("id, client_id, provider_id, category, service_fee, travel_fee")
            .eq("id", emergencyId)
            .single()

        if (!request || request.provider_id !== user.id) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 })
        }

        if (success) {
            // Service completed successfully — charge everything
            await supabaseAdmin.from("emergency_requests").update({
                status: "completed",
                travel_fee_status: "charged",
                service_fee_status: "charged"
            }).eq("id", emergencyId)

            if (assessmentId) {
                await supabaseAdmin.from("emergency_assessments").update({ status: "completed" }).eq("id", assessmentId)
            }

            // Notify client
            await supabaseAdmin.from("notifications").insert({
                user_id: request.client_id,
                title: "✅ Serviço Concluído",
                message: `O serviço de emergência de ${request.category} foi concluído com sucesso. Obrigado!`,
                type: "emergency_completed",
                read: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                data: { action_url: `/dashboard/emergency/${emergencyId}` }
            })

        } else if (agreeRefund) {
            // Provider couldn't finish, agrees to refund service fee
            await supabaseAdmin.from("emergency_requests").update({
                status: "completed",
                travel_fee_status: "charged",    // travel always charged
                service_fee_status: "refunded",  // service returned
                dispute_reason: null
            }).eq("id", emergencyId)

            if (assessmentId) {
                await supabaseAdmin.from("emergency_assessments").update({
                    status: "failed",
                    provider_failure_reason: failureReason || "",
                    provider_agrees_refund: true
                }).eq("id", assessmentId)
            }

            await supabaseAdmin.from("notifications").insert({
                user_id: request.client_id,
                title: "ℹ️ Serviço Não Concluído",
                message: `O técnico não conseguiu concluir o serviço de ${request.category}. O valor do serviço foi devolvido. A taxa de deslocação foi cobrada.`,
                type: "warning",
                read: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                data: { action_url: `/dashboard/emergency/${emergencyId}` }
            })

        } else {
            // Provider disputes — open litigio
            await supabaseAdmin.from("emergency_requests").update({
                status: "disputed",
                travel_fee_status: "charged",      // travel always charged
                service_fee_status: "disputed",    // held until platform deliberates
                dispute_reason: disputeReason || ""
            }).eq("id", emergencyId)

            if (assessmentId) {
                await supabaseAdmin.from("emergency_assessments").update({
                    status: "disputed",
                    provider_failure_reason: failureReason || "",
                    provider_agrees_refund: false,
                    dispute_reason: disputeReason || ""
                }).eq("id", assessmentId)
            }

            // Notify both parties
            const disputeMsg = `A emergência de ${request.category} está em litígio. A plataforma irá deliberar brevemente.`
            for (const userId of [request.client_id, request.provider_id]) {
                await supabaseAdmin.from("notifications").insert({
                    user_id: userId,
                    title: "⚖️ Litígio Aberto",
                    message: disputeMsg,
                    type: "warning",
                    read: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    data: { action_url: `/dashboard` }
                })
            }
        }

        return NextResponse.json({ success: true })

    } catch (e: any) {
        console.error("Complete API error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
