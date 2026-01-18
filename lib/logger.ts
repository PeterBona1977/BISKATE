
import { createClient } from "@supabase/supabase-js"

// Note: In a real Next.js app with Supabase, you might use createClient from @supabase/ssr or custom hook.
// For server actions/api, strict type safety is good. Using process.env for service role if needed, 
// or the context's client.

export type ActivityLog = {
    id: string
    user_id: string
    action: string
    details: any
    ip_address?: string
    user_role: string
    created_at: string
}

export type ActivityLogFilter = {
    role?: string
    search?: string
    startDate?: Date
    endDate?: Date
}

// Helper to get a service role client for logging (bypassing RLS for inserts if needed, or ensuring write access)
const getAdminClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        // Fallback for build time
        return createClient("https://placeholder.supabase.co", "placeholder")
    }
    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    })
}

export async function logActivity(
    userId: string,
    userRole: string,
    action: string,
    details: any = {},
    ipAddress?: string
) {
    try {
        console.log(`[LOGGER] 📝 Logging ${action} for user ${userId}...`)
        const supabase = getAdminClient()
        const { error } = await supabase.from("activity_logs").insert({
            user_id: userId,
            user_role: userRole,
            action,
            details,
            ip_address: ipAddress
        })

        if (error) {
            console.error("[LOGGER] ❌ Error logging activity (Supabase):", error.message)
        } else {
            console.log("[LOGGER] ✅ Activity recorded:", action)
        }
    } catch (err: any) {
        console.error("[LOGGER] ❌ UNEXPECTED ERROR:", err.message || err)
    }
}

export async function fetchActivityLogs(filter: ActivityLogFilter) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing on server.")
        throw new Error("Server configuration error: Missing Service Key")
    }

    const supabase = getAdminClient()
    let query = supabase
        .from("activity_logs")
        .select('*')
        .order("created_at", { ascending: false })

    if (filter.role) {
        if (filter.role === 'admin') {
            query = query.eq('user_role', 'admin')
        } else {
            query = query.neq('user_role', 'admin')
        }
    }

    if (filter.startDate) {
        const d = new Date(filter.startDate)
        if (!isNaN(d.getTime())) {
            query = query.gte("created_at", d.toISOString())
        }
    }

    if (filter.endDate) {
        const d = new Date(filter.endDate)
        if (!isNaN(d.getTime())) {
            // Set to end of day to include all logs for that date
            d.setHours(23, 59, 59, 999)
            query = query.lte("created_at", d.toISOString())
        }
    }

    // Apply strict search on action text first if provided
    if (filter.search) {
        query = query.ilike('action', `%${filter.search}%`)
    }

    const { data: logs, error } = await query

    if (error) {
        console.error("Error fetching logs:", error)
        throw error
    }

    if (!logs || logs.length === 0) return []

    // Fetch user details manually to avoid joining on auth.users which causes 500 error
    const userIds = Array.from(new Set(logs.map(log => log.user_id).filter(Boolean)))

    // We try to fetch from 'profiles' first which usually mirrors users
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .in('id', userIds)

    if (profileError) {
        console.warn("Could not fetch profiles for logs:", profileError)
    }

    const profileMap = new Map(profiles?.map(p => [p.id, p]))

    let combined = logs.map(log => {
        const profile = profileMap.get(log.user_id)
        return {
            ...log,
            users: {
                email: profile?.email || 'Unknown',
                raw_user_meta_data: {
                    full_name: profile?.full_name || 'Unknown'
                }
            }
        }
    })

    // If search was provided, we might want to filter by user email/name in memory
    // since we only filtered by 'action' in the DB query above.
    if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        combined = combined.filter((log: any) => {
            const email = log.users?.email?.toLowerCase() || ''
            const name = log.users?.raw_user_meta_data?.full_name?.toLowerCase() || ''
            const action = log.action.toLowerCase()
            return email.includes(searchLower) || name.includes(searchLower) || action.includes(searchLower)
        })
    }

    return combined
}
