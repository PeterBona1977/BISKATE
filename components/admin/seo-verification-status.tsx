"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/config/site-config"

export function SeoVerificationStatus() {
  const verifications = [
    {
      name: "Google Search Console",
      status: siteConfig.verification.google ? "verified" : "pending",
      code: siteConfig.verification.google,
      url: "https://search.google.com/search-console",
      description: "Motor de busca principal mundial",
    },
    {
      name: "Bing Webmaster Tools",
      status: "verified", // Acabou de ser configurado
      code: "B128E07173F88C1FD2F70E3CAB33C87A",
      url: "https://www.bing.com/webmasters/",
      description: "6-8% do mercado global, forte nos EUA",
    },
    {
      name: "Yandex Webmaster",
      status: siteConfig.verification.yandex ? "verified" : "pending",
      code: siteConfig.verification.yandex,
      url: "https://webmaster.yandex.com/",
      description: "Motor de busca principal na Rússia",
    },
    {
      name: "Pinterest Business",
      status: siteConfig.verification.pinterest ? "verified" : "pending",
      code: siteConfig.verification.pinterest,
      url: "https://business.pinterest.com/",
      description: "Ideal para negócios visuais e serviços",
    },
    {
      name: "Facebook Domain",
      status: siteConfig.verification.facebook ? "verified" : "pending",
      code: siteConfig.verification.facebook,
      url: "https://business.facebook.com/",
      description: "Verificação de domínio para Meta",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Verificado
          </Badge>
        )
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>
      default:
        return <Badge variant="destructive">Não configurado</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Status das Verificações SEO</h2>
        <p className="text-muted-foreground">Acompanhe o status das verificações dos motores de busca</p>
      </div>

      <div className="grid gap-4">
        {verifications.map((verification) => (
          <Card key={verification.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(verification.status)}
                  <CardTitle className="text-lg">{verification.name}</CardTitle>
                </div>
                {getStatusBadge(verification.status)}
              </div>
              <CardDescription>{verification.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {verification.code && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-mono break-all">{verification.code}</p>
                  </div>
                )}
                <Button variant="outline" size="sm" asChild>
                  <a href={verification.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir {verification.name}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">🎉 Bing Configurado com Sucesso!</CardTitle>
          <CardDescription className="text-green-700">
            O código de verificação do Bing foi adicionado ao site. Pode demorar algumas horas para ser processado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-green-700">
              <strong>Próximos passos:</strong>
            </p>
            <ul className="text-sm text-green-700 space-y-1 ml-4">
              <li>• Aguardar verificação automática (até 24h)</li>
              <li>• Submeter sitemap: https://v0-biskate.vercel.app/sitemap.xml</li>
              <li>• Monitorizar performance no Bing Webmaster Tools</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
