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
import {
  Search,
  MoreHorizontal,
  PlusCircle,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"

export function GigsManagementComplete() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">Gestão de Gigs</span>
            <Button size="sm" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Adicionar Gig
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="search" placeholder="Procurar gigs..." className="pl-8" />
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
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span>Aprovar Selecionados</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <XCircle className="mr-2 h-4 w-4" />
                    <span>Rejeitar Selecionados</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Eliminar Selecionados</span>
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
                  <TableHead>Título</TableHead>
                  <TableHead>Criador</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gigs.map((gig) => (
                  <TableRow key={gig.id}>
                    <TableCell>
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    </TableCell>
                    <TableCell className="font-medium">{gig.title}</TableCell>
                    <TableCell>{gig.creator}</TableCell>
                    <TableCell>{gig.category}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(gig.status)}>{gig.status}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{gig.createdDate}</TableCell>
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
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Ver Detalhes</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Aprovar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>Rejeitar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
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
              Mostrando <strong>12</strong> de <strong>12</strong> gigs
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

// Função auxiliar para determinar a variante do badge com base no status
function getStatusVariant(status: string) {
  switch (status) {
    case "ativo":
      return "success"
    case "pendente":
      return "warning"
    case "rejeitado":
      return "destructive"
    default:
      return "secondary"
  }
}

// Dados de exemplo
const gigs = [
  {
    id: 1,
    title: "Desenvolvimento de Website",
    creator: "João Silva",
    category: "Programação",
    status: "ativo",
    createdDate: "15/10/2023",
  },
  {
    id: 2,
    title: "Design de Logo",
    creator: "Maria Oliveira",
    category: "Design",
    status: "ativo",
    createdDate: "22/09/2023",
  },
  {
    id: 3,
    title: "Tradução de Documentos",
    creator: "Pedro Santos",
    category: "Tradução",
    status: "pendente",
    createdDate: "10/10/2023",
  },
  {
    id: 4,
    title: "Edição de Vídeo",
    creator: "Ana Costa",
    category: "Multimédia",
    status: "rejeitado",
    createdDate: "05/08/2023",
  },
  {
    id: 5,
    title: "Consultoria SEO",
    creator: "Carlos Ferreira",
    category: "Marketing",
    status: "ativo",
    createdDate: "18/10/2023",
  },
  {
    id: 6,
    title: "Ilustração Digital",
    creator: "Sofia Almeida",
    category: "Design",
    status: "ativo",
    createdDate: "25/09/2023",
  },
  {
    id: 7,
    title: "Redação de Artigos",
    creator: "Miguel Ribeiro",
    category: "Escrita",
    status: "pendente",
    createdDate: "12/10/2023",
  },
  {
    id: 8,
    title: "Desenvolvimento de App Mobile",
    creator: "Luísa Fernandes",
    category: "Programação",
    status: "ativo",
    createdDate: "30/09/2023",
  },
  {
    id: 9,
    title: "Fotografia de Produto",
    creator: "Ricardo Sousa",
    category: "Fotografia",
    status: "ativo",
    createdDate: "08/10/2023",
  },
  {
    id: 10,
    title: "Transcrição de Áudio",
    creator: "Teresa Martins",
    category: "Áudio",
    status: "pendente",
    createdDate: "14/10/2023",
  },
  {
    id: 11,
    title: "Animação 3D",
    creator: "André Pinto",
    category: "Animação",
    status: "rejeitado",
    createdDate: "02/10/2023",
  },
  {
    id: 12,
    title: "Consultoria Financeira",
    creator: "Catarina Lopes",
    category: "Finanças",
    status: "ativo",
    createdDate: "20/10/2023",
  },
]
