"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReviewService, type CreateReviewData } from "@/lib/reviews/review-service"
import { useAuth } from "@/contexts/auth-context"

interface CreateReviewModalProps {
  gig: {
    id: string
    title: string
    author_id: string
  }
  revieweeId: string
  revieweeName: string
  reviewType: "client_to_provider" | "provider_to_client"
  paymentId?: string
  onReviewCreated?: () => void
}

export function CreateReviewModal({
  gig,
  revieweeId,
  revieweeName,
  reviewType,
  paymentId,
  onReviewCreated,
}: CreateReviewModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    rating: 0,
    title: "",
    comment: "",
    communication_rating: 0,
    quality_rating: 0,
    timeliness_rating: 0,
    professionalism_rating: 0,
    is_anonymous: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (formData.rating === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma avaliação geral",
        variant: "destructive",
      })
      return
    }

    if (!formData.title.trim() || !formData.comment.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o título e comentário",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Verificar se pode avaliar
      const { canReview, reason } = await ReviewService.canUserReview(gig.id, user.id, revieweeId, reviewType)

      if (!canReview) {
        toast({
          title: "Não é possível avaliar",
          description: reason,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const reviewData: CreateReviewData = {
        gig_id: gig.id,
        payment_id: paymentId,
        reviewee_id: revieweeId,
        review_type: reviewType,
        ...formData,
      }

      const { data, error } = await ReviewService.createReview(reviewData, user.id)

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao criar avaliação",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Avaliação enviada!",
        description: "Sua avaliação foi enviada com sucesso",
      })

      // Verificar novos badges
      await ReviewService.checkAndAwardBadges(revieweeId)

      setOpen(false)
      onReviewCreated?.()

      // Reset form
      setFormData({
        rating: 0,
        title: "",
        comment: "",
        communication_rating: 0,
        quality_rating: 0,
        timeliness_rating: 0,
        professionalism_rating: 0,
        is_anonymous: false,
      })
    } catch (err) {
      console.error("Error creating review:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar avaliação",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const StarRating = ({
    value,
    onChange,
    label,
  }: { value: number; onChange: (rating: number) => void; label: string }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => onChange(star)} className="focus:outline-none">
            <Star
              className={`h-6 w-6 ${
                star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              } hover:text-yellow-400 transition-colors`}
            />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Star className="h-4 w-4 mr-2" />
          Avaliar {reviewType === "client_to_provider" ? "Prestador" : "Cliente"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliar {revieweeName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avaliação Geral */}
          <StarRating
            value={formData.rating}
            onChange={(rating) => setFormData({ ...formData, rating })}
            label="Avaliação Geral *"
          />

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título da Avaliação *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Excelente trabalho, muito profissional"
              required
            />
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentário *</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Descreva sua experiência com este usuário..."
              rows={4}
              required
            />
          </div>

          {/* Critérios Específicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StarRating
              value={formData.communication_rating}
              onChange={(rating) => setFormData({ ...formData, communication_rating: rating })}
              label="Comunicação"
            />
            <StarRating
              value={formData.quality_rating}
              onChange={(rating) => setFormData({ ...formData, quality_rating: rating })}
              label="Qualidade"
            />
            <StarRating
              value={formData.timeliness_rating}
              onChange={(rating) => setFormData({ ...formData, timeliness_rating: rating })}
              label="Pontualidade"
            />
            <StarRating
              value={formData.professionalism_rating}
              onChange={(rating) => setFormData({ ...formData, professionalism_rating: rating })}
              label="Profissionalismo"
            />
          </div>

          {/* Opções */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.is_anonymous}
              onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="anonymous" className="text-sm">
              Avaliar anonimamente
            </Label>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Avaliação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
