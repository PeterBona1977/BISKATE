"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Edit, Eye, MapPin, Clock, Euro, Tag, FileText, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@/hooks/use-user"
import { gigsService } from "@/lib/gigs"

interface GigData {
  title: string
  description: string
  category: string
  price: number
  location: string
  estimatedTime: string
}

interface GigReviewModalProps {
  isOpen: boolean
  onClose: () => void
  gigData: GigData
  onEdit: (data: GigData) => void
  onSuccess: () => void
}

export function GigReviewModal({ isOpen, onClose, gigData, onEdit, onSuccess }: GigReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useUser()
  const router = useRouter()

  const handleApproveAndSubmit = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para criar um gig.")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("🚀 Criando gig com dados da IA:", gigData)

      // Criar o gig usando o serviço local
      const newGig = gigsService.createGig({
        title: gigData.title,
        description: gigData.description,
        category: gigData.category,
        price: gigData.price,
        location: gigData.location,
        estimated_time: gigData.estimatedTime,
        is_premium: false,
        status: "pending", // Sempre pendente para moderação quando criado por IA
        author_id: user.id,
        author_name: user.user_metadata?.full_name || user.email || "Utilizador",
        author_email: user.email || "",
        author_phone: user.user_metadata?.phone || undefined,
      })

      console.log("✅ Gig criado com sucesso:", newGig)

      toast.success("Gig created successfully! It will be reviewed by our team before being published.", {
        duration: 5000,
      })

      // Fechar modal
      onClose()

      // Chamar callback de sucesso
      onSuccess()

      // Redirecionar para os meus gigs para ver o gig criado
      setTimeout(() => {
        router.push("/dashboard/my-gigs")
      }, 1000)
    } catch (error: any) {
      console.error("❌ Erro ao criar gig:", error)
      toast.error(error?.message || "Erro ao criar o biskate. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = () => {
    onEdit(gigData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Review AI-Generated Gig
            <Badge variant="outline" className="ml-2">
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Review your gig details before submitting. You can edit any information if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Título */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4 text-indigo-600" />
                Título
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 font-medium">{gigData.title}</p>
            </CardContent>
          </Card>

          {/* Descrição */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4 text-indigo-600" />
                Descrição
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{gigData.description}</p>
            </CardContent>
          </Card>

          {/* Detalhes em Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoria */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-green-600" />
                  Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {gigData.category}
                </Badge>
              </CardContent>
            </Card>

            {/* Preço */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Euro className="h-4 w-4 text-blue-600" />
                  Preço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{gigData.price}€</p>
              </CardContent>
            </Card>

            {/* Localização */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-red-600" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{gigData.location}</p>
              </CardContent>
            </Card>

            {/* Tempo Estimado */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-purple-600" />
                  Tempo Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{gigData.estimatedTime}</p>
              </CardContent>
            </Card>
          </div>

          {/* Aviso sobre moderação */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Revisão Automática</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Biskates criados pela IA são automaticamente enviados para revisão da nossa equipa antes de serem
                    publicados. Receberá uma notificação quando for aprovado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button variant="outline" onClick={handleEdit} className="flex-1">
            <Edit className="h-4 w-4 mr-2" />
            Editar Detalhes
          </Button>
          <Button onClick={handleApproveAndSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve and Submit
              </>
            )}
          </Button>
        </div>

        {/* Informação adicional */}
        <div className="text-xs text-center text-gray-500 pt-2 border-t">
          💡 Após submeter, pode acompanhar o estado do seu biskate em "Os Meus Gigs"
        </div>
      </DialogContent>
    </Dialog>
  )
}
