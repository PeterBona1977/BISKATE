"use client"

import { supabase } from "@/lib/supabase/client"

interface DeviceToken {
  id: string
  user_id: string
  token: string
  device_info: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
  last_used_at: string
}

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  serverKey: string
}

export class PushNotificationService {
  private static firebaseInitialized = false
  private static firebaseMessaging: any = null

  /**
   * Inicializa o Firebase no cliente
   */
  static async initializeFirebase(): Promise<boolean> {
    if (typeof window === "undefined") return false
    if (this.firebaseInitialized) return true

    try {
      // Buscar configuração do Firebase
      const { data: configData, error: configError } = await supabase
        .from("platform_integrations")
        .select("config, is_enabled")
        .eq("service_name", "firebase")
        .single()

      if (configError || !configData || !configData.is_enabled) {
        console.log("Firebase não configurado ou desativado")
        return false
      }

      const firebaseConfig = configData.config as FirebaseConfig

      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.log("Configuração do Firebase incompleta")
        return false
      }

      // Importar Firebase dinamicamente
      const { initializeApp } = await import("firebase/app")
      const { getMessaging, getToken, onMessage } = await import("firebase/messaging")

      // Inicializar Firebase
      const app = initializeApp(firebaseConfig)
      this.firebaseMessaging = getMessaging(app)
      this.firebaseInitialized = true

      // Configurar listener para mensagens em foreground
      onMessage(this.firebaseMessaging, (payload) => {
        console.log("Mensagem recebida em foreground:", payload)
        this.showNotification(payload)
      })

      console.log("Firebase inicializado com sucesso")
      return true
    } catch (err) {
      console.error("Erro ao inicializar Firebase:", err)
      return false
    }
  }

  /**
   * Solicita permissão e registra token do dispositivo
   */
  static async requestPermissionAndRegisterToken(): Promise<string | null> {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        console.log("Este navegador não suporta notificações push")
        return null
      }

      // Check if Firebase is initialized
      const initialized = await this.initializeFirebase()
      if (!initialized) {
        console.log("Falha ao inicializar Firebase. Verifique as configurações no painel de administração.")
        return null
      }

      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        console.log("Permissão para notificações negada")
        return null
      }

      // Importar getToken dinamicamente
      const { getToken } = await import("firebase/messaging")

      if (!this.firebaseMessaging) return null

      // Try to register service worker, but don't fail if it doesn't exist
      let serviceWorkerRegistration = undefined
      try {
        if ('serviceWorker' in navigator) {
          serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
          console.log('Service Worker registered successfully')
          // Wait for service worker to be ready to avoid AbortError: Subscription failed - no active Service Worker
          await navigator.serviceWorker.ready
        }
      } catch (swErr) {
        console.warn("Service Worker registration failed, continuing without it:", swErr)
        // Continue without service worker - some browsers may still work
      }

      const token = await getToken(this.firebaseMessaging, {
        serviceWorkerRegistration
      })

      if (token) {
        console.log("Token de notificação registrado:", token)

        // Save token to database
        const saved = await this.saveToken(token)
        if (saved) {
          console.log("Token salvo no banco de dados")
          return token
        } else {
          console.error("Falha ao salvar token no banco de dados")
          return null
        }
      } else {
        console.log("Nenhum token de registro disponível. Solicite permissão para gerar um.")
        return null
      }

    } catch (error) {
      console.error("Erro ao registrar token de notificação:", error)
      return null
    }
  }

  /**
   * Salva token do dispositivo na base de dados
   */
  static async saveToken(token: string): Promise<boolean> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        console.error("Usuário não autenticado")
        return false
      }

      const userId = userData.user.id

      // Informações do dispositivo
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timestamp: new Date().toISOString(),
      }

      // Verificar se token já existe
      const { data: existingToken } = await supabase
        .from("user_device_tokens")
        .select("id")
        .eq("user_id", userId)
        .eq("token", token)
        .maybeSingle()

      if (existingToken) {
        // Atualizar token existente
        const { error: updateError } = await supabase
          .from("user_device_tokens")
          .update({
            is_active: true,
            device_info: deviceInfo,
            updated_at: new Date().toISOString(),
            last_used_at: new Date().toISOString(),
          })
          .eq("id", existingToken.id)

        if (updateError) {
          console.error("Erro ao atualizar token:", updateError)
          return false
        }
      } else {
        // Inserir novo token
        const { error: insertError } = await supabase.from("user_device_tokens").insert({
          user_id: userId,
          token,
          device_info: deviceInfo,
        })

        if (insertError) {
          console.error("Erro ao salvar token:", insertError)
          return false
        }
      }

      console.log("Token salvo com sucesso")
      return true
    } catch (err) {
      console.error("Erro ao salvar token:", err)
      return false
    }
  }

  /**
   * Exibe notificação no navegador
   */
  static showNotification(payload: any): void {
    if (typeof window === "undefined" || !("Notification" in window)) return

    try {
      const title = payload.notification?.title || "Nova notificação"
      const options = {
        body: payload.notification?.body || "",
        icon: "/logo.png",
        badge: "/badge.png",
        data: payload.data || {},
      }

      const notification = new Notification(title, options)

      notification.onclick = () => {
        // Redirecionar para URL específica se disponível
        if (payload.data?.url) {
          window.open(payload.data.url, "_blank")
        } else {
          window.focus()
        }
        notification.close()
      }
    } catch (err) {
      console.error("Erro ao exibir notificação:", err)
    }
  }

  /**
   * Desativa token do dispositivo
   */
  static async deactivateToken(token: string): Promise<void> {
    try {
      console.log("Desativando token:", token)

      // Update token in database to mark as inactive
      const { error } = await supabase
        .from("user_device_tokens")
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq("token", token)

      if (error) {
        console.error("Erro ao desativar token no banco de dados:", error)
      } else {
        console.log("Token desativado com sucesso")
      }
    } catch (error) {
      console.error("Erro ao desativar token:", error)
    }
  }

  /**
   * Limpa tokens inativos ou antigos
   */
  static async cleanupOldTokens(daysOld = 90): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { data, error } = await supabase
        .from("user_device_tokens")
        .delete()
        .lt("last_used_at", cutoffDate.toISOString())
        .select("id")

      if (error) {
        console.error("Erro ao limpar tokens antigos:", error)
        return 0
      }

      return data?.length || 0
    } catch (err) {
      console.error("Erro ao limpar tokens antigos:", err)
      return 0
    }
  }

  static async sendNotification(title: string, body: string): Promise<void> {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return
      }

      if (Notification.permission === "granted") {
        new Notification(title, { body })
      }
    } catch (error) {
      console.error("Erro ao enviar notificação:", error)
    }
  }
}

