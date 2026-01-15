"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Search, TrendingUp, AlertTriangle, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function GoogleSearchConsoleSetup() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Google Search Console</h1>
        <p className="text-muted-foreground">
          A ferramenta mais importante para SEO - dados diretos do Google sobre o teu site
        </p>
      </div>

      {/* Importância */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Search className="h-5 w-5" />
            Porquê Google Search Console é essencial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800">📊 Dados que vais obter:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Palavras-chave que trazem tráfego</li>
                <li>• Posição nos resultados do Google</li>
                <li>• Páginas mais visitadas</li>
                <li>• Erros de indexação</li>
                <li>• Performance mobile vs desktop</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800">🎯 Benefícios para o Biskate:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Otimizar para palavras certas</li>
                <li>• Identificar problemas técnicos</li>
                <li>• Melhorar ranking no Google</li>
                <li>• Monitorizar crescimento</li>
                <li>• Submeter sitemaps</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passo a passo */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Configuração Passo-a-Passo</CardTitle>
          <CardDescription>Processo simples e rápido</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Passo 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">
                1
              </Badge>
              <h3 className="font-semibold">Aceder ao Google Search Console</h3>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">Vai para o Google Search Console e adiciona a propriedade</p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Google Search Console
                </a>
              </Button>
            </div>
          </div>

          {/* Passo 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">
                2
              </Badge>
              <h3 className="font-semibold">Adicionar Propriedade</h3>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                Clica em "Adicionar propriedade" e escolhe "Prefixo do URL"
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-mono text-sm">https://v0-biskate.vercel.app</p>
              </div>
            </div>
          </div>

          {/* Passo 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">
                3
              </Badge>
              <h3 className="font-semibold">Método de Verificação</h3>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">Escolhe "Tag HTML" e copia o código de verificação</p>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Vai parecer algo como: &lt;meta name="google-site-verification" content="ABC123..."&gt;
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Passo 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">
                4
              </Badge>
              <h3 className="font-semibold">Adicionar ao Site</h3>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">Partilha o código comigo e eu adiciono ao Biskate</p>
              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <p className="text-sm text-green-800">
                  ✅ Depois de fazer deploy, volta ao Google Search Console e clica "Verificar"
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Após verificação */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">📈 Após Verificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-800 mb-2">Configurações importantes:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Submeter sitemap: /sitemap.xml</li>
                <li>• Configurar público-alvo: Portugal</li>
                <li>• Ativar relatórios de experiência</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-800 mb-2">Dados disponíveis em:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Performance: 2-3 dias</li>
                <li>• Indexação: 1-2 dias</li>
                <li>• Relatórios completos: 1 semana</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">95%</p>
                <p className="text-sm text-muted-foreground">dos sites usam GSC</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-muted-foreground">dados do Google</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">Grátis</p>
                <p className="text-sm text-muted-foreground">ferramenta oficial</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
