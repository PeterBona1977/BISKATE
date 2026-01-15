"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MessageSquare, Search, Send, MoreVertical, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Database } from "@/lib/supabase/database.types"
import { formatDistanceToNow } from "date-fns"
import { pt } from "date-fns/locale"
import { useTranslations } from "next-intl"

type DBMessage = Database["public"]["Tables"]["messages"]["Row"]

interface Conversation {
  id: string
  participant: {
    id: string
    name: string
    avatar?: string
    email?: string
  }
  lastMessage: {
    content: string
    timestamp: string
    isFromMe: boolean
  } | null
  unreadCount: number
  gigTitle?: string
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  isFromMe: boolean
}

export default function MessagesPage() {
  const t = useTranslations("Dashboard.Messages")
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (user?.id) {
      loadConversations()
    }
  }, [user?.id])

  const loadConversations = async () => {
    try {
      setLoading(true)

      if (!user) return

      // 1. Get conversations I am part of
      const { data: myParticipations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", user.id)

      if (partError) throw partError

      if (!myParticipations || myParticipations.length === 0) {
        setConversations([])
        return
      }

      // Explicitly cast to avoid 'never' inference issues if types aren't perfectly aligned yet
      const parts = myParticipations as any[]
      const conversationIds = parts.map((p) => p.conversation_id)

      // 2. Fetch conversation details, participants (to find the other user), and last messages
      const { data: convsData, error: convsError } = await supabase
        .from("conversations")
        .select(`
          id, 
          status, 
          updated_at,
          conversation_participants (
            user_id,
            profiles (
              id,
              full_name,
              avatar_url,
              email
            )
          ),
          messages (
            content,
            created_at,
            sender_id,
            is_read
          )
        `)
        .in("id", conversationIds)
        .order("updated_at", { ascending: false })

      if (convsError) throw convsError

      // 3. Map to UI format
      const formattedConversations: Conversation[] = (convsData as any[]).map((conv: any) => {
        // Find the "other" participant
        const otherParticipant = conv.conversation_participants.find(
          (p: any) => p.user_id !== user.id
        )?.profiles

        // Find my last read time
        const myReadTime = parts.find((p) => p.conversation_id === conv.id)?.last_read_at

        // Sort messages to get the last one (Supabase might allow order in select but safely sort here)
        const sortedMessages = (conv.messages || []).sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        const lastMsg = sortedMessages[0]

        // Count unread
        const unreadCount = sortedMessages.filter(
          (m: any) => m.sender_id !== user.id && (!m.is_read || (myReadTime && new Date(m.created_at) > new Date(myReadTime)))
        ).length

        return {
          id: conv.id,
          participant: {
            id: otherParticipant?.id || "unknown",
            name: otherParticipant?.full_name || t("unknownUser"),
            avatar: otherParticipant?.avatar_url || "",
            email: otherParticipant?.email,
          },
          lastMessage: lastMsg
            ? {
              content: lastMsg.content,
              timestamp: formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true, locale: pt }),
              isFromMe: lastMsg.sender_id === user.id,
            }
            : null,
          unreadCount,
          gigTitle: t("defaultTitle"), // TODO: Fetch linked gig title if we link it in querying
        }
      })

      setConversations(formattedConversations)
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.gigTitle && conv.gigTitle.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-600 mt-2">
            {totalUnread > 0 ? t("unreadMessages", { count: totalUnread }) : t("allRead")}
          </p>
        </div>
        <Badge variant={totalUnread > 0 ? "default" : "secondary"}>{t("conversationsCount", { count: conversations.length })}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              {t("conversationsTitle")}
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">{t("noConversations")}</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${selectedConversation === conversation.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                      }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.participant.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {conversation.participant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 truncate">{conversation.participant.name}</h4>
                          <span className="text-xs text-gray-500">{conversation.lastMessage?.timestamp}</span>
                        </div>

                        {conversation.gigTitle && <p className="text-xs text-blue-600 mb-1">{conversation.gigTitle}</p>}

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate">{conversation.lastMessage?.content || t("newConversation")}</p>
                          {conversation.unreadCount > 0 && (
                            <Badge
                              variant="default"
                              className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                            >
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <ChatArea conversationId={selectedConversation} conversations={conversations} currentUser={user} />
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t("selectConversation")}</h3>
                <p className="text-gray-600">{t("selectConversationDesc")}</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

function ChatArea({
  conversationId,
  conversations,
  currentUser,
}: {
  conversationId: string
  conversations: Conversation[]
  currentUser: any
}) {
  const t = useTranslations("Dashboard.Messages")
  const conversation = conversations.find((c) => c.id === conversationId)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId)
      // Subscribe to new messages
      const channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMsg = payload.new as DBMessage
            setMessages((prev) => [
              ...prev,
              {
                id: newMsg.id,
                content: newMsg.content,
                senderId: newMsg.sender_id,
                createdAt: newMsg.created_at,
                isFromMe: newMsg.sender_id === currentUser?.id,
              },
            ])
            scrollToBottom()
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [conversationId, currentUser?.id])

  const loadMessages = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true })

      if (error) throw error

      if (data) {
        setMessages(
          data.map((m: any) => ({
            id: m.id,
            content: m.content,
            senderId: m.sender_id,
            createdAt: m.created_at,
            isFromMe: m.sender_id === currentUser?.id,
          })),
        )
        scrollToBottom()
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !conversationId) return

    try {
      setSending(true)
      const content = newMessage.trim()
      setNewMessage("") // Optimistic clear

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: content,
      })

      if (error) throw error

      // Update conversation timestamp locally or rely on re-fetch
      // Trigger conversation list update if needed (not implemented here for simplicity)
    } catch (error) {
      console.error("Error sending message:", error)
      setNewMessage(newMessage) // Restore on error
    } finally {
      setSending(false)
    }
  }

  if (!conversation) return null

  return (
    <>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={conversation.participant.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {conversation.participant.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div
                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white bg-gray-400`}
                title="Status desconhecido"
              ></div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{conversation.participant.name}</h3>
              <p className="text-sm text-gray-500">
                {conversation.gigTitle || "Conversation"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 flex flex-col h-[400px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <p>{t("noMessages")}</p>
              <p className="text-sm">{t("startChatting", { name: conversation.participant.name.split(' ')[0] })}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isFromMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${msg.isFromMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span className={`text-xs mt-1 block ${msg.isFromMe ? "text-blue-100" : "text-gray-500"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>

      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            placeholder={t("typeMessage")}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !sending && handleSendMessage()}
            className="flex-1"
            disabled={sending}
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  )
}
