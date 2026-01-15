"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

type SystemComponent = {
  name: string
  status: "operational" | "degraded" | "outage"
  lastChecked: Date
}

export function SystemStatus({ loading: parentLoading = false }) {
  const [components, setComponents] = useState<SystemComponent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSystemStatus() {
      if (parentLoading) return

      try {
        setLoading(true)

        // Check database connection
        const { data: dbCheck, error: dbError } = await supabase.from("platform_settings").select("key").limit(1)

        // Check auth service
        const { data: authCheck, error: authError } = await supabase.auth.getSession()

        // Check storage service
        const { data: storageCheck, error: storageError } = await supabase.storage
          .getBucket("default")
          .catch(() => ({ data: null, error: new Error("Storage check failed") }))

        // Set component statuses
        setComponents([
          {
            name: "Base de Dados",
            status: dbError ? "degraded" : "operational",
            lastChecked: new Date(),
          },
          {
            name: "Autenticação",
            status: authError ? "degraded" : "operational",
            lastChecked: new Date(),
          },
          {
            name: "Armazenamento",
            status: storageError ? "degraded" : "operational",
            lastChecked: new Date(),
          },
          {
            name: "API",
            status: "operational",
            lastChecked: new Date(),
          },
          {
            name: "Notificações",
            status: Math.random() > 0.9 ? "degraded" : "operational", // Simulação
            lastChecked: new Date(),
          },
        ])
      } catch (err) {
        console.error("Error checking system status:", err)
      } finally {
        setLoading(false)
      }
    }

    checkSystemStatus()
  }, [parentLoading])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "outage":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "operational":
        return "Operacional"
      case "degraded":
        return "Degradado"
      case "outage":
        return "Indisponível"
      default:
        return "Desconhecido"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado do Sistema</CardTitle>
        <CardDescription>Status dos componentes da plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        {loading || parentLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {components.map((component) => (
              <div key={component.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(component.status)}
                  <span className="text-sm font-medium">{component.name}</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    component.status === "operational"
                      ? "bg-green-100 text-green-800"
                      : component.status === "degraded"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {getStatusText(component.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
