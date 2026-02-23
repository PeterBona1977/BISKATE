import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function run() {
    console.log("Forcing provider_emergency_calls to TRUE for Pedro Bonança...")

    // Explicitly update Pedro's profile
    const { data, error } = await supabase
        .from('profiles')
        .update({ provider_emergency_calls: true })
        .eq('email', 'peterbona19772025@gmail.com')
        .select('id, email, provider_emergency_calls')

    if (error) {
        console.error("Error updating profile:", error)
        return
    }

    console.log("Success! Updated Profile:", data)

    // Also, update everyone else just in case
    const { count, error: countError } = await supabase
        .from('profiles')
        .update({ provider_emergency_calls: true })
        .eq('role', 'provider')

    if (countError) {
        console.error("Error updating other providers:", countError)
    } else {
        console.log("Bulk updated all other providers.")
    }
}

run()
