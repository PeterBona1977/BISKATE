
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkNotifications() {
    console.log("Checking recent notifications for 'pmbonanca@gmail.com'...")

    // 1. Get User ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, is_provider, is_online, last_lat, last_lng')
        .eq('email', 'pmbonanca@gmail.com')
        .single()

    if (!profile) {
        console.error("Profile not found")
        return
    }

    console.log("Provider Profile:", profile)

    // 2. Get Recent Notifications
    const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error("Error fetching notifications:", error)
        return
    }

    console.log("\n--- Recent Notifications ---")
    if (notifications.length === 0) {
        console.log("No notifications found for this user.")
    } else {
        notifications.forEach(n => {
            console.log(`[${n.created_at}] ${n.title}: ${n.message}`)
        })
    }
}

checkNotifications()
