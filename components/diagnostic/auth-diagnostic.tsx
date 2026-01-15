"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase, testDatabaseConnection } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, User, Shield } from "lucide-react"

interface DiagnosticResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
}

export function AuthDiagnostic() {
  const { user, profile, session, loading, error, isAuthenticated } = useAuth()
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const results: DiagnosticResult[] = []

    // 1. Teste de autenticação
    results.push({
      name: "Autenticação",
      status: isAuthenticated ? "success" : "error",
      message: isAuthenticated ? "Utilizador autenticado" : "Utilizador não autenticado",
      details: { email: user?.email, id: user?.id },
    })

    // 2. Teste de sessão
    results.push({
      name: "Sessão",
      status: session ? "success" : "error",
      message: session ? "Sessão ativa" : "Sem sessão",
      details: { expires_at: session?.expires_at },
    })

    // 3. Teste de perfil
    results.push({
      name: "Perfil",
      status: profile ? "success" : "warning",
      message: profile ? `Perfil carregado (${profile.role})` : "Perfil não carregado - usando fallback",
      details: profile,
    })

    // 4. Teste de conexão com base de dados
    try {
      const dbTest = await testDatabaseConnection()
      results.push({
        name: "Base de Dados",
        status: dbTest.success ? "success" : "error",
        message: dbTest.success ? "Conexão estabelecida" : `Erro: ${dbTest.error}`,
        details: dbTest.data,
      })
    } catch (err) {
      results.push({
        name: "Base de Dados",
        status: "error",
        message: `Exceção: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
      })
    }

    // 5. Teste de RLS
    try {
      const { data, error: rlsError } = await supabase.from("profiles").select("id").limit(1)
      results.push({
        name: "RLS Status",
        status: rlsError ? "error" : "success",
        message: rlsError ? `RLS Error: ${rlsError.message}` : "RLS funcionando ou desativado",
        details: { data, error: rlsError },
      })
    } catch (err) {
      results.push({
        name: "RLS Status",
        status: "error",
        message: `RLS Exception: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
      })
    }

    // 6. Teste de permissões admin
    const isAdmin = profile?.role === "admin" || user?.email === "pmbonanca@gmail.com"
    results.push({
      name: "Permissões Admin",
      status: isAdmin ? "success" : "warning",
      message: isAdmin ? "Utilizador tem permissões de admin" : "Utilizador não é admin",
      details: { profileRole: profile?.role, email: user?.email },
    })

    setDiagnostics(results)
    setIsRunning(false)
  }

  useEffect(() => {
    if (!loading) {
      runDiagnostics()
    }
  }, [loading, user, profile, session])

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Sucesso
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Erro</Badge>
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Aviso
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Diagnóstico de Autenticação</span>
          </CardTitle>
          <CardDescription>Verifica o estado do sistema de autenticação e base de dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">Última verificação: {new Date().toLocaleString()}</div>
            <Button onClick={runDiagnostics} disabled={isRunning} size="sm">
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />A verificar...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar novamente
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {diagnostics.map((diagnostic, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(diagnostic.status)}
                    <span className="font-medium">{diagnostic.name}</span>
                  </div>
                  {getStatusBadge(diagnostic.status)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{diagnostic.message}</p>
                {diagnostic.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Ver detalhes</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(diagnostic.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Informações do utilizador atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Informações do Utilizador</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Dados de Autenticação</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Email:</strong> {user?.email || "N/A"}
                </p>
                <p>
                  <strong>ID:</strong> {user?.id || "N/A"}
                </p>
                <p>
                  <strong>Criado em:</strong> {user?.created_at ? new Date(user.created_at).toLocaleString() : "N/A"}
                </p>
                <p>
                  <strong>Último login:</strong>{" "}
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "N/A"}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Dados do Perfil</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Nome:</strong> {profile?.full_name || "N/A"}
                </p>
                <p>
                  <strong>Role:</strong> {profile?.role || "N/A"}
                </p>
                <p>
                  <strong>Avatar:</strong> {profile?.avatar_url ? "Definido" : "N/A"}
                </p>
                <p>
                  <strong>Atualizado em:</strong>{" "}
                  {profile?.updated_at ? new Date(profile.updated_at).toLocaleString() : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erros e avisos */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Erro de Autenticação:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {loading && (
        <Alert className="border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">Sistema de autenticação a carregar...</AlertDescription>
        </Alert>
      )}

      {!profile && user && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Aviso:</strong> Perfil não carregado da base de dados. A usar dados de autenticação como fallback.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
