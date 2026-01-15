"use client"

import type React from "react"
import { createContext, useContext, useEffect, useReducer, useCallback } from "react"
import { supabase } from "@/lib/supabase/client" // ✅ IMPORTAÇÃO DIRETA DO CLIENT
import { useAuth } from "./auth-context"
import type { Database } from "@/lib/supabase/database.types"

type Notification = Database["public"]["Tables"]["notifications"]["Row"]

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
}

type NotificationsAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_NOTIFICATIONS"; payload: Notification[] }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_AS_READ"; payload: string }
  | { type: "MARK_ALL_AS_READ" }

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: null,
}

function notificationsReducer(state: NotificationsState, action: NotificationsAction): NotificationsState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_NOTIFICATIONS":
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter((n) => !n.read).length,
        loading: false,
        error: null,
      }
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false }
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
    default:
      return state
  }
}

interface NotificationsContextType extends NotificationsState {
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refetch: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(notificationsReducer, initialState)

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      dispatch({ type: "SET_NOTIFICATIONS", payload: [] })
      return
    }

    try {
      console.log("🔔 Buscando notificações para utilizador:", user.id)
      dispatch({ type: "SET_LOADING", payload: true })
      dispatch({ type: "SET_ERROR", payload: null })

      // ✅ QUERY CORRIGIDA COM user_id
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id) // ✅ USANDO user_id EM VEZ DE user
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("❌ Erro ao buscar notificações:", error)
        dispatch({ type: "SET_ERROR", payload: `Erro ao buscar notificações: ${error.message}` })
        return
      }

      console.log(`✅ ${data?.length || 0} notificações carregadas`)
      dispatch({ type: "SET_NOTIFICATIONS", payload: data || [] })
    } catch (err) {
      console.error("❌ Erro inesperado ao buscar notificações:", err)
      dispatch({ type: "SET_ERROR", payload: "Erro inesperado ao buscar notificações" })
    }
  }, [user])

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

      if (error) {
        console.error("❌ Erro ao marcar notificação como lida:", error)
        return
      }

      dispatch({ type: "MARK_AS_READ", payload: id })
    } catch (err) {
      console.error("❌ Erro inesperado ao marcar notificação:", err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user) return

    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id)

      if (error) {
        console.error("❌ Erro ao marcar todas as notificações como lidas:", error)
        return
      }

      dispatch({ type: "MARK_ALL_AS_READ" })
    } catch (err) {
      console.error("❌ Erro inesperado ao marcar todas as notificações:", err)
    }
  }, [user])

  // ✅ REAL-TIME SUBSCRIPTION
  useEffect(() => {
    if (!user) return

    console.log("🔔 Configurando subscription de notificações para:", user.id)

    const subscription = supabase
      .channel("notifications")
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
      .subscribe()

    return () => {
      console.log("🔔 Removendo subscription de notificações")
      subscription.unsubscribe()
    }
  }, [user])

  // ✅ FETCH INICIAL
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return (
    <NotificationsContext.Provider
      value={{
        ...state,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}
