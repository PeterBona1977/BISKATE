import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single() as any
        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // 1. Fetch from Stripe
        let stripeProducts: any[] = []
        try {
            const products = await stripe.products.list({
                active: true,
                expand: ['data.default_price'],
            })
            stripeProducts = products.data
        } catch (err) {
            console.error("Stripe fetch error:", err)
        }

        // 2. Fetch from Supabase plan_limits
        const { data: dbPlans } = await supabase.from("plan_limits").select("*")

        // 3. Normalize and merge
        // We prioritize Stripe products, but if a plan exists in DB and NOT in Stripe (by ID/Tier mapping), we show it as 'internal'
        const normalizedStripe = stripeProducts.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            amount: p.default_price?.unit_amount || 0,
            currency: p.default_price?.currency || 'eur',
            interval: p.default_price?.recurring?.interval || 'month',
            intervalCount: p.default_price?.recurring?.interval_count || 1,
            created: p.created,
            source: 'stripe',
            plan_tier: p.metadata?.plan_tier || p.name.toLowerCase().replace(/\s+/g, '-')
        }))

        const stripeTiers = new Set(normalizedStripe.map(s => s.plan_tier))

        const internalPlans = (dbPlans || [])
            .filter(p => !stripeTiers.has(p.plan_tier))
            .map(p => {
                let interval = 'month'
                let intervalCount = 1

                switch (p.reset_period) {
                    case 'weekly':
                        interval = 'week'
                        intervalCount = 1
                        break
                    case 'biweekly':
                        interval = 'week'
                        intervalCount = 2
                        break
                    case 'monthly':
                        interval = 'month'
                        intervalCount = 1
                        break
                    case 'yearly':
                        interval = 'year'
                        intervalCount = 1
                        break
                }

                return {
                    id: `internal_${p.plan_tier}`,
                    name: p.plan_tier.charAt(0).toUpperCase() + p.plan_tier.slice(1),
                    description: `Internal Plan (Quotas restricted)`,
                    amount: (p.price || 0) * 100, // Cents
                    currency: 'eur',
                    interval,
                    intervalCount,
                    created: Math.floor(new Date(p.updated_at || Date.now()).getTime() / 1000),
                    source: 'internal',
                    plan_tier: p.plan_tier
                }
            })

        return NextResponse.json({ data: [...normalizedStripe, ...internalPlans] })
    } catch (error) {
        console.error("Error fetching plans:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single() as any
        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { name, amount, interval, intervalCount, description } = await request.json()

        // Create a product
        const product = await stripe.products.create({
            name,
            description,
        })

        // Create a price for the product
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(amount * 100),
            currency: 'eur',
            recurring: {
                interval: interval || 'month',
                interval_count: intervalCount || 1,
            },
        })

        // Set the default price
        await stripe.products.update(product.id, {
            default_price: price.id,
        })

        // Map periodicity to reset_period
        let resetPeriod = "monthly"
        if (interval === "week") {
            resetPeriod = intervalCount === 2 ? "biweekly" : "weekly"
        } else if (interval === "year") {
            resetPeriod = "yearly"
        }

        // Generate plan tier (slug)
        const planTier = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

        // Sync with plan_limits table
        await supabase.from("plan_limits").upsert({
            plan_tier: planTier,
            contact_views_limit: 50, // Default to essential limits
            proposals_limit: 30,
            gig_responses_limit: 75,
            reset_period: resetPeriod,
            updated_at: new Date().toISOString()
        })

        return NextResponse.json({ data: { product, price } })
    } catch (error) {
        console.error("Error creating plan:", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single() as any
        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { productId, name, description } = await request.json()

        const product = await stripe.products.update(productId, {
            name,
            description,
        })

        return NextResponse.json({ data: product })
    } catch (error) {
        console.error("Error updating plan:", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single() as any
        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { productId } = await request.json()

        // Archive the product (Stripe doesn't allow deleting if it has transactions)
        const product = await stripe.products.update(productId, {
            active: false,
        })

        return NextResponse.json({ data: product })
    } catch (error) {
        console.error("Error archiving plan:", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
    }
}
