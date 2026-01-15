
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"

// Check if we have valid configuration
export function hasValidConfig(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

if (!hasValidConfig()) {
  throw new Error("Missing Supabase environment variables")
}

// Supabase client for client-side usage
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export const supabase = createClient()

// Test database connection with comprehensive error handling
export async function testDatabaseConnection() {
  try {
    const startTime = Date.now()

    // Simple connectivity test that doesn't trigger RLS
    const { data, error, count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).limit(1)

    const responseTime = Date.now() - startTime

    if (error) {
      console.error("❌ Database connection error:", error)

      // Check for specific error types
      if (error.message?.includes("infinite recursion")) {
        return {
          success: false,
          error: "RLS infinite recursion detected",
          responseTime,
          needsRLSFix: true,
          details: error,
        }
      }

      return {
        success: false,
        error: error.message,
        responseTime,
        details: error,
      }
    }

    return {
      success: true,
      count: count || 0,
      responseTime,
      message: "Connection established successfully",
    }
  } catch (err) {
    console.error("❌ Database connection exception:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown connection error",
      responseTime: 0,
    }
  }
}

// Test authentication status
export async function testAuthStatus() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("❌ Auth status error:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      authenticated: !!session,
      user: session?.user || null,
      email: session?.user?.email || null,
    }
  } catch (err) {
    console.error("❌ Auth status exception:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown auth error",
    }
  }
}

// Safe system health check without RLS dependencies
export async function checkSystemHealth() {
  const results = {
    database: { status: "unknown", details: null as any },
    auth: { status: "unknown", details: null as any },
    rls: { status: "unknown", details: null as any },
    overall: "unknown",
    timestamp: new Date().toISOString(),
  }

  // Test database connectivity
  try {
    const dbResult = await testDatabaseConnection()
    results.database = {
      status: dbResult.success ? "healthy" : "error",
      details: dbResult,
    }
  } catch (err) {
    results.database = {
      status: "error",
      details: { error: err instanceof Error ? err.message : "Database test failed" },
    }
  }

  // Test authentication
  try {
    const authResult = await testAuthStatus()
    results.auth = {
      status: authResult.success ? "healthy" : "error",
      details: authResult,
    }
  } catch (err) {
    results.auth = {
      status: "error",
      details: { error: err instanceof Error ? err.message : "Auth test failed" },
    }
  }

  // Test RLS status (safe check)
  try {
    const { data, error } = await supabase.rpc("get_system_stats")
    if (error) {
      results.rls = {
        status: "error",
        details: { error: error.message },
      }
    } else {
      results.rls = {
        status: "healthy",
        details: { stats: data, rls_disabled: true },
      }
    }
  } catch (err) {
    results.rls = {
      status: "error",
      details: { error: err instanceof Error ? err.message : "RLS check failed" },
    }
  }

  // Determine overall health
  const healthyCount = [results.database, results.auth, results.rls].filter((r) => r.status === "healthy").length

  if (healthyCount === 3) {
    results.overall = "healthy"
  } else if (healthyCount >= 2) {
    results.overall = "degraded"
  } else if (healthyCount >= 1) {
    results.overall = "critical"
  } else {
    results.overall = "error"
  }

  return results
}

export default supabase
