import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type Gig = Database["public"]["Tables"]["gigs"]["Row"]
type GigInsert = Database["public"]["Tables"]["gigs"]["Insert"]
type GigUpdate = Database["public"]["Tables"]["gigs"]["Update"]

export interface CreateGigData {
  title: string
  description: string
  category: string
  location: string
  price: number
  currency: string
  deadline?: string
  requirements?: string[]
  skills_required?: string[]
  attachments?: string[]
}

export interface GigFilters {
  category?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  skills?: string[]
  status?: string
  search?: string
}

class BiskateService {
  // Create a new gig/biskate
  async createGig(userId: string, gigData: CreateGigData): Promise<{ data: Gig | null; error: string | null }> {
    try {
      console.log("🆕 Creating new gig:", gigData.title)

      const { data, error } = await supabase
        .from("gigs")
        .insert({
          author_id: userId,
          title: gigData.title,
          description: gigData.description,
          category: gigData.category,
          location: gigData.location,
          price: gigData.price,
          currency: gigData.currency || "EUR",
          deadline: gigData.deadline,
          requirements: gigData.requirements,
          skills_required: gigData.skills_required,
          attachments: gigData.attachments,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Create gig error:", error)
        return { data: null, error: error.message }
      }

      console.log("✅ Gig created successfully:", data.id)
      return { data, error: null }
    } catch (err) {
      console.error("❌ Create gig exception:", err)
      return { data: null, error: err instanceof Error ? err.message : "Failed to create gig" }
    }
  }

  // Get gigs with filters
  async getGigs(filters: GigFilters = {}): Promise<{ data: Gig[] | null; error: string | null }> {
    try {
      console.log("🔍 Fetching gigs with filters:", filters)

      let query = supabase.from("gigs").select("*")

      // Apply filters
      if (filters.category) {
        query = query.eq("category", filters.category)
      }

      if (filters.location) {
        query = query.ilike("location", `%${filters.location}%`)
      }

      if (filters.minPrice) {
        query = query.gte("price", filters.minPrice)
      }

      if (filters.maxPrice) {
        query = query.lte("price", filters.maxPrice)
      }

      if (filters.status) {
        query = query.eq("status", filters.status)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Order by created date (newest first)
      query = query.order("created_at", { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error("❌ Get gigs error:", error)
        return { data: null, error: error.message }
      }

      console.log("✅ Gigs fetched successfully:", data?.length || 0)
      return { data, error: null }
    } catch (err) {
      console.error("❌ Get gigs exception:", err)
      return { data: null, error: err instanceof Error ? err.message : "Failed to fetch gigs" }
    }
  }

  // Get gig by ID
  async getGigById(gigId: string): Promise<{ data: Gig | null; error: string | null }> {
    try {
      console.log("🔍 Fetching gig:", gigId)

      const { data, error } = await supabase.from("gigs").select("*").eq("id", gigId).single()

      if (error) {
        console.error("❌ Get gig error:", error)
        return { data: null, error: error.message }
      }

      console.log("✅ Gig fetched successfully:", data.title)
      return { data, error: null }
    } catch (err) {
      console.error("❌ Get gig exception:", err)
      return { data: null, error: err instanceof Error ? err.message : "Failed to fetch gig" }
    }
  }

  // Get user's gigs
  async getUserGigs(userId: string): Promise<{ data: Gig[] | null; error: string | null }> {
    try {
      console.log("🔍 Fetching user gigs:", userId)

      const { data, error } = await supabase
        .from("gigs")
        .select("*")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Get user gigs error:", error)
        return { data: null, error: error.message }
      }

      console.log("✅ User gigs fetched successfully:", data?.length || 0)
      return { data, error: null }
    } catch (err) {
      console.error("❌ Get user gigs exception:", err)
      return { data: null, error: err instanceof Error ? err.message : "Failed to fetch user gigs" }
    }
  }

  // Update gig
  async updateGig(gigId: string, updates: Partial<GigUpdate>): Promise<{ data: Gig | null; error: string | null }> {
    try {
      console.log("📝 Updating gig:", gigId)

      const { data, error } = await supabase
        .from("gigs")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", gigId)
        .select()
        .single()

      if (error) {
        console.error("❌ Update gig error:", error)
        return { data: null, error: error.message }
      }

      console.log("✅ Gig updated successfully:", data.title)
      return { data, error: null }
    } catch (err) {
      console.error("❌ Update gig exception:", err)
      return { data: null, error: err instanceof Error ? err.message : "Failed to update gig" }
    }
  }

  // Delete gig
  async deleteGig(gigId: string): Promise<{ error: string | null }> {
    try {
      console.log("🗑️ Deleting gig:", gigId)

      const { error } = await supabase.from("gigs").delete().eq("id", gigId)

      if (error) {
        console.error("❌ Delete gig error:", error)
        return { error: error.message }
      }

      console.log("✅ Gig deleted successfully")
      return { error: null }
    } catch (err) {
      console.error("❌ Delete gig exception:", err)
      return { error: err instanceof Error ? err.message : "Failed to delete gig" }
    }
  }

  // Get gig statistics
  async getGigStats(userId?: string): Promise<{ data: any | null; error: string | null }> {
    try {
      console.log("📊 Fetching gig statistics")

      let query = supabase.from("gigs").select("status, price, created_at")

      if (userId) {
        query = query.eq("author_id", userId)
      }

      const { data, error } = await query

      if (error) {
        console.error("❌ Get gig stats error:", error)
        return { data: null, error: error.message }
      }

      // Calculate statistics
      const stats = {
        total: data?.length || 0,
        pending: data?.filter((g) => g.status === "pending").length || 0,
        approved: data?.filter((g) => g.status === "approved").length || 0,
        completed: data?.filter((g) => g.status === "completed").length || 0,
        rejected: data?.filter((g) => g.status === "rejected").length || 0,
        totalValue: data?.reduce((sum, g) => sum + (g.price || 0), 0) || 0,
        averagePrice: data?.length ? (data.reduce((sum, g) => sum + (g.price || 0), 0) / data.length).toFixed(2) : 0,
      }

      console.log("✅ Gig stats calculated:", stats)
      return { data: stats, error: null }
    } catch (err) {
      console.error("❌ Get gig stats exception:", err)
      return { data: null, error: err instanceof Error ? err.message : "Failed to fetch gig stats" }
    }
  }
}

// Create singleton instance
const biskateService = new BiskateService()

// Export both the service and as gigsService for compatibility
export { biskateService }
export const gigsService = biskateService
export default biskateService
