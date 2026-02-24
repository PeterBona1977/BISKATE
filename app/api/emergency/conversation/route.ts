import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

/**
 * POST /api/emergency/conversation
 * Get or create a chat conversation for an emergency, using admin client to bypass RLS.
 * Body: { requestId, clientId, providerId }
 */
export async function POST(req: NextRequest) {
    try {
        // Verify caller is authenticated
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { requestId, clientId, providerId } = await req.json()

        if (!requestId || !clientId || !providerId) {
            return NextResponse.json({ error: "Missing required fields: requestId, clientId, providerId" }, { status: 400 })
        }

        // 1. Try to find existing conversation using admin client
        const { data: existing, error: findErr } = await supabaseAdmin
            .from("conversations")
            .select("id")
            .eq("emergency_id", requestId)
            .eq("provider_id", providerId)
            .maybeSingle()

        if (findErr) {
            console.error("Error finding conversation:", findErr)
        }

        if (existing) {
            // Re-broadcast chat_started so the other side activates the floating button
            try {
                await supabaseAdmin.channel(`emergency_${requestId}`).send({
                    type: "broadcast",
                    event: "chat_started",
                    payload: {
                        conversationId: existing.id,
                        initiatorId: user.id,
                        clientId,
                        providerId
                    }
                })
            } catch { }
            return NextResponse.json({ conversationId: existing.id })
        }

        // 2. Create new conversation using admin client (bypasses RLS)
        const { data: newConv, error: createError } = await supabaseAdmin
            .from("conversations")
            .insert({
                emergency_id: requestId,
                client_id: clientId,
                provider_id: providerId,
                status: "active"
            })
            .select("id")
            .single()

        if (createError) {
            console.error("Error creating conversation:", createError)
            return NextResponse.json({ error: createError.message }, { status: 500 })
        }

        // 3. Add participants using admin client
        await supabaseAdmin
            .from("conversation_participants")
            .insert([
                { conversation_id: newConv.id, user_id: clientId },
                { conversation_id: newConv.id, user_id: providerId }
            ])

        // 4. Broadcast chat_started so the OTHER side shows the floating button + sound
        try {
            await supabaseAdmin.channel(`emergency_${requestId}`).send({
                type: "broadcast",
                event: "chat_started",
                payload: {
                    conversationId: newConv.id,
                    initiatorId: user.id,
                    clientId,
                    providerId
                }
            })
        } catch { }

        return NextResponse.json({ conversationId: newConv.id })

    } catch (e: any) {
        console.error("Conversation API error:", e)
        return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 })
    }
}
