export function debugSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("🔍 SUPABASE_DEBUG: Environment variables check", {
    hasUrl: !!url,
    hasAnonKey: !!anonKey,
    urlLength: url?.length || 0,
    anonKeyLength: anonKey?.length || 0,
    urlPreview: url ? `${url.substring(0, 20)}...` : "MISSING",
    anonKeyPreview: anonKey ? `${anonKey.substring(0, 20)}...` : "MISSING",
  })

  if (!url || !anonKey) {
    console.error("❌ SUPABASE_DEBUG: Missing environment variables!")
    return false
  }

  if (!url.startsWith("https://") || !url.includes("supabase.co")) {
    console.error("❌ SUPABASE_DEBUG: Invalid Supabase URL format!")
    return false
  }

  if (anonKey.length < 100) {
    console.error("❌ SUPABASE_DEBUG: Anon key seems too short!")
    return false
  }

  console.log("✅ SUPABASE_DEBUG: Environment variables look correct")
  return true
}

export async function testSupabaseConnection() {
  try {
    console.log("🔗 SUPABASE_DEBUG: Testing connection...")

    const { supabase } = await import("@/lib/supabase/client")

    // Test basic connection
    const { data, error } = await supabase.from("profiles").select("count").limit(1)

    if (error) {
      console.error("❌ SUPABASE_DEBUG: Connection test failed:", error)
      return false
    }

    console.log("✅ SUPABASE_DEBUG: Connection test successful")
    return true
  } catch (err) {
    console.error("❌ SUPABASE_DEBUG: Connection test exception:", err)
    return false
  }
}
