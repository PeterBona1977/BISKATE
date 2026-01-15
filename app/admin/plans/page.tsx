"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Save, Sparkles, Crown, Check, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PlanLimit {
    id: string
    plan_tier: string
    user_type?: "provider" | "client" | "both"
    contact_views_limit: number
    proposals_limit: number
    gig_responses_limit: number
    has_search_boost: boolean
    has_profile_highlight: boolean
    badge_text: string | null
    reset_period: string
    features: Record<string, any>
    price?: number
    currency?: string
}

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<PlanLimit[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        loadPlans()
    }, [])

    async function loadPlans() {
        setLoading(true)
        const { data, error } = await supabase
            .from("plan_limits")
            .select("*")
            .order("contact_views_limit")

        if (!error && data) {
            setPlans(data)
        }
        setLoading(false)
    }

    async function updatePlan(planId: string, updates: Partial<PlanLimit>) {
        setSaving(planId)

        const { error } = await supabase
            .from("plan_limits")
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq("id", planId)

        if (error) {
            toast({
                title: "Erro ao guardar",
                description: error.message,
                variant: "destructive",
            })
        } else {
            toast({
                title: "Plano atualizado",
                description: "As alterações foram guardadas com sucesso.",
            })
            loadPlans()
        }

        setSaving(null)
    }

    function updatePlanState(planId: string, field: keyof PlanLimit, value: any) {
        setPlans(
            plans.map((p) =>
                p.id === planId ? { ...p, [field]: value } : p
            )
        )
    }

    const getPlanIcon = (tier: string) => {
        switch (tier) {
            case "unlimited":
                return <Crown className="h-5 w-5 text-yellow-500" />
            case "pro":
                return <Sparkles className="h-5 w-5 text-purple-500" />
            case "essential":
                return <Check className="h-5 w-5 text-blue-500" />
            default:
                return null
        }
    }

    const getPlanColor = (tier: string) => {
        switch (tier) {
            case "unlimited":
                return "border-yellow-500 bg-yellow-50"
            case "pro":
                return "border-purple-500 bg-purple-50"
            case "essential":
                return "border-blue-500 bg-blue-50"
            default:
                return "border-gray-300 bg-gray-50"
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Gestão de Planos</h1>
                <p className="text-gray-600">
                    Configure os limites e funcionalidades de cada plano de subscrição
                </p>
            </div>

            <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                    As alterações aplicam-se imediatamente a todos os utilizadores com o respetivo plano.
                    Os limites são renovados automaticamente no período definido para o plano.
                </AlertDescription>
            </Alert>

            <Tabs defaultValue="limits" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="limits">Limites de Quota</TabsTrigger>
                    <TabsTrigger value="features">Funcionalidades Premium</TabsTrigger>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                </TabsList>

                <TabsContent value="limits" className="space-y-6">
                    {plans.map((plan) => (
                        <Card key={plan.id} className={`border-2 ${getPlanColor(plan.plan_tier)}`}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getPlanIcon(plan.plan_tier)}
                                        <div>
                                            <CardTitle className="capitalize">{plan.plan_tier}</CardTitle>
                                            <CardDescription>
                                                Configuração de limites e quotas para o plano {plan.plan_tier}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    {plan.badge_text && (
                                        <Badge variant="default" className="font-bold">
                                            {plan.badge_text}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-dashed">
                                    <Label htmlFor={`${plan.id}-user-type`} className="text-base font-semibold">
                                        Tipo de Utilizador
                                    </Label>
                                    <Select
                                        value={plan.user_type || "provider"}
                                        onValueChange={(value) => {
                                            updatePlanState(plan.id, "user_type", value as "provider" | "client" | "both")
                                        }}
                                    >
                                        <SelectTrigger id={`${plan.id}-user-type`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="provider">👨‍💼 Prestador (Responde a Gigs)</SelectItem>
                                            <SelectItem value="client">👤 Cliente (Publica Gigs)</SelectItem>
                                            <SelectItem value="both">🤝 Ambos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500">
                                        Define a quem se destina este plano
                                    </p>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Contact Views */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`${plan.id}-contact-views`}>
                                            Visualizações de Contacto
                                        </Label>
                                        <Input
                                            id={`${plan.id}-contact-views`}
                                            type="number"
                                            min="0"
                                            value={plan.contact_views_limit === 2147483647 ? "∞" : plan.contact_views_limit}
                                            onChange={(e) => {
                                                const value = e.target.value === "∞" ? 2147483647 : parseInt(e.target.value) || 0
                                                updatePlanState(plan.id, "contact_views_limit", value)
                                            }}
                                            disabled={plan.plan_tier === "unlimited"}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Quantas vezes podem ver contactos de clientes
                                        </p>
                                    </div>

                                    {/* Proposals */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`${plan.id}-proposals`}>
                                            Propostas
                                        </Label>
                                        <Input
                                            id={`${plan.id}-proposals`}
                                            type="number"
                                            min="0"
                                            value={plan.proposals_limit === 2147483647 ? "∞" : plan.proposals_limit}
                                            onChange={(e) => {
                                                const value = e.target.value === "∞" ? 2147483647 : parseInt(e.target.value) || 0
                                                updatePlanState(plan.id, "proposals_limit", value)
                                            }}
                                            disabled={plan.plan_tier === "unlimited"}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Quantas propostas podem submeter por mês
                                        </p>
                                    </div>

                                    {/* Gig Responses */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`${plan.id}-responses`}>
                                            Respostas a Gigs
                                        </Label>
                                        <Input
                                            id={`${plan.id}-responses`}
                                            type="number"
                                            min="0"
                                            value={plan.gig_responses_limit === 2147483647 ? "∞" : plan.gig_responses_limit}
                                            onChange={(e) => {
                                                const value = e.target.value === "∞" ? 2147483647 : parseInt(e.target.value) || 0
                                                updatePlanState(plan.id, "gig_responses_limit", value)
                                            }}
                                            disabled={plan.plan_tier === "unlimited"}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Quantas respostas podem dar a gigs
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor={`${plan.id}-price`}>Preço (Display)</Label>
                                        <Input
                                            id={`${plan.id}-price`}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={plan.price || 0}
                                            onChange={(e) => updatePlanState(plan.id, "price", parseFloat(e.target.value) || 0)}
                                        />
                                        <p className="text-xs text-gray-500">Valor visual a apresentar</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`${plan.id}-currency`}>Moeda</Label>
                                        <Input
                                            id={`${plan.id}-currency`}
                                            value={plan.currency || "EUR"}
                                            onChange={(e) => updatePlanState(plan.id, "currency", e.target.value)}
                                            maxLength={3}
                                        />
                                        <p className="text-xs text-gray-500">Código da moeda (ex: EUR)</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Período de Renovação</p>
                                        <Select
                                            value={plan.reset_period || "monthly"}
                                            onValueChange={(value) => {
                                                updatePlanState(plan.id, "reset_period", value)
                                            }}
                                        >
                                            <SelectTrigger className="w-[180px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Diário</SelectItem>
                                                <SelectItem value="weekly">Semanal</SelectItem>
                                                <SelectItem value="biweekly">Quinzenal</SelectItem>
                                                <SelectItem value="monthly">Mensal</SelectItem>
                                                <SelectItem value="yearly">Anual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-gray-400">
                                            Define a frequência de renovação das quotas
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => updatePlan(plan.id, plan)}
                                        disabled={saving === plan.id}
                                        size="sm"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving === plan.id ? "A guardar..." : "Guardar"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="features" className="space-y-6">
                    {plans.map((plan) => (
                        <Card key={plan.id} className={`border-2 ${getPlanColor(plan.plan_tier)}`}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    {getPlanIcon(plan.plan_tier)}
                                    <div>
                                        <CardTitle className="capitalize">{plan.plan_tier}</CardTitle>
                                        <CardDescription>
                                            Funcionalidades premium e destaque
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    {/* Search Boost */}
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-1">
                                            <Label htmlFor={`${plan.id}-search-boost`} className="text-base">
                                                Destaque em Pesquisas
                                            </Label>
                                            <p className="text-sm text-gray-500">
                                                Prestadores aparecem no topo dos resultados de pesquisa
                                            </p>
                                        </div>
                                        <Switch
                                            id={`${plan.id}-search-boost`}
                                            checked={plan.has_search_boost}
                                            onCheckedChange={(checked) => {
                                                updatePlanState(plan.id, "has_search_boost", checked)
                                            }}
                                        />
                                    </div>

                                    {/* Profile Highlight */}
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-1">
                                            <Label htmlFor={`${plan.id}-profile-highlight`} className="text-base">
                                                Realce de Perfil
                                            </Label>
                                            <p className="text-sm text-gray-500">
                                                Efeito visual de destaque nos cartões de perfil
                                            </p>
                                        </div>
                                        <Switch
                                            id={`${plan.id}-profile-highlight`}
                                            checked={plan.has_profile_highlight}
                                            onCheckedChange={(checked) => {
                                                updatePlanState(plan.id, "has_profile_highlight", checked)
                                            }}
                                        />
                                    </div>

                                    {/* Badge Text */}
                                    <div className="space-y-2 p-4 border rounded-lg">
                                        <Label htmlFor={`${plan.id}-badge`}>
                                            Texto do Badge
                                        </Label>
                                        <Input
                                            id={`${plan.id}-badge`}
                                            value={plan.badge_text || ""}
                                            onChange={(e) => {
                                                updatePlanState(plan.id, "badge_text", e.target.value || null)
                                            }}
                                            placeholder="Ex: PRO, VIP"
                                            maxLength={5}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Badge exibido no perfil do prestador (máx. 5 caracteres)
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => updatePlan(plan.id, plan)}
                                        disabled={saving === plan.id}
                                        size="sm"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving === plan.id ? "A guardar..." : "Guardar"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="overview">
                    <Card>
                        <CardHeader>
                            <CardTitle>Comparação de Planos</CardTitle>
                            <CardDescription>Vista geral de todos os planos lado a lado</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3 font-semibold">Funcionalidade</th>
                                            {plans.map((plan) => (
                                                <th key={plan.id} className="text-center p-3 font-semibold capitalize">
                                                    {plan.plan_tier}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b bg-gray-50">
                                            <td className="p-3 font-semibold">Tipo de Utilizador</td>
                                            {plans.map((plan) => (
                                                <td key={plan.id} className="text-center p-3">
                                                    {plan.user_type === "provider" && "👨‍💼 Prestadores"}
                                                    {plan.user_type === "client" && "👤 Clientes"}
                                                    {plan.user_type === "both" && "🤝 Ambos"}
                                                    {!plan.user_type && "👨‍💼 Prestadores"}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-3">Visualizações de Contacto</td>
                                            {plans.map((plan) => (
                                                <td key={plan.id} className="text-center p-3">
                                                    {plan.contact_views_limit === 2147483647 ? "∞" : plan.contact_views_limit}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-3">Propostas</td>
                                            {plans.map((plan) => (
                                                <td key={plan.id} className="text-center p-3">
                                                    {plan.proposals_limit === 2147483647 ? "∞" : plan.proposals_limit}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-3">Respostas a Gigs</td>
                                            {plans.map((plan) => (
                                                <td key={plan.id} className="text-center p-3">
                                                    {plan.gig_responses_limit === 2147483647 ? "∞" : plan.gig_responses_limit}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-3">Preço (Display)</td>
                                            {plans.map((plan) => (
                                                <td key={plan.id} className="text-center p-3 font-semibold">
                                                    {plan.price ? `${plan.price} ${plan.currency || "EUR"}` : "Gratuito"}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-3">Destaque em Pesquisas</td>
                                            {plans.map((plan) => (
                                                <td key={plan.id} className="text-center p-3">
                                                    {plan.has_search_boost ? "✅" : "❌"}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-3">Realce de Perfil</td>
                                            {plans.map((plan) => (
                                                <td key={plan.id} className="text-center p-3">
                                                    {plan.has_profile_highlight ? "✅" : "❌"}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-3">Badge</td>
                                            {plans.map((plan) => (
                                                <td key={plan.id} className="text-center p-3">
                                                    {plan.badge_text || "-"}
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
