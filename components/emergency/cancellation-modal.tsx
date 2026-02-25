"use client"

import { useState } from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Loader2 } from "lucide-react"

interface CancellationModalProps {
    open: boolean
    onClose: () => void
    onConfirm: (reason: string) => Promise<void>
    cancelledBy: "client" | "provider"
    providerEnRoute?: boolean  // client cancelling while provider in_progress/arrived
}

export function CancellationModal({ open, onClose, onConfirm, cancelledBy, providerEnRoute }: CancellationModalProps) {
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        if (!reason.trim()) return
        try {
            setLoading(true)
            await onConfirm(reason.trim())
            setReason("")
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Confirmar Cancelamento
                    </DialogTitle>
                    <DialogDescription>
                        {cancelledBy === "client"
                            ? "Tem a certeza que deseja cancelar esta emergência?"
                            : "Tem a certeza que deseja cancelar esta ocorrência?"
                        }
                    </DialogDescription>
                </DialogHeader>

                {/* ⚠️ Warning if client cancels while provider is en route */}
                {cancelledBy === "client" && providerEnRoute && (
                    <div className="flex gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
                        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-black text-red-700 text-sm">Atenção: taxa de deslocação será cobrada</p>
                            <p className="text-xs text-red-600 mt-1">
                                O técnico já está em trajeto para o seu local. Se cancelar agora,
                                a <strong>taxa de deslocação será cobrada na mesma</strong> a favor do técnico.
                            </p>
                        </div>
                    </div>
                )}

                {/* Provider cancels info */}
                {cancelledBy === "provider" && (
                    <div className="flex gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
                        <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">
                            Ao cancelar, a taxa de deslocação será <strong>devolvida na totalidade ao cliente</strong>.
                        </p>
                    </div>
                )}

                <div className="py-2">
                    <label className="text-sm font-bold text-gray-700 mb-2 block">
                        Motivo do cancelamento <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Descreva o motivo do cancelamento..."
                        className="min-h-[100px] resize-none"
                        maxLength={500}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{reason.length}/500</p>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Voltar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={loading || !reason.trim()}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {cancelledBy === "client" && providerEnRoute
                            ? "Confirmar (taxa cobrada)"
                            : "Confirmar Cancelamento"
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
