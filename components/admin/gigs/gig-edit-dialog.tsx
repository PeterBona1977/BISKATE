"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Gig, GigFormData } from "@/hooks/use-gigs-management"

interface GigEditDialogProps {
  gig: Gig | null
  formData: GigFormData
  onFormChange: (form: GigFormData) => void
  onSave: () => Promise<void>
  onCancel: () => void
}

export function GigEditDialog({ gig, formData, onFormChange, onSave, onCancel }: GigEditDialogProps) {
  if (!gig) return null

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Editar Biskate</DialogTitle>
        <DialogDescription>Edite as informações do biskate "{gig.title}"</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => onFormChange({ ...formData, category: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="price">Preço (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => onFormChange({ ...formData, price: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => onFormChange({ ...formData, location: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => onFormChange({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSave}>Salvar</Button>
      </DialogFooter>
    </DialogContent>
  )
}
