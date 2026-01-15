"use client"

import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type Conversation = Database["public"]["Tables"]["conversations"]["Row"]
type Message = Database["public"]["Tables"]["messages"]["Row"]

export interface CreateConversationData {
  gig_id: string
  participant1_id: string
  participant2_id: string
}

export interface SendMessageData {
  conversation_id: string
  sender_id: string
  content: string
  message_type?: "text" | "image" | "file" | "system"
  reply_to_id?: string
  file_url?: string
  file_name?: string
  file_size?: number
}

export class ChatService {
  /**
   * Criar ou buscar conversa existente
   */
  static async getOrCreateConversation(data: CreateConversationData): Promise<{
    data: Conversation | null
    error: any
  }> {
    try {
      // Primeiro, tentar encontrar conversa existente
      const { data: existingConversation, error: searchError } = await supabase
        .from("conversations")
        .select("*")
        .eq("gig_id", data.gig_id)
        .or(
          `and(participant1_id.eq.${data.participant1_id},participant2_id.eq.${data.participant2_id}),and(participant1_id.eq.${data.participant2_id},participant2_id.eq.${data.participant1_id})`,
        )
        .single()

      if (existingConversation) {
        return { data: existingConversation, error: null }
      }

      // Se não existir, criar nova conversa
      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          gig_id: data.gig_id,
          participant1_id: data.participant1_id,
          participant2_id: data.participant2_id,
        })
        .select()
        .single()

      if (createError) {
        console.error("❌ Erro ao criar conversa:", createError)
        return { data: null, error: createError }
      }

      return { data: newConversation, error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { data: null, error: err }
    }
  }

  /**
   * Buscar conversas do usuário
   */
  static async getUserConversations(userId: string): Promise<{ data: Conversation[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          gig:gigs (
            title,
            status
          ),
          participant1:profiles!participant1_id (
            full_name,
            avatar_url
          ),
          participant2:profiles!participant2_id (
            full_name,
            avatar_url
          ),
          last_message:messages (
            content,
            message_type,
            created_at
          )
        `)
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order("last_message_at", { ascending: false })

      if (error) {
        console.error("❌ Erro ao buscar conversas:", error)
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { data: [], error: err }
    }
  }

  /**
   * Buscar mensagens de uma conversa
   */
  static async getConversationMessages(
    conversationId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ data: Message[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!sender_id (
            full_name,
            avatar_url
          ),
          reply_to:messages!reply_to_id (
            content,
            sender:profiles!sender_id (
              full_name
            )
          )
        `)
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error("❌ Erro ao buscar mensagens:", error)
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { data: [], error: err }
    }
  }

  /**
   * Enviar mensagem
   */
  static async sendMessage(data: SendMessageData): Promise<{ data: Message | null; error: any }> {
    try {
      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: data.conversation_id,
          sender_id: data.sender_id,
          content: data.content,
          message_type: data.message_type || "text",
          reply_to_id: data.reply_to_id,
          file_url: data.file_url,
          file_name: data.file_name,
          file_size: data.file_size,
        })
        .select(`
          *,
          sender:profiles!sender_id (
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) {
        console.error("❌ Erro ao enviar mensagem:", error)
        return { data: null, error }
      }

      return { data: message, error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { data: null, error: err }
    }
  }

  /**
   * Marcar mensagens como lidas
   */
  static async markMessagesAsRead(conversationId: string, userId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase.rpc("mark_messages_as_read", {
        conversation_uuid: conversationId,
        user_uuid: userId,
      })

      if (error) {
        console.error("❌ Erro ao marcar mensagens como lidas:", error)
        return { success: false, error }
      }

      return { success: true }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { success: false, error: err }
    }
  }

  /**
   * Editar mensagem
   */
  static async editMessage(messageId: string, content: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from("messages")
        .update({
          content,
          edited_at: new Date().toISOString(),
        })
        .eq("id", messageId)

      if (error) {
        console.error("❌ Erro ao editar mensagem:", error)
        return { success: false, error }
      }

      return { success: true }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { success: false, error: err }
    }
  }

  /**
   * Deletar mensagem
   */
  static async deleteMessage(messageId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from("messages")
        .update({
          deleted_at: new Date().toISOString(),
          content: "Mensagem removida",
        })
        .eq("id", messageId)

      if (error) {
        console.error("❌ Erro ao deletar mensagem:", error)
        return { success: false, error }
      }

      return { success: true }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { success: false, error: err }
    }
  }

  /**
   * Upload de arquivo para mensagem
   */
  static async uploadMessageFile(file: File, conversationId: string): Promise<{ url: string | null; error?: any }> {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${conversationId}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage.from("chat-files").upload(fileName, file)

      if (error) {
        console.error("❌ Erro ao fazer upload:", error)
        return { url: null, error }
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-files").getPublicUrl(data.path)

      return { url: publicUrl, error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { url: null, error: err }
    }
  }

  /**
   * Buscar conversa por ID
   */
  static async getConversationById(conversationId: string): Promise<{ data: Conversation | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          gig:gigs (
            title,
            status,
            author_id
          ),
          participant1:profiles!participant1_id (
            full_name,
            avatar_url
          ),
          participant2:profiles!participant2_id (
            full_name,
            avatar_url
          )
        `)
        .eq("id", conversationId)
        .single()

      if (error) {
        console.error("❌ Erro ao buscar conversa:", error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { data: null, error: err }
    }
  }

  /**
   * Arquivar conversa
   */
  static async archiveConversation(conversationId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase.from("conversations").update({ status: "archived" }).eq("id", conversationId)

      if (error) {
        console.error("❌ Erro ao arquivar conversa:", error)
        return { success: false, error }
      }

      return { success: true }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { success: false, error: err }
    }
  }

  /**
   * Bloquear conversa
   */
  static async blockConversation(conversationId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase.from("conversations").update({ status: "blocked" }).eq("id", conversationId)

      if (error) {
        console.error("❌ Erro ao bloquear conversa:", error)
        return { success: false, error }
      }

      return { success: true }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { success: false, error: err }
    }
  }

  /**
   * Subscrever a mudanças em tempo real
   */
  static subscribeToConversation(conversationId: string, callback: (message: Message) => void) {
    return supabase
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
          callback(payload.new as Message)
        },
      )
      .subscribe()
  }

  /**
   * Subscrever a conversas do usuário
   */
  static subscribeToUserConversations(userId: string, callback: (conversation: Conversation) => void) {
    return supabase
      .channel(`user-conversations:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `or(participant1_id.eq.${userId},participant2_id.eq.${userId})`,
        },
        (payload) => {
          callback(payload.new as Conversation)
        },
      )
      .subscribe()
  }
}
