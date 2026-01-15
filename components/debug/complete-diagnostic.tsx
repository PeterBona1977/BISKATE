"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

interface DiagnosticResult {
  category: string
  test: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
}

export function CompleteDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [jsErrors, setJsErrors] = useState<string[]>([])

  useEffect(() => {
    // Capturar erros JavaScript
    const originalError = console.error
    const errors: string[] = []

    console.error = (...args) => {
      errors.push(args.join(" "))
      setJsErrors([...errors])
      originalError(...args)
    }

    window.addEventListener("error", (e) => {
      errors.push(`${e.message} at ${e.filename}:${e.lineno}`)
      setJsErrors([...errors])
    })

    return () => {
      console.error = originalError
    }
  }, [])

  const runDiagnostics = async () => {
    setIsRunning(true)
    const diagnosticResults: DiagnosticResult[] = []

    try {
      // 1. Verificar Environment Variables
      diagnosticResults.push({
        category: "Environment",
        test: "NEXT_PUBLIC_SUPABASE_URL",
        status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "success" : "error",
        message: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configurado" : "Não configurado",
        details: process.env.NEXT_PUBLIC_SUPABASE_URL,
      })

      diagnosticResults.push({
        category: "Environment",
        test: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "success" : "error",
        message: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configurado" : "Não configurado",
        details: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Presente" : "Ausente",
      })

      // 2. Verificar Imports Críticos
      try {
        const { supabase } = await import("@/lib/supabase/client")
        diagnosticResults.push({
          category: "Imports",
          test: "Supabase Client",
          status: "success",
          message: "Importado com sucesso",
          details: typeof supabase,
        })
      } catch (error: any) {
        diagnosticResults.push({
          category: "Imports",
          test: "Supabase Client",
          status: "error",
          message: `Erro na importação: ${error.message}`,
          details: error.stack,
        })
      }

      // 3. Verificar AuthContext
      try {
        const { AuthProvider } = await import("@/contexts/auth-context")
        diagnosticResults.push({
          category: "Context",
          test: "AuthProvider",
          status: "success",
          message: "AuthProvider importado",
          details: typeof AuthProvider,
        })
      } catch (error: any) {
        diagnosticResults.push({
          category: "Context",
          test: "AuthProvider",
          status: "error",
          message: `Erro no AuthProvider: ${error.message}`,
          details: error.stack,
        })
      }

      // 4. Verificar Componentes UI
      try {
        const { Button } = await import("@/components/ui/button")
        diagnosticResults.push({
          category: "UI Components",
          test: "Button Component",
          status: "success",
          message: "Componente Button OK",
          details: typeof Button,
        })
      } catch (error: any) {
        diagnosticResults.push({
          category: "UI Components",
          test: "Button Component",
          status: "error",
          message: `Erro no Button: ${error.message}`,
          details: error.stack,
        })
      }

      // 5. Verificar Conectividade Supabase
      try {
        const { supabase } = await import("@/lib/supabase/client")
        const { data, error } = await supabase.from("profiles").select("count").limit(1)

        if (error) {
          diagnosticResults.push({
            category: "Database",
            test: "Supabase Connection",
            status: "error",
            message: `Erro de conexão: ${error.message}`,
            details: error,
          })
        } else {
          diagnosticResults.push({
            category: "Database",
            test: "Supabase Connection",
            status: "success",
            message: "Conexão com Supabase OK",
            details: data,
          })
        }
      } catch (error: any) {
        diagnosticResults.push({
          category: "Database",
          test: "Supabase Connection",
          status: "error",
          message: `Erro crítico: ${error.message}`,
          details: error.stack,
        })
      }

      // 6. Verificar Roteamento
      diagnosticResults.push({
        category: "Routing",
        test: "Current Path",
        status: "success",
        message: `Rota atual: ${window.location.pathname}`,
        details: {
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        },
      })

      // 7. Verificar Local Storage
      try {
        localStorage.setItem("test", "test")
        localStorage.removeItem("test")
        diagnosticResults.push({
          category: "Browser",
          test: "Local Storage",
          status: "success",
          message: "Local Storage funcionando",
          details: "OK",
        })
      } catch (error: any) {
        diagnosticResults.push({
          category: "Browser",
          test: "Local Storage",
          status: "error",
          message: `Local Storage com problema: ${error.message}`,
          details: error,
        })
      }

      // 8. Verificar Console Errors
      if (jsErrors.length > 0) {
        diagnosticResults.push({
          category: "JavaScript",
          test: "Console Errors",
          status: "error",
          message: `${jsErrors.length} erros encontrados`,
          details: jsErrors,
        })
      } else {
        diagnosticResults.push({
          category: "JavaScript",
          test: "Console Errors",
          status: "success",
          message: "Nenhum erro JavaScript detectado",
          details: "OK",
        })
      }
    } catch (error: any) {
      diagnosticResults.push({
        category: "System",
        test: "Diagnostic Runner",
        status: "error",
        message: `Erro no diagnóstico: ${error.message}`,
        details: error.stack,
      })
    }

    setResults(diagnosticResults)
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default",
      error: "destructive",
      warning: "secondary",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status.toUpperCase()}</Badge>
  }

  const errorCount = results.filter((r) => r.status === "error").length
  const warningCount = results.filter((r) => r.status === "warning").length
  const successCount = results.filter((r) => r.status === "success").length

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔧 Diagnóstico Completo do Sistema
              <Button onClick={runDiagnostics} disabled={isRunning} size="sm" variant="outline">
                {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Executar Diagnóstico"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length > 0 && (
              <div className="flex gap-4 mb-6">
                <Badge variant="default" className="bg-green-500">
                  ✅ Sucessos: {successCount}
                </Badge>
                <Badge variant="secondary" className="bg-yellow-500">
                  ⚠️ Avisos: {warningCount}
                </Badge>
                <Badge variant="destructive">❌ Erros: {errorCount}</Badge>
              </div>
            )}

            {errorCount > 0 && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Problemas críticos encontrados!</strong>
                  {errorCount} erro(s) podem estar causando a página em branco.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="grid gap-4">
            {Object.entries(
              results.reduce(
                (acc, result) => {
                  if (!acc[result.category]) acc[result.category] = []
                  acc[result.category].push(result)
                  return acc
                },
                {} as Record<string, DiagnosticResult[]>,
              ),
            ).map(([category, categoryResults]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryResults.map((result, index) => (
                      <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{result.test}</span>
                              {getStatusBadge(result.status)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                            {result.details && (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                  Ver detalhes
                                </summary>
                                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                                  {typeof result.details === "string"
                                    ? result.details
                                    : JSON.stringify(result.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {jsErrors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">🚨 Erros JavaScript Detectados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {jsErrors.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertDescription>
                      <pre className="text-xs overflow-auto">{error}</pre>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
