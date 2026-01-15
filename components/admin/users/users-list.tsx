"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, Users, Shield, User } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Database } from "@/lib/supabase/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface UsersListProps {
  users: Profile[]
  onEdit: (user: Profile) => void
  onDelete: (userId: string, userEmail: string) => void
}

export function UsersList({ users, onEdit, onDelete }: UsersListProps) {
  const router = useRouter()

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

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Nenhum utilizador encontrado.</p>
          <p className="text-sm text-gray-400">
            Verifique se as políticas RLS permitem que admins vejam todos os utilizadores.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {users.map((user) => (
        <Card key={user.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {getRoleIcon(user.role || "user")}
                      {user.full_name || "Nome não informado"}
                    </h3>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getRoleBadgeColor(user.role || "user")}>{user.role || "user"}</Badge>
                      <Badge className={getPlanBadgeColor(user.plan || "free")}>{user.plan || "free"}</Badge>
                      <span className="text-sm text-gray-500">Respostas: {user.responses_used || 0}</span>
                      <span className="text-sm text-gray-500">
                        Criado: {new Date(user.created_at).toLocaleDateString("pt-PT")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => router.push(`/admin/users/${user.id}`)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(user.id, user.email || "")}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
