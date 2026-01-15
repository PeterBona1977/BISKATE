
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

async function simulate() {
    console.log("--- BROADCAST SIMULATION ---");

    // 1. Get latest request
    const { data: reqs } = await supabase
        .from('emergency_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

    if (!reqs || reqs.length === 0) {
        console.log("No requests found.");
        return;
    }
    const req = reqs[0];
    console.log(`Latest Request: ${req.category} at ${req.lat}, ${req.lng}`);

    // 2. Get the provider
    const { data: provider } = await supabase
        .from('profiles')
        .select(`
            id, 
            email, 
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

    if (!provider) {
        console.log("Provider 'pmbonanca@gmail.com' not found.");
        return;
    }

    console.log(`Provider: ${provider.email}`);
    console.log(`- Online: ${provider.is_online}`);
    console.log(`- Is Provider: ${provider.is_provider}`);
    console.log(`- Location: ${provider.last_lat}, ${provider.last_lng}`);
    console.log(`- Radius: ${provider.provider_service_radius}km`);

    // 3. Logic Check
    const dist = calculateDistance(req.lat, req.lng, provider.last_lat, provider.last_lng);
    const inRadius = dist <= (provider.provider_service_radius || 20);
    const hasEmergencyFeature = provider.plan_limits?.features?.emergency_calls === true;

    const serviceId = req.service_id;
    const hasMatchingSkill = !serviceId || (provider.skills && Array.isArray(provider.skills) && provider.skills.includes(serviceId));

    console.log("\n--- Eligibility ---");
    console.log(`1. Distance: ${dist.toFixed(2)}km (within ${provider.provider_service_radius}km? ${inRadius})`);
    console.log(`2. Emergency Feature: ${hasEmergencyFeature}`);
    console.log(`3. Skill Match: ${hasMatchingSkill}`);
    console.log(`4. Online Status: ${provider.is_online}`);
    console.log(`5. Is Provider Role (Internal Column): ${provider.is_provider}`);

    const pass = inRadius && hasEmergencyFeature && hasMatchingSkill && provider.is_online && provider.is_provider === true;
    console.log(`\n--- Final Decision ---`);
    console.log(`- In Radius? ${inRadius}`);
    console.log(`- Has Feature? ${hasEmergencyFeature}`);
    console.log(`- Has Skill? ${hasMatchingSkill}`);
    console.log(`- Online? ${provider.is_online}`);
    console.log(`- Is Provider? ${provider.is_provider}`);
    console.log(`- OVERALL PASS: ${pass}`);

    if (pass) {
        console.log("\n✅ The provider SHOULD have received the notification.");
    } else {
        console.log("\n❌ EXCLUDED because:");
        if (!inRadius) console.log("- Out of radius");
        if (!hasEmergencyFeature) console.log("- No emergency_calls feature in plan (Pro/Unlimited required)");
        if (!hasMatchingSkill) console.log("- No matching skill");
        if (!provider.is_online) console.log("- Offline");
        if (provider.is_provider !== true) console.log("- is_provider flag is not true");
    }
}

simulate()
