import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "edge"
export const dynamic = "force-dynamic"

/**
 * POST /api/emergency/assessment
 * Provider submits on-site assessment: photos, description, final price.
 * Body: { emergencyId, description, finalPrice, photos: string[] }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { emergencyId, description, finalPrice, photos } = await req.json()
        if (!emergencyId || !description || !finalPrice) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        // Validate provider owns this emergency
        const { data: request } = await supabaseAdmin
            .from("emergency_requests")
            .select("id, client_id, category, provider_id, status")
            .eq("id", emergencyId)
            .single()

        if (!request || request.provider_id !== user.id) {
            return NextResponse.json({ error: "Not authorized for this emergency" }, { status: 403 })
        }

        // Insert assessment
        const { data: assessment, error } = await supabaseAdmin
            .from("emergency_assessments")
            .insert({
                emergency_id: emergencyId,
                provider_id: user.id,
                description,
                final_price: finalPrice,
                photos: photos || [],
                status: "pending"
            })
            .select("id")
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Update emergency status to assessment_pending
        await supabaseAdmin
            .from("emergency_requests")
            .update({ status: "assessment_pending", service_fee: finalPrice })
            .eq("id", emergencyId)

        // Notify client
        await supabaseAdmin.from("notifications").insert({
            user_id: request.client_id,
            title: "🔧 Avaliação Disponível",
            message: `O técnico avaliou a sua emergência de ${request.category} e propõe um serviço de €${Number(finalPrice).toFixed(2)}. Confirme para continuar.`,
            type: "emergency_assessment",
            read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            data: { action_url: `/dashboard/emergency/${emergencyId}` }
        })

        return NextResponse.json({ success: true, assessmentId: assessment.id })

    } catch (e: any) {
        console.error("Assessment API error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

/**
 * GET /api/emergency/assessment?emergencyId=xxx
 * Fetch the latest assessment for an emergency.
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const emergencyId = req.nextUrl.searchParams.get("emergencyId")
        if (!emergencyId) return NextResponse.json({ error: "Missing emergencyId" }, { status: 400 })

        const { data, error } = await supabaseAdmin
            .from("emergency_assessments")
            .select("*")
            .eq("emergency_id", emergencyId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ assessment: data })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
