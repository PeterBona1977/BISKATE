"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

export function CategoriesDebug() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [testName, setTestName] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>({})
  const { toast } = useToast()
  const { user, profile, isAdmin } = useAuth()

  const runDebug = async () => {
    setLoading(true)
    const debug: any = {}

    try {
      // 1. Verificar user e perfil
      debug.user = {
        id: user?.id,
        email: user?.email,
        isAdmin,
        profileRole: profile?.role,
      }

      // 2. Testar conexão básica
      const { data: testConnection, error: testError } = await supabase
        .from("categories")
        .select("count", { count: "exact", head: true })

      debug.connection = { testConnection, testError }

      // 3. Tentar buscar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name")

      debug.categories = {
        data: categoriesData,
        error: categoriesError,
        count: categoriesData?.length || 0,
      }

      // 4. Verificar auth.uid()
      const { data: authTest, error: authError } = await supabase.rpc("auth.uid").single()

      debug.auth = { authTest, authError }

      setCategories(categoriesData || [])
      setDebugInfo(debug)
    } catch (error: any) {
      debug.criticalError = error.message
      setDebugInfo(debug)
      toast({
        title: "Erro crítico",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createTestCategory = async () => {
    if (!testName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para a categoria",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("🧪 Tentando criar categoria:", testName)

      const slug = testName.toLowerCase().replace(/\s+/g, "-")
      const categoryData = {
        name: testName,
        description: `Categoria de teste: ${testName}`,
        slug,
        margin_percentage: 10.0,
        is_active: true,
        icon: "🧪",
      }

      console.log("📝 Dados da categoria:", categoryData)

      const { data, error } = await supabase.from("categories").insert([categoryData]).select()

      console.log("📊 Resultado da inserção:", { data, error })

      if (error) {
        throw new Error(`Erro na inserção: ${error.message}`)
      }

      toast({
        title: "Sucesso!",
        description: `Categoria "${testName}" criada com sucesso!`,
      })

      setTestName("")
      runDebug() // Refresh
    } catch (error: any) {
      console.error("💥 Erro ao criar categoria:", error)
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDebug()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug de Categorias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">👤 Informações do Usuário</h3>
            <pre className="text-xs">{JSON.stringify(debugInfo.user, null, 2)}</pre>
          </div>

          {/* Connection Test */}
          <div className="p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">🔗 Teste de Conexão</h3>
            <pre className="text-xs">{JSON.stringify(debugInfo.connection, null, 2)}</pre>
          </div>

          {/* Categories Data */}
          <div className="p-4 bg-green-50 rounded">
            <h3 className="font-semibold mb-2">📋 Dados das Categorias</h3>
            <pre className="text-xs">{JSON.stringify(debugInfo.categories, null, 2)}</pre>
          </div>

          {/* Auth Test */}
          <div className="p-4 bg-yellow-50 rounded">
            <h3 className="font-semibold mb-2">🔐 Teste de Autenticação</h3>
            <pre className="text-xs">{JSON.stringify(debugInfo.auth, null, 2)}</pre>
          </div>

          <Button onClick={runDebug} disabled={loading}>
            {loading ? "Executando..." : "🔄 Executar Debug"}
          </Button>
        </CardContent>
      </Card>

      {/* Test Category Creation */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste de Criação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Nome da categoria de teste"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
            <Button onClick={createTestCategory} disabled={loading}>
              {loading ? "Criando..." : "Criar Teste"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Categorias Encontradas ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="p-2 border rounded">
                  <div className="font-medium">
                    {cat.icon} {cat.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {cat.slug} • {cat.margin_percentage}% • {cat.is_active ? "Ativa" : "Inativa"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
