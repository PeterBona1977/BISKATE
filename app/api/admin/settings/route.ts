import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin" // Use admin client to bypass potential RLS issues initially if needed, but RLS is better.
// Actually, let's use user client with RLS for security, but since it's admin route, check role.

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Role check
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        if (!profile || (profile as any).role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Fetch settings
        const { data, error } = await supabase
            .from("platform_integrations")
            .select("config")
            .eq("service_name", "general_settings")
            .single()

        if (error) {
            // If not found, return defaults
            if (error.code === 'PGRST116') {
                return NextResponse.json({
                    settings: {
                        site_name: "Biskate",
                        site_url: "https://gighub.com",
                        site_description: "Plataforma de serviços freelance",
                        maintenance_mode: false,
                    }
                })
            }
            throw error
        }

        return NextResponse.json({ settings: data.config })

    } catch (error: any) {
        console.error("Error fetching admin settings:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Role check
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        if (!profile || (profile as any).role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const settings = await request.json()

        // Upsert settings
        // We use supabaseAdmin to ensure we can write even if RLS is tricky, but let's try standard client first.
        // Actually, upsert is easier with onConflict
        const { error } = await supabase
            .from("platform_integrations")
            .upsert({
                service_name: "general_settings",
                config: settings,
                updated_at: new Date().toISOString()
            }, { onConflict: 'service_name' })

        if (error) throw error

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("Error updating admin settings:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
