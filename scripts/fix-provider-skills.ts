
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fix() {
    const email = 'pmbonanca@gmail.com'

    // 1. Get latest req service_id
    const { data: reqs } = await supabase
        .from('emergency_requests')
        .select('service_id')
        .order('created_at', { ascending: false })
        .limit(1)

    if (!reqs || reqs.length === 0 || !reqs[0].service_id) {
        console.log("No recent emergency request with service_id found.");
        return;
    }
    const serviceId = reqs[0].service_id;
    console.log(`Latest Request Service ID: ${serviceId}`);

    // 2. Get provider
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, skills')
        .eq('email', email)
        .single()

    if (!profile) {
        console.log("Provider not found.");
        return;
    }

    // 3. Update skills
    const currentSkills = Array.isArray(profile.skills) ? profile.skills : [];
    if (!currentSkills.includes(serviceId)) {
        currentSkills.push(serviceId);
    }

    const { error } = await supabase
        .from('profiles')
        .update({ skills: currentSkills })
        .eq('id', profile.id)

    if (error) {
        console.error("Error updating skills:", error);
    } else {
        console.log(`✅ Success! Added skill ${serviceId} to ${email}`);
    }
}

fix()
