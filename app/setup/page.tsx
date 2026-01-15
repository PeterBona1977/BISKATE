"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")

  const createTestUser = async () => {
    setLoading(true)
    setError("")
    setMessage("")

    try {
      // Registrar usuário normal
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: "user@biskate.com",
        password: "user123",
      })

      if (userError) {
        setError(userError.message)
        setLoading(false)
        return
      }

      // Registrar admin
      const { data: adminData, error: adminError } = await supabase.auth.signUp({
        email: "admin@biskate.com",
        password: "admin123",
      })

      if (adminError) {
        setError(adminError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setMessage("Usuários de teste criados com sucesso! Agora você pode fazer login com as credenciais fornecidas.")
    } catch (err) {
      console.error("Erro:", err)
      setError("Ocorreu um erro ao tentar criar os usuários de teste")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-2xl font-bold text-indigo-600 mb-2">
            BISK<span className="text-orange-500">A</span>TE
          </div>
          <CardTitle>Configuração Inicial</CardTitle>
          <CardDescription>Configure o banco de dados com usuários de teste para o BISKATE</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Devido às limitações do ambiente de preview, vamos usar uma abordagem alternativa:
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm">
              <h3 className="font-semibold text-amber-800 mb-2">Instruções para criar usuários de teste:</h3>
              <ol className="list-decimal pl-5 text-amber-700 space-y-2">
                <li>
                  <strong>Registre-se normalmente</strong> através da página de{" "}
                  <Link href="/register" className="text-indigo-600 hover:underline">
                    registro
                  </Link>
                  .
                </li>
                <li>
                  <strong>Faça login</strong> com as credenciais que você acabou de criar.
                </li>
                <li>
                  <strong>Você terá acesso como usuário normal</strong> ao dashboard.
                </li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm">
              <h3 className="font-semibold text-blue-800 mb-2">Credenciais para teste:</h3>
              <p className="text-blue-700 mb-2">
                Para facilitar, você pode usar estas credenciais pré-definidas ao se registrar:
              </p>
              <ul className="list-disc pl-5 text-blue-700 space-y-1">
                <li>
                  <strong>Email:</strong> user@biskate.com
                </li>
                <li>
                  <strong>Senha:</strong> user123
                </li>
              </ul>
            </div>

            <div className="text-center mt-4">
              <Link href="/register">
                <Button>Ir para Página de Registro</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
