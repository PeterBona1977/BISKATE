"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, CheckCircle, AlertCircle } from "lucide-react"
import { PushNotificationService } from "@/lib/notifications/push-notification-service"
import { useToast } from "@/hooks/use-toast"

interface PushNotificationPermissionProps {
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function PushNotificationPermission({
  className,
  variant = "outline",
  size = "default",
}: PushNotificationPermissionProps) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported" | "loading">(
    "loading",
  )
  const [isFirebaseReady, setIsFirebaseReady] = useState<boolean>(false)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar se notificações são suportadas
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionStatus(Notification.permission)

      // Inicializar Firebase
      PushNotificationService.initializeFirebase().then((ready) => {
        setIsFirebaseReady(ready)

        // Se permissão já concedida, registrar token automaticamente
        if (Notification.permission === "granted") {
          PushNotificationService.requestPermissionAndRegisterToken()
        }
      })
    } else {
      setPermissionStatus("unsupported")
    }
  }, [])

  const requestPermission = async () => {
    setPermissionStatus("loading")

    try {
      // Inicializar Firebase se ainda não estiver pronto
      if (!isFirebaseReady) {
        const ready = await PushNotificationService.initializeFirebase()
        setIsFirebaseReady(ready)

        if (!ready) {
          toast({
            title: "Erro",
            description: "Não foi possível inicializar o serviço de notificações",
            variant: "destructive",
          })
          setPermissionStatus("denied")
          return
        }
      }

      // Solicitar permissão e registrar token
      const token = await PushNotificationService.requestPermissionAndRegisterToken()

      if (token) {
        setPermissionStatus("granted")
        toast({
          title: "Notificações ativadas",
          description: "Você receberá notificações importantes sobre suas atividades",
          variant: "default",
        })
      } else {
        setPermissionStatus(Notification.permission)

        if (Notification.permission === "denied") {
          toast({
            title: "Permissão negada",
            description: "Você precisa permitir notificações nas configurações do seu navegador",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error)
      setPermissionStatus("denied")
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao ativar as notificações",
        variant: "destructive",
      })
    }
  }

  if (permissionStatus === "loading") {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <span className="animate-spin mr-2">⟳</span>
        Carregando...
      </Button>
    )
  }

  if (permissionStatus === "unsupported") {
    return (
      <Button variant="secondary" size={size} className={className} disabled>
        <BellOff className="h-4 w-4 mr-2" />
        Não suportado
      </Button>
    )
  }

  if (permissionStatus === "granted") {
    return (
      <Button variant="secondary" size={size} className={className} disabled>
        <CheckCircle className="h-4 w-4 mr-2" />
        Notificações ativadas
      </Button>
    )
  }

  if (permissionStatus === "denied") {
    return (
      <Button
        variant="destructive"
        size={size}
        className={className}
        onClick={() => {
          toast({
            title: "Permissão bloqueada",
            description: "Você precisa permitir notificações nas configurações do seu navegador",
            variant: "destructive",
          })
        }}
      >
        <AlertCircle className="h-4 w-4 mr-2" />
        Permissão negada
      </Button>
    )
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={requestPermission}>
      <Bell className="h-4 w-4 mr-2" />
      Ativar notificações
    </Button>
  )
}
