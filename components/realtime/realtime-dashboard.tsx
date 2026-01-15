"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PresenceIndicator } from "./presence-indicator"
import { useAuth } from "@/contexts/auth-context"
import { useUserPresence } from "@/hooks/use-user-presence"
import { RealtimeService } from "@/lib/realtime/realtime-service"
import { supabase } from "@/lib/supabase/client"
import { Users, MessageSquare, Bell, Activity, Monitor, Smartphone, Globe, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase/database.types"

type UserPresence = Database["public"]["Tables"]["user_presence"]["Row"] & {
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  }
}

type ActiveSession = Database["public"]["Tables"]["active_sessions"]["Row"]
type RealtimeNotification = Database["public"]["Tables"]["realtime_notifications"]["Row"]

export function RealtimeDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { onlineUsers, updateStatus } = useUserPresence()
  const [activeTab, setActiveTab] = useState("presence")
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
      subscribeToNotifications()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar sessões ativas
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("active_sessions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("last_activity", { ascending: false })

      if (sessionsError) {
        console.error("Erro ao carregar sessões:", sessionsError)
      } else {
        setSessions(sessionsData || [])
      }

      // Carregar notificações recentes
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("realtime_notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (notificationsError) {
        console.error("Erro ao carregar notificações:", notificationsError)
      } else {
        setNotifications(notificationsData || [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToNotifications = () => {
    if (!user) return

    const unsubscribe = RealtimeService.subscribeToNotifications(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 19)])

      toast({
        title: notification.title,
        description: notification.body,
      })
    })

    return unsubscribe
  }

  const handleStatusChange = async (newStatus: "online" | "away" | "busy" | "offline") => {
    await updateStatus(newStatus)
    toast({
      title: "Status atualizado",
      description: `Seu status foi alterado para ${newStatus}`,
    })
  }

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Agora mesmo"
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`
    return `${Math.floor(diffInMinutes / 1440)}d atrás`
  }

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />
      case "desktop":
        return <Monitor className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com Status do Usuário */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <PresenceIndicator userId={user!.id} userName={user!.email || "Usuário"} showName={true} size="lg" />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleStatusChange("online")}>
                Online
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleStatusChange("away")}>
                Ausente
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleStatusChange("busy")}>
                Ocupado
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs do Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="presence" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Presença</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Sessões</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab de Presença */}
        <TabsContent value="presence">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Usuários Online ({onlineUsers.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {onlineUsers.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhum usuário online no momento</p>
                  ) : (
                    onlineUsers.map((presence) => (
                      <div key={presence.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                        <PresenceIndicator
                          userId={presence.user_id}
                          userName={`Usuário ${presence.user_id.slice(0, 8)}`}
                          showName={true}
                        />
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{formatLastSeen(presence.last_seen)}</p>
                          {presence.current_page && <p className="text-xs text-gray-400">{presence.current_page}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Notificações */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notificações Recentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhuma notificação</p>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium">{notification.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.body}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{formatLastSeen(notification.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Sessões */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Sessões Ativas ({sessions.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {sessions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhuma sessão ativa</p>
                  ) : (
                    sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {getDeviceIcon(session.device_type)}
                          <div>
                            <p className="text-sm font-medium">{session.browser || "Navegador desconhecido"}</p>
                            <p className="text-xs text-gray-600">{session.os || "Sistema desconhecido"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{formatLastSeen(session.last_activity)}</p>
                          {session.country && (
                            <p className="text-xs text-gray-400">
                              {session.city}, {session.country}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Chat */}
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Chat em Tempo Real</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Selecione uma conversa para começar a conversar</p>
                <Button variant="outline">Ver Conversas</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
