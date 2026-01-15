"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Check, RefreshCw, Trash2, User } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { enGB } from "date-fns/locale"

interface Notification {
  id: string
  user_id: string
  title: string
  content: string
  type: string
  read: boolean
  created_at: string
  user?: {
    email: string
    full_name: string | null
  }
}

export function NotificationsSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchNotifications()

    // Configurar subscription para atualizações em tempo real
    const subscription = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("Change detected:", payload)
          fetchNotifications()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          user:user_id (
            email,
            full_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error

      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Could not load notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

      if (error) throw error

      setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))

      toast({
        title: "Notification marked as read",
        description: "The notification was successfully updated",
      })
    } catch (error) {
      console.error("Error updating notification:", error)
      toast({
        title: "Error",
        description: "Could not update the notification",
        variant: "destructive",
      })
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id)

      if (error) throw error

      setNotifications(notifications.filter((notif) => notif.id !== id))

      toast({
        title: "Notification deleted",
        description: "The notification was successfully removed",
      })
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "Could not delete the notification",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="h-5 w-5" />
      case "system":
        return <Bell className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "user":
        return <Badge className="bg-blue-100 text-blue-800">User</Badge>
      case "system":
        return <Badge className="bg-purple-100 text-purple-800">System</Badge>
      case "alert":
        return <Badge className="bg-red-100 text-red-800">Alert</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          System Notifications
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchNotifications}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded animate-pulse">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">There are no notifications to show</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${!notification.read ? "bg-blue-50 border-blue-100" : "bg-white"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-full ${!notification.read ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{notification.title}</h3>
                        {getNotificationBadge(notification.type)}
                        {!notification.read && (
                          <Badge variant="outline" className="bg-blue-50">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{notification.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{notification.user?.full_name || notification.user?.email || "System"}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: enGB,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
