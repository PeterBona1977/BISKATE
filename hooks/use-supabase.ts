"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type Gig = Database["public"]["Tables"]["gigs"]["Row"]

// ✅ HOOK useSupabase CORRIGIDO E EXPORTADO
export function useSupabase() {
  return supabase
}

// ✅ HOOKS EXISTENTES MANTIDOS
export function useGigs() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGigs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("gigs")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6)

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      setGigs(data || [])
    } catch (err) {
      console.error("Error fetching gigs:", err)
      setError("Erro ao carregar gigs")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGigs()
  }, [fetchGigs])

  return { gigs, loading, error, refetch: fetchGigs }
}

export function useGig(id: string) {
  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGig = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase.from("gigs").select("*").eq("id", id).single()

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      setGig(data)
    } catch (err) {
      console.error("Error fetching gig:", err)
      setError("Erro ao carregar gig")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchGig()
  }, [fetchGig])

  return { gig, loading, error, refetch: fetchGig }
}