// Função para enviar notificação push (server-side)
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data: Record<string, any> = {},
): Promise<boolean> {
  try {
    // Buscar configuração do Firebase
    const { data: configData, error: configError } = await supabase
      .from("platform_integrations")
      .select("config, is_enabled")
      .eq("service_name", "firebase")
      .single()

    if (configError || !configData || !configData.is_enabled) {
      console.log("Firebase não configurado ou desativado")
      return false
    }

    const firebaseConfig = configData.config as FirebaseConfig

    if (!firebaseConfig.serverKey) {
      console.log("Server Key do Firebase não configurada")
      return false
    }

    // Preparar payload da notificação
    const payload = {
      notification: {
        title,
        body,
        icon: "/logo.png",
        click_action: "https://v0-biskate.vercel.app/",
      },
      data,
      to: token,
    }

    // Enviar notificação via FCM API
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${firebaseConfig.serverKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Erro ao enviar notificação push:", errorData)

      // Se token inválido, desativar
      if (errorData?.results?.[0]?.error === "NotRegistered") {
        await PushNotificationService.deactivateToken(token)
      }

      return false
    }

    const result = await response.json()
    console.log("Notificação push enviada com sucesso:", result)
    return true
  } catch (err) {
    console.error("Erro ao enviar notificação push:", err)
    return false
  }
}
