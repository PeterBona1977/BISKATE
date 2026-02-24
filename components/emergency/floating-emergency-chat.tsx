"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { MessageSquare, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmergencyChat } from "@/components/emergency/emergency-chat"
import { useEmergencyChat } from "@/contexts/emergency-chat-context"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

function playBeep() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.4, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.4)
    } catch { }
}

export function FloatingEmergencyChat() {
    const { activeConversationId, conversationTitle, otherParticipantName, closeChat } = useEmergencyChat()
    const { user } = useAuth()
    const supabase = createClient()

    const [isOpen, setIsOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    // Refs to avoid stale closures inside Realtime callbacks
    const isOpenRef = useRef(isOpen)
    const unreadTimerRef = useRef<NodeJS.Timeout | null>(null)
    const lastHandledIdRef = useRef<string | null>(null)
    const unreadCountRef = useRef(unreadCount)
    const otherNameRef = useRef(otherParticipantName)

    // Keep refs in sync
    useEffect(() => { isOpenRef.current = isOpen }, [isOpen])
    useEffect(() => { unreadCountRef.current = unreadCount }, [unreadCount])
    useEffect(() => { otherNameRef.current = otherParticipantName }, [otherParticipantName])

    const showBrowserNotification = useCallback(async (body: string) => {
        if (typeof window === "undefined" || !("Notification" in window)) return

        let permission = Notification.permission
        if (permission === "default") {
            permission = await Notification.requestPermission()
        }
        if (permission === "granted") {
            const notif = new Notification("🚨 Mensagem de Emergência", {
                body,
                icon: "/favicon.ico",
                tag: "emergency-chat-msg",
                requireInteraction: false
            })
            notif.onclick = () => {
                window.focus()
                setIsOpen(true)
                notif.close()
            }
        }
    }, [])

    // Subscribe via Realtime BROADCAST (bypasses RLS — messages are sent via admin API)
    useEffect(() => {
        if (!activeConversationId || !user) return

        const channel = supabase
            .channel(`emergency_chat_${activeConversationId}`)
            .on(
                "broadcast",
                { event: "new_message" },
                (payload) => {
                    const msg = payload.payload?.message as any
                    if (!msg) return

                    // Ignore own messages
                    if (msg.sender_id === user.id) return
                    // Deduplicate
                    if (msg.id === lastHandledIdRef.current) return
                    lastHandledIdRef.current = msg.id

                    // Always play beep
                    playBeep()

                    // Only show badge + notification if chat is CLOSED
                    if (!isOpenRef.current) {
                        setUnreadCount(prev => prev + 1)

                        // Cancel previous timer, start fresh 20s timer
                        if (unreadTimerRef.current) clearTimeout(unreadTimerRef.current)
                        unreadTimerRef.current = setTimeout(() => {
                            const name = otherNameRef.current || "utilizador"
                            showBrowserNotification(`Nova mensagem de ${name} no chat de emergência.`)
                        }, 20000)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            if (unreadTimerRef.current) clearTimeout(unreadTimerRef.current)
        }
    }, [activeConversationId, user]) // stable — refs handle isOpen, otherName

    // Clear unread when opened
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0)
            if (unreadTimerRef.current) clearTimeout(unreadTimerRef.current)
        }
    }, [isOpen])

    // Reset floating button when conversation is closed
    useEffect(() => {
        if (!activeConversationId) {
            setIsOpen(false)
            setUnreadCount(0)
        }
    }, [activeConversationId])

    if (!activeConversationId) return null

    return (
        <>
            {/* Chat Window */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl border border-red-200 flex flex-col overflow-hidden"
                    style={{ zIndex: 99998 }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-600 text-white shrink-0">
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-sm uppercase tracking-wide truncate">🚨 {conversationTitle}</p>
                            <p className="text-xs text-red-200 truncate">{otherParticipantName}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-red-700 shrink-0" onClick={() => setIsOpen(false)}>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-red-800 shrink-0" onClick={() => { setIsOpen(false); closeChat() }}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-hidden">
                        <EmergencyChat
                            conversationId={activeConversationId}
                            title={conversationTitle || "Chat de Emergência"}
                            otherParticipantName={otherParticipantName || "Utilizador"}
                        />
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="fixed bottom-6 right-4 sm:right-6 h-14 w-14 rounded-full bg-red-600 text-white shadow-lg flex items-center justify-center hover:bg-red-700 transition-all active:scale-95 hover:scale-105"
                style={{ zIndex: 99997 }}
                aria-label="Chat de Emergência"
            >
                {isOpen ? <ChevronDown className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}

                {/* Unread badge */}
                {!isOpen && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-yellow-400 text-black text-[10px] font-black flex items-center justify-center animate-bounce select-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
                {!isOpen && unreadCount > 0 && (
                    <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-50 pointer-events-none" />
                )}
            </button>
        </>
    )
}
