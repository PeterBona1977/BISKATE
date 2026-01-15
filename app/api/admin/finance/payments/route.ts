import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single() as { data: { role: string } | null, error: any }

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")

        // 1. Prepare Filters
        const stripeFilter: any = { limit: 100 }
        let dbQuery = supabase.from("transactions").select("*, profiles(email, full_name)")

        if (startDate && startDate !== "") {
            const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
            if (!isNaN(startTimestamp)) {
                stripeFilter.created = { ...stripeFilter.created, gte: startTimestamp }
                dbQuery = dbQuery.gte("created_at", new Date(startDate).toISOString())
            }
        }

        if (endDate && endDate !== "") {
            const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)
            if (!isNaN(endTimestamp)) {
                stripeFilter.created = { ...stripeFilter.created, lte: endTimestamp }
                dbQuery = dbQuery.lte("created_at", new Date(endDate).toISOString())
            }
        }

        // 2. Fetch from Stripe (Payment Intents + Invoices)
        let stripeData: any[] = []
        try {
            const [paymentIntents, invoices] = await Promise.all([
                stripe.paymentIntents.list(stripeFilter),
                stripe.invoices.list(stripeFilter)
            ])

            // Normalize Payment Intents
            const normalizedPI = paymentIntents.data.map(pi => ({
                id: pi.id,
                amount: pi.amount,
                currency: pi.currency,
                status: pi.status,
                created: pi.created,
                receipt_email: pi.receipt_email,
                customer: pi.customer as string,
                description: pi.description,
                source: 'stripe_pi'
            }))

            // Normalize Invoices
            const normalizedInv = invoices.data.map(inv => ({
                id: inv.id,
                amount: inv.amount_paid,
                currency: inv.currency,
                status: inv.status === 'paid' ? 'succeeded' : inv.status,
                created: inv.created,
                receipt_email: inv.customer_email,
                customer: inv.customer_name || (inv.customer as string),
                description: `Invoice for ${inv.lines.data[0]?.description || 'subscription'}`,
                source: 'stripe_invoice'
            }))

            stripeData = [...normalizedPI, ...normalizedInv]
        } catch (e) {
            console.error("Stripe error (skipping):", e)
        }

        // 3. Fetch Internal Transactions
        const { data: internalTx, error: txError } = await dbQuery.order("created_at", { ascending: false })

        if (txError) console.error("Supabase tx error:", txError)

        // 4. Normalize Internal Transactions
        const normalizedInternal = (internalTx || []).map((tx: any) => ({
            id: tx.id,
            amount: Math.abs(tx.amount * 100),
            currency: tx.currency?.toLowerCase() || 'eur',
            status: tx.status === 'completed' ? 'succeeded' : tx.status,
            created: Math.floor(new Date(tx.created_at).getTime() / 1000),
            receipt_email: tx.profiles?.email || "internal@system",
            customer: tx.profiles?.full_name || "Internal User",
            description: tx.description,
            source: 'internal'
        }))

        // 5. Combine and Filter Duplicates
        // (Stripe PI and Stripe Invoice might relate to same payment, but let's show all for full history)
        const combined = [...normalizedInternal, ...stripeData].sort((a, b) => b.created - a.created)

        return NextResponse.json({ data: combined })
    } catch (error) {
        console.error("Error fetching payments:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check admin
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id as string).single() as any
        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { paymentIntentId, amount, reason } = await request.json()

        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined, // amount in cents
            reason: reason || "requested_by_customer",
        })

        return NextResponse.json({ data: refund })
    } catch (error) {
        console.error("Error creating refund:", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
    }
}
