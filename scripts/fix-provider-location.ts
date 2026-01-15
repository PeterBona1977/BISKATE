
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixProvider() {
    console.log("Forcing location update for 'pmbonanca@gmail.com'...")

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'pmbonanca@gmail.com')
        .single()

    if (!profile) {
        console.error("Profile not found")
        return
    }

    // Set to Lisbon coordinates (approx)
    // 38.7223, -9.1393
    const { error } = await supabase
        .from('profiles')
        .update({
            last_lat: 38.7223,
            last_lng: -9.1393,
            is_online: true,
            is_provider: true, // Ensure this is true
            provider_service_radius: 50
        })
        .eq('id', profile.id)

    if (error) {
        console.error("Error updating profile:", error)
    } else {
        console.log("✅ Success! Provider location set to Lisbon (38.7223, -9.1393) and set to ONLINE.")
    }
}

fixProvider()
