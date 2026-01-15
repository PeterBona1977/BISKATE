"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Edit, MapPin, Clock, Euro, Tag } from "lucide-react"

interface VoiceConfirmationProps {
  isOpen: boolean
  onClose: () => void
  extractedData: {
    title: string
    description: string
    category: string
    price: number
    location: string
    estimatedTime: string
  }
  onConfirm: () => void
  onEdit: () => void
}

export function VoiceConfirmation({ isOpen, onClose, extractedData, onConfirm, onEdit }: VoiceConfirmationProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Confirmar Criação de Gig
          </DialogTitle>
          <DialogDescription>Verifique os detalhes extraídos da sua mensagem de voz</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dados extraídos */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{extractedData.title}</h3>
                <p className="text-sm text-gray-600">{extractedData.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Euro className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Preço</p>
                    <p className="font-semibold">
                      {extractedData.price > 0 ? `€${extractedData.price.toFixed(2)}` : "A definir"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Categoria</p>
                    <Badge variant="outline" className="text-xs">
                      {extractedData.category}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-xs text-gray-500">Localização</p>
                    <p className="font-semibold">{extractedData.location || "A definir"}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Tempo Estimado</p>
                    <p className="font-semibold">{extractedData.estimatedTime}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aviso sobre moderação */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Nota:</strong> O seu gig será enviado para moderação e estará disponível após aprovação.
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex space-x-3">
            <Button onClick={onConfirm} className="flex-1 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Confirmar e Criar Gig
            </Button>
            <Button variant="outline" onClick={onEdit} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
