
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials in .env.local")
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function verifyMigration() {
    console.log("🔍 Verifying RBAC Migration...")

    try {
        const { data: profile, error } = await supabaseAdmin
            .from("profiles")
            .select("id, email, role, permissions")
            .eq("email", "pedromiguelbonanca@gmail.com")
            .single()

        if (error) {
            console.error("❌ Error fetching profile:", error.message)
            console.log("   Suggestion: Check if the email matches exactly in Supabase.")
            return
        }

        console.log("✅ Profile found:")
        console.log(`   Email: ${profile.email}`)
        console.log(`   Role: ${profile.role}`)
        console.log(`   Permissions: ${JSON.stringify(profile.permissions)}`)

        if (profile.role === 'admin' && Array.isArray(profile.permissions) && profile.permissions.includes('super_admin')) {
            console.log("🎉 SUCCESS: The migration was applied correctly!")
        } else {
            console.warn("⚠️ WARNING: Profile found but not correctly promoted.")
        }

    } catch (err) {
        console.error("❌ Unexpected error:", err)
    }
}

verifyMigration()
