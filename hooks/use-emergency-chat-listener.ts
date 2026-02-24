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
        osc.frequency.value = 680
        gain.gain.setValueAtTime(0.5, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.5)
    } catch { }
}

/**
 * useEmergencyChatListener
 *
 * Two mechanisms:
 * 1. On mount: polls the API to check if a conversation already exists for this
 *    emergency (handles page refresh / late join).
 * 2. Realtime: subscribes to `conversations` INSERT events filtered by emergency_id,
 *    so new conversations fire instantly.
 *
 * When detected and the current user is NOT the initiator, activates the floating
 * button and plays a beep.
 */
export function useEmergencyChatListener(
    requestId: string | null | undefined,
    chatTitle: string,
    otherName: string
) {
    const { user } = useAuth()
    const { openChat, activeConversationId } = useEmergencyChat()
    const supabase = createClient()
    const activatedRef = useRef<string | null>(null) // stores the convId that triggered activation

    function activate(convId: string, beep = true) {
        if (activatedRef.current === convId) return // already activated for this conv
        if (activeConversationId === convId) return // user already has it open themselves
        activatedRef.current = convId
        openChat(convId, chatTitle, otherName)
        if (beep) playBeep()
    }

    // 1. On mount & when requestId changes: check via API for an existing conversation
    useEffect(() => {
        if (!requestId || !user) return
        // Don't poll if we already have it open
        if (activeConversationId) return

        const checkExisting = async () => {
            try {
                const res = await fetch(`/api/emergency/conversation?requestId=${requestId}`)
                if (!res.ok) return
                const { conversation } = await res.json()
                if (conversation?.id) {
                    // Found one — activate silently (no beep, the other side already has it)
                    activate(conversation.id, false)
                }
            } catch { }
        }

        checkExisting()
        // Poll every 5s as fallback in case realtime isn't in the publication yet
        const interval = setInterval(checkExisting, 5000)
        return () => clearInterval(interval)
    }, [requestId, user?.id])

    // 2. Realtime: subscribe to new conversations INSERT on this emergency
    useEffect(() => {
        if (!requestId || !user) return

        const channel = supabase
            .channel(`conv_notify_${requestId}`)
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
                    }
                    const isParticipant = conv.client_id === user.id || conv.provider_id === user.id
                    if (!isParticipant) return
                    // Activate with beep (this is a NEW conversation just created)
                    activate(conv.id, true)
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [requestId, user?.id])

    // Reset if request changes
    useEffect(() => {
        activatedRef.current = null
    }, [requestId])
}
