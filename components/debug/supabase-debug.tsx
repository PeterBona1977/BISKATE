"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/client" // ✅ IMPORTAÇÃO DIRETA
import { CheckCircle, XCircle, AlertCircle, Database, Wifi } from "lucide-react"

interface ConnectionStatus {
  isConnected: boolean
  latency: number | null
  error: string | null
  lastChecked: Date
}

interface TableInfo {
  name: string
  count: number | null
  error: string | null
}

export function SupabaseDebug() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    latency: null,
    error: null,
    lastChecked: new Date(),
  })
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    const startTime = Date.now()

    try {
      console.log("🔍 Testando conexão com Supabase...")

      // ✅ USANDO CLIENTE DIRETAMENTE
      const { data, error } = await supabase.from("profiles").select("count", { count: "exact", head: true })

      const latency = Date.now() - startTime

      if (error) {
        setConnectionStatus({
          isConnected: false,
          latency,
          error: error.message,
          lastChecked: new Date(),
        })
        console.error("❌ Erro na conexão:", error)
      } else {
        setConnectionStatus({
          isConnected: true,
          latency,
          error: null,
          lastChecked: new Date(),
        })
        console.log("✅ Conexão bem-sucedida, latência:", latency + "ms")
      }
    } catch (err) {
      const latency = Date.now() - startTime
      setConnectionStatus({
        isConnected: false,
        latency,
        error: err instanceof Error ? err.message : "Erro desconhecido",
        lastChecked: new Date(),
      })
      console.error("❌ Erro inesperado:", err)
    } finally {
      setLoading(false)
    }
  }

  const checkTables = async () => {
    const tableNames = ["profiles", "gigs", "gig_responses", "notifications"]
    const tableResults: TableInfo[] = []

    for (const tableName of tableNames) {
      try {
        const { count, error } = await supabase.from(tableName).select("*", { count: "exact", head: true })

        tableResults.push({
          name: tableName,
          count: error ? null : count,
          error: error?.message || null,
        })
      } catch (err) {
        tableResults.push({
          name: tableName,
          count: null,
          error: err instanceof Error ? err.message : "Erro desconhecido",
        })
      }
    }

    setTables(tableResults)
  }

  useEffect(() => {
    testConnection()
    checkTables()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado da Conexão Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connectionStatus.isConnected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700">Conectado</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700">Desconectado</span>
                </>
              )}
            </div>
            <Button onClick={testConnection} disabled={loading} size="sm">
              {loading ? "Testando..." : "Testar Conexão"}
            </Button>
          </div>

          {connectionStatus.latency && (
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Latência: {connectionStatus.latency}ms</span>
            </div>
          )}

          {connectionStatus.error && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{connectionStatus.error}</span>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Última verificação: {connectionStatus.lastChecked.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado das Tabelas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tables.map((table) => (
              <div key={table.name} className="flex items-center justify-between">
                <span className="font-medium">{table.name}</span>
                <div className="flex items-center gap-2">
                  {table.error ? (
                    <Badge variant="destructive">Erro</Badge>
                  ) : (
                    <Badge variant="outline">{table.count} registros</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button onClick={checkTables} className="w-full mt-4" variant="outline" size="sm">
            Atualizar Contagens
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
