import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "X-Client-Info": "biskate-web",
    },
  },
})

// Helper function for safe database queries
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
): Promise<{ data: T | null; error: any }> {
  try {
    const result = await queryFn()
    return result
  } catch (error) {
    console.error("Database query error:", error)
    return { data: null, error }
  }
}

// Helper function to get current user
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) {
      console.error("Auth error:", error)
      return null
    }
    return user
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}

// Helper function to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

export default supabase
