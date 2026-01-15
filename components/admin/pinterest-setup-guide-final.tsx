"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, ExternalLink, Copy, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { siteConfig } from "@/lib/config/site-config"

export function PinterestSetupGuideFinal() {
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
            <span>Pinterest Verification - Passos Exatos</span>
          </h2>
          <p className="text-muted-foreground">Usando "Contas externas reivindicadas"</p>
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

      <Alert className="border-green-500 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>✅ Localização Confirmada:</strong> A opção está em "Contas externas reivindicadas"!
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
              <span>Acessar Pinterest</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm">1. Acesse o Pinterest:</p>
              <div className="flex items-center space-x-2">
                <Button onClick={() => window.open("https://pinterest.com/", "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Abrir Pinterest
                </Button>
              </div>
              <p className="text-sm">2. Faça login na sua conta</p>
            </div>
          </CardContent>
        </Card>

        {/* Passo 2 */}
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <span>Navegar para Configurações</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm">
                1. Clique na sua <strong>foto de perfil</strong> (canto superior direito)
              </p>
              <p className="text-sm">
                2. Selecione <strong>"Definições"</strong> no menu dropdown
              </p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Dica:</strong> Pode aparecer como "Settings" se estiver em inglês
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passo 3 */}
        <Card className="border-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <span>Encontrar "Contas externas reivindicadas"</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm">Na página de definições, procure no menu lateral por:</p>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="font-medium text-purple-800">📋 "Contas externas reivindicadas"</p>
                <p className="text-sm text-purple-600 mt-1">
                  (Em inglês pode aparecer como "Claimed accounts" ou "External accounts")
                </p>
              </div>
              <p className="text-sm">Clique nesta opção</p>
            </div>
          </CardContent>
        </Card>

        {/* Passo 4 */}
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <span>Reivindicar Website</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm">1. Na seção "Contas externas reivindicadas", procure por:</p>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="font-medium text-orange-800">🌐 "Website" ou "Reivindicar website"</p>
              </div>
              <p className="text-sm">
                2. Clique em <strong>"Reivindicar"</strong> ou <strong>"+"</strong>
              </p>
              <p className="text-sm">3. Digite sua URL:</p>
              <div className="flex items-center space-x-2">
                <code className="bg-muted px-2 py-1 rounded text-sm flex-1">{siteConfig.url}</code>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(siteConfig.url)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passo 5 */}
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                5
              </div>
              <span>Método de Verificação</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm">O Pinterest oferecerá métodos de verificação:</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Adicionar tag HTML (Recomendado)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Upload de arquivo HTML</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Adicionar registro TXT DNS</span>
                </div>
              </div>
              <p className="text-sm">
                1. Escolha <strong>"Adicionar tag HTML"</strong>
              </p>
              <p className="text-sm">2. Copie APENAS o código de verificação:</p>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Tag completa que o Pinterest mostra:</p>
                  <code className="text-xs text-red-600 block bg-red-50 p-2 rounded">
                    &lt;meta name="p:domain_verify" content="abc123def456ghi789" /&gt;
                  </code>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Você precisa APENAS desta parte:</p>
                  <code className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded block">
                    abc123def456ghi789
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passo 6 */}
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                6
              </div>
              <span>Configurar e Verificar</span>
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
                3. Volte ao Pinterest e clique em <strong>"Verificar"</strong>
              </p>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>✅ Sucesso!</strong> Após a verificação, você terá acesso ao Pinterest Analytics e Rich Pins!
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu de Navegação Visual */}
      <Card>
        <CardHeader>
          <CardTitle>🗺️ Mapa de Navegação Visual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Pinterest.com</span>
              <ArrowRight className="h-4 w-4" />
              <span>Foto de Perfil</span>
              <ArrowRight className="h-4 w-4" />
              <span>Definições</span>
              <ArrowRight className="h-4 w-4" />
              <span className="font-medium text-purple-600">Contas externas reivindicadas</span>
              <ArrowRight className="h-4 w-4" />
              <span>Website</span>
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
                  <p className="text-sm text-muted-foreground">
                    Siga o caminho: Perfil → Definições → Contas externas reivindicadas
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
