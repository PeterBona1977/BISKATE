
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase credentials")
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkProvider() {
    console.log("Checking provider 'pmbonanca@gmail.com'...")

    // fetch profile with plan features
    const { data: provider, error } = await supabase
        .from('profiles')
        .select(`
            id, 
            email, 
            role, 
            is_provider,
            skills, 
            is_online,
            last_lat, 
            last_lng, 
            provider_service_radius,
            plan_limits:plan (features)
        `)
        .eq('email', 'pmbonanca@gmail.com')
        .single()

    if (error) {
        console.error("Error fetching provider:", error)
        return
    }

    console.log("\n--- Provider Status ---")
    console.log(`ID: ${provider.id}`)
    console.log(`Role: ${provider.role}`)
    console.log(`Is Provider: ${provider.is_provider}`)
    console.log(`Online: ${provider.is_online}`)
    console.log(`Location: ${provider.last_lat}, ${provider.last_lng}`)
    console.log(`Radius: ${provider.provider_service_radius} km`)
    console.log(`Skills:`, provider.skills)
    console.log(`Plan Features:`, JSON.stringify(provider.plan_limits?.features, null, 2))

    // Simulation check
    const emergencyLat = provider.last_lat // simulating mostly same location
    const emergencyLng = provider.last_lng

    if (emergencyLat && emergencyLng) {
        console.log("\n--- Eligibility Check (Self-Test) ---")
        const hasEmergencyFeature = provider.plan_limits?.features?.emergency_calls === true
        console.log(`1. Emergency Feature Enabled: ${hasEmergencyFeature}`)

        // Check "Canalização" category if we knew the ID.
        // For now just check if skills is an array
        const isSkillsArray = Array.isArray(provider.skills)
        console.log(`2. Skills is Array: ${isSkillsArray}`)

        console.log(`3. Is Online: ${provider.is_online}`)
    } else {
        console.log("\n❌ Provider has no location set (last_lat/last_lng is null). Cannot receive emergencies.")
    }
}

checkProvider()
