"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlanLimitsService, type UserQuotas } from "@/lib/monetization/plan-limits-service"
import { Calendar, Eye, FileText, MessageSquare, Zap } from "lucide-react"
import Link from "next/link"

interface UsageQuotaDisplayProps {
    userId: string
    compact?: boolean
    showUpgradeButton?: boolean
}

export function UsageQuotaDisplay({ userId, compact = false, showUpgradeButton = true }: UsageQuotaDisplayProps) {
    const [quotas, setQuotas] = useState<UserQuotas | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadQuotas() {
            const data = await PlanLimitsService.getUserQuotas(userId)
            setQuotas(data)
            setLoading(false)
        }
        loadQuotas()
    }, [userId])

    if (loading) {
        return (
            <Card className={compact ? "border-0 shadow-none" : ""}>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded"></div>
                        <div className="h-2 bg-gray-200 rounded"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!quotas) {
        return null
    }

    const isUnlimited = quotas.plan_tier === "unlimited"
    const isPremium = quotas.plan_tier === "pro" || quotas.plan_tier === "unlimited"

    const quotaItems = [
        {
            icon: Eye,
            label: "Visualizações de Contacto",
            used: quotas.contact_views_used,
            limit: quotas.contact_views_limit,
            remaining: quotas.contact_views_remaining,
            color: "blue",
        },
        {
            icon: FileText,
            label: "Propostas",
            used: quotas.proposals_used,
            limit: quotas.proposals_limit,
            remaining: quotas.proposals_remaining,
            color: "green",
        },
        {
            icon: MessageSquare,
            label: "Respostas a Gigs",
            used: quotas.gig_responses_used,
            limit: quotas.gig_responses_limit,
            remaining: quotas.gig_responses_remaining,
            color: "purple",
        },
    ]

    const getPercentage = (used: number, limit: number) => {
        if (limit === 2147483647) return 0 // Unlimited
        return Math.min(100, (used / limit) * 100)
    }

    const getProgressColor = (percentage: number) => {
        if (percentage >= 90) return "bg-red-500"
        if (percentage >= 70) return "bg-yellow-500"
        return "bg-green-500"
    }

    if (compact) {
        return (
            <div className="space-y-3">
                {quotaItems.map((item) => {
                    const percentage = getPercentage(item.used, item.limit)
                    const Icon = item.icon
                    return (
                        <div key={item.label} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                <span className="text-gray-600">
                                    {isUnlimited ? (
                                        <Badge variant="secondary" className="text-xs">
                                            <Zap className="h-3 w-3 mr-1" />
                                            Ilimitado
                                        </Badge>
                                    ) : (
                                        `${item.used} / ${item.limit}`
                                    )}
                                </span>
                            </div>
                            {!isUnlimited && (
                                <Progress
                                    value={percentage}
                                    className="h-2"
                                    indicatorClassName={getProgressColor(percentage)}
                                />
                            )}
                        </div>
                    )
                })}

                {!isUnlimited && quotas.next_reset_date && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                        <Calendar className="h-3 w-3" />
                        <span>Renova em {new Date(quotas.next_reset_date).toLocaleDateString("pt-PT")}</span>
                    </div>
                )}
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Uso de Quota
                            <Badge variant={isPremium ? "default" : "secondary"} className="capitalize">
                                {quotas.plan_tier}
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            {isUnlimited
                                ? "Acesso ilimitado a todas as funcionalidades"
                                : "Acompanhe o seu uso mensal"}
                        </CardDescription>
                    </div>
                    {showUpgradeButton && !isUnlimited && (
                        <Link href="/pricing">
                            <Button size="sm" variant="outline">
                                <Zap className="h-4 w-4 mr-2" />
                                Upgrade
                            </Button>
                        </Link>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {quotaItems.map((item) => {
                    const percentage = getPercentage(item.used, item.limit)
                    const Icon = item.icon
                    const isLow = percentage >= 70

                    return (
                        <div key={item.label} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isUnlimited ? (
                                        <Badge variant="secondary" className="text-xs">
                                            <Zap className="h-3 w-3 mr-1" />
                                            Ilimitado
                                        </Badge>
                                    ) : (
                                        <>
                                            <span className="text-sm text-gray-600">
                                                {item.remaining} restantes
                                            </span>
                                            {isLow && item.remaining > 0 && (
                                                <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
                                                    Baixo
                                                </Badge>
                                            )}
                                            {item.remaining === 0 && (
                                                <Badge variant="destructive" className="text-xs">
                                                    Esgotado
                                                </Badge>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {!isUnlimited && (
                                <>
                                    <Progress
                                        value={percentage}
                                        className="h-2"
                                        indicatorClassName={getProgressColor(percentage)}
                                    />
                                    <p className="text-xs text-gray-500">
                                        {item.used} de {item.limit} utilizados
                                    </p>
                                </>
                            )}
                        </div>
                    )
                })}

                {!isUnlimited && quotas.next_reset_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 pt-4 border-t">
                        <Calendar className="h-4 w-4" />
                        <span>
                            Quota renova em{" "}
                            <strong>{new Date(quotas.next_reset_date).toLocaleDateString("pt-PT")}</strong>
                        </span>
                    </div>
                )}

                {isPremium && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-start gap-3">
                            <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-sm text-gray-900">Benefícios Premium</h4>
                                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                                    <li>✓ Destaque nos resultados de pesquisa</li>
                                    <li>✓ Badge {quotas.plan_tier === "pro" ? "PRO" : "VIP"} no perfil</li>
                                    <li>✓ Quotas elevadas</li>
                                    {quotas.plan_tier === "unlimited" && <li>✓ Sem limites!</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
