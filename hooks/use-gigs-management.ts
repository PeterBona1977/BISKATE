"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase/database.types"

export type Gig = Database["public"]["Tables"]["gigs"]["Row"] & {
  profiles?: {
    full_name: string | null
    email: string | null
  }
}

export type GigFormData = {
  title: string
  description: string
  category: string
  price: string
  location: string
  status: string
}

export function useGigsManagement() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [editingGig, setEditingGig] = useState<Gig | null>(null)
  const [editForm, setEditForm] = useState<GigFormData>({
    title: "",
    description: "",
    category: "",
    price: "",
    location: "",
    status: "",
  })
  const { toast } = useToast()

  const fetchGigs = useCallback(async () => {
    try {
      console.log("🔍 Admin: Buscando todos os gigs...")
      setLoading(true)

      const { data, error } = await supabase
        .from("gigs")
        .select(`
          *,
          profiles:author_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Admin: Erro ao buscar gigs:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os gigs.",
          variant: "destructive",
        })
        return
      }

      console.log(`✅ Admin: ${data?.length || 0} gigs carregados`)
      setGigs(data || [])
    } catch (err) {
      console.error("❌ Admin: Erro inesperado:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar gigs.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const handleEditGig = useCallback((gig: Gig) => {
    console.log("✏️ Admin: Editando gig:", gig.title)
    setEditingGig(gig)
    setEditForm({
      title: gig.title || "",
      description: gig.description || "",
      category: gig.category || "",
      price: gig.price?.toString() || "",
      location: gig.location || "",
      status: gig.status || "pending",
    })
  }, [])

  const handleSaveGig = useCallback(async () => {
    if (!editingGig) return

    try {
      console.log("💾 Admin: Salvando alterações do gig:", editingGig.title)

      const { error } = await supabase
        .from("gigs")
        .update({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          price: Number.parseFloat(editForm.price) || 0,
          location: editForm.location,
          status: editForm.status as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingGig.id)

      if (error) {
        console.error("❌ Admin: Erro ao atualizar gig:", error)
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o gig.",
          variant: "destructive",
        })
        return
      }

      console.log("✅ Admin: Gig atualizado com sucesso")
      toast({
        title: "Sucesso",
        description: "Gig atualizado com sucesso.",
      })

      setEditingGig(null)
      fetchGigs() // Recarregar lista
    } catch (err) {
      console.error("❌ Admin: Erro inesperado:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar gig.",
        variant: "destructive",
      })
    }
  }, [editingGig, editForm, fetchGigs, toast])

  const handleApproveGig = useCallback(
    async (gigId: string, gigTitle: string) => {
      try {
        console.log("✅ Admin: Aprovando gig:", gigTitle)

        const { error } = await supabase
          .from("gigs")
          .update({ status: "approved", updated_at: new Date().toISOString() })
          .eq("id", gigId)

        if (error) {
          console.error("❌ Admin: Erro ao aprovar gig:", error)
          toast({
            title: "Erro",
            description: "Não foi possível aprovar o gig.",
            variant: "destructive",
          })
          return
        }

        console.log("✅ Admin: Gig aprovado com sucesso")
        toast({
          title: "Sucesso",
          description: "Gig aprovado com sucesso.",
        })

        fetchGigs() // Recarregar lista
      } catch (err) {
        console.error("❌ Admin: Erro inesperado:", err)
        toast({
          title: "Erro",
          description: "Erro inesperado ao aprovar gig.",
          variant: "destructive",
        })
      }
    },
    [fetchGigs, toast],
  )

  const handleRejectGig = useCallback(
    async (gigId: string, gigTitle: string) => {
      try {
        console.log("❌ Admin: Rejeitando gig:", gigTitle)

        const { error } = await supabase
          .from("gigs")
          .update({
            status: "rejected",
            rejection_reason: "Rejeitado pela administração",
            updated_at: new Date().toISOString(),
          })
          .eq("id", gigId)

        if (error) {
          console.error("❌ Admin: Erro ao rejeitar gig:", error)
          toast({
            title: "Erro",
            description: "Não foi possível rejeitar o gig.",
            variant: "destructive",
          })
          return
        }

        console.log("✅ Admin: Gig rejeitado com sucesso")
        toast({
          title: "Sucesso",
          description: "Gig rejeitado com sucesso.",
        })

        fetchGigs() // Recarregar lista
      } catch (err) {
        console.error("❌ Admin: Erro inesperado:", err)
        toast({
          title: "Erro",
          description: "Erro inesperado ao rejeitar gig.",
          variant: "destructive",
        })
      }
    },
    [fetchGigs, toast],
  )

  const handleDeleteGig = useCallback(
    async (gigId: string, gigTitle: string) => {
      try {
        console.log("🗑️ Admin: Apagando gig:", gigTitle)

        const { error } = await supabase.from("gigs").delete().eq("id", gigId)

        if (error) {
          console.error("❌ Admin: Erro ao apagar gig:", error)
          toast({
            title: "Erro",
            description: "Não foi possível apagar o gig.",
            variant: "destructive",
          })
          return
        }

        console.log("✅ Admin: Gig apagado com sucesso")
        toast({
          title: "Sucesso",
          description: "Gig apagado com sucesso.",
        })

        fetchGigs() // Recarregar lista
      } catch (err) {
        console.error("❌ Admin: Erro inesperado:", err)
        toast({
          title: "Erro",
          description: "Erro inesperado ao apagar gig.",
          variant: "destructive",
        })
      }
    },
    [fetchGigs, toast],
  )

  const filteredGigs = gigs.filter((gig) => {
    const matchesSearch =
      gig.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.category?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || gig.status === statusFilter

    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    fetchGigs()
  }, [fetchGigs])

  return {
    gigs,
    filteredGigs,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    editingGig,
    setEditingGig,
    editForm,
    setEditForm,
    handleEditGig,
    handleSaveGig,
    handleApproveGig,
    handleRejectGig,
    handleDeleteGig,
    fetchGigs,
  }
}
