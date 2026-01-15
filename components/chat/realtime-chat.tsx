"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"
import { ProposalService } from "@/lib/proposals/proposal-service"
import { RealtimeService, type TypingState } from "@/lib/realtime/realtime-service"
import { useUserPresence } from "@/hooks/use-user-presence"
import { Send, MessageSquare, Clock, Check, CheckCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase/database.types"

type Message = Database["public"]["Tables"]["messages"]["Row"] & {
  sender?: {
    full_name: string | null
    avatar_url: string | null
  }
}

interface RealtimeChatProps {
  conversationId: string
  gigTitle: string
  otherParticipant: {
    id: string
    name: string
    avatar?: string
  }
}

export function RealtimeChat({ conversationId, gigTitle, otherParticipant }: RealtimeChatProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { isUserOnline, getUserStatus } = useUserPresence()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState<TypingState | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadMessages()
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!user) return

    // Subscrever a mensagens em tempo real
    const unsubscribe = RealtimeService.subscribeToConversation(
      conversationId,
      (message) => {
        setMessages((prev) => {
          // Evitar duplicatas
          if (prev.some((m) => m.id === message.id)) return prev
          return [...prev, message]
        })

        // Marcar como lida se não é do usuário atual
        if (message.sender_id !== user.id) {
          RealtimeService.markMessageAsRead(message.id, user.id)
        }
      },
      (typingState) => {
        if (typingState.user_id !== user.id) {
          setTyping(typingState.is_typing ? typingState : null)

          // Limpar indicador de digitação após 3 segundos
          if (typingState.is_typing) {
            setTimeout(() => setTyping(null), 3000)
          }
        }
      },
    )

    return unsubscribe
  }, [conversationId, user])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await ProposalService.getConversationMessages(conversationId)

      if (error) {
        console.error("Erro ao carregar mensagens:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as mensagens",
          variant: "destructive",
        })
        return
      }

      setMessages(data)
    } catch (err) {
      console.error("Erro inesperado:", err)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim()) return

    setSending(true)

    try {
      const { data, error } = await ProposalService.sendMessage(conversationId, user.id, newMessage.trim())

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível enviar a mensagem",
          variant: "destructive",
        })
        return
      }

      setNewMessage("")

      // Parar indicador de digitação
      if (user) {
        RealtimeService.setTypingStatus(conversationId, user.id, false)
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao enviar mensagem",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)

    if (!user) return

    // Indicar que está digitando
    if (value.trim()) {
      RealtimeService.setTypingStatus(conversationId, user.id, true)

      // Limpar timeout anterior
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Parar indicador após 2 segundos sem digitar
      typingTimeoutRef.current = setTimeout(() => {
        RealtimeService.setTypingStatus(conversationId, user.id, false)
      }, 2000)
    } else {
      RealtimeService.setTypingStatus(conversationId, user.id, false)
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else {
      return date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  const getMessageAlignment = (senderId: string) => {
    return senderId === user?.id ? "justify-end" : "justify-start"
  }

  const getMessageStyle = (senderId: string) => {
    return senderId === user?.id ? "bg-indigo-600 text-white ml-12" : "bg-gray-100 text-gray-900 mr-12"
  }

  const getStatusIcon = (message: Message) => {
    if (message.sender_id !== user?.id) return null

    if (message.read_at) {
      return <CheckCheck className="h-3 w-3 text-blue-400" />
    } else if (message.delivered_at) {
      return <Check className="h-3 w-3 text-gray-400" />
    } else {
      return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  const userStatus = getUserStatus(otherParticipant.id)
  const isOnline = isUserOnline(otherParticipant.id)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando conversa...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherParticipant.avatar || "/placeholder.svg"} />
                <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {/* Indicador de status */}
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  userStatus === "online"
                    ? "bg-green-500"
                    : userStatus === "away"
                      ? "bg-yellow-500"
                      : userStatus === "busy"
                        ? "bg-red-500"
                        : "bg-gray-400"
                }`}
              />
            </div>
            <div>
              <CardTitle className="text-lg">{otherParticipant.name}</CardTitle>
              <p className="text-sm text-gray-600">{gigTitle}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`${
              isOnline ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Área de Mensagens */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma mensagem ainda.</p>
                <p className="text-sm text-gray-400">Envie a primeira mensagem para iniciar a conversa!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${getMessageAlignment(message.sender_id)}`}>
                  <div className="flex items-start space-x-2 max-w-[80%]">
                    {message.sender_id !== user?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender?.avatar_url || ""} />
                        <AvatarFallback>
                          {message.sender?.full_name?.charAt(0) || otherParticipant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`rounded-lg px-4 py-2 ${getMessageStyle(message.sender_id)}`}>
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 opacity-60" />
                          <span className="text-xs opacity-60">{formatMessageTime(message.created_at)}</span>
                        </div>
                        {getStatusIcon(message)}
                      </div>
                    </div>
                    {message.sender_id === user?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>Eu</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Indicador de digitação */}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 max-w-[80%]">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Área de Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !newMessage.trim()} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
