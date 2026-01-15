import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { paymentIntentId } = await request.json()

    // Update payment status to held in escrow
    await supabase.from("payments").update({ status: "held_in_escrow" }).eq("stripe_payment_intent_id", paymentIntentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
