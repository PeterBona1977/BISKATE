import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, UserPlus, Filter, Download, Mail, Shield, UserX, Edit } from "lucide-react"

export function UsersManagementComplete() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">Gestão de Utilizadores</span>
            <Button size="sm" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Adicionar Utilizador
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="search" placeholder="Procurar utilizadores..." className="pl-8" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Ações em Massa</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Enviar Email</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Alterar Permissões</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <UserX className="mr-2 h-4 w-4" />
                    <span>Desativar Contas</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Data de Registo</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "success" : "destructive"}>{user.status}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{user.registeredDate}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Enviar Email</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Alterar Permissões</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <UserX className="mr-2 h-4 w-4" />
                            <span>Desativar Conta</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Mostrando <strong>5</strong> de <strong>5</strong> utilizadores
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled>
                Próximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Dados de exemplo
const users = [
  {
    id: 1,
    name: "João Silva",
    email: "joao@example.com",
    role: "admin",
    status: "active",
    registeredDate: "15/10/2023",
  },
  {
    id: 2,
    name: "Maria Oliveira",
    email: "maria@example.com",
    role: "user",
    status: "active",
    registeredDate: "22/09/2023",
  },
  {
    id: 3,
    name: "Pedro Santos",
    email: "pedro@example.com",
    role: "user",
    status: "active",
    registeredDate: "10/10/2023",
  },
  {
    id: 4,
    name: "Ana Costa",
    email: "ana@example.com",
    role: "user",
    status: "inactive",
    registeredDate: "05/08/2023",
  },
  {
    id: 5,
    name: "Carlos Ferreira",
    email: "carlos@example.com",
    role: "user",
    status: "active",
    registeredDate: "18/10/2023",
  },
]
