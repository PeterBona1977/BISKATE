"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, ExternalLink, Copy, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { siteConfig } from "@/lib/config/site-config"

export function PinterestSetupGuideCorrected() {
  const [currentStep, setCurrentStep] = useState(1)
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    })
  }

  const isConfigured = !!process.env.NEXT_PUBLIC_PINTEREST_VERIFICATION

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span>Pinterest Verification - Passos Corretos</span>
          </h2>
          <p className="text-muted-foreground">Guia atualizado com a interface atual do Pinterest</p>
        </div>
        {isConfigured ? (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Configurado
          </Badge>
        ) : (
          <Badge variant="outline">Não Configurado</Badge>
        )}
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Interface Atualizada:</strong> O Pinterest mudou sua interface. Aqui estão os passos corretos para
          2024.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Passo 1 */}
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <span>Acessar Pinterest Business</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm">1. Acesse o Pinterest Business Hub:</p>
              <div className="flex items-center space-x-2">
                <Button onClick={() => window.open("https://business.pinterest.com/", "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Abrir Pinterest Business
                </Button>
              </div>
              <p className="text-sm">2. Faça login com sua conta Pinterest ou crie uma nova</p>
              <p className="text-sm">3. Se não tiver conta business, clique em "Get started" ou "Começar"</p>
            </div>
          </CardContent>
        </Card>

        {/* Passo 2 Correto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <span>Acessar Configurações da Conta</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm">1. No Pinterest, clique na sua foto de perfil (canto superior direito)</p>
              <p className="text-sm">
                2. Selecione <strong>"Settings"</strong> no menu dropdown
              </p>
              <p className="text-sm">
                3. Na página de configurações, procure pela seção <strong>"Website"</strong> ou <strong>"Claim"</strong>
              </p>
              <Alert>
                <AlertDescription>
                  <strong>Nota:</strong> A localização exata pode variar. Procure por "Claim your website" ou "Verify
                  website".
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Passo 3 Correto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <span>Verificar Website</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm">
                1. Procure por <strong>"Claim your website"</strong> ou botão similar
              </p>
              <p className="text-sm">2. Digite sua URL:</p>
              <div className="flex items-center space-x-2">
                <code className="bg-muted px-2 py-1 rounded text-sm flex-1">{siteConfig.url}</code>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(siteConfig.url)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm">
                3. Clique em <strong>"Claim"</strong> ou <strong>"Verify"</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Passo 4 Correto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <span>Escolher Método de Verificação</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm">O Pinterest oferecerá métodos de verificação:</p>
              <div className="space-y-2 ml-4">
                <p className="text-sm">
                  • <strong>HTML Tag</strong> (Recomendado)
                </p>
                <p className="text-sm">• Upload de arquivo HTML</p>
                <p className="text-sm">• DNS TXT record</p>
              </div>
              <p className="text-sm">
                1. Escolha <strong>"Add HTML tag"</strong>
              </p>
              <p className="text-sm">2. Copie APENAS o código de verificação:</p>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-xs text-gray-600">Tag completa que o Pinterest mostra:</p>
                <code className="text-xs text-red-600 block">
                  &lt;meta name="p:domain_verify" content="abc123def456ghi789" /&gt;
                </code>
                <p className="text-xs text-gray-600">Você precisa APENAS desta parte:</p>
                <code className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                  abc123def456ghi789
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passo 5 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                5
              </div>
              <span>Configurar Variável de Ambiente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm">1. Adicione o código como variável de ambiente:</p>
              <div className="flex items-center space-x-2">
                <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                  NEXT_PUBLIC_PINTEREST_VERIFICATION=seu_codigo_aqui
                </code>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard("NEXT_PUBLIC_PINTEREST_VERIFICATION")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm">2. Faça deploy da aplicação</p>
              <p className="text-sm">
                3. Volte ao Pinterest e clique em <strong>"Verify"</strong>
              </p>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  A verificação pode levar alguns minutos. Após confirmada, você terá acesso ao Pinterest Analytics!
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métodos Alternativos */}
      <Card>
        <CardHeader>
          <CardTitle>🔄 Métodos Alternativos (se não encontrar "Claim")</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium">Opção 1: Pinterest Business Hub</h4>
            <p className="text-sm">1. Vá para business.pinterest.com</p>
            <p className="text-sm">2. Procure por "Tools" ou "Ferramentas"</p>
            <p className="text-sm">3. Encontre "Website verification" ou similar</p>

            <h4 className="font-medium mt-4">Opção 2: Pinterest Ads Manager</h4>
            <p className="text-sm">1. Acesse ads.pinterest.com</p>
            <p className="text-sm">2. Vá para "Settings" &gt; "Domain verification"</p>

            <h4 className="font-medium mt-4">Opção 3: Pinterest Help Center</h4>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open("https://help.pinterest.com/en/business/article/claim-your-website", "_blank")
                }
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Ver Documentação Oficial
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Status da Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            {isConfigured ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium text-green-600">Pinterest Verificado!</p>
                  <p className="text-sm text-muted-foreground">Sua verificação está ativa e funcionando.</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                <div>
                  <p className="font-medium text-gray-600">Aguardando Configuração</p>
                  <p className="text-sm text-muted-foreground">Siga os passos acima para verificar seu site.</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
