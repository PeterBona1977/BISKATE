"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AuthDebug() {
  const { user, profile, loading } = useAuth()
  const [logs, setLogs] = useState<string[]>([])
  const [renderCount, setRenderCount] = useState(0)
  const lastStateRef = useRef<string>("")

  // Contar re-renders
  useEffect(() => {
    setRenderCount((prev) => prev + 1)
  })

  // Monitorar mudanças de estado
  useEffect(() => {
    const currentState = JSON.stringify({
      hasUser: !!user,
      hasProfile: !!profile,
      loading,
      userId: user?.id?.slice(0, 8),
    })

    if (currentState !== lastStateRef.current) {
      const timestamp = new Date().toLocaleTimeString()
      const newLog = `${timestamp}: ${currentState}`

      setLogs((prev) => {
        const newLogs = [newLog, ...prev.slice(0, 9)] // Manter apenas 10 logs
        return newLogs
      })

      lastStateRef.current = currentState
    }
  }, [user, profile, loading])

  const clearLogs = () => {
    setLogs([])
    setRenderCount(0)
  }

  return (
    <Card className="fixed top-4 right-4 w-96 max-h-96 overflow-auto z-50 bg-white shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex justify-between items-center">
          🐛 Auth Debug
          <Button variant="outline" size="sm" onClick={clearLogs}>
            Clear
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Renders:</strong> {renderCount}
          </div>
          <div>
            <strong>Loading:</strong> {loading ? "✅" : "❌"}
          </div>
          <div>
            <strong>User:</strong> {user ? "✅" : "❌"}
          </div>
          <div>
            <strong>Profile:</strong> {profile ? "✅" : "❌"}
          </div>
        </div>

        <div>
          <strong>Estado Atual:</strong>
          <div className="bg-gray-100 p-2 rounded text-xs">
            {JSON.stringify(
              {
                hasUser: !!user,
                hasProfile: !!profile,
                loading,
                email: user?.email,
              },
              null,
              2,
            )}
          </div>
        </div>

        <div>
          <strong>Histórico de Mudanças:</strong>
          <div className="bg-gray-50 p-2 rounded max-h-32 overflow-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Nenhuma mudança detectada</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-xs border-b border-gray-200 py-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {renderCount > 10 && (
          <div className="bg-red-50 border border-red-200 p-2 rounded">
            <strong className="text-red-600">⚠️ MUITOS RE-RENDERS!</strong>
            <div className="text-red-500">{renderCount} renders detectados. Possível loop infinito!</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
