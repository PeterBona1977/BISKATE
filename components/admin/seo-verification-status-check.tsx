"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { siteConfig } from "@/lib/config/site-config"

export function SEOVerificationStatusCheck() {
  const verifications = [
    {
      name: "Google Search Console",
      status: siteConfig.verification.google ? "configured" : "pending",
      code: siteConfig.verification.google || "Não configurado",
      importance: "Alta",
    },
    {
      name: "Bing Webmaster Tools",
      status: siteConfig.verification.bing ? "verified" : "pending",
      code: siteConfig.verification.bing || "Não configurado",
      importance: "Alta",
    },
    {
      name: "Pinterest Business",
      status: siteConfig.verification.pinterest ? "verified" : "pending",
      code: siteConfig.verification.pinterest || "Não configurado",
      importance: "Média",
    },
    {
      name: "Yandex Webmaster",
      status: siteConfig.verification.yandex ? "configured" : "pending",
      code: siteConfig.verification.yandex || "Não configurado",
      importance: "Média",
    },
    {
      name: "Facebook Domain Verification",
      status: siteConfig.verification.facebook ? "configured" : "pending",
      code: siteConfig.verification.facebook || "Não configurado",
      importance: "Baixa",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "configured":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="default" className="bg-green-500">
            Verificado ✅
          </Badge>
        )
      case "configured":
        return <Badge variant="secondary">Configurado ⏳</Badge>
      default:
        return <Badge variant="destructive">Pendente ❌</Badge>
    }
  }

  return (
    <div className="space-y-4">
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
              <CardDescription>Importância: {verification.importance}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Código:</strong>{" "}
                  <code className="bg-muted px-2 py-1 rounded text-xs">{verification.code}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Progresso SEO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Verificados:</span>
              <span className="font-bold text-green-600">
                {verifications.filter((v) => v.status === "verified").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Configurados:</span>
              <span className="font-bold text-yellow-600">
                {verifications.filter((v) => v.status === "configured").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pendentes:</span>
              <span className="font-bold text-red-600">
                {verifications.filter((v) => v.status === "pending").length}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Total:</span>
              <span className="font-bold">{verifications.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
