"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Users } from "lucide-react"
import { useUsersManagement } from "@/hooks/use-users-management"
import { UsersList } from "./users/users-list"
import { UserEditDialog } from "./users/user-edit-dialog"
import type { Database } from "@/lib/supabase/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export function UsersManagementRefactored() {
  const { users, loading, searchTerm, setSearchTerm, filteredUsers, updateUser, deleteUser, refreshUsers } =
    useUsersManagement()
  const [editingUser, setEditingUser] = useState<Profile | null>(null)

  const handleEditUser = (user: Profile) => {
    setEditingUser(user)
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    await deleteUser(userId)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando todos os utilizadores...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header e Pesquisa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestão de Utilizadores
            </span>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {users.length} utilizadores
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={refreshUsers} variant="outline" size="sm">
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Utilizadores */}
      <UsersList
        users={filteredUsers}
        onEdit={handleEditUser}
        onDelete={(userId, userEmail) => {
          // Usar AlertDialog para confirmação
          if (confirm(`Tem certeza que deseja apagar o utilizador ${userEmail}?`)) {
            handleDeleteUser(userId, userEmail)
          }
        }}
      />

      {/* Dialog de Edição */}
      <UserEditDialog
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={updateUser}
      />
    </div>
  )
}
