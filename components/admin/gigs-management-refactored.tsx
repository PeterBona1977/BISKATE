"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { Search } from "lucide-react"
import { useGigsManagement } from "@/hooks/use-gigs-management"
import { GigsList } from "./gigs/gigs-list"
import { GigEditDialog } from "./gigs/gig-edit-dialog"
import { GigDeleteDialog } from "./gigs/gig-actions"

export function GigsManagementRefactored() {
  const {
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
  } = useGigsManagement()

  const [deletingGig, setDeletingGig] = useState<{ id: string; title: string } | null>(null)

  const handleDeleteConfirm = () => {
    if (deletingGig) {
      handleDeleteGig(deletingGig.id, deletingGig.title)
      setDeletingGig(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header e Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gestão de Biskates</span>
            <Badge variant="outline">{filteredGigs.length} biskates</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por título, descrição ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Gigs */}
      <GigsList
        gigs={filteredGigs}
        onEdit={handleEditGig}
        onApprove={handleApproveGig}
        onReject={handleRejectGig}
        onDelete={(id, title) => setDeletingGig({ id, title })}
        isLoading={loading}
      />

      {/* Dialog de Edição */}
      <Dialog
        open={!!editingGig}
        onOpenChange={(open) => {
          if (!open) setEditingGig(null)
        }}
      >
        <GigEditDialog
          gig={editingGig}
          formData={editForm}
          onFormChange={setEditForm}
          onSave={handleSaveGig}
          onCancel={() => setEditingGig(null)}
        />
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog
        open={!!deletingGig}
        onOpenChange={(open) => {
          if (!open) setDeletingGig(null)
        }}
      >
        {deletingGig && <GigDeleteDialog gigTitle={deletingGig.title} onConfirmDelete={handleDeleteConfirm} />}
      </AlertDialog>
    </div>
  )
}
