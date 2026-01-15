"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Home, Bug } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Bug className="h-5 w-5" />
                Erro na Aplicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>Algo deu errado! A aplicação encontrou um erro inesperado.</AlertDescription>
              </Alert>

              {this.state.error && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Detalhes do Erro:</h3>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>

                  {this.state.errorInfo && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800 mb-2">Stack Trace</summary>
                      <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-48">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Recarregar Página
                </Button>

                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Ir para Início
                </Button>

                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/diagnostic")}
                  className="flex items-center gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Executar Diagnóstico
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
