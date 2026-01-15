"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  CreditCard,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ContactViewService } from "@/lib/monetization/contact-view-service"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ContactViewButtonProps {
  gigId: string
  gigTitle: string
  authorName?: string
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
}

export function ContactViewButton({
  gigId,
  gigTitle,
  authorName = "Cliente",
  className,
  variant = "default",
  size = "default",
}: ContactViewButtonProps) {
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasViewed, setHasViewed] = useState(false)
  const [contactInfo, setContactInfo] = useState<any>(null)
  const [canView, setCanView] = useState<any>(null)

  // Verificar se pode visualizar quando o componente carrega
  React.useEffect(() => {
    if (user && gigId) {
      checkViewPermission()
      checkIfAlreadyViewed()
    }
  }, [user, gigId])

  const checkViewPermission = async () => {
    if (!user) return

    const permission = await ContactViewService.canViewContact(user.id, gigId)
    setCanView(permission)
  }

  const checkIfAlreadyViewed = async () => {
    if (!user) return

    const viewed = await ContactViewService.hasViewedContact(user.id, gigId)
    setHasViewed(viewed)

    // Se já visualizou, buscar as informações
    if (viewed) {
      const result = await ContactViewService.viewContact(user.id, gigId)
      if (result.success) {
        setContactInfo(result.contactInfo)
      }
    }
  }

  const handleViewContact = async () => {
    if (!user || !profile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para visualizar contactos",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const result = await ContactViewService.viewContact(user.id, gigId)

      if (result.success) {
        setContactInfo(result.contactInfo)
        setHasViewed(true)

        toast({
          title: "Contacto Revelado! 🎉",
          description: `Você agora pode contactar ${authorName}. Créditos restantes: ${result.creditsRemaining}`,
        })

        // Atualizar permissões
        await checkViewPermission()
      } else {
        toast({
          title: "Não foi possível revelar contacto",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro interno do sistema",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getMaxResponses = (plan: string) => {
    switch (plan) {
      case "free":
        return 1
      case "essential":
        return 50
      case "pro":
        return 150
      case "unlimited":
        return "∞"
      default:
        return 0
    }
  }

  if (!user || !profile) {
    return (
      <Button variant="outline" disabled className={className}>
        <Lock className="h-4 w-4 mr-2" />
        Login Necessário
      </Button>
    )
  }

  // Se já visualizou, mostrar informações
  if (hasViewed && contactInfo) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className={className} size={size}>
            <Unlock className="h-4 w-4 mr-2" />
            Ver Contacto
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Informações de Contacto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>✅ Você já tem acesso a estas informações de contacto.</AlertDescription>
            </Alert>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Nome Completo</p>
                    <p className="font-medium">{contactInfo.fullName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{contactInfo.email}</p>
                  </div>
                </div>

                {contactInfo.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Telefone</p>
                      <p className="font-medium">{contactInfo.phone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                💡 <strong>Dica:</strong> Entre em contacto de forma profissional e mencione o gig "{gigTitle}".
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Se não pode visualizar, mostrar razão
  if (canView && !canView.canView) {
    const getErrorMessage = (reason: string) => {
      switch (reason) {
        case "own_gig":
          return "Este é o seu próprio gig"
        case "insufficient_credits":
          return "Créditos insuficientes"
        default:
          return "Não disponível"
      }
    }

    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled className={className} size={size}>
            <Lock className="h-4 w-4 mr-2" />
            {canView.reason === "insufficient_credits" ? "Sem Créditos" : "Bloqueado"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              Contacto Não Disponível
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{getErrorMessage(canView.reason)}</AlertDescription>
            </Alert>

            {canView.reason === "insufficient_credits" && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <CreditCard className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="font-medium">Upgrade Necessário</p>
                      <p className="text-sm text-gray-600">
                        Plano atual: <Badge>{profile.plan.toUpperCase()}</Badge>
                      </p>
                      <p className="text-sm text-gray-600">
                        Créditos: {profile.responses_used} / {getMaxResponses(profile.plan)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center">
                  <Link href="/dashboard/plans">
                    <Button className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Fazer Upgrade
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Botão principal para visualizar contacto
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className} size={size}>
          <Eye className="h-4 w-4 mr-2" />
          Revelar Contacto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2 text-blue-600" />
            Revelar Informações de Contacto
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta ação irá consumir {canView?.creditsNeeded || 1} crédito do seu plano.
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="text-center">
                <EyeOff className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="font-medium text-lg">Contacto de {authorName}</h3>
                <p className="text-sm text-gray-600">Gig: "{gigTitle}"</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  <strong>Plano:</strong> {profile.plan.toUpperCase()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Créditos:</strong> {profile.responses_used} / {getMaxResponses(profile.plan)} utilizados
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Custo:</strong> {canView?.creditsNeeded || 1} crédito
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button onClick={handleViewContact} disabled={isProcessing} className="w-full" size="lg">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Confirmar e Revelar Contacto
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-gray-500">💡 Após revelar, você terá acesso permanente a este contacto</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
