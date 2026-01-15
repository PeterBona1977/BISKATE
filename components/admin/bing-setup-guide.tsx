"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, ExternalLink, CheckCircle, AlertTriangle, Globe, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function BingSetupGuide() {
  const [step, setStep] = useState(1)
  const { toast } = useToast()

  const siteUrl = "https://v0-biskate.vercel.app"

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    })
  }

  const bingStats = [
    { label: "Market Share Global", value: "6-8%", icon: Globe },
    { label: "Utilizadores Mensais", value: "1B+", icon: TrendingUp },
    { label: "Forte em", value: "EUA & Corporativo", icon: CheckCircle },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Globe className="h-6 w-6 text-blue-600" />
            <span>Configurar Bing Webmaster Tools</span>
          </h2>
          <p className="text-muted-foreground">Configure o Biskate no motor de busca da Microsoft</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">Prioridade Média</Badge>
      </div>

      {/* Estatísticas do Bing */}
      <div className="grid gap-4 md:grid-cols-3">
        {bingStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="flex items-center p-4">
              <stat.icon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="guide" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guide">Guia Passo-a-Passo</TabsTrigger>
          <TabsTrigger value="benefits">Benefícios</TabsTrigger>
          <TabsTrigger value="verification">Verificação</TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Como Configurar o Bing Webmaster Tools</CardTitle>
              <CardDescription>Siga estes passos para adicionar o Biskate ao Bing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Aceder ao Bing Webmaster Tools</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Vai para o site oficial do Bing Webmaster Tools
                    </p>
                    <Button
                      onClick={() => window.open("https://www.bing.com/webmasters/", "_blank")}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Bing Webmaster Tools
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Fazer Login</h4>
                    <p className="text-sm text-muted-foreground">
                      Usa a tua conta Microsoft (Outlook, Hotmail, ou cria uma nova)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Adicionar Site</h4>
                    <p className="text-sm text-muted-foreground mb-2">Clica em "Add a site" e adiciona a URL:</p>
                    <div className="flex items-center space-x-2">
                      <code className="bg-muted px-3 py-2 rounded text-sm flex-1">{siteUrl}</code>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(siteUrl)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Escolher Método de Verificação</h4>
                    <p className="text-sm text-muted-foreground">Seleciona "HTML meta tag"</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    5
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Copiar Código de Verificação</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      O Bing vai mostrar algo como:
                      <br />
                      <code className="text-xs">&lt;meta name="msvalidate.01" content="ABC123..." /&gt;</code>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Copia apenas o código</strong> (ex: ABC123...), não a tag inteira!
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    6
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Adicionar Variável de Ambiente</h4>
                    <p className="text-sm text-muted-foreground mb-2">No Vercel, adiciona esta variável de ambiente:</p>
                    <div className="flex items-center space-x-2">
                      <code className="bg-muted px-3 py-2 rounded text-sm flex-1">
                        NEXT_PUBLIC_BING_SITE_VERIFICATION
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard("NEXT_PUBLIC_BING_SITE_VERIFICATION")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">O valor será o código que copiaste do Bing</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Verificar</h4>
                    <p className="text-sm text-muted-foreground">
                      Volta ao Bing Webmaster Tools e clica "Verify". Pronto! 🎉
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>💡 Dica:</strong> Após a verificação, o Bing pode demorar alguns dias para começar a indexar o
                  teu site. É normal!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🎯 Porquê Configurar o Bing?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium text-green-600">✅ Vantagens</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>6-8% do tráfego global de pesquisa</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Forte presença nos EUA e mercados corporativos</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Integração com Microsoft Edge e Windows</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Menos competição que Google</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Ferramentas de SEO gratuitas</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-600">📊 Estatísticas</h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>1 bilião+</strong> pesquisas mensais
                    </li>
                    <li>
                      <strong>36%</strong> dos utilizadores de desktop nos EUA
                    </li>
                    <li>
                      <strong>Crescimento</strong> constante ano após ano
                    </li>
                    <li>
                      <strong>Público-alvo:</strong> Profissionais e empresas
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🔍 Verificar Configuração</CardTitle>
              <CardDescription>Como confirmar se está tudo a funcionar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">1. Verificar Meta Tag</h4>
                  <p className="text-sm text-muted-foreground mb-2">Vai ao código fonte do teu site e procura por:</p>
                  <code className="block bg-muted p-3 rounded text-sm">
                    &lt;meta name="msvalidate.01" content="..." /&gt;
                  </code>
                </div>

                <div>
                  <h4 className="font-medium mb-2">2. Testar no Bing</h4>
                  <p className="text-sm text-muted-foreground mb-2">Pesquisa no Bing por:</p>
                  <div className="flex items-center space-x-2">
                    <code className="bg-muted px-3 py-2 rounded text-sm flex-1">site:v0-biskate.vercel.app</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open("https://www.bing.com/search?q=site:v0-biskate.vercel.app", "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">3. Monitorizar Performance</h4>
                  <Button onClick={() => window.open("https://www.bing.com/webmasters/", "_blank")} className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Bing Webmaster Tools
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>⏰ Tempo de Indexação:</strong> O Bing pode demorar 2-4 semanas para indexar completamente o
                  teu site. Sê paciente!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>🚀 Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button
              onClick={() => window.open("https://vercel.com/dashboard", "_blank")}
              className="w-full"
              variant="outline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Configurar no Vercel
            </Button>
            <Button onClick={() => window.open("https://www.bing.com/webmasters/", "_blank")} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ir para Bing Webmaster
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
