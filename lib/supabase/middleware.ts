// This file should ONLY be used by middleware.ts
import { createServerClient } from "@supabase/ssr"
import type { NextRequest, NextResponse } from "next/server"
import type { Database } from "./database.types"

export function createMiddlewareSupabaseClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: any) {
        response.cookies.set({
          name,
          value: "",
          ...options,
        })
      },
    },
    auth: {
      storageKey: "biskate-supabase-auth",
      flowType: "pkce",
    },
    global: {
      headers: {
        "X-Client-Info": "biskate-middleware",
      },
    },
  })
}
