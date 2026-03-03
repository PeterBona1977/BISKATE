export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const subscription = await request.json()

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: "Invalid subscription object given." }, { status: 400 })
        }

        // Fetch current profile to append the subscription
        const { data: profile } = await supabase.from('profiles').select('notification_preferences').eq('id', user.id).single()

        let prefs = profile?.notification_preferences || {}
        if (typeof prefs !== 'object') prefs = {}

        const existingSubs = Array.isArray(prefs.push_subscriptions) ? prefs.push_subscriptions : []

        // Remove old occurrences of this exact endpoint to avoid duplicates
        const updatedSubs = existingSubs.filter((sub: any) => sub.endpoint !== subscription.endpoint)
        updatedSubs.push(subscription)

        prefs.push_subscriptions = updatedSubs

        const { error } = await supabase
            .from('profiles')
            .update({ notification_preferences: prefs })
            .eq('id', user.id)

        if (error) {
            console.error("Error saving push subscription:", error)
            return NextResponse.json({ error: "Fail to save to database" }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Subscription saved successfully" })
    } catch (error) {
        console.error("Push Subscribe Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
