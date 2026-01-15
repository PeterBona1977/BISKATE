"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Shield, Users, Settings } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface TestResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: string
}

export function DatabaseTest() {
  const { user } = useAuth()
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [overallStatus, setOverallStatus] = useState<"success" | "error" | "warning">("warning")

  const runTests = async () => {
    setLoading(true)
    const testResults: TestResult[] = []

    // Test 1: Conexão básica
    try {
      const { data, error } = await supabase.from("profiles").select("count").limit(1)
      if (error) throw error
      testResults.push({
        name: "Conexão com Supabase",
        status: "success",
        message: "Conectado com sucesso",
      })
    } catch (error) {
      testResults.push({
        name: "Conexão com Supabase",
        status: "error",
        message: "Falha na conexão",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }

    // Test 2: Autenticação
    if (user) {
      testResults.push({
        name: "Autenticação",
        status: "success",
        message: `Usuário autenticado: ${user.email}`,
      })
    } else {
      testResults.push({
        name: "Autenticação",
        status: "warning",
        message: "Usuário não autenticado",
      })
    }

    // Test 3: Acesso à tabela profiles
    try {
      const { data, error } = await supabase.from("profiles").select("id, email, role").limit(5)
      if (error) throw error
      testResults.push({
        name: "Tabela Profiles",
        status: "success",
        message: `${data?.length || 0} perfis encontrados`,
      })
    } catch (error) {
      testResults.push({
        name: "Tabela Profiles",
        status: "error",
        message: "Erro ao acessar profiles",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }

    // Test 4: Acesso à tabela categories
    try {
      const { data, error } = await supabase.from("categories").select("id, name, slug").limit(10)
      if (error) throw error
      testResults.push({
        name: "Tabela Categories",
        status: "success",
        message: `${data?.length || 0} categorias encontradas`,
      })
    } catch (error) {
      testResults.push({
        name: "Tabela Categories",
        status: "error",
        message: "Erro ao acessar categories",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }

    // Test 5: Acesso à tabela gigs
    try {
      const { data, error } = await supabase.from("gigs").select("id, title, status").limit(5)
      if (error) throw error
      testResults.push({
        name: "Tabela Gigs",
        status: "success",
        message: `${data?.length || 0} gigs encontrados`,
      })
    } catch (error) {
      testResults.push({
        name: "Tabela Gigs",
        status: "error",
        message: "Erro ao acessar gigs",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }

    // Test 6: RLS Policies
    if (user) {
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        if (error) throw error
        testResults.push({
          name: "RLS Policies",
          status: "success",
          message: "Políticas RLS funcionando corretamente",
        })
      } catch (error) {
        testResults.push({
          name: "RLS Policies",
          status: "error",
          message: "Problema com políticas RLS",
          details: error instanceof Error ? error.message : "Erro desconhecido",
        })
      }
    }

    // Test 7: Funções personalizadas
    try {
      const { data, error } = await supabase.rpc("get_user_profile", {
        user_id: user?.id || "00000000-0000-0000-0000-000000000000",
      })
      testResults.push({
        name: "Funções Personalizadas",
        status: "success",
        message: "Funções RPC funcionando",
      })
    } catch (error) {
      testResults.push({
        name: "Funções Personalizadas",
        status: "warning",
        message: "Algumas funções podem não estar disponíveis",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }

    setResults(testResults)

    // Determinar status geral
    const hasErrors = testResults.some((r) => r.status === "error")
    const hasWarnings = testResults.some((r) => r.status === "warning")

    if (hasErrors) {
      setOverallStatus("error")
    } else if (hasWarnings) {
      setOverallStatus("warning")
    } else {
      setOverallStatus("success")
    }

    setLoading(false)
  }

  useEffect(() => {
    runTests()
  }, [user])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diagnóstico da Base de Dados</h1>
          <p className="text-gray-600">Verificação do estado do sistema BISKATE</p>
        </div>
        <Button onClick={runTests} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Testando..." : "Executar Testes"}
        </Button>
      </div>

      {/* Status Geral */}
      <Alert
        className={
          overallStatus === "success"
            ? "border-green-200 bg-green-50"
            : overallStatus === "error"
              ? "border-red-200 bg-red-50"
              : "border-yellow-200 bg-yellow-50"
        }
      >
        {getStatusIcon(overallStatus)}
        <AlertDescription>
          <strong>
            {overallStatus === "success" && "Sistema Funcionando Corretamente"}
            {overallStatus === "error" && "Problemas Críticos Detectados"}
            {overallStatus === "warning" && "Sistema Funcional com Avisos"}
          </strong>
          <br />
          {overallStatus === "success" && "Todas as funcionalidades principais estão operacionais."}
          {overallStatus === "error" &&
            "Alguns componentes críticos não estão funcionando. Verifique os detalhes abaixo."}
          {overallStatus === "warning" &&
            "O sistema está funcional, mas algumas funcionalidades podem estar limitadas."}
        </AlertDescription>
      </Alert>

      {/* Resultados dos Testes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((result, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  {result.name === "Conexão com Supabase" && <Database className="h-5 w-5" />}
                  {result.name === "Autenticação" && <Shield className="h-5 w-5" />}
                  {result.name.includes("Tabela") && <Settings className="h-5 w-5" />}
                  {result.name === "RLS Policies" && <Shield className="h-5 w-5" />}
                  {result.name === "Funções Personalizadas" && <Settings className="h-5 w-5" />}
                  {result.name}
                </div>
                <Badge className={getStatusColor(result.status)}>
                  {result.status === "success" && "OK"}
                  {result.status === "error" && "ERRO"}
                  {result.status === "warning" && "AVISO"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded border">{result.details}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuário Atual</p>
              <p className="text-lg font-semibold">{user?.email || "Não autenticado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Role</p>
              <p className="text-lg font-semibold">{user?.role || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status da Conexão</p>
              <p className="text-lg font-semibold">
                {results.find((r) => r.name === "Conexão com Supabase")?.status === "success"
                  ? "Conectado"
                  : "Desconectado"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Recomendadas */}
      {overallStatus !== "success" && (
        <Card>
          <CardHeader>
            <CardTitle>Ações Recomendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results
                .filter((r) => r.status === "error")
                .map((result, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Corrigir: {result.name}</p>
                      <p className="text-xs text-gray-600">{result.details}</p>
                    </div>
                  </div>
                ))}
              {results.filter((r) => r.status === "error").length === 0 && (
                <p className="text-sm text-gray-600">
                  Execute o script de correções críticas se ainda não foi executado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
