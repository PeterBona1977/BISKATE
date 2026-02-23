import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const debugData: any = {}

        // 1. Get latest 10 emergency requests
        const { data: requests, error: err1 } = await supabaseAdmin
            .from("emergency_requests")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10)

        debugData.recentRequests = requests || err1

        // 2. Get latest 10 emergency notifications
        const { data: notifications, error: err2 } = await supabaseAdmin
            .from("notifications")
            .select("*")
            .ilike("type", "%emergency%")
            .order("created_at", { ascending: false })
            .limit(10)

        debugData.recentNotifications = notifications || err2

        // 3. Get all online providers (to see who is eligible)
        const { data: providers, error: err3 } = await supabaseAdmin
            .from("profiles")
            .select("id, email, full_name, role, is_provider, is_online, provider_emergency_calls, emergency_skills, last_lat, last_lng")
            .eq("is_online", true)

        debugData.onlineProviders = providers || err3

        return NextResponse.json(debugData)

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 })
    }
}
