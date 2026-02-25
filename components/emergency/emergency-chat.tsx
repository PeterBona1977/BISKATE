"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageSquare, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface EmergencyChatProps {
    conversationId: string
    title?: string
    otherParticipantName?: string
}

interface Message {
    id: string
    content: string
    sender_id: string
    created_at: string
}

export function EmergencyChat({ conversationId, title = "Chat de Emergência", otherParticipantName = "Cliente" }: EmergencyChatProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const supabase = createClient()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const lastCountRef = useRef(0)

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

    // Load messages from API (admin-bypassed)
    const loadMessages = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            const res = await fetch(`/api/emergency/messages?conversationId=${conversationId}`)
            if (!res.ok) return
            const { messages: data } = await res.json()
            const list: Message[] = data || []
            if (list.length !== lastCountRef.current) {
                lastCountRef.current = list.length
                setMessages(list)
            }
        } catch (err: any) {
            if (!silent) toast({ title: "Erro", description: "Não foi possível carregar mensagens.", variant: "destructive" })
        } finally {
            if (!silent) setLoading(false)
        }
    }, [conversationId])

    // Initial load
    useEffect(() => { loadMessages() }, [conversationId])

    // Scroll on new messages
    useEffect(() => { scrollToBottom() }, [messages])

    // PRIMARY: postgres_changes on messages table (works once migration is applied)
    useEffect(() => {
        if (!conversationId) return
        const channel = supabase
            .channel(`msgs_pg_${conversationId}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {
                const msg = payload.new as Message
                setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [conversationId])

    // FALLBACK: poll every 4 seconds (catches messages even without Realtime working)
    useEffect(() => {
        if (!conversationId) return
        const interval = setInterval(() => loadMessages(true), 4000)
        return () => clearInterval(interval)
    }, [conversationId, loadMessages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !user) return
        setSending(true)
        const content = newMessage.trim()
        setNewMessage("")
        try {
            const res = await fetch("/api/emergency/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId, content })
            })
            if (!res.ok) throw new Error((await res.json()).error)
            const { message } = await res.json()
            setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message])
            lastCountRef.current += 1
        } catch (err: any) {
            setNewMessage(content)
            toast({ title: "Erro", description: err.message || "Não foi possível enviar.", variant: "destructive" })
        } finally {
            setSending(false)
        }
    }

    const formatTime = (ts: string) =>
        new Date(ts).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })

    if (loading) return (
        <div className="flex flex-col h-full items-center justify-center">
            <MessageSquare className="h-10 w-10 text-red-500 animate-pulse mb-2" />
            <p className="text-sm text-muted-foreground">A carregar chat...</p>
        </div>
    )

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-red-50 shrink-0">
                <div className="h-9 w-9 rounded-full bg-red-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {otherParticipantName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{otherParticipantName}</p>
                    <p className="text-xs text-red-600 truncate">{title}</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-700 font-medium">Online</span>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-2">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                        <MessageSquare className="h-8 w-8 text-gray-200" />
                        <p className="text-sm">Nenhuma mensagem ainda.</p>
                        <p className="text-xs">Envie a primeira mensagem!</p>
                    </div>
                ) : (
                    <div className="space-y-3 py-2">
                        {messages.map(msg => {
                            const isMe = msg.sender_id === user?.id
                            return (
                                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? "bg-red-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                                        <p className="text-sm break-words">{msg.content}</p>
                                        <div className="flex items-center gap-1 mt-1 justify-end">
                                            <Clock className="h-3 w-3 opacity-50" />
                                            <span className="text-[10px] opacity-50">{formatTime(msg.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t shrink-0">
                <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Escreva uma mensagem..."
                    disabled={sending}
                    className="flex-1"
                    autoComplete="off"
                />
                <Button type="submit" size="icon" disabled={sending || !newMessage.trim()} className="bg-red-600 hover:bg-red-700 shrink-0">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    )
}
