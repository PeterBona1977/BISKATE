import Stripe from "stripe"

const secretKey = process.env.STRIPE_SECRET_KEY

export const stripe = new Stripe(secretKey || "sk_test_placeholder", {
    apiVersion: "2024-06-20",
    typescript: true,
}) as any

// Optional: Helper to check if stripe is configured
export function isStripeConfigured() {
    return !!process.env.STRIPE_SECRET_KEY
}
