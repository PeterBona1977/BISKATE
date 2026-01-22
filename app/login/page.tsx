"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { logClientActivity } from "@/app/actions/log"
// import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const runtime = "edge"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { signIn, isAuthenticated, profile, organizations } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && profile) {
      // Log successful login/session presence
      if (!sessionStorage.getItem("logged_in_session")) {
        logClientActivity(profile.id, profile.role || "user", "LOGIN", { email: profile.email || "unknown" })
        sessionStorage.setItem("logged_in_session", "true")
      }

      if (profile.role === "admin") {
        router.push("/admin")
      } else if (organizations && organizations.length > 0) {
        // Redirect to the first organization dashboard
        router.push(`/dashboard/org/${organizations[0].id}`)
      } else if (profile.role === "provider" || profile.is_provider) {
        router.push("/dashboard/provider")
      } else {
        router.push("/dashboard")
      }
    }
  }, [isAuthenticated, profile, organizations, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await signIn(email, password)

    if (error) {
      setError(error)
      setLoading(false)
    } else {
      // Success will trigger the useEffect above
      sessionStorage.removeItem("logged_in_session") // Clear to ensure we log the new login
    }
    // Redirection is handled by useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">Access your GigHub account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link href="/register" className="text-blue-600 hover:text-blue-500">
                Create account
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
