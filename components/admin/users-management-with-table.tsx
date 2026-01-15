"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye, Users, Shield, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog } from "@/components/ui/dialog"
import { useUsersManagement } from "@/hooks/use-users-management"
import { UserEditDialog } from "./users/user-edit-dialog"
import { AdminTable, type Column } from "./shared/admin-table"
import { AdminSearchFilter, type FilterOption } from "./shared/admin-search-filter"
import { AdminErrorBoundary } from "./shared/admin-error-boundary"
import type { Database } from "@/lib/supabase/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export function UsersManagementWithTable() {
  const router = useRouter()
  const { users, loading, filteredUsers, updateUser, deleteUser, refreshUsers } = useUsersManagement()
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [planFilter, setPlanFilter] = useState("")

  // Filtros para o componente de pesquisa
  const filters: FilterOption[] = [
    {
      label: "Função",
      value: "role",
      options: [
        { label: "Administrador", value: "admin" },
        { label: "Fornecedor", value: "provider" },
        { label: "Utilizador", value: "user" },
      ],
    },
    {
      label: "Plano",
      value: "plan",
      options: [
        { label: "Free", value: "free" },
        { label: "Essential", value: "essential" },
        { label: "Pro", value: "pro" },
        { label: "Unlimited", value: "unlimited" },
      ],
    },
  ]

  // Função para filtrar utilizadores
  const getFilteredUsers = () => {
    return users.filter((user) => {
      const matchesSearch =
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole = !roleFilter || roleFilter === "all" || user.role === roleFilter
      const matchesPlan = !planFilter || planFilter === "all" || user.plan === planFilter

      return matchesSearch && matchesRole && matchesPlan
    })
  }

  const handleFilterChange = (filter: string, value: string) => {
    if (filter === "role") {
      setRoleFilter(value === "all" ? "" : value)
    } else if (filter === "plan") {
      setPlanFilter(value === "all" ? "" : value)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (confirm(`Tem certeza que deseja apagar o utilizador ${userEmail}?`)) {
      await deleteUser(userId)
    }
  }

  // Ícones para roles
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />
      case "provider":
        return <Users className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  // Cores para badges
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "provider":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "unlimited":
        return "bg-purple-100 text-purple-800"
      case "pro":
        return "bg-green-100 text-green-800"
      case "essential":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Definição das colunas da tabela
  const columns: Column<Profile>[] = [
    {
      header: "Utilizador",
      accessorKey: (row) => (
        <div className="flex items-center space-x-3">
          {getRoleIcon(row.role || "user")}
          <div>
            <div className="font-medium">{row.full_name || "Nome não informado"}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Função",
      accessorKey: "role",
      cell: (row) => <Badge className={getRoleBadgeColor(row.role || "user")}>{row.role || "user"}</Badge>,
    },
    {
      header: "Plano",
      accessorKey: "plan",
      cell: (row) => <Badge className={getPlanBadgeColor(row.plan || "free")}>{row.plan || "free"}</Badge>,
    },
    {
      header: "Respostas",
      accessorKey: "responses_used",
      cell: (row) => <span className="text-sm">{row.responses_used || 0}</span>,
    },
    {
      header: "Criado em",
      accessorKey: "created_at",
      cell: (row) => <span className="text-sm">{new Date(row.created_at).toLocaleDateString("pt-PT")}</span>,
    },
    {
      header: "Ações",
      accessorKey: (row) => (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/users/${row.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditingUser(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600"
            onClick={() => handleDeleteUser(row.id, row.email || "")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "w-32",
    },
  ]

  const currentFilteredUsers = getFilteredUsers()

  return (
    <AdminErrorBoundary>
      <div className="space-y-6">
        {/* Filtros de Pesquisa */}
        <AdminSearchFilter
          placeholder="Pesquisar por nome ou email..."
          filters={filters}
          onSearch={setSearchTerm}
          onFilterChange={handleFilterChange}
        />

        {/* Tabela de Utilizadores */}
        <AdminTable
          data={currentFilteredUsers}
          columns={columns}
          title="Gestão de Utilizadores"
          totalItems={currentFilteredUsers.length}
          itemsPerPage={10}
          isLoading={loading}
          emptyMessage="Nenhum utilizador encontrado"
          actions={
            <Button onClick={refreshUsers} variant="outline" size="sm">
              Atualizar
            </Button>
          }
        />

        {/* Dialog de Edição */}
        <Dialog
          open={!!editingUser}
          onOpenChange={(open) => {
            if (!open) setEditingUser(null)
          }}
        >
          <UserEditDialog
            user={editingUser}
            isOpen={!!editingUser}
            onClose={() => setEditingUser(null)}
            onSave={updateUser}
          />
        </Dialog>
      </div>
    </AdminErrorBoundary>
  )
}
