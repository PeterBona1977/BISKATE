"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"

const STORAGE_KEY = "biskate_emergency_chat"

interface StoredChat {
    conversationId: string
    conversationTitle: string
    otherParticipantName: string
}

interface EmergencyChatContextType {
    activeConversationId: string | null
    conversationTitle: string | null
    otherParticipantName: string | null
    openChat: (conversationId: string, title?: string, otherName?: string) => void
    closeChat: () => void
}

const EmergencyChatContext = createContext<EmergencyChatContextType>({
    activeConversationId: null,
    conversationTitle: null,
    otherParticipantName: null,
    openChat: () => { },
    closeChat: () => { }
})

export function useEmergencyChat() {
    return useContext(EmergencyChatContext)
}

export function EmergencyChatProvider({ children }: { children: React.ReactNode }) {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [conversationTitle, setConversationTitle] = useState<string | null>(null)
    const [otherParticipantName, setOtherParticipantName] = useState<string | null>(null)

    // 🔁 Restore from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed: StoredChat = JSON.parse(stored)
                setActiveConversationId(parsed.conversationId)
                setConversationTitle(parsed.conversationTitle)
                setOtherParticipantName(parsed.otherParticipantName)
            }
        } catch { }
    }, [])

    const openChat = useCallback((conversationId: string, title?: string, otherName?: string) => {
        const t = title || "Chat de Emergência"
        const n = otherName || "Utilizador"
        setActiveConversationId(conversationId)
        setConversationTitle(t)
        setOtherParticipantName(n)
        // 💾 Persist so it survives refresh
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversationId, conversationTitle: t, otherParticipantName: n }))
        } catch { }
    }, [])

    const closeChat = useCallback(() => {
        setActiveConversationId(null)
        setConversationTitle(null)
        setOtherParticipantName(null)
        try { localStorage.removeItem(STORAGE_KEY) } catch { }
    }, [])

    return (
        <EmergencyChatContext.Provider value={{
            activeConversationId,
            conversationTitle,
            otherParticipantName,
            openChat,
            closeChat
        }}>
            {children}
        </EmergencyChatContext.Provider>
    )
}
