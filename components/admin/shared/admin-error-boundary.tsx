"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  errorTitle?: string
  errorMessage?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class AdminErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("🔴 AdminErrorBoundary capturou um erro:", error, errorInfo)
    this.setState({ error, errorInfo })
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertTriangle className="mr-2 h-5 w-5" />
              {this.props.errorTitle || "Ocorreu um erro"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700">
              <p>{this.props.errorMessage || "Não foi possível carregar este componente."}</p>
              {process.env.NODE_ENV !== "production" && this.state.error && (
                <div className="mt-4">
                  <p className="font-medium">Detalhes do erro (apenas em desenvolvimento):</p>
                  <pre className="mt-2 max-h-96 overflow-auto rounded bg-gray-100 p-4 text-xs">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={this.resetError} variant="outline" className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </CardFooter>
        </Card>
      )
    }

    return this.props.children
  }
}
