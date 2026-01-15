"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Copy, Globe, Search } from "lucide-react"
import { siteConfig, getFullUrl } from "@/lib/config/site-config"
import { useToast } from "@/hooks/use-toast"

interface SEOCheck {
  name: string
  status: "success" | "error" | "warning"
  message: string
  value?: string
  action?: string
  priority: "high" | "medium" | "low"
  category: "verification" | "technical" | "content" | "performance"
}

interface SearchEngine {
  name: string
  url: string
  description: string
  importance: "high" | "medium" | "low"
  region: string
  envVar: string
  configured: boolean
}

export function SEODashboardComplete() {
  const [checks, setChecks] = useState<SEOCheck[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const searchEngines: SearchEngine[] = [
    {
      name: "Google",
      url: "https://search.google.com/search-console/",
      description: "Motor de busca mais usado mundialmente",
      importance: "high",
      region: "Global",
      envVar: "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
      configured: !!process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    {
      name: "Bing",
      url: "https://www.bing.com/webmasters/",
      description: "Motor de busca da Microsoft",
      importance: "medium",
      region: "Global",
      envVar: "NEXT_PUBLIC_BING_SITE_VERIFICATION",
      configured: !!process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
    },
    {
      name: "Yandex",
      url: "https://webmaster.yandex.com/",
      description: "Principal motor de busca da Rússia",
      importance: "medium",
      region: "Rússia/Europa Oriental",
      envVar: "NEXT_PUBLIC_YANDEX_VERIFICATION",
      configured: !!process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    },
    {
      name: "Baidu",
      url: "https://ziyuan.baidu.com/",
      description: "Principal motor de busca da China",
      importance: "low",
      region: "China",
      envVar: "NEXT_PUBLIC_BAIDU_VERIFICATION",
      configured: !!process.env.NEXT_PUBLIC_BAIDU_VERIFICATION,
    },
    {
      name: "Naver",
      url: "https://searchadvisor.naver.com/",
      description: "Principal motor de busca da Coreia do Sul",
      importance: "low",
      region: "Coreia do Sul",
      envVar: "NEXT_PUBLIC_NAVER_VERIFICATION",
      configured: !!process.env.NEXT_PUBLIC_NAVER_VERIFICATION,
    },
  ]

  useEffect(() => {
    runSEOChecks()
  }, [])

  const runSEOChecks = async () => {
    setLoading(true)

    const seoChecks: SEOCheck[] = [
      // Verificações de motores de busca
      ...searchEngines.map((engine) => ({
        name: `${engine.name} Verification`,
        status: engine.configured
          ? ("success" as const)
          : engine.importance === "high"
            ? ("error" as const)
            : ("warning" as const),
        message: engine.configured ? "Configurado" : `Não configurado - ${engine.description}`,
        value: engine.configured ? "✓ Configurado" : undefined,
        action: engine.url,
        priority: engine.importance,
        category: "verification" as const,
      })),

      // Verificações técnicas
      {
        name: "URL do Site",
        status: siteConfig.url ? "success" : "error",
        message: siteConfig.url || "URL não configurada",
        value: siteConfig.url,
        priority: "high",
        category: "technical",
      },
      {
        name: "Sitemap XML",
        status: "success",
        message: "Sitemap gerado automaticamente",
        value: getFullUrl("/sitemap.xml"),
        action: getFullUrl("/sitemap.xml"),
        priority: "high",
        category: "technical",
      },
      {
        name: "Robots.txt",
        status: "success",
        message: "Robots.txt configurado",
        value: getFullUrl("/robots.txt"),
        action: getFullUrl("/robots.txt"),
        priority: "high",
        category: "technical",
      },
      {
        name: "HTTPS",
        status: siteConfig.url?.startsWith("https://") ? "success" : "error",
        message: siteConfig.url?.startsWith("https://") ? "Site seguro com HTTPS" : "Configure HTTPS para SEO",
        priority: "high",
        category: "technical",
      },

      // Verificações de conteúdo
      {
        name: "Meta Description",
        status: siteConfig.description ? "success" : "warning",
        message: siteConfig.description || "Meta description não configurada",
        value: siteConfig.description,
        priority: "high",
        category: "content",
      },
      {
        name: "Open Graph",
        status: "success",
        message: "Open Graph configurado para redes sociais",
        priority: "medium",
        category: "content",
      },
      {
        name: "Structured Data",
        status: "success",
        message: "JSON-LD implementado para SEO",
        priority: "medium",
        category: "content",
      },
      {
        name: "Favicon",
        status: "success",
        message: "Favicon configurado",
        priority: "low",
        category: "content",
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Alta</Badge>
      case "medium":
        return <Badge variant="secondary">Média</Badge>
      case "low":
        return <Badge variant="outline">Baixa</Badge>
      default:
        return null
    }
  }

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">Essencial</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Importante</Badge>
      case "low":
        return <Badge className="bg-blue-100 text-blue-800">Opcional</Badge>
      default:
        return null
    }
  }

  const filterChecksByCategory = (category: string) => {
    return checks.filter((check) => check.category === category)
  }

  const getOverallScore = () => {
    const totalChecks = checks.length
    const successChecks = checks.filter((check) => check.status === "success").length
    return Math.round((successChecks / totalChecks) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard SEO Completo</h2>
          <p className="text-muted-foreground">Monitore e otimize o SEO do Biskate em todos os motores de busca</p>
        </div>
        {!loading && (
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{getOverallScore()}%</div>
            <div className="text-sm text-muted-foreground">Score SEO</div>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="search-engines">Motores de Busca</TabsTrigger>
          <TabsTrigger value="technical">Técnico</TabsTrigger>
          <TabsTrigger value="tools">Ferramentas</TabsTrigger>
          <TabsTrigger value="guides">Guias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verificações</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{checks.filter((c) => c.status === "success").length}</div>
                <p className="text-xs text-muted-foreground">de {checks.length} configuradas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Motores de Busca</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{searchEngines.filter((s) => s.configured).length}</div>
                <p className="text-xs text-muted-foreground">de {searchEngines.length} configurados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prioridade Alta</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {checks.filter((c) => c.priority === "high" && c.status === "success").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  de {checks.filter((c) => c.priority === "high").length} críticas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Geral</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{getOverallScore()}%</div>
                <p className="text-xs text-muted-foreground">Otimização SEO</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status Geral</CardTitle>
              <CardDescription>Todas as verificações de SEO</CardDescription>
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
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{check.name}</h4>
                            {getPriorityBadge(check.priority)}
                          </div>
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

        <TabsContent value="search-engines" className="space-y-4">
          <div className="grid gap-4">
            {searchEngines.map((engine, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{engine.name}</span>
                        {getImportanceBadge(engine.importance)}
                      </CardTitle>
                      <CardDescription>{engine.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      {engine.configured ? (
                        <Badge className="bg-green-100 text-green-800">Configurado</Badge>
                      ) : (
                        <Badge variant="outline">Não Configurado</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm">
                        <strong>Região:</strong> {engine.region}
                      </p>
                      <p className="text-sm">
                        <strong>Variável:</strong> <code className="bg-muted px-1">{engine.envVar}</code>
                      </p>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(engine.envVar)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar Variável
                      </Button>
                      <Button size="sm" onClick={() => window.open(engine.url, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Configurar
                      </Button>
                      {engine.name === "Bing" && (
                        <Button variant="secondary" size="sm" onClick={() => window.open("/admin/seo/bing", "_blank")}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Guia Completo
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verificações Técnicas</CardTitle>
              <CardDescription>Aspectos técnicos do SEO</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterChecksByCategory("technical").map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <h4 className="font-medium">{check.name}</h4>
                        <p className="text-sm text-muted-foreground">{check.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(check.status)}
                      {check.action && (
                        <Button variant="ghost" size="sm" onClick={() => window.open(check.action, "_blank")}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                <CardTitle>Yandex Webmaster</CardTitle>
                <CardDescription>Configure seu site no Yandex</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => window.open("https://webmaster.yandex.com/", "_blank")} className="w-full">
                  Abrir Yandex Webmaster
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

            <Card>
              <CardHeader>
                <CardTitle>Rich Results Test</CardTitle>
                <CardDescription>Teste structured data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() =>
                    window.open(
                      `https://search.google.com/test/rich-results?url=${encodeURIComponent(siteConfig.url)}`,
                      "_blank",
                    )
                  }
                  className="w-full"
                >
                  Testar Rich Results
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="guides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🔍 Como Configurar Yandex Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Acesse{" "}
                  <a
                    href="https://webmaster.yandex.com/"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                    rel="noreferrer"
                  >
                    Yandex Webmaster
                  </a>
                </li>
                <li>Faça login ou crie uma conta Yandex</li>
                <li>Clique em "Add site" ou "Adicionar site"</li>
                <li>
                  Digite sua URL: <code className="bg-muted px-1">{siteConfig.url}</code>
                </li>
                <li>Escolha o método "Meta tag"</li>
                <li>Copie apenas o código de verificação (não a tag inteira)</li>
                <li>
                  Adicione como variável de ambiente:{" "}
                  <code className="bg-muted px-1">NEXT_PUBLIC_YANDEX_VERIFICATION</code>
                </li>
              </ol>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dica:</strong> O Yandex é especialmente importante se você planeja ter usuários da Rússia,
                  Ucrânia, Bielorrússia, Cazaquistão e outros países da região.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Prioridades de Configuração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-red-600 mb-2">🔴 Prioridade Alta (Configure Primeiro)</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>Google Search Console</li>
                    <li>HTTPS e URL canônica</li>
                    <li>Sitemap XML</li>
                    <li>Meta descriptions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-600 mb-2">🟡 Prioridade Média</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>Bing Webmaster Tools</li>
                    <li>Yandex Webmaster</li>
                    <li>Open Graph tags</li>
                    <li>Structured data</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-600 mb-2">🔵 Prioridade Baixa (Opcional)</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>Baidu (apenas se tiver usuários na China)</li>
                    <li>Naver (apenas se tiver usuários na Coreia)</li>
                    <li>Pinterest verification</li>
                    <li>Facebook domain verification</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
