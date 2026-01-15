import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check admin
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single()
        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // List subscriptions from Stripe
        let stripeSubs: any[] = []
        try {
            const subscriptions = await stripe.subscriptions.list({
                limit: 100,
                expand: ['data.customer'],
            })
            stripeSubs = subscriptions.data
        } catch (e) {
            console.error("Stripe error (skipping):", e)
        }

        // 2. Fetch internal subscriptions from Supabase
        const { data: internalSubs, error: subError } = await supabase
            .from("user_subscriptions")
            .select("*, profiles(email, full_name, plan)")
            .order("created_at", { ascending: false })

        if (subError) console.error("Supabase sub error:", subError)

        // 3. Also fetch profiles that have a non-free plan but might not be in user_subscriptions yet
        const { data: profilePlans, error: profileError } = await supabase
            .from("profiles")
            .select("id, email, full_name, plan")
            .neq("plan", "free")

        if (profileError) console.error("Supabase profile plan error:", profileError)

        const subUserIds = new Set((internalSubs || []).map(s => s.user_id))

        const extraSubs = (profilePlans || [])
            .filter(p => !subUserIds.has(p.id))
            .map(p => ({
                id: `legacy_${p.id}`,
                user_id: p.id,
                status: 'active',
                current_period_end: null,
                customer: {
                    email: p.email,
                    name: p.full_name || "Internal User"
                },
                items: {
                    data: [{
                        plan: {
                            nickname: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
                            id: p.plan
                        }
                    }]
                },
                metadata: { source: 'profile' }
            }))

        // 4. Normalize internal subscriptions
        const normalizedInternal = (internalSubs || []).map((sub: any) => ({
            id: sub.id,
            status: sub.status,
            current_period_end: sub.current_period_end ? Math.floor(new Date(sub.current_period_end).getTime() / 1000) : null,
            customer: {
                email: sub.profiles?.email || "internal@system",
                name: sub.profiles?.full_name || "Internal User"
            },
            items: {
                data: [{
                    plan: {
                        nickname: sub.plan_id.charAt(0).toUpperCase() + sub.plan_id.slice(1),
                        id: sub.plan_id
                    }
                }]
            },
            metadata: { ...sub.metadata, source: 'internal' }
        }))

        // 5. Combine everything
        const combined = [...normalizedInternal, ...extraSubs, ...stripeSubs]

        return NextResponse.json({ data: combined })
    } catch (error) {
        console.error("Error fetching subscriptions:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check admin
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single()
        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { subscriptionId, action } = await request.json()

        let result
        if (action === "cancel") {
            result = await stripe.subscriptions.cancel(subscriptionId)
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }

        return NextResponse.json({ data: result })
    } catch (error) {
        console.error("Error managing subscription:", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
    }
}
