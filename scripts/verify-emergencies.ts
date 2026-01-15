
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
    const email = 'pmbonanca@gmail.com';
    console.log(`Searching for profile: ${email}`);

    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('id, email, is_provider, is_online, last_lat, last_lng')
        .eq('email', email)
        .single()

    if (pError || !profile) {
        console.log('User not found or error:', pError);
        return;
    }

    console.log('User Profile:', JSON.stringify(profile, null, 2));

    console.log(`\nChecking notifications for user ID: ${profile.id}`);
    const { data: notifs, error: nError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10)

    if (nError) {
        console.log('Error fetching notifications:', nError);
        return;
    }

    if (notifs.length === 0) {
        console.log('No notifications found.');
    } else {
        notifs.forEach(n => {
            console.log(`--- [${n.created_at}] ---`);
            console.log(`Title: ${n.title}`);
            console.log(`Message: ${n.message}`);
            console.log(`Type: ${n.type}`);
            console.log(`User Type (Filter): ${n.user_type}`);
            console.log(`Read: ${n.read}`);
        });
    }

    console.log('\nChecking recent Emergency Requests (last 5):');
    const { data: reqs } = await supabase
        .from('emergency_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

    reqs?.forEach(r => {
        console.log(`[${r.created_at}] Category: ${r.category}, Status: ${r.status}`);
    });
}

check()
