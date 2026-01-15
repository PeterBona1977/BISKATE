"use client"

import { useState, useEffect } from "react"
import { RealtimeService } from "@/lib/realtime/realtime-service"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type RealtimeNotification = Database["public"]["Tables"]["realtime_notifications"]["Row"]

export function useRealtimeNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    loadNotifications()
    subscribeToNotifications()
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("realtime_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Erro ao carregar notificações:", error)
        return
      }

      setNotifications(data || [])
      setUnreadCount(data?.filter((n) => !n.read_at).length || 0)
    } catch (error) {
      console.error("Erro inesperado:", error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToNotifications = () => {
    if (!user) return

    const unsubscribe = RealtimeService.subscribeToNotifications(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 49)])
      setUnreadCount((prev) => prev + 1)
    })

    return unsubscribe
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("realtime_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", user!.id)

      if (error) {
        console.error("Erro ao marcar como lida:", error)
        return
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Erro inesperado:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("realtime_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user!.id)
        .is("read_at", null)

      if (error) {
        console.error("Erro ao marcar todas como lidas:", error)
        return
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Erro inesperado:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("realtime_notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user!.id)

      if (error) {
        console.error("Erro ao deletar notificação:", error)
        return
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error("Erro inesperado:", error)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications,
  }
}
