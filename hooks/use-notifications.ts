"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { NotificationRow } from "@/lib/supabase/database.types"

export function useNotifications() {
  const supabase = createClient()
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }
      setNotifications(data || [])
    } catch (err: any) {
      console.error("Error fetching notifications:", err.message)
      setError(err.message)
      toast({
        title: "Erro ao carregar notificações",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user, supabase, toast])

  useEffect(() => {
    fetchNotifications()

    // Realtime listener for new notifications
    const channel = supabase
      .channel("notifications_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: user ? `user_id=eq.${user.id}` : undefined,
        },
        (payload) => {
          const newNotification = payload.new as NotificationRow
          setNotifications((prev) => [newNotification, ...prev])
          toast({
            title: newNotification.title,
            description: newNotification.message,
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNotifications, supabase, user, toast])

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)
        if (error) throw error
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      } catch (err: any) {
        console.error("Error marking notification as read:", err.message)
        toast({
          title: "Erro ao marcar como lida",
          description: err.message,
          variant: "destructive",
        })
      }
    },
    [supabase, toast],
  )

  const markAllAsRead = useCallback(async () => {
    if (!user) return
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)
      if (error) throw error
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err: any) {
      console.error("Error marking all notifications as read:", err.message)
      toast({
        title: "Erro ao marcar todas como lidas",
        description: err.message,
        variant: "destructive",
      })
    }
  }, [user, supabase, toast])

  const clearAllNotifications = useCallback(async () => {
    if (!user) return
    try {
      const { error } = await supabase.from("notifications").delete().eq("user_id", user.id)
      if (error) throw error
      setNotifications([])
    } catch (err: any) {
      console.error("Error clearing all notifications:", err.message)
      toast({
        title: "Erro ao limpar notificações",
        description: err.message,
        variant: "destructive",
      })
    }
  }, [user, supabase, toast])

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
  }
}
