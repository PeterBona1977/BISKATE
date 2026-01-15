"use client"

import type React from "react"
import { createContext, useContext, useReducer, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "./auth-context"

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  created_at: string
  updated_at?: string
}

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
}

type NotificationsAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_NOTIFICATIONS"; payload: Notification[] }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_AS_READ"; payload: string }
  | { type: "MARK_ALL_AS_READ" }
  | { type: "REMOVE_NOTIFICATION"; payload: string }

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
}

function notificationsReducer(state: NotificationsState, action: NotificationsAction): NotificationsState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false }

    case "SET_NOTIFICATIONS":
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter((n) => !n.read).length,
        loading: false,
        error: null,
      }

    case "ADD_NOTIFICATION":
      const newNotifications = [action.payload, ...state.notifications]
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newNotifications.filter((n) => !n.read).length,
      }

    case "MARK_AS_READ":
      const updatedNotifications = state.notifications.map((n) => (n.id === action.payload ? { ...n, read: true } : n))
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter((n) => !n.read).length,
      }

    case "MARK_ALL_AS_READ":
      const allReadNotifications = state.notifications.map((n) => ({ ...n, read: true }))
      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0,
      }

    case "REMOVE_NOTIFICATION":
      const filteredNotifications = state.notifications.filter((n) => n.id !== action.payload)
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter((n) => !n.read).length,
      }

    default:
      return state
  }
}

interface NotificationsContextType extends NotificationsState {
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  removeNotification: (id: string) => Promise<void>
  addNotification: (notification: Omit<Notification, "id" | "created_at" | "user_id">) => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationsReducer, initialState)
  const { user } = useAuth()

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      console.log("🔍 Usuário não autenticado, pulando busca de notificações")
      return
    }

    dispatch({ type: "SET_LOADING", payload: true })

    try {
      console.log("🔍 Buscando notificações para usuário:", user.id)

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          user_id,
          title,
          message,
          type,
          read,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("❌ Erro na query de notificações:", error)
        throw error
      }

      console.log("✅ Notificações carregadas:", data?.length || 0)
      dispatch({ type: "SET_NOTIFICATIONS", payload: data || [] })
    } catch (err: any) {
      console.error("❌ Erro ao buscar notificações:", err)
      dispatch({ type: "SET_ERROR", payload: err.message })
    }
  }, [user?.id])

  const markAsRead = useCallback(
    async (id: string) => {
      if (!user?.id) return

      try {
        const { error } = await supabase
          .from("notifications")
          .update({
            read: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("user_id", user.id) // Segurança adicional

        if (error) throw error

        dispatch({ type: "MARK_AS_READ", payload: id })
        console.log("✅ Notificação marcada como lida:", id)
      } catch (err: any) {
        console.error("❌ Erro ao marcar como lida:", err)
      }
    },
    [user?.id],
  )

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from("notifications")
        .update({
          read: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("read", false)

      if (error) throw error

      dispatch({ type: "MARK_ALL_AS_READ" })
      console.log("✅ Todas as notificações marcadas como lidas")
    } catch (err: any) {
      console.error("❌ Erro ao marcar todas como lidas:", err)
    }
  }, [user?.id])

  const removeNotification = useCallback(
    async (id: string) => {
      if (!user?.id) return

      try {
        const { error } = await supabase.from("notifications").delete().eq("id", id).eq("user_id", user.id) // Segurança adicional

        if (error) throw error

        dispatch({ type: "REMOVE_NOTIFICATION", payload: id })
        console.log("✅ Notificação removida:", id)
      } catch (err: any) {
        console.error("❌ Erro ao remover notificação:", err)
      }
    },
    [user?.id],
  )

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "created_at" | "user_id">) => {
      if (!user?.id) return

      const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        user_id: user.id,
        created_at: new Date().toISOString(),
      }
      dispatch({ type: "ADD_NOTIFICATION", payload: newNotification })
      console.log("✅ Notificação local adicionada:", newNotification.title)
    },
    [user?.id],
  )

  // Fetch notifications when user changes
  useEffect(() => {
    if (user?.id) {
      console.log("🔄 Usuário mudou, buscando notificações...")
      fetchNotifications()
    } else {
      // Limpar notificações quando usuário sair
      dispatch({ type: "SET_NOTIFICATIONS", payload: [] })
    }
  }, [user?.id, fetchNotifications])

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return

    console.log("🔄 Configurando subscription de notificações para:", user.id)

    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("🔔 Nova notificação recebida:", payload.new)
          dispatch({ type: "ADD_NOTIFICATION", payload: payload.new as Notification })
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("🔄 Notificação atualizada:", payload.new)
          // Refetch para manter sincronizado
          fetchNotifications()
        },
      )
      .subscribe((status) => {
        console.log("📡 Status da subscription:", status)
      })

    return () => {
      console.log("🔌 Desconectando subscription de notificações")
      subscription.unsubscribe()
    }
  }, [user?.id, fetchNotifications])

  const value: NotificationsContextType = {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification,
  }

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}
