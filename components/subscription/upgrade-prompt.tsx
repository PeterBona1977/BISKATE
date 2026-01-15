"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Check, X } from "lucide-react"
import Link from "next/link"
import type { ActionType } from "@/lib/monetization/plan-limits-service"

interface UpgradePromptProps {
    open: boolean
    onClose: () => void
    limitType: ActionType
    currentPlan: "free" | "essential" | "pro" | "unlimited"
    nextResetDate?: string
}

const ACTION_LABELS: Record<ActionType, string> = {
    proposal: "propostas",
    gig_response: "respostas a gigs",
    contact_view: "visualizações de contacto",
}

const PLAN_NAMES: Record<string, string> = {
    free: "Grátis",
    essential: "Essential",
    pro: "Pro",
    unlimited: "Unlimited",
}

const RECOMMENDED_PLAN: Record<string, "essential" | "pro" | "unlimited"> = {
    free: "essential",
    essential: "pro",
    pro: "unlimited",
}

export function UpgradePrompt({ open, onClose, limitType, currentPlan, nextResetDate }: UpgradePromptProps) {
    const recommendedPlan = RECOMMENDED_PLAN[currentPlan]
    const actionLabel = ACTION_LABELS[limitType] || "ações"

    const planFeatures = {
        essential: [
            "50 visualizações de contacto/mês",
            "30 propostas/mês",
            "75 respostas a gigs/mês",
            "Suporte prioritário",
        ],
        pro: [
            "150 visualizações de contacto/mês",
            "100 propostas/mês",
            "250 respostas a gigs/mês",
            "Destaque nos resultados",
            "Badge PRO no perfil",
            "Analytics avançados",
        ],
        unlimited: [
            "Visualizações ilimitadas",
            "Propostas ilimitadas",
            "Respostas ilimitadas",
            "Badge VIP no perfil",
            "Branding personalizado",
            "Suporte dedicado",
        ],
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Limite de Quota Atingido
                    </DialogTitle>
                    <DialogDescription>
                        Esgotou o seu limite mensal de {actionLabel} no plano{" "}
                        <Badge variant="secondary" className="capitalize">
                            {PLAN_NAMES[currentPlan]}
                        </Badge>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {nextResetDate && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-900">
                                <strong>A sua quota renova em:</strong>{" "}
                                {new Date(nextResetDate).toLocaleDateString("pt-PT", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    )}

                    <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                                Upgrade para {PLAN_NAMES[recommendedPlan]}
                            </h4>
                            <Badge className="bg-green-600">Recomendado</Badge>
                        </div>

                        <ul className="space-y-2">
                            {planFeatures[recommendedPlan].map((feature, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        Continue a usar a plataforma sem limites!
                    </p>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Continuar com {PLAN_NAMES[currentPlan]}
                    </Button>
                    <Link href="/pricing" className="w-full sm:w-auto">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            <Zap className="h-4 w-4 mr-2" />
                            Ver Planos
                        </Button>
                    </Link>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
