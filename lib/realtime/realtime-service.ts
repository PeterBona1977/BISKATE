"use client"

import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import type { RealtimeChannel } from "@supabase/supabase-js"

type UserPresence = Database["public"]["Tables"]["user_presence"]["Row"]
type RealtimeNotification = Database["public"]["Tables"]["realtime_notifications"]["Row"]
type Message = Database["public"]["Tables"]["messages"]["Row"]
type Conversation = Database["public"]["Tables"]["conversations"]["Row"]

export interface PresenceState {
  user_id: string
  status: "online" | "away" | "busy" | "offline"
  last_seen: string
  current_page?: string
}

export interface TypingState {
  user_id: string
  conversation_id: string
  is_typing: boolean
  started_at: string
}

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map()
  private static presenceCallbacks: Set<(presence: PresenceState[]) => void> = new Set()
  private static messageCallbacks: Map<string, Set<(message: Message) => void>> = new Map()
  private static typingCallbacks: Map<string, Set<(typing: TypingState) => void>> = new Map()
  private static notificationCallbacks: Set<(notification: RealtimeNotification) => void> = new Set()

  /**
   * Inicializar presença do usuário
   */
  static async initializePresence(userId: string): Promise<void> {
    try {
      console.log("🟢 Inicializando presença para:", userId)

      // Atualizar status para online
      await this.updateUserPresence(userId, "online")

      // Configurar canal de presença
      const presenceChannel = supabase.channel("user-presence", {
        config: {
          presence: {
            key: userId,
          },
        },
      })

      presenceChannel
        .on("presence", { event: "sync" }, () => {
          const state = presenceChannel.presenceState()
          const presenceList = Object.values(state).flat() as PresenceState[]
          this.notifyPresenceCallbacks(presenceList)
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          console.log("👋 Usuário entrou:", key, newPresences)
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          console.log("👋 Usuário saiu:", key, leftPresences)
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await presenceChannel.track({
              user_id: userId,
              status: "online",
              last_seen: new Date().toISOString(),
              current_page: window.location.pathname,
            })
          }
        })

      this.channels.set("presence", presenceChannel)

      // Configurar heartbeat para manter presença
      setInterval(() => {
        this.updateUserPresence(userId, "online")
      }, 30000) // A cada 30 segundos

      // Detectar quando usuário sai da página
      window.addEventListener("beforeunload", () => {
        this.updateUserPresence(userId, "offline")
      })

      // Detectar quando usuário fica inativo
      let inactivityTimer: NodeJS.Timeout
      const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer)
        inactivityTimer = setTimeout(
          () => {
            this.updateUserPresence(userId, "away")
          },
          5 * 60 * 1000,
        ) // 5 minutos
      }

      document.addEventListener("mousemove", resetInactivityTimer)
      document.addEventListener("keypress", resetInactivityTimer)
      resetInactivityTimer()
    } catch (error) {
      console.error("❌ Erro ao inicializar presença:", error)
    }
  }

  /**
   * Atualizar presença do usuário
   */
  static async updateUserPresence(
    userId: string,
    status: "online" | "away" | "busy" | "offline",
    currentPage?: string,
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc("update_user_presence", {
        target_user_id: userId,
        new_status: status,
        page_info: currentPage || window.location.pathname,
        device_data: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
      })

      if (error) {
        console.error("❌ Erro ao atualizar presença:", error)
      }
    } catch (error) {
      console.error("❌ Erro inesperado ao atualizar presença:", error)
    }
  }

  /**
   * Subscrever a uma conversa para mensagens em tempo real
   */
  static subscribeToConversation(
    conversationId: string,
    onMessage: (message: Message) => void,
    onTyping?: (typing: TypingState) => void,
  ): () => void {
    const channelName = `conversation-${conversationId}`

    if (this.channels.has(channelName)) {
      // Canal já existe, apenas adicionar callback
      if (!this.messageCallbacks.has(conversationId)) {
        this.messageCallbacks.set(conversationId, new Set())
      }
      this.messageCallbacks.get(conversationId)!.add(onMessage)

      if (onTyping) {
        if (!this.typingCallbacks.has(conversationId)) {
          this.typingCallbacks.set(conversationId, new Set())
        }
        this.typingCallbacks.get(conversationId)!.add(onTyping)
      }

      return () => {
        this.messageCallbacks.get(conversationId)?.delete(onMessage)
        if (onTyping) {
          this.typingCallbacks.get(conversationId)?.delete(onTyping)
        }
      }
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("📨 Nova mensagem:", payload.new)
          const message = payload.new as Message
          this.notifyMessageCallbacks(conversationId, message)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const conversation = payload.new as Conversation
          if (conversation.typing_user_id && onTyping) {
            const typingState: TypingState = {
              user_id: conversation.typing_user_id,
              conversation_id: conversationId,
              is_typing: true,
              started_at: conversation.typing_started_at || new Date().toISOString(),
            }
            this.notifyTypingCallbacks(conversationId, typingState)
          }
        },
      )
      .subscribe()

    this.channels.set(channelName, channel)

    // Adicionar callbacks
    if (!this.messageCallbacks.has(conversationId)) {
      this.messageCallbacks.set(conversationId, new Set())
    }
    this.messageCallbacks.get(conversationId)!.add(onMessage)

    if (onTyping) {
      if (!this.typingCallbacks.has(conversationId)) {
        this.typingCallbacks.set(conversationId, new Set())
      }
      this.typingCallbacks.get(conversationId)!.add(onTyping)
    }

    // Retornar função de cleanup
    return () => {
      this.messageCallbacks.get(conversationId)?.delete(onMessage)
      if (onTyping) {
        this.typingCallbacks.get(conversationId)?.delete(onTyping)
      }

      // Se não há mais callbacks, remover canal
      if (this.messageCallbacks.get(conversationId)?.size === 0) {
        channel.unsubscribe()
        this.channels.delete(channelName)
        this.messageCallbacks.delete(conversationId)
        this.typingCallbacks.delete(conversationId)
      }
    }
  }

  /**
   * Subscrever a notificações do usuário
   */
  static subscribeToNotifications(
    userId: string,
    onNotification: (notification: RealtimeNotification) => void,
  ): () => void {
    const channelName = `user-notifications-${userId}`

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "realtime_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔔 Nova notificação:", payload.new)
          const notification = payload.new as RealtimeNotification
          this.notifyNotificationCallbacks(notification)

          // Mostrar notificação do navegador se permitido
          this.showBrowserNotification(notification)
        },
      )
      .subscribe()

    this.channels.set(channelName, channel)
    this.notificationCallbacks.add(onNotification)

    return () => {
      this.notificationCallbacks.delete(onNotification)
      channel.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  /**
   * Indicar que usuário está digitando
   */
  static async setTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({
          typing_user_id: isTyping ? userId : null,
          typing_started_at: isTyping ? new Date().toISOString() : null,
        })
        .eq("id", conversationId)

      if (error) {
        console.error("❌ Erro ao atualizar status de digitação:", error)
      }
    } catch (error) {
      console.error("❌ Erro inesperado ao atualizar digitação:", error)
    }
  }

  /**
   * Marcar mensagem como lida
   */
  static async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("mark_message_as_read", {
        message_id: messageId,
        reader_user_id: userId,
      })

      if (error) {
        console.error("❌ Erro ao marcar mensagem como lida:", error)
      }
    } catch (error) {
      console.error("❌ Erro inesperado ao marcar como lida:", error)
    }
  }

  /**
   * Buscar usuários online
   */
  static async getOnlineUsers(): Promise<UserPresence[]> {
    try {
      const { data, error } = await supabase
        .from("user_presence")
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .in("status", ["online", "away", "busy"])
        .order("last_seen", { ascending: false })

      if (error) {
        console.error("❌ Erro ao buscar usuários online:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("❌ Erro inesperado ao buscar usuários online:", error)
      return []
    }
  }

  /**
   * Mostrar notificação do navegador
   */
  private static async showBrowserNotification(notification: RealtimeNotification): Promise<void> {
    if (!("Notification" in window)) return

    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.body,
        icon: "/logo.png",
        badge: "/badge.png",
        data: notification.data,
      })
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        new Notification(notification.title, {
          body: notification.body,
          icon: "/logo.png",
        })
      }
    }
  }

  /**
   * Notificar callbacks de presença
   */
  private static notifyPresenceCallbacks(presenceList: PresenceState[]): void {
    this.presenceCallbacks.forEach((callback) => {
      try {
        callback(presenceList)
      } catch (error) {
        console.error("❌ Erro no callback de presença:", error)
      }
    })
  }

  /**
   * Notificar callbacks de mensagem
   */
  private static notifyMessageCallbacks(conversationId: string, message: Message): void {
    const callbacks = this.messageCallbacks.get(conversationId)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(message)
        } catch (error) {
          console.error("❌ Erro no callback de mensagem:", error)
        }
      })
    }
  }

  /**
   * Notificar callbacks de digitação
   */
  private static notifyTypingCallbacks(conversationId: string, typing: TypingState): void {
    const callbacks = this.typingCallbacks.get(conversationId)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(typing)
        } catch (error) {
          console.error("❌ Erro no callback de digitação:", error)
        }
      })
    }
  }

  /**
   * Notificar callbacks de notificação
   */
  private static notifyNotificationCallbacks(notification: RealtimeNotification): void {
    this.notificationCallbacks.forEach((callback) => {
      try {
        callback(notification)
      } catch (error) {
        console.error("❌ Erro no callback de notificação:", error)
      }
    })
  }

  /**
   * Cleanup de todos os canais
   */
  static cleanup(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe()
    })
    this.channels.clear()
    this.presenceCallbacks.clear()
    this.messageCallbacks.clear()
    this.typingCallbacks.clear()
    this.notificationCallbacks.clear()
  }
}
