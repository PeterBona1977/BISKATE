"use client"

import { useState, useEffect } from "react"
import { RealtimeService, type PresenceState } from "@/lib/realtime/realtime-service"
import { useAuth } from "@/contexts/auth-context"

export function useUserPresence() {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    let cleanup: (() => void) | undefined

    const initializePresence = async () => {
      try {
        // Inicializar presença do usuário atual
        await RealtimeService.initializePresence(user.id)

        // Buscar usuários online iniciais
        const users = await RealtimeService.getOnlineUsers()
        setOnlineUsers(
          users.map((u) => ({
            user_id: u.user_id,
            status: u.status as any,
            last_seen: u.last_seen,
            current_page: u.current_page,
          })),
        )

        setLoading(false)
      } catch (error) {
        console.error("Erro ao inicializar presença:", error)
        setLoading(false)
      }
    }

    initializePresence()

    return () => {
      if (cleanup) cleanup()
      if (user) {
        RealtimeService.updateUserPresence(user.id, "offline")
      }
    }
  }, [user])

  const updateStatus = async (status: "online" | "away" | "busy" | "offline") => {
    if (user) {
      await RealtimeService.updateUserPresence(user.id, status)
    }
  }

  const isUserOnline = (userId: string): boolean => {
    const userPresence = onlineUsers.find((u) => u.user_id === userId)
    return userPresence?.status === "online"
  }

  const getUserStatus = (userId: string): "online" | "away" | "busy" | "offline" => {
    const userPresence = onlineUsers.find((u) => u.user_id === userId)
    return userPresence?.status || "offline"
  }

  return {
    onlineUsers,
    loading,
    updateStatus,
    isUserOnline,
    getUserStatus,
  }
}
