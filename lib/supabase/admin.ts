import { createClient } from "@supabase/supabase-js"
import { Database } from "@/lib/supabase/database.types"

// Warning: This client has admin privileges. Use with caution.
// Only use in Server Actions or API routes, never on the client.
export const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
)
