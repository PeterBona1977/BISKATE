"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Database, Users, Loader2 } from "lucide-react"
import { supabase, testSupabaseConnection } from "@/lib/supabase/client-fixed-final"
import { useAuth } from "@/contexts/auth-context-fixed-final"

interface TestResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: string
}

export function SystemTest() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const { user, profile, loading: authLoading } = useAuth()

  const runTests = async () => {
    setLoading(true)
    const results: TestResult[] = []

    // Teste 1: Conexão Supabase
    try {
      const connected = await testSupabaseConnection()
      results.push({
        name: "Conexão Supabase",
        status: connected ? "success" : "error",
        message: connected ? "Conexão estabelecida com sucesso" : "Falha na conexão",
      })
    } catch (error) {
      results.push({
        name: "Conexão Supabase",
        status: "error",
        message: "Erro ao testar conexão",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }

    // Teste 2: Autenticação
    results.push({
      name: "Sistema de Autenticação",
      status: user ? "success" : "warning",
      message: user ? `Utilizador autenticado: ${user.email}` : "Nenhum utilizador autenticado",
    })

    // Teste 3: Perfil do utilizador
    results.push({
      name: "Perfil do Utilizador",
      status: profile ? "success" : user ? "warning" : "error",
      message: profile
        ? `Perfil carregado: ${profile.role}`
        : user
          ? "Utilizador sem perfil"
          : "Sem utilizador autenticado",
    })

    // Teste 4: Tabela Profiles
    try {
      const { data, error } = await supabase.from("profiles").select("id").limit(1)
      results.push({
        name: "Tabela Profiles",
        status: error ? "error" : "success",
        message: error ? "Erro ao aceder tabela profiles" : "Tabela profiles acessível",
        details: error?.message,
      })
    } catch (error) {
      results.push({
        name: "Tabela Profiles",
        status: "error",
        message: "Erro ao testar tabela profiles",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }

    // Teste 5: Tabela Gigs
    try {
      const { data, error } = await supabase.from("gigs").select("id").limit(1)
      results.push({
        name: "Tabela Gigs",
        status: error ? "error" : "success",
        message: error ? "Erro ao aceder tabela gigs" : "Tabela gigs acessível",
        details: error?.message,
      })
    } catch (error) {
      results.push({
        name: "Tabela Gigs",
        status: "error",
        message: "Erro ao testar tabela gigs",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }

    // Teste 6: Tabela Categories
    try {
      const { data, error } = await supabase.from("categories").select("id, name").limit(5)
      results.push({
        name: "Tabela Categories",
        status: error ? "error" : "success",
        message: error
          ? "Erro ao aceder tabela categories"
          : `Tabela categories acessível (${data?.length || 0} categorias)`,
        details: error?.message,
      })
    } catch (error) {
      results.push({
        name: "Tabela Categories",
        status: "error",
        message: "Erro ao testar tabela categories",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }

    // Teste 7: Políticas RLS
    try {
      // Tentar aceder dados próprios se autenticado
      if (user) {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        results.push({
          name: "Políticas RLS",
          status: error ? "error" : "success",
          message: error ? "RLS bloqueando acesso próprio" : "RLS funcionando corretamente",
          details: error?.message,
        })
      } else {
        results.push({
          name: "Políticas RLS",
          status: "warning",
          message: "Não é possível testar RLS sem autenticação",
        })
      }
    } catch (error) {
      results.push({
        name: "Políticas RLS",
        status: "error",
        message: "Erro ao testar políticas RLS",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }

    // Teste 8: Variáveis de ambiente
    const envVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"]

    const missingEnvVars = envVars.filter((envVar) => !process.env[envVar])

    results.push({
      name: "Variáveis de Ambiente",
      status: missingEnvVars.length === 0 ? "success" : "warning",
      message:
        missingEnvVars.length === 0
          ? "Todas as variáveis essenciais configuradas"
          : `${missingEnvVars.length} variáveis em falta`,
      details: missingEnvVars.length > 0 ? `Em falta: ${missingEnvVars.join(", ")}` : undefined,
    })

    setTests(results)
    setLoading(false)
  }

  useEffect(() => {
    if (!authLoading) {
      runTests()
    }
  }, [authLoading])

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const successCount = tests.filter((t) => t.status === "success").length
  const errorCount = tests.filter((t) => t.status === "error").length
  const warningCount = tests.filter((t) => t.status === "warning").length

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">A executar testes do sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{tests.length}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sucesso</p>
                <p className="text-3xl font-bold text-green-600">{successCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avisos</p>
                <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Erros</p>
                <p className="text-3xl font-bold text-red-600">{errorCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado do utilizador */}
      {user && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            <strong>Utilizador:</strong> {user.email} | <strong>Role:</strong> {profile?.role || "Sem perfil"} |{" "}
            <strong>ID:</strong> {user.id}
          </AlertDescription>
        </Alert>
      )}

      {/* Resultados dos testes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resultados dos Testes</span>
            <Button onClick={runTests} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Executar Novamente
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tests.map((test, index) => (
              <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h3 className="font-medium text-gray-900">{test.name}</h3>
                    <p className="text-sm text-gray-600">{test.message}</p>
                    {test.details && <p className="text-xs text-gray-500 mt-1">{test.details}</p>}
                  </div>
                </div>
                <Badge className={getStatusColor(test.status)}>
                  {test.status === "success" ? "OK" : test.status === "error" ? "ERRO" : "AVISO"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      {errorCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Ação Necessária:</strong> {errorCount} erro(s) encontrado(s). Execute o script de correções críticas
            para resolver os problemas de base de dados.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
