import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { gigId, providerId } = await request.json()

    // Get payment info
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("gig_id", gigId)
      .eq("status", "held_in_escrow")
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Release funds to provider
    await stripe.transfers.create({
      amount: Math.round(payment.amount * 0.95 * 100), // 95% to provider (5% platform fee)
      currency: "eur",
      destination: providerId, // This should be the provider's Stripe account
    })

    // Update payment status
    await supabase.from("payments").update({ status: "completed" }).eq("id", payment.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error releasing escrow:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
