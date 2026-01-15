"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Shield, Clock, Euro } from "lucide-react"

interface PaymentInfoModalProps {
  isOpen: boolean
  onClose: () => void
  gig: {
    id: string
    title: string
    budget_min: number
    budget_max: number
  }
  onProceedToPayment: () => void
}

export default function PaymentInfoModal({ isOpen, onClose, gig: biskate, onProceedToPayment }: PaymentInfoModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const estimatedAmount = (biskate.budget_min + biskate.budget_max) / 2
  const platformFee = estimatedAmount * 0.05 // 5% taxa da plataforma
  const totalAmount = estimatedAmount + platformFee

  const handleProceed = async () => {
    setIsLoading(true)
    try {
      await onProceedToPayment()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </DialogTitle>
          <DialogDescription>Details about your service payment on GigHub</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{biskate.title}</CardTitle>
              <CardDescription>
                Orçamento: €{biskate.budget_min} - €{biskate.budget_max}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Estimated value</span>
                <span className="font-medium">€{estimatedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Platform fee (5%)</span>
                <span className="font-medium">€{platformFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <span className="text-lg">€{totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Pagamento Seguro</h4>
                <p className="text-sm text-blue-700">Seu dinheiro fica em escrow até o trabalho ser concluído</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Clock className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Proteção ao Cliente</h4>
                <p className="text-sm text-green-700">Só liberamos o pagamento quando você aprovar o trabalho</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <Euro className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Reembolso Garantido</h4>
                <p className="text-sm text-yellow-700">Se não ficar satisfeito, devolvemos seu dinheiro</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleProceed}
              disabled={isLoading}
              className="flex-1"
              style={{ backgroundColor: "rgb(79, 70, 229)" }}
            >
              {isLoading ? "Processing..." : "Proceed"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
