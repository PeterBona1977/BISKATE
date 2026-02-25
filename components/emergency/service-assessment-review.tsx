"use client"

import { useState } from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Euro, Camera, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Assessment {
    id: string
    description: string
    final_price: number
    photos: string[]
}

interface ServiceAssessmentReviewProps {
    open: boolean
    assessment: Assessment | null
    emergencyId: string
    onClose: () => void
    onResponded: () => void
}

export function ServiceAssessmentReview({
    open, assessment, emergencyId, onClose, onResponded
}: ServiceAssessmentReviewProps) {
    const [declining, setDeclining] = useState(false)
    const [declineReason, setDeclineReason] = useState("")
    const [loading, setLoading] = useState(false)
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

    const handleRespond = async (accept: boolean) => {
        if (!assessment) return
        if (!accept && !declineReason.trim()) { setDeclining(true); return }
        setLoading(true)
        try {
            const res = await fetch("/api/emergency/assessment/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assessmentId: assessment.id,
                    emergencyId,
                    accept,
                    declineReason: accept ? undefined : declineReason.trim()
                })
            })
            if (!res.ok) throw new Error((await res.json()).error)
            toast({
                title: accept ? "Serviço aceite!" : "Serviço recusado",
                description: accept
                    ? "O valor foi autorizado. O técnico iniciará o serviço."
                    : "A deslocação foi cobrada. Serviço encerrado."
            })
            onResponded()
            onClose()
        } catch (err: any) {
            toast({ title: "Erro", description: err.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    if (!assessment) return null

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-black text-xl">🔧 Avaliação do Técnico</DialogTitle>
                    </DialogHeader>

                    {/* Price */}
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase text-red-400">Valor do Serviço</p>
                            <p className="text-3xl font-black text-red-600">€{Number(assessment.final_price).toFixed(2)}</p>
                        </div>
                        <Badge className="bg-red-600 text-white">Proposta</Badge>
                    </div>

                    {/* Description */}
                    <div>
                        <p className="text-xs font-bold uppercase text-gray-400 mb-1">Diagnóstico</p>
                        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{assessment.description}</p>
                    </div>

                    {/* Photos */}
                    {assessment.photos?.length > 0 && (
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-1">
                                <Camera className="h-3 w-3" /> {assessment.photos.length} foto(s)
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {assessment.photos.map((url, i) => (
                                    <img
                                        key={i}
                                        src={url}
                                        alt={`foto ${i + 1}`}
                                        onClick={() => setSelectedPhoto(url)}
                                        className="aspect-square rounded-xl object-cover cursor-pointer hover:opacity-90 transition border border-gray-100"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Decline reason */}
                    {declining && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-orange-600">
                                <AlertTriangle className="h-4 w-4" />
                                <p className="text-sm font-bold">Justifique o motivo da recusa</p>
                            </div>
                            <Textarea
                                value={declineReason}
                                onChange={e => setDeclineReason(e.target.value)}
                                placeholder="Motivo pelo qual recusa este orçamento..."
                                className="min-h-[80px] resize-none"
                            />
                            <p className="text-xs text-gray-500">A taxa de deslocação será cobrada. O serviço ficará encerrado.</p>
                        </div>
                    )}

                    <DialogFooter className="gap-2 flex-col sm:flex-row">
                        {!declining ? (
                            <>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => setDeclining(true)}
                                    disabled={loading}
                                >
                                    <XCircle className="h-4 w-4 mr-2" /> Recusar
                                </Button>
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black"
                                    onClick={() => handleRespond(true)}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                    Aceitar (€{Number(assessment.final_price).toFixed(2)})
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" className="flex-1" onClick={() => setDeclining(false)} disabled={loading}>
                                    Voltar
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleRespond(false)}
                                    disabled={loading || !declineReason.trim()}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Confirmar Recusa
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Fullscreen photo preview */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 bg-black/90 z-[99999] flex items-center justify-center cursor-pointer"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <img src={selectedPhoto} alt="foto expandida" className="max-w-full max-h-full object-contain rounded-xl" />
                </div>
            )}
        </>
    )
}
