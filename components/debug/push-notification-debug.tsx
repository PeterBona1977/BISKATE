"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PushNotificationServiceFixed } from "@/lib/notifications/push-notification-service-fixed"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

export function PushNotificationDebug() {
  const { user } = useAuth()
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearResults = () => {
    setResults([])
  }

  const testPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      addResult(`Permissão: ${permission}`)
    } catch (error) {
      addResult(`Erro na permissão: ${error}`)
    }
  }

  const testTokenRegistration = async () => {
    setTesting(true)
    clearResults()

    try {
      addResult("Iniciando teste de registro de token...")

      // Debug completo
      await PushNotificationServiceFixed.debugTokenRegistration()

      // Tentar registrar token
      const token = await PushNotificationServiceFixed.requestPermissionAndRegisterToken()

      if (token) {
        addResult(`✅ Token registrado: ${token.substring(0, 20)}...`)
      } else {
        addResult("❌ Falha no registro do token")
      }
    } catch (error) {
      addResult(`❌ Erro: ${error}`)
    } finally {
      setTesting(false)
    }
  }

  const checkTokens = async () => {
    if (!user) {
      addResult("❌ Usuário não autenticado")
      return
    }

    try {
      const { data: tokens, error } = await supabase.from("user_device_tokens").select("*").eq("user_id", user.id)

      if (error) {
        addResult(`❌ Erro ao buscar tokens: ${error.message}`)
      } else {
        addResult(`📊 Tokens encontrados: ${tokens?.length || 0}`)
        tokens?.forEach((token, index) => {
          addResult(`Token ${index + 1}: ${token.token.substring(0, 20)}... (Ativo: ${token.is_active})`)
        })
      }
    } catch (error) {
      addResult(`❌ Erro: ${error}`)
    }
  }

  const testNotification = async () => {
    try {
      PushNotificationServiceFixed.showNotification({
        notification: {
          title: "Teste de Notificação",
          body: "Esta é uma notificação de teste local",
        },
      })
      addResult("✅ Notificação de teste enviada")
    } catch (error) {
      addResult(`❌ Erro na notificação: ${error}`)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔔 Debug de Push Notifications
          <Badge variant={user ? "default" : "destructive"}>{user ? "Autenticado" : "Não autenticado"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button onClick={testPermission} variant="outline" size="sm">
            Testar Permissão
          </Button>
          <Button onClick={testTokenRegistration} disabled={testing || !user} size="sm">
            {testing ? "Testando..." : "Registrar Token"}
          </Button>
          <Button onClick={checkTokens} disabled={!user} variant="outline" size="sm">
            Verificar Tokens
          </Button>
          <Button onClick={testNotification} variant="outline" size="sm">
            Teste Local
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Logs de Debug:</h4>
            <Button onClick={clearResults} variant="ghost" size="sm">
              Limpar
            </Button>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg max-h-60 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum log ainda...</p>
            ) : (
              results.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Instruções:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Primeiro, teste a permissão do navegador</li>
            <li>Em seguida, tente registrar o token (requer autenticação)</li>
            <li>Verifique se o token foi salvo na base de dados</li>
            <li>Teste uma notificação local para confirmar funcionamento</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
