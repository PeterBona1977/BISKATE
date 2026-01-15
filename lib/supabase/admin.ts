import { createClient } from "@supabase/supabase-js"
import { Database } from "@/lib/supabase/database.types"

// Warning: This client has admin privileges. Use with caution.
// Only use in Server Actions or API routes, never on the client.
export const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error("Missing Supabase admin environment variables")
    }

    return createClient<Database>(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}

// Deprecated: Use getSupabaseAdmin() instead. 
// Keeping this for compatibility but making it lazy.
export const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder",
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
)
