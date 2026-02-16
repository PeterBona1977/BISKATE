
import { supabase } from "@/lib/supabase/client"


type Notification = {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
  updated_at: string
  data?: any
}

export class NotificationService {
  /**
   * Dispara uma notificação e envia email se configurado
   */


  async getUserNotifications(userId: string, limit = 20, userType?: string): Promise<Notification[]> {
    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (userType) {
        query = query.eq("user_type", userType)
      }

      const { data, error } = await query

      if (error) {
        console.error("Erro ao buscar notificações:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Erro ao buscar notificações:", error)
      return []
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq("id", notificationId)

      if (error) {
        console.error("Erro ao marcar notificação como lida:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
      return false
    }
  }

  async markAllAsRead(userId: string, userType?: string): Promise<boolean> {
    try {
      let query = supabase
        .from("notifications")
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("read", false)

      if (userType) {
        query = query.eq("user_type", userType)
      }

      const { error } = await query

      if (error) {
        console.error("Erro ao marcar todas as notificações como lidas:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error)
      return false
    }
  }

  async getUnreadCount(userId: string, userType?: string): Promise<number> {
    try {
      let query = supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false)

      if (userType) {
        query = query.eq("user_type", userType)
      }

      const { count, error } = await query

      if (error) {
        console.error("Erro ao contar notificações não lidas:", error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error("Erro ao contar notificações não lidas:", error)
      return 0
    }
  }

  async createNotification(notification: {
    user_id: string
    title: string
    message: string
    type?: string
    user_type?: string
    data?: any
  }): Promise<boolean> {
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type || "info",
        user_type: notification.user_type || "client",
        data: notification.data || {},
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Erro ao criar notificação:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Erro ao criar notificação:", error)
      return false
    }
  }

  /**
   * Subsbcribe to user notifications in realtime
   */
  subscribeToUserNotifications(userId: string, callback: (payload: any) => void, userType?: string) {
    const channelName = `notifications-user-${userId}${userType ? `-${userType}` : ""}`

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`, // ONLY one filter allowed in Realtime
        },
        (payload) => {
          // Filter by userType manually in the JS callback
          // because Supabase Realtime only supports ONE filter per channel
          const newNotif = payload.new as any
          if (!userType || newNotif.user_type === userType) {
            callback(payload)
          }
        },
      )
      .subscribe()

    return channel
  }

  /**
   * Unsubscribe from realtime notifications
   */
  unsubscribeFromUserNotifications(channel: any) {
    if (channel) {
      supabase.removeChannel(channel)
    }
  }
}

export const notificationService = new NotificationService()
