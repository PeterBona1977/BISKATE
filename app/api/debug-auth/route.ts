import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const cookieStore = await cookies()
        const cookieNames = cookieStore.getAll().map(c => c.name)

        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        return NextResponse.json({
            status: "success",
            cookies: cookieNames,
            userAuthenticated: !!user,
            userId: user?.id,
            authError: authError,
            envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "present" : "missing",
            envKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "present" : "missing"
        })
    } catch (error) {
        return NextResponse.json({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}
