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
  serverKey?: string
  vapidKey?: string
}

export class PushNotificationServiceFixed {
  private static firebaseInitialized = false
  private static firebaseMessaging: any = null
  private static firebaseApp: any = null

  /**
   * Inicializa o Firebase no cliente com logs detalhados
   */
  static async initializeFirebase(): Promise<boolean> {
    if (typeof window === "undefined") {
      console.log("❌ Ambiente servidor - Firebase não disponível")
      return false
    }

    if (this.firebaseInitialized) {
      console.log("✅ Firebase já inicializado")
      return true
    }

    try {
      console.log("🔧 Iniciando configuração do Firebase...")

      // Buscar configuração do Firebase
      const { data: configData, error: configError } = await supabase
        .from("platform_integrations")
        .select("config, is_enabled")
        .eq("service_name", "firebase")
        .single()

      if (configError) {
        console.error("❌ Erro ao buscar configuração Firebase:", configError)
        return false
      }

      if (!configData || !configData.is_enabled) {
        console.log("⚠️ Firebase não configurado ou desativado")
        return false
      }

      const firebaseConfig = configData.config as FirebaseConfig
      console.log("🔍 Configuração Firebase:", {
        projectId: firebaseConfig.projectId,
        hasApiKey: !!firebaseConfig.apiKey,
        hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
        hasVapidKey: !!firebaseConfig.vapidKey,
      })

      if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.messagingSenderId) {
        console.error("❌ Configuração do Firebase incompleta")
        return false
      }

      // Importar Firebase dinamicamente
      const { initializeApp } = await import("firebase/app")
      const { getMessaging, getToken, onMessage, isSupported } = await import("firebase/messaging")

      // Verificar se messaging é suportado
      const messagingSupported = await isSupported()
      if (!messagingSupported) {
        console.error("❌ Firebase Messaging não suportado neste navegador")
        return false
      }

      // Inicializar Firebase
      this.firebaseApp = initializeApp(firebaseConfig)
      this.firebaseMessaging = getMessaging(this.firebaseApp)
      this.firebaseInitialized = true

      console.log("✅ Firebase inicializado com sucesso")

      // Configurar listener para mensagens em foreground
      onMessage(this.firebaseMessaging, (payload) => {
        console.log("📨 Mensagem recebida em foreground:", payload)
        this.showNotification(payload)
      })

      return true
    } catch (err) {
      console.error("❌ Erro ao inicializar Firebase:", err)
      return false
    }
  }

  /**
   * Registra service worker para Firebase
   */
  static async registerServiceWorker(): Promise<boolean> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.log("❌ Service Worker não suportado")
      return false
    }

    try {
      console.log("🔧 Registrando Service Worker...")

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
      console.log("✅ Service Worker registrado:", registration)

      // Aguardar ativação
      if (registration.installing) {
        await new Promise((resolve) => {
          registration.installing!.addEventListener("statechange", () => {
            if (registration.installing!.state === "activated") {
              resolve(true)
            }
          })
        })
      }

      return true
    } catch (error) {
      console.error("❌ Erro ao registrar Service Worker:", error)
      return false
    }
  }

  /**
   * Solicita permissão e registra token do dispositivo com logs detalhados
   */
  static async requestPermissionAndRegisterToken(): Promise<string | null> {
    try {
      console.log("🔔 Iniciando processo de registro de token...")

      if (typeof window === "undefined" || !("Notification" in window)) {
        console.error("❌ Notificações não suportadas neste navegador")
        return null
      }

      // Verificar usuário autenticado
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        console.error("❌ Usuário não autenticado:", userError)
        return null
      }

      console.log("👤 Usuário autenticado:", userData.user.id)

      // Solicitar permissão
      console.log("🔐 Solicitando permissão de notificação...")
      const permission = await Notification.requestPermission()
      console.log("🔐 Permissão concedida:", permission)

      if (permission !== "granted") {
        console.log("❌ Permissão negada pelo usuário")
        return null
      }

      // Registrar Service Worker
      const swRegistered = await this.registerServiceWorker()
      if (!swRegistered) {
        console.error("❌ Falha ao registrar Service Worker")
        return null
      }

      // Inicializar Firebase
      const firebaseReady = await this.initializeFirebase()
      if (!firebaseReady) {
        console.error("❌ Firebase não está pronto")
        return null
      }

      // Obter configuração para VAPID key
      const { data: configData } = await supabase
        .from("platform_integrations")
        .select("config")
        .eq("service_name", "firebase")
        .single()

      const vapidKey = configData?.config?.vapidKey
      if (!vapidKey) {
        console.error("❌ VAPID key não configurada")
        return null
      }

      // Obter token FCM
      console.log("🎫 Obtendo token FCM...")
      const { getToken } = await import("firebase/messaging")

      const token = await getToken(this.firebaseMessaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: await navigator.serviceWorker.getRegistration(),
      })

      if (!token) {
        console.error("❌ Não foi possível obter token FCM")
        return null
      }

      console.log("✅ Token FCM obtido:", token.substring(0, 20) + "...")

      // Salvar token na base de dados
      const saved = await this.saveToken(token)
      if (!saved) {
        console.error("❌ Falha ao salvar token na base de dados")
        return null
      }

      console.log("🎉 Token registrado com sucesso!")
      return token
    } catch (error) {
      console.error("❌ Erro no processo de registro:", error)
      return null
    }
  }

  /**
   * Salva token do dispositivo na base de dados com logs detalhados
   */
  static async saveToken(token: string): Promise<boolean> {
    try {
      console.log("💾 Salvando token na base de dados...")

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        console.error("❌ Usuário não autenticado para salvar token")
        return false
      }

      const userId = userData.user.id
      console.log("👤 Salvando token para usuário:", userId)

      // Informações do dispositivo
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }

      console.log("📱 Informações do dispositivo:", deviceInfo)

      // Verificar se token já existe
      const { data: existingToken, error: checkError } = await supabase
        .from("user_device_tokens")
        .select("id, is_active")
        .eq("user_id", userId)
        .eq("token", token)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("❌ Erro ao verificar token existente:", checkError)
        return false
      }

      if (existingToken) {
        console.log("🔄 Atualizando token existente...")
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
          console.error("❌ Erro ao atualizar token:", updateError)
          return false
        }

        console.log("✅ Token atualizado com sucesso")
      } else {
        console.log("➕ Inserindo novo token...")
        const { error: insertError } = await supabase.from("user_device_tokens").insert({
          user_id: userId,
          token,
          device_info: deviceInfo,
          is_active: true,
        })

        if (insertError) {
          console.error("❌ Erro ao inserir token:", insertError)
          console.error("Detalhes do erro:", {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
          })
          return false
        }

        console.log("✅ Token inserido com sucesso")
      }

      // Verificar se foi salvo
      const { data: verifyData, error: verifyError } = await supabase
        .from("user_device_tokens")
        .select("id")
        .eq("user_id", userId)
        .eq("token", token)
        .eq("is_active", true)

      if (verifyError || !verifyData || verifyData.length === 0) {
        console.error("❌ Token não foi salvo corretamente")
        return false
      }

      console.log("✅ Token verificado na base de dados")
      return true
    } catch (err) {
      console.error("❌ Erro crítico ao salvar token:", err)
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
        if (payload.data?.url) {
          window.open(payload.data.url, "_blank")
        } else {
          window.focus()
        }
        notification.close()
      }
    } catch (err) {
      console.error("❌ Erro ao exibir notificação:", err)
    }
  }

  /**
   * Desativa token do dispositivo
   */
  static async deactivateToken(token: string): Promise<boolean> {
    try {
      console.log("🔇 Desativando token...")

      const { error } = await supabase.from("user_device_tokens").update({ is_active: false }).eq("token", token)

      if (error) {
        console.error("❌ Erro ao desativar token:", error)
        return false
      }

      console.log("✅ Token desativado com sucesso")
      return true
    } catch (err) {
      console.error("❌ Erro ao desativar token:", err)
      return false
    }
  }

  /**
   * Função de teste para debug
   */
  static async debugTokenRegistration(): Promise<void> {
    console.log("🔍 INICIANDO DEBUG DE REGISTRO DE TOKEN")
    console.log("=====================================")

    // Verificar suporte a notificações
    console.log("1. Suporte a notificações:", "Notification" in window)
    console.log("2. Permissão atual:", Notification.permission)

    // Verificar usuário
    const { data: userData } = await supabase.auth.getUser()
    console.log("3. Usuário autenticado:", !!userData.user)
    console.log("4. ID do usuário:", userData.user?.id)

    // Verificar configuração Firebase
    const { data: configData } = await supabase
      .from("platform_integrations")
      .select("*")
      .eq("service_name", "firebase")
      .single()

    console.log("5. Configuração Firebase:", {
      exists: !!configData,
      enabled: configData?.is_enabled,
      hasConfig: !!configData?.config,
    })

    // Verificar tokens existentes
    if (userData.user) {
      const { data: tokens } = await supabase.from("user_device_tokens").select("*").eq("user_id", userData.user.id)

      console.log("6. Tokens existentes:", tokens?.length || 0)
    }

    console.log("=====================================")
  }
}

// Exportar para compatibilidade
export const PushNotificationService = PushNotificationServiceFixed
