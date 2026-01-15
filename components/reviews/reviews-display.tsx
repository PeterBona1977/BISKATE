"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Flag, ThumbsUp, Loader2 } from "lucide-react"
import { ReviewService } from "@/lib/reviews/review-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase/database.types"

type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  reviewer: {
    full_name: string
    avatar_url?: string
  }
  gig: {
    title: string
    category: string
  }
}

interface ReviewsDisplayProps {
  userId: string
  showTitle?: boolean
  maxReviews?: number
}

export function ReviewsDisplay({ userId, showTitle = true, maxReviews }: ReviewsDisplayProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [reportingId, setReportingId] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [userId])

  const fetchReviews = async () => {
    try {
      const { data, error } = await ReviewService.getUserReviews(userId)
      if (error) {
        console.error("Error fetching reviews:", error)
        return
      }

      let reviewsToShow = data as Review[]
      if (maxReviews) {
        reviewsToShow = reviewsToShow.slice(0, maxReviews)
      }

      setReviews(reviewsToShow)
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleReport = async (reviewId: string) => {
    if (!user) return

    setReportingId(reviewId)

    try {
      const { error } = await ReviewService.reportReview(
        reviewId,
        user.id,
        "inappropriate",
        "Conteúdo inapropriado reportado pelo usuário",
      )

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao reportar avaliação",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Reportado",
        description: "Avaliação reportada para moderação",
      })
    } catch (err) {
      console.error("Error reporting review:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado",
        variant: "destructive",
      })
    } finally {
      setReportingId(null)
    }
  }

  const renderStars = (rating: number, size = "h-4 w-4") => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-PT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Ainda não há avaliações</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Avaliações ({reviews.length})</h3>
          <div className="flex items-center space-x-2">
            {renderStars(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length)}
            <span className="text-sm text-gray-600">
              {(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.reviewer.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{review.is_anonymous ? "?" : review.reviewer.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {review.is_anonymous ? "Usuário Anônimo" : review.reviewer.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(review.created_at)} • {review.gig.title}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {renderStars(review.rating)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReport(review.id)}
                    disabled={reportingId === review.id}
                  >
                    {reportingId === review.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Flag className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">{review.title}</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                </div>

                {/* Critérios específicos */}
                {(review.communication_rating ||
                  review.quality_rating ||
                  review.timeliness_rating ||
                  review.professionalism_rating) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
                    {review.communication_rating && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Comunicação</div>
                        {renderStars(review.communication_rating, "h-3 w-3")}
                      </div>
                    )}
                    {review.quality_rating && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Qualidade</div>
                        {renderStars(review.quality_rating, "h-3 w-3")}
                      </div>
                    )}
                    {review.timeliness_rating && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Pontualidade</div>
                        {renderStars(review.timeliness_rating, "h-3 w-3")}
                      </div>
                    )}
                    {review.professionalism_rating && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Profissionalismo</div>
                        {renderStars(review.professionalism_rating, "h-3 w-3")}
                      </div>
                    )}
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {review.helpful_votes || 0}
                    </Button>
                    <Badge variant="outline" className="text-xs">
                      {review.gig.category}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    {review.review_type === "client_to_provider" ? "Cliente → Prestador" : "Prestador → Cliente"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
