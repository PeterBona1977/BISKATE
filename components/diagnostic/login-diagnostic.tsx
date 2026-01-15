"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, Loader2, User, Shield, Database, Cookie, RefreshCw } from "lucide-react"

export default function LoginDiagnostic() {
  const { user, profile, session, loading, error, retryConnection } = useAuth()
  const [diagnostics, setDiagnostics] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const results = []

    // Check 1: Authentication State
    results.push({
      name: "Estado de Autenticação",
      status: user ? "success" : "error",
      message: user ? `Utilizador autenticado: ${user.email}` : "Nenhum utilizador autenticado",
      details: user
        ? {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
          }
        : null,
    })

    // Check 2: Session State
    results.push({
      name: "Estado da Sessão",
      status: session ? "success" : "error",
      message: session ? "Sessão ativa encontrada" : "Nenhuma sessão ativa",
      details: session
        ? {
            expires_at: session.expires_at,
            token_type: session.token_type,
          }
        : null,
    })

    // Check 3: Profile State
    results.push({
      name: "Perfil do Utilizador",
      status: profile ? "success" : "warning",
      message: profile ? `Perfil carregado: ${profile.full_name}` : "Perfil não encontrado",
      details: profile
        ? {
            role: profile.role,
            plan: profile.plan,
            location: profile.location,
          }
        : null,
    })

    // Check 4: Local Storage
    let localStorageStatus = "error"
    let localStorageMessage = "Local Storage não acessível"
    try {
      if (typeof window !== "undefined") {
        const sessionData = localStorage.getItem("biskate-session")
        const userData = localStorage.getItem("biskate-user")

        if (sessionData && userData) {
          localStorageStatus = "success"
          localStorageMessage = "Dados de sessão encontrados no Local Storage"
        } else {
          localStorageStatus = "warning"
          localStorageMessage = "Nenhum dado de sessão no Local Storage"
        }
      }
    } catch (error) {
      localStorageMessage = `Erro no Local Storage: ${error}`
    }

    results.push({
      name: "Local Storage",
      status: localStorageStatus,
      message: localStorageMessage,
    })

    // Check 5: Cookies
    let cookieStatus = "error"
    let cookieMessage = "Cookies não acessíveis"
    try {
      if (typeof document !== "undefined") {
        const authCookie = document.cookie.includes("biskate-auth")

        if (authCookie) {
          cookieStatus = "success"
          cookieMessage = "Cookie de autenticação encontrado"
        } else {
          cookieStatus = "warning"
          cookieMessage = "Nenhum cookie de autenticação"
        }
      }
    } catch (error) {
      cookieMessage = `Erro nos cookies: ${error}`
    }

    results.push({
      name: "Cookies",
      status: cookieStatus,
      message: cookieMessage,
    })

    // Check 6: Context Loading State
    results.push({
      name: "Estado de Carregamento",
      status: loading ? "warning" : "success",
      message: loading ? "Contexto ainda a carregar" : "Contexto carregado",
    })

    // Check 7: Error State
    results.push({
      name: "Estado de Erro",
      status: error ? "error" : "success",
      message: error ? `Erro: ${error}` : "Nenhum erro reportado",
    })

    setDiagnostics(results)
    setIsRunning(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [user, profile, session, loading, error])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default",
      warning: "secondary",
      error: "destructive",
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status === "success" ? "OK" : status === "warning" ? "AVISO" : "ERRO"}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Diagnóstico de Login</h1>
        <p className="text-muted-foreground mt-2">Verificação do estado de autenticação e sessão</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 justify-center">
        <Button onClick={runDiagnostics} disabled={isRunning} variant="outline">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />A executar...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Executar Diagnóstico
            </>
          )}
        </Button>

        <Button onClick={retryConnection} variant="outline">
          <Database className="mr-2 h-4 w-4" />
          Tentar Reconectar
        </Button>
      </div>

      {/* Current State Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <User className="mr-2 h-4 w-4" />
              Utilizador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user ? "Autenticado" : "Não autenticado"}</div>
            <p className="text-xs text-muted-foreground">{user?.email || "Nenhum utilizador"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.role || "N/A"}</div>
            <p className="text-xs text-muted-foreground">{profile?.full_name || "Sem perfil"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Cookie className="mr-2 h-4 w-4" />
              Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session ? "Ativa" : "Inativa"}</div>
            <p className="text-xs text-muted-foreground">{session ? "Sessão válida" : "Sem sessão"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Diagnostic Results */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados do Diagnóstico</CardTitle>
          <CardDescription>Verificação detalhada de todos os componentes de autenticação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnostics.map((diagnostic, index) => (
            <div key={index}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(diagnostic.status)}
                  <div>
                    <h3 className="font-medium">{diagnostic.name}</h3>
                    <p className="text-sm text-muted-foreground">{diagnostic.message}</p>
                  </div>
                </div>
                {getStatusBadge(diagnostic.status)}
              </div>

              {diagnostic.details && (
                <div className="mt-2 ml-7 p-3 bg-muted rounded-lg">
                  <pre className="text-xs">{JSON.stringify(diagnostic.details, null, 2)}</pre>
                </div>
              )}

              {index < diagnostics.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Error Details */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro de Autenticação:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Sistema de autenticação a carregar...</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
