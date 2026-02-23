import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { requestId, status } = await request.json()

        if (!requestId || !status) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
        }

        console.log(`[Emergency Status] Provider ${user.id} updating request ${requestId} to ${status}`)

        // Verify the request belongs to this provider
        const { data: requestData } = await supabaseAdmin
            .from("emergency_requests")
            .select("client_id, provider_id, category")
            .eq("id", requestId)
            .single()

        if (!requestData || requestData.provider_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized or not found" }, { status: 403 })
        }

        // Update the request status
        const updateData: any = { status }
        if (status === "completed") {
            updateData.completed_at = new Date().toISOString()
        }

        const { error: updateError } = await supabaseAdmin
            .from("emergency_requests")
            .update(updateData)
            .eq("id", requestId)

        if (updateError) {
            console.error("Failed to update status:", updateError)
            return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
        }

        // Send Notification to Client
        let title = "Atualização da Emergência"
        let message = `O técnico alterou o estado do seu serviço de ${requestData.category}.`

        let type = "emergency_update"

        if (status === "in_progress") {
            title = "🚕 Técnico a caminho!"
            message = `O técnico acabou de iniciar o trajeto para o local da emergência (${requestData.category}).`
            type = "emergency_in_progress"
        } else if (status === "arrived") {
            title = "📍 Técnico no local"
            message = `O técnico chegou ao local da emergência. Por favor, receba-o.`
            type = "emergency_arrived"
        } else if (status === "completed") {
            title = "✅ Serviço Concluído!"
            message = `A emergência de ${requestData.category} foi finalizada.`
            type = "emergency_completed"
        }

        await supabaseAdmin.from("notifications").insert({
            user_id: requestData.client_id,
            user_type: "client",
            title,
            message,
            type,
            data: { action_url: `/dashboard/emergency/${requestId}` },
            read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })

        return NextResponse.json({ success: true, status })

    } catch (error) {
        console.error("Emergency Status API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
