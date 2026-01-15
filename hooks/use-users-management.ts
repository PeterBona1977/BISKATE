"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface UseUsersManagementReturn {
  users: Profile[]
  loading: boolean
  searchTerm: string
  setSearchTerm: (term: string) => void
  filteredUsers: Profile[]
  updateUser: (userId: string, updates: Partial<Profile>) => Promise<boolean>
  deleteUser: (userId: string) => Promise<boolean>
  refreshUsers: () => Promise<void>
}

export function useUsersManagement(): UseUsersManagementReturn {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching users:", error)
        toast({
          title: "Erro ao carregar utilizadores",
          description: `Erro: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      setUsers(data || [])
    } catch (err) {
      console.error("❌ Exception fetching users:", err)
      toast({
        title: "Erro inesperado",
        description: "Erro inesperado ao carregar utilizadores",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const updateUser = useCallback(
    async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)

        if (error) {
          toast({
            title: "Erro",
            description: `Não foi possível atualizar o utilizador: ${error.message}`,
            variant: "destructive",
          })
          return false
        }

        toast({
          title: "Sucesso",
          description: "Utilizador atualizado com sucesso.",
        })

        await fetchUsers()
        return true
      } catch (err) {
        console.error("❌ Error updating user:", err)
        toast({
          title: "Erro",
          description: "Erro inesperado ao atualizar utilizador.",
          variant: "destructive",
        })
        return false
      }
    },
    [toast, fetchUsers],
  )

  const deleteUser = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from("profiles").delete().eq("id", userId)

        if (error) {
          toast({
            title: "Erro",
            description: `Não foi possível apagar o utilizador: ${error.message}`,
            variant: "destructive",
          })
          return false
        }

        toast({
          title: "Sucesso",
          description: "Utilizador apagado com sucesso.",
        })

        await fetchUsers()
        return true
      } catch (err) {
        console.error("❌ Error deleting user:", err)
        toast({
          title: "Erro",
          description: "Erro inesperado ao apagar utilizador.",
          variant: "destructive",
        })
        return false
      }
    },
    [toast, fetchUsers],
  )

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    filteredUsers,
    updateUser,
    deleteUser,
    refreshUsers: fetchUsers,
  }
}
