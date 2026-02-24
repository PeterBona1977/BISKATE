"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
    sender?: { full_name: string | null }
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

    useEffect(() => {
        loadMessages()
    }, [conversationId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Subscribe to new messages via Realtime BROADCAST (bypasses RLS)
    useEffect(() => {
        if (!conversationId) return
        const channel = supabase
            .channel(`emergency_chat_${conversationId}`)
            .on(
                "broadcast",
                { event: "new_message" },
                (payload) => {
                    const msg = payload.payload?.message as Message
                    if (!msg) return
                    setMessages(prev => {
                        if (prev.some(m => m.id === msg.id)) return prev
                        return [...prev, msg]
                    })
                }
            )
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [conversationId])

    const loadMessages = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/emergency/messages?conversationId=${conversationId}`)
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Falha ao carregar")
            }
            const { messages: data } = await res.json()
            setMessages(data || [])
        } catch (err: any) {
            console.error("Error loading emergency messages:", err)
            toast({
                title: "Erro",
                description: err.message || "Não foi possível carregar mensagens.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

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
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Falha ao enviar")
            }
            const { message } = await res.json()
            setMessages(prev => {
                if (prev.some(m => m.id === message.id)) return prev
                return [...prev, message]
            })
        } catch (err: any) {
            console.error("Error sending message:", err)
            setNewMessage(content) // restore on error
            toast({
                title: "Erro",
                description: err.message || "Não foi possível enviar a mensagem.",
                variant: "destructive"
            })
        } finally {
            setSending(false)
        }
    }

    const formatTime = (ts: string) =>
        new Date(ts).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })

    if (loading) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <MessageSquare className="h-10 w-10 text-red-500 animate-pulse mb-2" />
                <p className="text-sm text-muted-foreground">A carregar chat...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-red-50">
                <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-red-600 text-white font-bold text-sm">
                        {otherParticipantName.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-sm">{otherParticipantName}</p>
                    <p className="text-xs text-red-600">{title}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-700 font-medium">Online</span>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-2">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2">
                        <MessageSquare className="h-8 w-8 text-gray-300" />
                        <p className="text-sm text-gray-400">Nenhuma mensagem ainda.</p>
                        <p className="text-xs text-gray-400">Envie a primeira mensagem para iniciar a conversa!</p>
                    </div>
                ) : (
                    <div className="space-y-3 py-2">
                        {messages.map(msg => {
                            const isMe = msg.sender_id === user?.id
                            return (
                                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? "bg-red-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                                        <p className="text-sm">{msg.content}</p>
                                        <div className="flex items-center gap-1 mt-1 justify-end">
                                            <Clock className="h-3 w-3 opacity-60" />
                                            <span className="text-[10px] opacity-60">{formatTime(msg.created_at)}</span>
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
            <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t">
                <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Escreva uma mensagem..."
                    disabled={sending}
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={sending || !newMessage.trim()} className="bg-red-600 hover:bg-red-700 shrink-0">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    )
}
