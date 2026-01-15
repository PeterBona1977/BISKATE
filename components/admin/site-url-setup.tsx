"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, AlertTriangle, CheckCircle, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SiteUrlSetup() {
  const [currentUrl, setCurrentUrl] = useState("")
  const [customUrl, setCustomUrl] = useState("")
  const [environment, setEnvironment] = useState<"development" | "preview" | "production" | "unknown">("unknown")
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = window.location.origin
      setCurrentUrl(url)

      // Detectar ambiente
      if (url.includes("localhost") || url.includes("127.0.0.1")) {
        setEnvironment("development")
      } else if (url.includes("vusercontent.net") || url.includes("vercel.app")) {
        setEnvironment("preview")
      } else {
        setEnvironment("production")
      }
    }
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    })
  }

  const getEnvironmentBadge = () => {
    switch (environment) {
      case "development":
        return <Badge variant="secondary">Desenvolvimento</Badge>
      case "preview":
        return <Badge className="bg-yellow-100 text-yellow-800">Preview</Badge>
      case "production":
        return <Badge className="bg-green-100 text-green-800">Produção</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const getEnvironmentIcon = () => {
    switch (environment) {
      case "production":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "preview":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Globe className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuração da URL do Site</h2>
        <p className="text-muted-foreground">Configure a URL correta para SEO e integrações</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getEnvironmentIcon()}
            <span>URL Atual</span>
            {getEnvironmentBadge()}
          </CardTitle>
          <CardDescription>Esta é a URL onde estás a aceder ao Biskate agora</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input value={currentUrl} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(currentUrl)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {environment === "preview" && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>⚠️ Esta é uma URL de preview!</strong> Não uses esta URL para configurações de SEO. Ela é apenas
                para testes e desenvolvimento.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurar URL de Produção</CardTitle>
          <CardDescription>Define a URL real do teu site para configurações de SEO</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">URL do Site em Produção</label>
            <div className="flex items-center space-x-2 mt-1">
              <Input
                placeholder="https://biskate.com"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="font-mono text-sm"
              />
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(customUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Como configurar:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">1</span>
                <div>
                  <p>
                    <strong>Fazer deploy do projeto</strong>
                  </p>
                  <p className="text-muted-foreground">Deploy no Vercel, Netlify, ou outro serviço</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">2</span>
                <div>
                  <p>
                    <strong>Configurar domínio personalizado</strong>
                  </p>
                  <p className="text-muted-foreground">Ex: biskate.com, app.biskate.com</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">3</span>
                <div>
                  <p>
                    <strong>Adicionar variável de ambiente</strong>
                  </p>
                  <p className="text-muted-foreground">
                    <code className="bg-muted px-1">NEXT_PUBLIC_SITE_URL=https://biskate.com</code>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>💡 Dica:</strong> Até fazeres deploy, podes usar uma URL placeholder como
              <code className="bg-muted px-1 ml-1">https://biskate.com</code> para configurar as integrações de SEO.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variáveis de Ambiente Necessárias</CardTitle>
          <CardDescription>Adiciona estas variáveis no teu serviço de deploy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <code className="text-sm">NEXT_PUBLIC_SITE_URL</code>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard("NEXT_PUBLIC_SITE_URL")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <code className="text-sm">NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION</code>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <code className="text-sm">NEXT_PUBLIC_BING_SITE_VERIFICATION</code>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard("NEXT_PUBLIC_BING_SITE_VERIFICATION")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => window.open("https://vercel.com/new", "_blank")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Deploy no Vercel
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open("https://docs.vercel.com/concepts/projects/environment-variables", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Como Configurar Variáveis de Ambiente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
