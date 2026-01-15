"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X, Edit, Trash2, Eye } from "lucide-react"
import { AlertDialogTrigger } from "@/components/ui/alert-dialog"
import type { Gig } from "@/hooks/use-gigs-management"

interface GigsListProps {
  gigs: Gig[]
  onEdit: (gig: Gig) => void
  onApprove: (gigId: string, gigTitle: string) => void
  onReject: (gigId: string, gigTitle: string) => void
  onDelete: (gigId: string, gigTitle: string) => void
  isLoading: boolean
}

export function GigsList({ gigs, onEdit, onApprove, onReject, onDelete, isLoading }: GigsListProps) {
  const router = useRouter()

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando gigs...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (gigs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Nenhuma gig encontrada.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {gigs.map((gig) => (
        <Card key={gig.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{gig.title}</h3>
                    <p className="text-gray-600 mt-1 line-clamp-2">{gig.description}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      <Badge className={getStatusBadgeColor(gig.status || "pending")}>{gig.status || "pending"}</Badge>
                      <span className="text-sm text-gray-500">Categoria: {gig.category}</span>
                      <span className="text-sm font-medium text-green-600">€{Number(gig.price || 0).toFixed(2)}</span>
                      <span className="text-sm text-gray-500">📍 {gig.location}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Autor: {gig.profiles?.full_name || "Nome não informado"} ({gig.profiles?.email})
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Botões de Aprovação/Rejeição para gigs pendentes */}
                {gig.status === "pending" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/admin/gigs/${gig.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600"
                      onClick={() => onApprove(gig.id, gig.title || "")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => onReject(gig.id, gig.title || "")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Botão Editar */}
                <Button variant="outline" size="sm" onClick={() => onEdit(gig)}>
                  <Edit className="h-4 w-4" />
                </Button>

                {/* Botão Apagar */}
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
