"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useEmergencyChat } from "@/contexts/emergency-chat-context"

function playBeep() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.value = 660
        gain.gain.setValueAtTime(0.5, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.5)
    } catch { }
}

/**
 * useEmergencyChatListener
 *
 * Watches the `conversations` table for INSERT events filtered by emergency_id.
 * When a conversation is created for this emergency AND the current user is a
 * participant (client_id or provider_id), it activates the floating chat button
 * and plays a beep — BUT only if the current user did NOT initiate the chat
 * (i.e. they don't already have the floating button open).
 *
 * Uses postgres_changes which is reliable and RLS-aware (unlike admin broadcasts).
 */
export function useEmergencyChatListener(
    requestId: string | null | undefined,
    chatTitle: string,
    otherName: string
) {
    const { user } = useAuth()
    const { openChat, activeConversationId } = useEmergencyChat()
    const supabase = createClient()
    const activatedRef = useRef(false)

    useEffect(() => {
        if (!requestId || !user) return

        const channel = supabase
            .channel(`conv_watch_${requestId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "conversations",
                    filter: `emergency_id=eq.${requestId}`
                },
                (payload) => {
                    const conv = payload.new as {
                        id: string
                        client_id: string
                        provider_id: string
                        emergency_id: string
                    }

                    // Only react if this user is a participant
                    const isParticipant = conv.client_id === user.id || conv.provider_id === user.id
                    if (!isParticipant) return

                    // Don't re-trigger if they already opened the chat themselves
                    if (activeConversationId === conv.id) return
                    if (activatedRef.current) return
                    activatedRef.current = true

                    // Activate floating chat button on THIS side
                    openChat(conv.id, chatTitle, otherName)

                    // Sound alert
                    playBeep()
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [requestId, user?.id]) // user.id is stable

    // Reset activatedRef if conversationId changes (new emergency)
    useEffect(() => {
        activatedRef.current = false
    }, [requestId])
}
