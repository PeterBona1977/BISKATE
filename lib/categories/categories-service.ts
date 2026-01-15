import { supabase } from "@/lib/supabase/client"

export interface Category {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  margin_percentage: number
  effective_margin: number
  is_active: boolean
  slug: string
  icon: string | null
  display_order: number
  color_hex: string
  commission_type: "percentage" | "fixed"
  min_price: number
  max_price: number | null
  requires_verification: boolean
  featured: boolean
  subcategory_count: number
  gig_count: number
  category_level: number
  created_at: string
  subcategories?: Category[]
}

export class CategoriesService {
  /**
   * Buscar todas as categorias com estatísticas
   */
  static async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories_with_stats")
      .select("*")
      .order("display_order")
      .order("name")

    if (error) throw error
    return data || []
  }

  /**
   * Buscar categorias principais (sem pai)
   */
  static async getMainCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories_with_stats")
      .select("*")
      .is("parent_id", null)
      .eq("is_active", true)
      .order("display_order")

    if (error) throw error
    return data || []
  }

  /**
   * Buscar subcategorias de uma categoria
   */
  static async getSubcategories(parentId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories_with_stats")
      .select("*")
      .eq("parent_id", parentId)
      .eq("is_active", true)
      .order("display_order")

    if (error) throw error
    return data || []
  }

  /**
   * Buscar categoria por slug
   */
  static async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase.from("categories_with_stats").select("*").eq("slug", slug).single()

    if (error) return null
    return data
  }

  /**
   * Calcular margem efetiva de uma categoria
   */
  static async getEffectiveMargin(categoryId: string): Promise<number> {
    const { data, error } = await supabase.rpc("get_effective_margin", { category_id: categoryId })

    if (error) throw error
    return data || 10.0
  }

  /**
   * Buscar hierarquia completa de uma categoria
   */
  static async getCategoryHierarchy(categoryId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc("get_category_hierarchy", { category_id: categoryId })

    if (error) throw error
    return data || []
  }

  /**
   * Organizar categorias em estrutura hierárquica
   */
  static organizeHierarchy(categories: Category[]): Category[] {
    const categoriesMap = new Map()
    const rootCategories: Category[] = []

    // Criar mapa de categorias
    categories.forEach((category) => {
      categoriesMap.set(category.id, { ...category, subcategories: [] })
    })

    // Organizar hierarquia
    categories.forEach((category) => {
      if (category.parent_id) {
        const parent = categoriesMap.get(category.parent_id)
        if (parent) {
          parent.subcategories.push(categoriesMap.get(category.id))
        }
      } else {
        rootCategories.push(categoriesMap.get(category.id))
      }
    })

    return rootCategories
  }

  /**
   * Buscar categorias em destaque
   */
  static async getFeaturedCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories_with_stats")
      .select("*")
      .eq("featured", true)
      .eq("is_active", true)
      .order("display_order")

    if (error) throw error
    return data || []
  }

  /**
   * Buscar categorias com mais gigs
   */
  static async getPopularCategories(limit = 10): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories_with_stats")
      .select("*")
      .eq("is_active", true)
      .order("gig_count", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  /**
   * Validar se categoria requer verificação
   */
  static async requiresVerification(categoryId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("categories")
      .select("requires_verification")
      .eq("id", categoryId)
      .single()

    if (error) return false
    return data?.requires_verification || false
  }

  /**
   * Validar preço dentro dos limites da categoria
   */
  static async validatePrice(categoryId: string, price: number): Promise<{ valid: boolean; message?: string }> {
    const { data, error } = await supabase
      .from("categories")
      .select("min_price, max_price, name")
      .eq("id", categoryId)
      .single()

    if (error) return { valid: false, message: "Categoria não encontrada" }

    if (price < data.min_price) {
      return {
        valid: false,
        message: `Preço mínimo para ${data.name} é €${data.min_price}`,
      }
    }

    if (data.max_price && price > data.max_price) {
      return {
        valid: false,
        message: `Preço máximo para ${data.name} é €${data.max_price}`,
      }
    }

    return { valid: true }
  }
}
