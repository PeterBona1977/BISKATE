"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, AlertTriangle, CheckCircle, ExternalLink, Copy } from "lucide-react"
import { useState } from "react"

export function StripeSetupGuide() {
  const [testMode, setTestMode] = useState(true)

  const envVars = [
    {
      name: "STRIPE_SECRET_KEY",
      description: "Chave secreta do Stripe (servidor)",
      example: testMode ? "sk_test_..." : "sk_live_...",
      required: true,
    },
    {
      name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      description: "Chave pública do Stripe (cliente)",
      example: testMode ? "pk_test_..." : "pk_live_...",
      required: true,
    },
    {
      name: "STRIPE_WEBHOOK_SECRET",
      description: "Segredo do webhook para verificar eventos",
      example: "whsec_...",
      required: true,
    },
    {
      name: "STRIPE_PLATFORM_ACCOUNT_ID",
      description: "ID da conta da plataforma para Connect",
      example: "acct_...",
      required: false,
    },
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-6 w-6 text-blue-500" />
            <span>Configuração do Sistema de Pagamentos Stripe</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Configure o Stripe para processar pagamentos seguros na plataforma BISKATE. Este guia irá ajudá-lo a
            configurar tanto o modo de teste quanto o modo de produção.
          </p>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Comece sempre com o modo de teste antes de configurar o modo de produção.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs value={testMode ? "test" : "live"} onValueChange={(value) => setTestMode(value === "test")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test">Modo de Teste</TabsTrigger>
          <TabsTrigger value="live">Modo de Produção</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  TESTE
                </Badge>
                <span>Configuração para Desenvolvimento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No modo de teste, pode usar cartões de teste e nenhum dinheiro real será processado.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Passos para Configuração:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    Aceda ao{" "}
                    <a
                      href="https://dashboard.stripe.com/register"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center"
                    >
                      Stripe Dashboard <ExternalLink className="h-3 w-3 ml-1" />
                    </a>{" "}
                    e crie uma conta
                  </li>
                  <li>Ative o "Modo de Teste" no dashboard (toggle no canto superior direito)</li>
                  <li>
                    Vá para{" "}
                    <a
                      href="https://dashboard.stripe.com/test/apikeys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Developers → API keys
                    </a>
                  </li>
                  <li>Copie as chaves de teste e configure as variáveis de ambiente abaixo</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Badge variant="destructive">PRODUÇÃO</Badge>
                <span>Configuração para Produção</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Atenção:</strong> No modo de produção, transações reais serão processadas. Configure apenas
                  quando estiver pronto para lançar.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Requisitos para Produção:</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Conta Stripe totalmente verificada</li>
                  <li>Informações bancárias configuradas</li>
                  <li>Termos de serviço e política de privacidade publicados</li>
                  <li>SSL/HTTPS configurado no seu domínio</li>
                  <li>Testes completos realizados no modo de teste</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Variáveis de Ambiente */}
      <Card>
        <CardHeader>
          <CardTitle>Variáveis de Ambiente Necessárias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {envVars.map((envVar) => (
              <div key={envVar.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Label className="font-mono text-sm">{envVar.name}</Label>
                    {envVar.required && <Badge variant="destructive">Obrigatório</Badge>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(envVar.name)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-2">{envVar.description}</p>
                <Input placeholder={envVar.example} className="font-mono text-xs" readOnly />
              </div>
            ))}
          </div>

          <Alert className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Segurança:</strong> Nunca exponha as chaves secretas no código frontend. Use apenas variáveis que
              começam com <code>NEXT_PUBLIC_</code> no cliente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Stripe Connect */}
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect (Para Prestadores)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            O Stripe Connect permite que prestadores recebam pagamentos diretamente nas suas contas Stripe.
          </p>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuração do Connect:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                No Stripe Dashboard, vá para{" "}
                <a
                  href="https://dashboard.stripe.com/connect/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Connect → Overview
                </a>
              </li>
              <li>Configure o tipo de plataforma como "Marketplace"</li>
              <li>Defina as taxas da plataforma (recomendado: 5-10%)</li>
              <li>Configure o processo de onboarding para prestadores</li>
              <li>Teste o fluxo completo no modo de teste</li>
            </ol>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Com o Connect configurado, prestadores podem receber pagamentos diretamente e a plataforma retém
              automaticamente a sua comissão.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Webhooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Webhooks são essenciais para receber notificações sobre eventos de pagamento em tempo real.
          </p>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Eventos Importantes:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <code>payment_intent.succeeded</code> - Pagamento bem-sucedido
              </li>
              <li>
                <code>payment_intent.payment_failed</code> - Pagamento falhado
              </li>
              <li>
                <code>account.updated</code> - Conta Connect atualizada
              </li>
              <li>
                <code>transfer.created</code> - Transferência criada
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <Label className="text-sm font-medium">URL do Webhook:</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input value="https://seu-dominio.com/api/webhooks/stripe" readOnly className="font-mono text-xs" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard("https://seu-dominio.com/api/webhooks/stripe")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cartões de Teste */}
      {testMode && (
        <Card>
          <CardHeader>
            <CardTitle>Cartões de Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Cartões que Funcionam:</h4>
                <div className="space-y-1 text-sm font-mono">
                  <div>4242 4242 4242 4242 (Visa)</div>
                  <div>5555 5555 5555 4444 (Mastercard)</div>
                  <div>3782 822463 10005 (American Express)</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Cartões que Falham:</h4>
                <div className="space-y-1 text-sm font-mono">
                  <div>4000 0000 0000 0002 (Declined)</div>
                  <div>4000 0000 0000 9995 (Insufficient funds)</div>
                  <div>4000 0000 0000 9987 (Lost card)</div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Use qualquer data de expiração futura e qualquer CVC de 3 dígitos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
