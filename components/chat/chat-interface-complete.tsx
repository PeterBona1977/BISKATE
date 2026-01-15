"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { ChatService } from "@/lib/chat/chat-service"
import { Send, Paperclip, MoreVertical, Archive, Trash2, Edit3, Reply, Check, CheckCheck, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Database } from "@/lib/supabase/database.types"

type Conversation = Database["public"]["Tables"]["conversations"]["Row"]
type Message = Database["public"]["Tables"]["messages"]["Row"]

interface ChatInterfaceProps {
  conversationId: string
  onClose?: () => void
}

interface MessageWithSender extends Message {
  sender: {
    full_name: string | null
    avatar_url: string | null
  }
  reply_to?: {
    content: string
    sender: {
      full_name: string | null
    }
  } | null
}

export function ChatInterface({ conversationId, onClose }: ChatInterfaceProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carregar conversa e mensagens
  const loadConversation = useCallback(async () => {
    try {
      setLoading(true)

      const [conversationResult, messagesResult] = await Promise.all([
        ChatService.getConversationById(conversationId),
        ChatService.getConversationMessages(conversationId),
      ])

      if (conversationResult.error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar a conversa",
          variant: "destructive",
        })
        return
      }

      if (messagesResult.error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as mensagens",
          variant: "destructive",
        })
        return
      }

      setConversation(conversationResult.data)
      setMessages(messagesResult.data as MessageWithSender[])

      // Marcar mensagens como lidas
      if (user) {
        await ChatService.markMessagesAsRead(conversationId, user.id)
      }
    } catch (err) {
      console.error("Erro ao carregar conversa:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar conversa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [conversationId, user, toast])

  // Enviar mensagem
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user || sending) return

    try {
      setSending(true)

      const { data, error } = await ChatService.sendMessage({
        conversation_id: conversationId,
        sender_id: user.id,
        content: newMessage.trim(),
        reply_to_id: replyTo?.id,
      })

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível enviar a mensagem",
          variant: "destructive",
        })
        return
      }

      setMessages((prev) => [...prev, data as MessageWithSender])
      setNewMessage("")
      setReplyTo(null)
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
  }, [newMessage, user, sending, conversationId, replyTo, toast])

  // Editar mensagem
  const editMessage = useCallback(
    async (messageId: string) => {
      if (!editContent.trim()) return

      try {
        const { success } = await ChatService.editMessage(messageId, editContent.trim())

        if (success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, content: editContent.trim(), edited_at: new Date().toISOString() } : msg,
            ),
          )
          setEditingMessage(null)
          setEditContent("")

          toast({
            title: "Sucesso",
            description: "Mensagem editada com sucesso",
          })
        }
      } catch (err) {
        console.error("Erro ao editar mensagem:", err)
        toast({
          title: "Erro",
          description: "Erro ao editar mensagem",
          variant: "destructive",
        })
      }
    },
    [editContent, toast],
  )

  // Deletar mensagem
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const { success } = await ChatService.deleteMessage(messageId)

        if (success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, content: "Mensagem removida", deleted_at: new Date().toISOString() }
                : msg,
            ),
          )

          toast({
            title: "Sucesso",
            description: "Mensagem removida com sucesso",
          })
        }
      } catch (err) {
        console.error("Erro ao deletar mensagem:", err)
        toast({
          title: "Erro",
          description: "Erro ao remover mensagem",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  // Upload de arquivo
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!user) return

      try {
        const { url, error } = await ChatService.uploadMessageFile(file, conversationId)

        if (error || !url) {
          toast({
            title: "Erro",
            description: "Erro ao fazer upload do arquivo",
            variant: "destructive",
          })
          return
        }

        const { data, error: sendError } = await ChatService.sendMessage({
          conversation_id: conversationId,
          sender_id: user.id,
          content: `Arquivo: ${file.name}`,
          message_type: "file",
          file_url: url,
          file_name: file.name,
          file_size: file.size,
        })

        if (sendError) {
          toast({
            title: "Erro",
            description: "Erro ao enviar arquivo",
            variant: "destructive",
          })
          return
        }

        setMessages((prev) => [...prev, data as MessageWithSender])
      } catch (err) {
        console.error("Erro no upload:", err)
        toast({
          title: "Erro",
          description: "Erro inesperado no upload",
          variant: "destructive",
        })
      }
    },
    [user, conversationId, toast],
  )

  // Scroll para o final
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Efeitos
  useEffect(() => {
    loadConversation()
  }, [loadConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Subscrever a novas mensagens
  useEffect(() => {
    const subscription = ChatService.subscribeToConversation(conversationId, (newMessage) => {
      setMessages((prev) => {
        // Evitar duplicatas
        if (prev.some((msg) => msg.id === newMessage.id)) {
          return prev
        }
        return [...prev, newMessage as MessageWithSender]
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [conversationId])

  // Handlers de teclado
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage],
  )

  // Obter informações do outro participante
  const getOtherParticipant = useCallback(() => {
    if (!conversation || !user) return null

    const isParticipant1 = conversation.participant1_id === user.id
    return isParticipant1 ? conversation.participant2 : conversation.participant1
  }, [conversation, user])

  const otherParticipant = getOtherParticipant()

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando conversa...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={otherParticipant?.avatar_url || ""} />
              <AvatarFallback>{otherParticipant?.full_name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{otherParticipant?.full_name || "Usuário"}</CardTitle>
              <p className="text-sm text-gray-600">{conversation?.gig?.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* Mensagens */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === user?.id
            const isEditing = editingMessage === message.id

            return (
              <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
                  {/* Reply indicator */}
                  {message.reply_to && (
                    <div className="text-xs text-gray-500 mb-1 p-2 bg-gray-100 rounded border-l-2 border-blue-500">
                      <span className="font-medium">{message.reply_to.sender.full_name}:</span>{" "}
                      {message.reply_to.content}
                    </div>
                  )}

                  <div className={`rounded-lg p-3 ${isOwn ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              editMessage(message.id)
                            }
                            if (e.key === "Escape") {
                              setEditingMessage(null)
                              setEditContent("")
                            }
                          }}
                          className="bg-white text-black"
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => editMessage(message.id)}>
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingMessage(null)
                              setEditContent("")
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {message.message_type === "file" ? (
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4" />
                            <a
                              href={message.file_url || ""}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:no-underline"
                            >
                              {message.file_name || "Arquivo"}
                            </a>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}

                        {message.edited_at && <p className="text-xs opacity-70 mt-1">(editada)</p>}
                      </>
                    )}
                  </div>

                  {/* Message info */}
                  <div
                    className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 ${
                      isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span>
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>

                    {isOwn && (
                      <>
                        {message.is_read ? (
                          <CheckCheck className="h-3 w-3 text-blue-500" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </>
                    )}

                    {/* Actions */}
                    {isOwn && !message.deleted_at && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setEditingMessage(message.id)
                            setEditContent(message.content)
                          }}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => deleteMessage(message.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {!isOwn && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setReplyTo(message)}>
                        <Reply className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Avatar */}
                {!isOwn && (
                  <Avatar className="w-8 h-8 order-1 mr-2">
                    <AvatarImage src={message.sender.avatar_url || ""} />
                    <AvatarFallback>{message.sender.full_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Input area */}
      <div className="p-4">
        {/* Reply indicator */}
        {replyTo && (
          <div className="mb-2 p-2 bg-gray-100 rounded border-l-2 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Respondendo a {replyTo.sender.full_name}:</span>
                <p className="text-gray-600 truncate">{replyTo.content}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                ✕
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={sending}
              className="resize-none"
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleFileUpload(file)
              }
            }}
          />

          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={sending}>
            <Paperclip className="h-4 w-4" />
          </Button>

          <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} size="sm">
            {sending ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  )
}
