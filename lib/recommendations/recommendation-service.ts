import { supabase } from "@/lib/supabase/client"

export interface Recommendation {
  id: string
  title: string
  description: string
  category: string
  price: number
  location?: string
  deadline?: string
  author: {
    id: string
    name: string
    avatar?: string
    rating: number
  }
  matchScore: number
  tags: string[]
}

export interface RecommendationStats {
  totalRecommendations: number
  averageMatchScore: number
  topCategories: string[]
  newThisWeek: number
}

export class RecommendationService {
  static async getRecommendationsForProvider(providerId: string): Promise<{
    recommendations: Recommendation[]
    stats: RecommendationStats
  }> {
    try {
      console.log("🔍 Buscando recomendações para provider:", providerId)

      // 1. Buscar categorias do prestador
      const { data: providerCategories, error: categoriesError } = await supabase
        .from("provider_categories")
        .select(`
          category_id,
          categories (
            id,
            name,
            slug
          )
        `)
        .eq("provider_id", providerId)

      if (categoriesError) {
        console.warn("⚠️ Erro ao buscar categorias do prestador:", categoriesError)
      }

      // 2. Buscar todas as categorias como fallback
      const { data: allCategories, error: allCategoriesError } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order")

      if (allCategoriesError) {
        console.error("❌ Erro ao buscar categorias:", allCategoriesError)
        throw new Error("Não foi possível carregar as categorias")
      }

      const categories = allCategories || []
      console.log("📂 Categorias encontradas:", categories.length)

      // 3. Determinar categorias relevantes
      const relevantCategoryIds =
        providerCategories && providerCategories.length > 0
          ? providerCategories.map((pc) => pc.category_id)
          : categories.slice(0, 3).map((c) => c.id) // Fallback para primeiras 3 categorias

      console.log("🎯 Categorias relevantes:", relevantCategoryIds)

      // 4. Buscar gigs recomendados
      let gigsQuery = supabase
        .from("gigs")
        .select(`
          id,
          title,
          description,
          price,
          location,
          deadline,
          category,
          author_id,
          created_at,
          profiles!gigs_author_id_fkey (
            id,
            full_name,
            avatar_url,
            rating
          ),
          categories (
            name,
            slug
          )
        `)
        .eq("status", "published")
        .neq("author_id", providerId)
        .order("created_at", { ascending: false })
        .limit(20)

      // Filtrar por categorias se disponível
      if (relevantCategoryIds.length > 0) {
        gigsQuery = gigsQuery.in("category", relevantCategoryIds)
      }

      const { data: gigs, error: gigsError } = await gigsQuery

      if (gigsError) {
        console.error("❌ Erro ao buscar gigs:", gigsError)
        // Retornar dados vazios em caso de erro
        return {
          recommendations: [],
          stats: {
            totalRecommendations: 0,
            averageMatchScore: 0,
            topCategories: categories.slice(0, 3).map((c) => c.name),
            newThisWeek: 0,
          },
        }
      }

      console.log("📋 Gigs encontrados:", gigs?.length || 0)

      // 5. Processar recomendações
      const recommendations: Recommendation[] = (gigs || [])
        .map((gig) => {
          const matchScore = this.calculateMatchScore(gig, providerCategories)

          return {
            id: gig.id,
            title: gig.title,
            description: gig.description,
            category: gig.categories?.name || "Geral",
            price: gig.price || 0,
            location: gig.location,
            deadline: gig.deadline,
            author: {
              id: gig.author_id,
              name: gig.profiles?.full_name || "Utilizador",
              avatar: gig.profiles?.avatar_url,
              rating: gig.profiles?.rating || 0,
            },
            matchScore,
            tags: this.extractTags(gig.description),
          }
        })
        .sort((a, b) => b.matchScore - a.matchScore)

      // 6. Calcular estatísticas
      const stats: RecommendationStats = {
        totalRecommendations: recommendations.length,
        averageMatchScore:
          recommendations.length > 0
            ? recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length
            : 0,
        topCategories: this.getTopCategories(recommendations),
        newThisWeek: this.countNewThisWeek(gigs || []),
      }

      console.log("📊 Estatísticas:", stats)

      return {
        recommendations: recommendations.slice(0, 12), // Limitar a 12 recomendações
        stats,
      }
    } catch (error) {
      console.error("❌ Erro no serviço de recomendações:", error)

      // Retornar dados de fallback em caso de erro
      return {
        recommendations: [],
        stats: {
          totalRecommendations: 0,
          averageMatchScore: 0,
          topCategories: ["Tecnologia", "Design", "Marketing"],
          newThisWeek: 0,
        },
      }
    }
  }

  private static calculateMatchScore(gig: any, providerCategories: any[]): number {
    let score = 50 // Score base

    // Bonus por categoria matching
    if (providerCategories && providerCategories.length > 0) {
      const hasMatchingCategory = providerCategories.some((pc) => pc.category_id === gig.category)
      if (hasMatchingCategory) {
        score += 30
      }
    }

    // Bonus por gig recente
    const gigDate = new Date(gig.created_at)
    const daysSinceCreated = (Date.now() - gigDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreated <= 7) {
      score += 15
    } else if (daysSinceCreated <= 30) {
      score += 5
    }

    // Bonus por preço atrativo
    if (gig.price && gig.price >= 100) {
      score += 10
    }

    // Bonus por localização (se especificada)
    if (gig.location) {
      score += 5
    }

    return Math.min(score, 100) // Máximo de 100
  }

  private static extractTags(description: string): string[] {
    if (!description) return []

    const commonTags = [
      "urgente",
      "remoto",
      "presencial",
      "experiência",
      "profissional",
      "criativo",
      "inovador",
      "qualidade",
      "rápido",
      "detalhado",
    ]

    const foundTags = commonTags.filter((tag) => description.toLowerCase().includes(tag))

    return foundTags.slice(0, 3) // Máximo 3 tags
  }

  private static getTopCategories(recommendations: Recommendation[]): string[] {
    const categoryCount = recommendations.reduce(
      (acc, rec) => {
        acc[rec.category] = (acc[rec.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)
  }

  private static countNewThisWeek(gigs: any[]): number {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    return gigs.filter((gig) => new Date(gig.created_at) >= oneWeekAgo).length
  }

  // Método para buscar recomendações genéricas quando não há dados específicos
  static async getGenericRecommendations(): Promise<Recommendation[]> {
    try {
      const { data: gigs, error } = await supabase
        .from("gigs")
        .select(`
          id,
          title,
          description,
          price,
          location,
          deadline,
          profiles!gigs_author_id_fkey (
            id,
            full_name,
            avatar_url,
            rating
          ),
          categories (
            name
          )
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(6)

      if (error) throw error

      return (gigs || []).map((gig) => ({
        id: gig.id,
        title: gig.title,
        description: gig.description,
        category: gig.categories?.name || "Geral",
        price: gig.price || 0,
        location: gig.location,
        deadline: gig.deadline,
        author: {
          id: gig.profiles?.id || "",
          name: gig.profiles?.full_name || "Utilizador",
          avatar: gig.profiles?.avatar_url,
          rating: gig.profiles?.rating || 0,
        },
        matchScore: 50,
        tags: [],
      }))
    } catch (error) {
      console.error("Erro ao buscar recomendações genéricas:", error)
      return []
    }
  }
}
