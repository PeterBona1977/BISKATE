import { type NextRequest, NextResponse } from "next/server"

// export const runtime = "edge" // Removed to fix Stripe env var issue
export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { amount, metadata = {}, type = "misc" } = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "eur",
      metadata: {
        ...metadata,
        userId: user.id,
        paymentType: type // 'gig_payment', 'subscription_upgrade', 'wallet_topup'
      },
    })

    // If it's a gig payment, we might still want to record it in the 'payments' table 
    // but for wallet/subs we use the 'transactions' table after confirmation.
    if (type === 'gig_payment' && metadata.gigId) {
      await supabase.from("payments").insert({
        gig_id: metadata.gigId,
        amount,
        stripe_payment_intent_id: paymentIntent.id,
        status: "pending",
      })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
