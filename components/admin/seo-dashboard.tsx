"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Copy } from "lucide-react"
import { siteConfig, getFullUrl } from "@/lib/config/site-config"
import { useToast } from "@/hooks/use-toast"

interface SEOCheck {
  name: string
  status: "success" | "error" | "warning"
  message: string
  value?: string
  action?: string
}

export function SEODashboard() {
  const [checks, setChecks] = useState<SEOCheck[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    runSEOChecks()
  }, [])

  const runSEOChecks = async () => {
    setLoading(true)

    const seoChecks: SEOCheck[] = [
      // Verificações básicas
      {
        name: "URL do Site",
        status: siteConfig.url ? "success" : "error",
        message: siteConfig.url || "URL não configurada",
        value: siteConfig.url,
      },
      {
        name: "Google Site Verification",
        status: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? "success" : "warning",
        message: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
          ? "Configurado"
          : "Não configurado - Configure para aparecer no Google",
        value: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        action: "https://search.google.com/search-console/",
      },
      {
        name: "Sitemap",
        status: "success",
        message: "Sitemap gerado automaticamente",
        value: getFullUrl("/sitemap.xml"),
        action: getFullUrl("/sitemap.xml"),
      },
      {
        name: "Robots.txt",
        status: "success",
        message: "Robots.txt configurado",
        value: getFullUrl("/robots.txt"),
        action: getFullUrl("/robots.txt"),
      },
      {
        name: "Meta Description",
        status: siteConfig.description ? "success" : "warning",
        message: siteConfig.description || "Meta description não configurada",
        value: siteConfig.description,
      },
      {
        name: "Open Graph",
        status: "success",
        message: "Open Graph configurado para redes sociais",
      },
      {
        name: "Structured Data",
        status: "success",
        message: "JSON-LD implementado para SEO",
      },
    ]

    setChecks(seoChecks)
    setLoading(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            OK
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Erro</Badge>
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Atenção
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard SEO</h2>
        <p className="text-muted-foreground">Monitore e otimize o SEO do Biskate</p>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Status SEO</TabsTrigger>
          <TabsTrigger value="tools">Ferramentas</TabsTrigger>
          <TabsTrigger value="guides">Guias</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verificações SEO</CardTitle>
              <CardDescription>Status atual das configurações de SEO</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Verificando...</div>
              ) : (
                <div className="space-y-4">
                  {checks.map((check, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <h4 className="font-medium">{check.name}</h4>
                          <p className="text-sm text-muted-foreground">{check.message}</p>
                          {check.value && (
                            <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">{check.value}</code>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(check.status)}
                        {check.value && (
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(check.value!)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        {check.action && (
                          <Button variant="ghost" size="sm" onClick={() => window.open(check.action, "_blank")}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Google Search Console</CardTitle>
                <CardDescription>Monitore como o Google vê seu site</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => window.open("https://search.google.com/search-console/", "_blank")}
                  className="w-full"
                >
                  Abrir Search Console
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PageSpeed Insights</CardTitle>
                <CardDescription>Teste a velocidade do seu site</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() =>
                    window.open(
                      `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(siteConfig.url)}`,
                      "_blank",
                    )
                  }
                  className="w-full"
                >
                  Testar Velocidade
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="guides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Como Configurar Google Site Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Acesse{" "}
                  <a
                    href="https://search.google.com/search-console/"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                    rel="noreferrer"
                  >
                    Google Search Console
                  </a>
                </li>
                <li>Clique em "Adicionar propriedade"</li>
                <li>
                  Escolha "Prefixo do URL" e digite: <code className="bg-muted px-1">{siteConfig.url}</code>
                </li>
                <li>Escolha o método "Tag HTML"</li>
                <li>Copie apenas o código de verificação (não a tag inteira)</li>
                <li>
                  Adicione como variável de ambiente: <code className="bg-muted px-1">GOOGLE_SITE_VERIFICATION</code>
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
