import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

/**
 * GET /api/emergency/messages?conversationId=xxx
 * Fetch messages for a conversation using admin client to bypass RLS.
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const conversationId = req.nextUrl.searchParams.get("conversationId")
        if (!conversationId) {
            return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from("messages")
            .select(`
                *,
                sender:profiles!sender_id (
                    full_name,
                    avatar_url
                )
            `)
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })

        if (error) {
            console.error("Error loading messages:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ messages: data || [] })

    } catch (e: any) {
        console.error("Messages API error:", e)
        return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 })
    }
}

/**
 * POST /api/emergency/messages
 * Send a message to a conversation using admin client to bypass RLS.
 * Body: { conversationId, content }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { conversationId, content } = await req.json()
        if (!conversationId || !content) {
            return NextResponse.json({ error: "Missing conversationId or content" }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from("messages")
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: content.trim()
            })
            .select()
            .single()

        if (error) {
            console.error("Error sending message:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Broadcast message to all channel subscribers (bypasses RLS)
        // FloatingEmergencyChat and EmergencyChat listen on this broadcast channel
        try {
            await supabaseAdmin
                .channel(`emergency_chat_${conversationId}`)
                .send({
                    type: "broadcast",
                    event: "new_message",
                    payload: { message: data }
                })
        } catch (broadcastErr) {
            console.warn("Broadcast failed (non-critical):", broadcastErr)
        }

        return NextResponse.json({ message: data })

    } catch (e: any) {
        console.error("Send message API error:", e)
        return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 })
    }
}
