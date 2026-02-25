"use client"

import { useState } from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, AlertTriangle, Scale, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

type Step = "choose" | "failure_reason" | "refund_confirm" | "dispute"

interface ServiceCompletionModalProps {
    open: boolean
    onClose: () => void
    emergencyId: string
    assessmentId: string | null
    onCompleted: () => void
}

export function ServiceCompletionModal({
    open, onClose, emergencyId, assessmentId, onCompleted
}: ServiceCompletionModalProps) {
    const [step, setStep] = useState<Step>("choose")
    const [failureReason, setFailureReason] = useState("")
    const [disputeReason, setDisputeReason] = useState("")
    const [loading, setLoading] = useState(false)

    const reset = () => { setStep("choose"); setFailureReason(""); setDisputeReason("") }

    const handleClose = () => { reset(); onClose() }

    const call = async (success: boolean, agreeRefund?: boolean) => {
        setLoading(true)
        try {
            const res = await fetch("/api/emergency/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emergencyId,
                    assessmentId,
                    success,
                    failureReason: failureReason.trim() || undefined,
                    agreeRefund,
                    disputeReason: disputeReason.trim() || undefined
                })
            })
            if (!res.ok) throw new Error((await res.json()).error)
            toast({
                title: success ? "Serviço concluído!" : agreeRefund ? "Registado" : "Litígio aberto",
                description: success
                    ? "Pagamento processado. Obrigado!"
                    : agreeRefund
                        ? "O valor do serviço será devolvido ao cliente. A deslocação foi cobrada."
                        : "A plataforma irá deliberar. A deslocação foi cobrada."
            })
            onCompleted()
            handleClose()
        } catch (err: any) {
            toast({ title: "Erro", description: err.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle className="font-black text-xl">Conclusão do Serviço</DialogTitle>
                    <DialogDescription>Como decorreu o serviço?</DialogDescription>
                </DialogHeader>

                {step === "choose" && (
                    <div className="grid grid-cols-1 gap-3 py-2">
                        <Button
                            className="h-16 bg-green-600 hover:bg-green-700 text-white font-black text-base"
                            onClick={() => call(true)}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                            Serviço Concluído com Sucesso
                        </Button>
                        <Button
                            variant="outline"
                            className="h-16 border-orange-200 text-orange-700 hover:bg-orange-50 font-bold text-base"
                            onClick={() => setStep("failure_reason")}
                            disabled={loading}
                        >
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Não Foi Possível Terminar
                        </Button>
                    </div>
                )}

                {step === "failure_reason" && (
                    <div className="space-y-4 py-2">
                        <div>
                            <p className="text-sm font-bold mb-2">Descreva o motivo pelo qual não foi possível concluir</p>
                            <Textarea
                                value={failureReason}
                                onChange={e => setFailureReason(e.target.value)}
                                placeholder="Ex: Peça necessária não disponível, problema mais grave do que o esperado..."
                                className="min-h-[100px] resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep("choose")} disabled={loading} className="flex-1">Voltar</Button>
                            <Button
                                className="flex-1"
                                onClick={() => setStep("refund_confirm")}
                                disabled={!failureReason.trim() || loading}
                            >
                                Continuar
                            </Button>
                        </div>
                    </div>
                )}

                {step === "refund_confirm" && (
                    <div className="space-y-4 py-2">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                            <p className="font-bold mb-1">Concorda em devolver o valor do serviço ao cliente?</p>
                            <p className="text-xs">A taxa de deslocação será cobrada independentemente. Apenas o valor do serviço está em questão.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep("failure_reason")} disabled={loading} className="flex-1">Voltar</Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                disabled={loading}
                                onClick={() => setStep("dispute")}
                            >
                                <Scale className="h-4 w-4 mr-2" /> Não concordo
                            </Button>
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                disabled={loading}
                                onClick={() => call(false, true)}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Concordo
                            </Button>
                        </div>
                    </div>
                )}

                {step === "dispute" && (
                    <div className="space-y-4 py-2">
                        <div className="flex gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
                            <Scale className="h-5 w-5 text-red-600 shrink-0" />
                            <p className="text-xs text-red-700">
                                Ao abrir litígio, <strong>nem o técnico recebe nem o cliente é ressarcido</strong> até a plataforma deliberar. A taxa de deslocação é cobrada imediatamente.
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-bold mb-2">Justifique a sua posição</p>
                            <Textarea
                                value={disputeReason}
                                onChange={e => setDisputeReason(e.target.value)}
                                placeholder="Explique porquê entende que deve ser cobrado algum valor pelo serviço..."
                                className="min-h-[100px] resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep("refund_confirm")} disabled={loading} className="flex-1">Voltar</Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                disabled={!disputeReason.trim() || loading}
                                onClick={() => call(false, false)}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Scale className="h-4 w-4 mr-2" />}
                                Abrir Litígio
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
