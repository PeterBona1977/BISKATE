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
 * Subscribe to `chat_started` broadcast on the given emergency request channel.
 * When the OTHER participant opens the chat, this hook activates the floating button
 * on this side with a beep.
 */
export function useEmergencyChatListener(
    requestId: string | null | undefined,
    chatTitle: string,
    otherName: string
) {
    const { user } = useAuth()
    const { openChat, activeConversationId } = useEmergencyChat()
    const supabase = createClient()
    const openedRef = useRef(false)

    useEffect(() => {
        if (!requestId || !user) return

        const channel = supabase
            .channel(`emergency_${requestId}`)
            .on(
                "broadcast",
                { event: "chat_started" },
                (payload) => {
                    const { conversationId, initiatorId } = payload.payload as {
                        conversationId: string
                        initiatorId: string
                        clientId: string
                        providerId: string
                    }

                    // Only react if WE are NOT the one who started the chat
                    if (initiatorId === user.id) return

                    // Don't re-open if we already have this conversation active
                    if (activeConversationId === conversationId && openedRef.current) return
                    openedRef.current = true

                    // Activate the floating button on our side
                    openChat(conversationId, chatTitle, otherName)

                    // Play alert beep
                    playBeep()
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [requestId, user])
}
