"use client"

import { useState } from "react"
import { AdminTable, type Column } from "./shared/admin-table"
import { AdminSearchFilter, type FilterOption } from "./shared/admin-search-filter"
import { AdminLoadingState } from "./shared/admin-loading-state"
import { AdminErrorBoundary } from "./shared/admin-error-boundary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Plus } from "lucide-react"

// Exemplo de tipo de dados
interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

export function ExampleAdminTableUsage() {
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Dados de exemplo
  const users: User[] = [
    {
      id: "1",
      name: "João Silva",
      email: "joao@example.com",
      role: "admin",
      status: "active",
      createdAt: "2023-01-15",
    },
    {
      id: "2",
      name: "Maria Oliveira",
      email: "maria@example.com",
      role: "user",
      status: "active",
      createdAt: "2023-02-20",
    },
    {
      id: "3",
      name: "Pedro Santos",
      email: "pedro@example.com",
      role: "editor",
      status: "inactive",
      createdAt: "2023-03-10",
    },
    // Mais dados...
  ]

  // Filtros
  const filters: FilterOption[] = [
    {
      label: "Função",
      value: "role",
      options: [
        { label: "Administrador", value: "admin" },
        { label: "Utilizador", value: "user" },
        { label: "Editor", value: "editor" },
      ],
    },
    {
      label: "Status",
      value: "status",
      options: [
        { label: "Ativo", value: "active" },
        { label: "Inativo", value: "inactive" },
      ],
    },
  ]

  // Colunas da tabela
  const columns: Column<User>[] = [
    {
      header: "Nome",
      accessorKey: "name",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Função",
      accessorKey: "role",
      cell: (row) => {
        const roleColors: Record<string, string> = {
          admin: "bg-purple-100 text-purple-800",
          user: "bg-blue-100 text-blue-800",
          editor: "bg-green-100 text-green-800",
        }

        return <Badge className={roleColors[row.role] || "bg-gray-100 text-gray-800"}>{row.role}</Badge>
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => (
        <Badge className={row.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
          {row.status === "active" ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      header: "Data de Criação",
      accessorKey: "createdAt",
    },
    {
      header: "Ações",
      accessorKey: (row) => (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "w-24",
    },
  ]

  // Filtragem de dados
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = !roleFilter || user.role === roleFilter
    const matchesStatus = !statusFilter || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleFilterChange = (filter: string, value: string) => {
    if (filter === "role") {
      setRoleFilter(value)
    } else if (filter === "status") {
      setStatusFilter(value)
    }
  }

  // Simulação de carregamento
  const simulateLoading = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1500)
  }

  return (
    <AdminErrorBoundary>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Gestão de Utilizadores</h2>
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            <span>Novo Utilizador</span>
          </Button>
        </div>

        <AdminSearchFilter
          placeholder="Pesquisar por nome ou email..."
          filters={filters}
          onSearch={setSearchTerm}
          onFilterChange={handleFilterChange}
        />

        {isLoading ? (
          <AdminLoadingState message="Carregando utilizadores..." />
        ) : (
          <AdminTable
            data={filteredUsers}
            columns={columns}
            title="Utilizadores"
            totalItems={filteredUsers.length}
            itemsPerPage={5}
          />
        )}

        <div className="flex justify-center">
          <Button variant="outline" onClick={simulateLoading}>
            Simular Carregamento
          </Button>
        </div>
      </div>
    </AdminErrorBoundary>
  )
}
