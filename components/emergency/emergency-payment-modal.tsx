"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShieldCheck, CreditCard, Lock } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => Promise<void>
    amount: number
    providerName: string
}

export function EmergencyPaymentModal({ isOpen, onClose, onSuccess, amount, providerName }: PaymentModalProps) {
    const [processing, setProcessing] = useState(false)

    const handlePay = async () => {
        try {
            setProcessing(true)

            // SIMULATE PAYMENT PROCESS
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Call the success callback (which will accept the provider)
            await onSuccess()

            toast({
                title: "Pagamento Confirmado",
                description: `Valor de €${amount.toFixed(2)} autorizado com sucesso.`,
            })
            onClose()
        } catch (error) {
            console.error("Payment failed", error)
            toast({
                title: "Erro no Pagamento",
                description: "Não foi possível processar o pagamento. Tente novamente.",
                variant: "destructive"
            })
        } finally {
            setProcessing(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Lock className="h-5 w-5 text-green-600" />
                        Pagamento Seguro
                    </DialogTitle>
                    <DialogDescription>
                        Para confirmar o técnico <span className="font-bold text-gray-900">{providerName}</span>, é necessário autorizar o valor da deslocação/serviço mínimo.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total a Pagar</p>
                            <p className="text-2xl font-black text-gray-900">€{amount.toFixed(2)}</p>
                        </div>
                        <Badge variant="outline" className="bg-white text-gray-600 border-gray-200">
                            TAXA DE URGÊNCIA INCLUÍDA
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-blue-50/50 border-blue-100 cursor-pointer ring-2 ring-blue-500 ring-offset-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900">Cartão Visa ending 4242</p>
                                <p className="text-xs text-gray-500">Expira em 12/28</p>
                            </div>
                            <div className="h-4 w-4 bg-blue-600 rounded-full" />
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 justify-center mt-2">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Pagamento seguro via Stripe. O valor só é capturado após conclusão.</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:gap-0">
                    <Button
                        onClick={handlePay}
                        disabled={processing}
                        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg shadow-green-100"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                PROCESSANDO...
                            </>
                        ) : (
                            `PAGAR €${amount.toFixed(2)} & CHAMAR`
                        )}
                    </Button>
                    <Button variant="ghost" onClick={onClose} disabled={processing} className="mt-2 text-xs text-gray-400 hover:text-gray-600">
                        Cancelar e escolher outro
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
