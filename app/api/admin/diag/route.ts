import { NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        let profile = null
        if (user) {
            const { data } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single()
            profile = data
        }

        return NextResponse.json({
            authenticated: !!user,
            userId: user?.id,
            email: user?.email,
            role: profile?.role,
            hasSession: !!session,
            errors: {
                userError,
                sessionError
            },
            cookiesCount: (await import("next/headers")).cookies().getAll().length
        })
    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal server error"
        }, { status: 500 })
    }
}
