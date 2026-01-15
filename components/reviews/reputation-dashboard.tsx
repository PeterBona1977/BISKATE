"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp, Award, Users, Loader2 } from "lucide-react"
import { ReviewService } from "@/lib/reviews/review-service"
import { UserBadges } from "./user-badges"
import { ReviewsDisplay } from "./reviews-display"
import type { Database } from "@/lib/supabase/database.types"

type ReputationStats = Database["public"]["Tables"]["reputation_stats"]["Row"]

interface ReputationDashboardProps {
  userId: string
  isOwnProfile?: boolean
}

export function ReputationDashboard({ userId, isOwnProfile = false }: ReputationDashboardProps) {
  const [stats, setStats] = useState<ReputationStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [userId])

  const fetchStats = async () => {
    try {
      const { data, error } = await ReviewService.getReputationStats(userId)
      if (error) {
        console.error("Error fetching stats:", error)
        return
      }

      setStats(data)
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, size = "h-5 w-5") => {
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

  const getReputationInfo = (level: string) => {
    return ReviewService.getReputationLevelInfo(level)
  }

  const calculateTrustScore = () => {
    if (!stats) return 0
    return ReviewService.calculateTrustScore(stats)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sem dados de reputação</h3>
          <p className="text-gray-500">
            {isOwnProfile
              ? "Complete alguns projetos para começar a construir sua reputação"
              : "Este usuário ainda não possui avaliações"}
          </p>
        </CardContent>
      </Card>
    )
  }

  const reputationInfo = getReputationInfo(stats.reputation_level)
  const trustScore = calculateTrustScore()

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.rating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avaliação Média</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.total_reviews_received}</p>
                <p className="text-xs text-muted-foreground">Total de Avaliações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.total_badges}</p>
                <p className="text-xs text-muted-foreground">Badges Conquistados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{trustScore}%</p>
                <p className="text-xs text-muted-foreground">Score de Confiança</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nível de Reputação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="mr-2">{reputationInfo.icon}</span>
            Nível de Reputação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="text-lg px-4 py-2" style={{ backgroundColor: reputationInfo.color, color: "white" }}>
                {reputationInfo.label}
              </Badge>
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.reputation_score}</div>
                <div className="text-sm text-gray-500">pontos</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso para o próximo nível</span>
                <span>{Math.min(100, (stats.reputation_score % 1000) / 10)}%</span>
              </div>
              <Progress value={Math.min(100, (stats.reputation_score % 1000) / 10)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critérios Detalhados */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações por Critério</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Comunicação</span>
                <span className="text-sm">{stats.avg_communication.toFixed(1)}/5</span>
              </div>
              <div className="flex items-center space-x-2">
                {renderStars(Math.round(stats.avg_communication), "h-4 w-4")}
                <Progress value={(stats.avg_communication / 5) * 100} className="flex-1" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Qualidade</span>
                <span className="text-sm">{stats.avg_quality.toFixed(1)}/5</span>
              </div>
              <div className="flex items-center space-x-2">
                {renderStars(Math.round(stats.avg_quality), "h-4 w-4")}
                <Progress value={(stats.avg_quality / 5) * 100} className="flex-1" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pontualidade</span>
                <span className="text-sm">{stats.avg_timeliness.toFixed(1)}/5</span>
              </div>
              <div className="flex items-center space-x-2">
                {renderStars(Math.round(stats.avg_timeliness), "h-4 w-4")}
                <Progress value={(stats.avg_timeliness / 5) * 100} className="flex-1" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Profissionalismo</span>
                <span className="text-sm">{stats.avg_professionalism.toFixed(1)}/5</span>
              </div>
              <div className="flex items-center space-x-2">
                {renderStars(Math.round(stats.avg_professionalism), "h-4 w-4")}
                <Progress value={(stats.avg_professionalism / 5) * 100} className="flex-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.reviews_last_30_days}</div>
              <div className="text-sm text-gray-500">Últimos 30 dias</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.reviews_last_90_days}</div>
              <div className="text-sm text-gray-500">Últimos 90 dias</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.reviews_last_year}</div>
              <div className="text-sm text-gray-500">Último ano</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <UserBadges userId={userId} />

      {/* Avaliações Recentes */}
      <ReviewsDisplay userId={userId} maxReviews={5} />
    </div>
  )
}
