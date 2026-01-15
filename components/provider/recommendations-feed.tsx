"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TrendingUp,
  MapPin,
  Calendar,
  Star,
  Eye,
  Filter,
  RefreshCw,
  AlertCircle,
  Target,
  BarChart3,
  Clock,
} from "lucide-react"
import {
  RecommendationService,
  type Recommendation,
  type RecommendationStats,
} from "@/lib/recommendations/recommendation-service"
import { useAuth } from "@/contexts/auth-context"

export function RecommendationsFeed() {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [stats, setStats] = useState<RecommendationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadRecommendations = async () => {
    if (!user?.id) return

    try {
      setError(null)
      const result = await RecommendationService.getRecommendationsForProvider(user.id)
      setRecommendations(result.recommendations)
      setStats(result.stats)
    } catch (err) {
      console.error("Erro ao carregar recomendações:", err)
      setError("Não foi possível carregar as recomendações. Tente novamente.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRecommendations()
  }

  useEffect(() => {
    loadRecommendations()
  }, [user?.id])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "Expirado"
    if (diffDays === 0) return "Hoje"
    if (diffDays === 1) return "Amanhã"
    return `${diffDays} dias`
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800"
    if (score >= 60) return "bg-blue-100 text-blue-800"
    if (score >= 40) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommendations Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recomendações para Si</h2>
          <p className="text-gray-600">Trabalhos que correspondem ao seu perfil</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRecommendations}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Match Médio</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(stats.averageMatchScore)}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Novos Esta Semana</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.newThisWeek}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Categoria</p>
                  <p className="text-lg font-bold text-gray-900">{stats.topCategories[0] || "N/A"}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations Grid */}
      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma recomendação encontrada</h3>
            <p className="text-gray-600 mb-4">
              Configure suas categorias de interesse para receber recomendações personalizadas.
            </p>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Configurar Preferências
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((recommendation) => (
            <Card key={recommendation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2 mb-2">{recommendation.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{recommendation.category}</Badge>
                      <Badge className={getMatchScoreColor(recommendation.matchScore)}>
                        {recommendation.matchScore}% match
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{recommendation.description}</p>

                {/* Tags */}
                {recommendation.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {recommendation.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Orçamento:</span>
                    <span className="font-semibold text-green-600">{formatPrice(recommendation.price)}</span>
                  </div>

                  {recommendation.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {recommendation.location}
                    </div>
                  )}

                  {recommendation.deadline && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      Prazo: {formatDeadline(recommendation.deadline)}
                    </div>
                  )}
                </div>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {recommendation.author.avatar ? (
                        <img
                          src={recommendation.author.avatar || "/placeholder.svg"}
                          alt={recommendation.author.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium">
                          {recommendation.author.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{recommendation.author.name}</p>
                      {recommendation.author.rating > 0 && (
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600 ml-1">{recommendation.author.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
