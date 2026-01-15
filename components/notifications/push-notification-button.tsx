"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function PushNotificationButton() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleToggleNotifications = async () => {
    setIsLoading(true)

    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        toast({
          title: "Não suportado",
          description: "Seu navegador não suporta notificações push",
          variant: "destructive",
        })
        return
      }

      if (!isEnabled) {
        const permission = await Notification.requestPermission()
        if (permission === "granted") {
          setIsEnabled(true)
          toast({
            title: "Notificações ativadas",
            description: "Você receberá notificações sobre novas oportunidades",
          })
        } else {
          toast({
            title: "Permissão negada",
            description: "Não foi possível ativar as notificações",
            variant: "destructive",
          })
        }
      } else {
        setIsEnabled(false)
        toast({
          title: "Notificações desativadas",
          description: "Você não receberá mais notificações push",
        })
      }
    } catch (error) {
      console.error("Erro ao gerenciar notificações:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao gerenciar as notificações",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggleNotifications}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {isEnabled ? (
        <>
          <Bell className="h-4 w-4" />
          Notificações Ativas
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" />
          Ativar Notificações
        </>
      )}
    </Button>
  )
}
