"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProductionDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        // Verificar configuração do Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        // Verificar sessão atual
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        // Verificar conectividade
        const { data: healthCheck, error: healthError } = await supabase.from("profiles").select("count").limit(1)

        setDebugInfo({
          environment: process.env.NODE_ENV,
          supabaseUrl: supabaseUrl ? "✅ Configurado" : "❌ Faltando",
          supabaseKey: supabaseKey ? "✅ Configurado" : "❌ Faltando",
          session: sessionData.session ? "✅ Ativa" : "❌ Nenhuma",
          sessionError: sessionError?.message || "Nenhum",
          healthCheck: healthError ? "❌ Falhou" : "✅ OK",
          healthError: healthError?.message || "Nenhum",
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        })
      } catch (error: any) {
        setDebugInfo({
          error: error.message,
          timestamp: new Date().toISOString(),
        })
      }
    }

    checkEnvironment()
  }, [])

  // Mostrar debug apenas se houver problemas ou em desenvolvimento
  const shouldShow = debugInfo.sessionError || debugInfo.healthError || process.env.NODE_ENV === "development"

  if (!shouldShow && !isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-red-50 border-red-200 text-red-700"
        >
          🐛 Debug
        </Button>
      ) : (
        <Card className="w-96 max-h-96 overflow-auto bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex justify-between items-center">
              Debug Info - Produção
              <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm">
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            {Object.entries(debugInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className={value?.toString().includes("❌") ? "text-red-600" : "text-green-600"}>
                  {String(value)}
                </span>
              </div>
            ))}
            <Button onClick={() => window.location.reload()} className="w-full mt-2" size="sm" variant="outline">
              🔄 Recarregar Página
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
