"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, ExternalLink, Copy, ImageIcon, TrendingUp, Users, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { siteConfig } from "@/lib/config/site-config"

export function PinterestSetupGuide() {
  const [currentStep, setCurrentStep] = useState(1)
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    })
  }

  const steps = [
    {
      title: "Criar Conta Business",
      description: "Acesse Pinterest Business e crie uma conta",
      action: "https://business.pinterest.com/",
    },
    {
      title: "Acessar Configurações",
      description: "Vá para Settings > Claim no painel",
      action: null,
    },
    {
      title: "Reivindicar Website",
      description: "Clique em 'Claim website' e adicione sua URL",
      action: null,
    },
    {
      title: "Obter Código HTML",
      description: "Escolha método 'Add HTML tag' e copie o código",
      action: null,
    },
    {
      title: "Configurar Variável",
      description: "Adicione o código como variável de ambiente",
      action: null,
    },
  ]

  const benefits = [
    {
      icon: <ImageIcon className="h-5 w-5 text-blue-500" />,
      title: "Rich Pins",
      description: "Suas imagens aparecem com informações extras (preço, disponibilidade, etc.)",
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      title: "Analytics Avançado",
      description: "Veja como suas imagens performam no Pinterest",
    },
    {
      icon: <Users className="h-5 w-5 text-purple-500" />,
      title: "Audiência Qualificada",
      description: "Pinterest tem alta intenção de compra (83% dos usuários fizeram compras)",
    },
    {
      icon: <Eye className="h-5 w-5 text-orange-500" />,
      title: "Visibilidade SEO",
      description: "Imagens do Pinterest aparecem no Google Images",
    },
  ]

  const isConfigured = !!process.env.NEXT_PUBLIC_PINTEREST_VERIFICATION

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span>Pinterest Verification</span>
          </h2>
          <p className="text-muted-foreground">Configure Pinterest para SEO de imagens e tráfego social</p>
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

      <Tabs defaultValue="guide" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="guide">Guia Passo a Passo</TabsTrigger>
          <TabsTrigger value="benefits">Benefícios</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
          <TabsTrigger value="testing">Teste</TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Pinterest é especialmente valioso para negócios visuais como o Biskate. 83%
              dos usuários do Pinterest fizeram compras baseadas em conteúdo que viram na plataforma.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {steps.map((step, index) => (
              <Card key={index} className={currentStep === index + 1 ? "border-blue-500" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          currentStep > index + 1
                            ? "bg-green-500 text-white"
                            : currentStep === index + 1
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {currentStep > index + 1 ? "✓" : index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Passo {index + 1}: {step.title}
                        </CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </div>
                    </div>
                    {step.action && (
                      <Button variant="outline" size="sm" onClick={() => window.open(step.action!, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Abrir
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {currentStep === index + 1 && (
                  <CardContent>
                    {index === 0 && (
                      <div className="space-y-3">
                        <p className="text-sm">
                          1. Acesse{" "}
                          <a
                            href="https://business.pinterest.com/"
                            target="_blank"
                            className="text-blue-600 hover:underline"
                            rel="noreferrer"
                          >
                            Pinterest Business
                          </a>
                        </p>
                        <p className="text-sm">2. Clique em "Create a business account" se não tiver conta</p>
                        <p className="text-sm">3. Preencha as informações do seu negócio</p>
                        <div className="mt-3">
                          <Button
                            onClick={() => {
                              window.open("https://business.pinterest.com/", "_blank")
                              setCurrentStep(2)
                            }}
                          >
                            Criar Conta Business
                          </Button>
                        </div>
                      </div>
                    )}

                    {index === 1 && (
                      <div className="space-y-3">
                        <p className="text-sm">
                          1. No painel do Pinterest Business, clique no seu perfil (canto superior direito)
                        </p>
                        <p className="text-sm">2. Selecione "Settings" ou "Configurações"</p>
                        <p className="text-sm">3. No menu lateral, procure por "Claim" ou "Reivindicar"</p>
                        <div className="mt-3">
                          <Button onClick={() => setCurrentStep(3)} variant="outline">
                            Próximo Passo
                          </Button>
                        </div>
                      </div>
                    )}

                    {index === 2 && (
                      <div className="space-y-3">
                        <p className="text-sm">1. Clique em "Claim website" ou "Reivindicar website"</p>
                        <p className="text-sm">2. Digite sua URL:</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm flex-1">{siteConfig.url}</code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(siteConfig.url)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm">3. Clique em "Continue" ou "Continuar"</p>
                        <div className="mt-3">
                          <Button onClick={() => setCurrentStep(4)} variant="outline">
                            Próximo Passo
                          </Button>
                        </div>
                      </div>
                    )}

                    {index === 3 && (
                      <div className="space-y-3">
                        <p className="text-sm">1. Escolha o método "Add HTML tag"</p>
                        <p className="text-sm">2. Copie APENAS o código de verificação (não a tag inteira)</p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p className="text-gray-600 mb-2">Tag completa (NÃO copie isso):</p>
                          <code className="text-red-600">
                            &lt;meta name="p:domain_verify" content="abc123def456" /&gt;
                          </code>
                          <p className="text-gray-600 mt-2 mb-2">Copie APENAS esta parte:</p>
                          <code className="text-green-600 font-bold">abc123def456</code>
                        </div>
                        <div className="mt-3">
                          <Button onClick={() => setCurrentStep(5)} variant="outline">
                            Próximo Passo
                          </Button>
                        </div>
                      </div>
                    )}

                    {index === 4 && (
                      <div className="space-y-3">
                        <p className="text-sm">1. Adicione o código como variável de ambiente:</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                            NEXT_PUBLIC_PINTEREST_VERIFICATION=seu_codigo_aqui
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard("NEXT_PUBLIC_PINTEREST_VERIFICATION")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm">2. Faça deploy da aplicação</p>
                        <p className="text-sm">3. Volte ao Pinterest e clique em "Verify" ou "Verificar"</p>
                        <Alert className="mt-3">
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            Após a verificação, você poderá usar Pinterest Analytics e Rich Pins!
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="benefits" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {benefit.icon}
                    <span>{benefit.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>📊 Estatísticas do Pinterest</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">83%</div>
                  <div className="text-sm text-muted-foreground">dos usuários fizeram compras</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">450M+</div>
                  <div className="text-sm text-muted-foreground">usuários ativos mensais</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">2x</div>
                  <div className="text-sm text-muted-foreground">mais intenção de compra que outras redes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🎨 Como o Biskate se Beneficia do Pinterest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Para Prestadores de Serviços:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Portfólio visual de trabalhos</li>
                    <li>• Antes/depois de projetos</li>
                    <li>• Inspirações e ideias</li>
                    <li>• Tutoriais e dicas</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Para Clientes:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Descobrir profissionais locais</li>
                    <li>• Ver trabalhos realizados</li>
                    <li>• Salvar ideias para projetos</li>
                    <li>• Comparar estilos e preços</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🏷️ Rich Pins para Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Com Rich Pins, suas imagens de serviços mostrarão automaticamente:
              </p>
              <div className="grid gap-2 md:grid-cols-2 text-sm">
                <div>• Preço do serviço</div>
                <div>• Disponibilidade</div>
                <div>• Localização</div>
                <div>• Avaliações</div>
                <div>• Categoria do serviço</div>
                <div>• Link direto para contratação</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🧪 Testar Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">1. Rich Pins Validator</h4>
                  <p className="text-sm text-muted-foreground mb-2">Teste se seus Rich Pins estão funcionando:</p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://developers.pinterest.com/tools/url-debugger/?link=${encodeURIComponent(siteConfig.url)}`,
                        "_blank",
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Testar Rich Pins
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-2">2. Pinterest Analytics</h4>
                  <p className="text-sm text-muted-foreground mb-2">Veja como suas imagens performam:</p>
                  <Button variant="outline" onClick={() => window.open("https://analytics.pinterest.com/", "_blank")}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver Analytics
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-2">3. Status da Verificação</h4>
                  <div className="flex items-center space-x-2">
                    {isConfigured ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-green-600">Pinterest verificado com sucesso!</span>
                      </>
                    ) : (
                      <>
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                        <span className="text-sm text-gray-600">Aguardando configuração...</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
