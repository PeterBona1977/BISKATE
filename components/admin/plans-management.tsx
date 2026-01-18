"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Package, Plus, Trash2, Loader2, ExternalLink, Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export function PlansManagement() {
    const [plans, setPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<any>(null)
    const [newPlan, setNewPlan] = useState({
        name: "",
        amount: "",
        interval: "month",
        intervalCount: 1,
        description: ""
    })
    const { toast } = useToast()
    const t = useTranslations("Admin.Plans")

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            setLoading(true)
            const res = await fetch("/api/admin/finance/plans")
            const result = await res.json()
            if (result.data) setPlans(result.data)
        } catch (error) {
            console.error("Error fetching plans:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch("/api/admin/finance/plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newPlan,
                    amount: parseFloat(newPlan.amount),
                    interval: newPlan.interval === "biweekly" ? "week" : newPlan.interval,
                    intervalCount: newPlan.interval === "biweekly" ? 2 : 1
                })
            })
            const result = await res.json()
            if (result.error) throw new Error(result.error)

            toast({ title: "Plan created", description: "The new plan was successfully created on Stripe." })
            setIsCreateDialogOpen(false)
            setNewPlan({ name: "", amount: "", interval: "month", intervalCount: 1, description: "" })
            fetchPlans()
        } catch (error: any) {
            toast({ title: "Error creating plan", description: error.message, variant: "destructive" })
        }
    }

    const handleUpdatePlan = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch("/api/admin/finance/plans", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: editingPlan.id,
                    name: editingPlan.name,
                    description: editingPlan.description
                })
            })
            const result = await res.json()
            if (result.error) throw new Error(result.error)

            toast({ title: "Plan updated", description: "The plan information was updated on Stripe." })
            setIsEditDialogOpen(false)
            setEditingPlan(null)
            fetchPlans()
        } catch (error: any) {
            toast({ title: "Error updating plan", description: error.message, variant: "destructive" })
        }
    }

    const handleArchivePlan = async (productId: string) => {
        if (!confirm("Are you sure you want to archive this plan? It will no longer be available for new subscriptions.")) return

        try {
            const res = await fetch("/api/admin/finance/plans", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId })
            })
            const result = await res.json()
            if (result.error) throw new Error(result.error)

            toast({ title: "Plan archived", description: "The plan was successfully deactivated." })
            fetchPlans()
        } catch (error: any) {
            toast({ title: "Error archiving plan", description: error.message, variant: "destructive" })
        }
    }

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat("pt-PT", {
            style: "currency",
            currency: currency.toUpperCase()
        }).format(amount / 100)
    }

    return (
        <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">{t("title")}</h2>
                    <p className="text-sm text-gray-500 text-muted-foreground">{t("description")}</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            {t("newPlan")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t("createTitle")}</DialogTitle>
                            <DialogDescription>
                                {t("createDescription")}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreatePlan} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t("form.name")}</Label>
                                <Input
                                    id="name"
                                    placeholder={t("form.namePlaceholder")}
                                    required
                                    value={newPlan.name}
                                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">{t("form.price")}</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder="19.99"
                                        required
                                        value={newPlan.amount}
                                        onChange={(e) => setNewPlan({ ...newPlan, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="interval">{t("form.interval")}</Label>
                                    <Select
                                        value={newPlan.interval}
                                        onValueChange={(val) => setNewPlan({ ...newPlan, interval: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="week">{t("form.weekly")}</SelectItem>
                                            <SelectItem value="biweekly">{t("form.biweekly")}</SelectItem>
                                            <SelectItem value="month">{t("form.monthly")}</SelectItem>
                                            <SelectItem value="year">{t("form.yearly")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">{t("form.description")}</Label>
                                <Input
                                    id="description"
                                    placeholder={t("form.descriptionPlaceholder")}
                                    value={newPlan.description}
                                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit">{t("actions.create")}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("table.plan")}</TableHead>
                                <TableHead>{t("table.source")}</TableHead>
                                <TableHead>{t("table.price")}</TableHead>
                                <TableHead>{t("table.frequency")}</TableHead>
                                <TableHead>{t("table.creationDate")}</TableHead>
                                <TableHead className="text-right">{t("table.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto mr-2" /> {t("status.loading")}</TableCell></TableRow>
                            ) : plans.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">{t("status.empty")}</TableCell></TableRow>
                            ) : (
                                plans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className={cn("p-2 rounded-lg", plan.source === 'stripe' ? "bg-indigo-50" : "bg-teal-50")}>
                                                    <Package className={cn("h-4 w-4", plan.source === 'stripe' ? "text-indigo-600" : "text-teal-600")} />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{plan.name}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{plan.description || "No description"}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={plan.source === 'stripe' ? "default" : "secondary"}>
                                                {plan.source.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold text-color-primary">
                                            {formatCurrency(plan.amount, plan.currency)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {plan.interval === "week" && plan.intervalCount === 2
                                                    ? t("form.biweekly")
                                                    : plan.interval === "week"
                                                        ? t("form.weekly")
                                                        : plan.interval === "month"
                                                            ? t("form.monthly")
                                                            : plan.interval === "year"
                                                                ? t("form.yearly")
                                                                : t("form.recurring")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {new Date(plan.created * 1000).toLocaleDateString("pt-PT")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {plan.source === 'stripe' ? (
                                                    <>
                                                        <Button variant="ghost" size="sm" asChild title="View on Stripe">
                                                            <a href={`https://dashboard.stripe.com/products/${plan.id}`} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Edit"
                                                            onClick={() => {
                                                                setEditingPlan(plan)
                                                                setIsEditDialogOpen(true)
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            title="Archive"
                                                            onClick={() => handleArchivePlan(plan.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic mr-2">{t("status.managedInDB")}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("editTitle")}</DialogTitle>
                        <DialogDescription>
                            {t("editDescription")}
                        </DialogDescription>
                    </DialogHeader>
                    {editingPlan && (
                        <form onSubmit={handleUpdatePlan} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">{t("form.name")}</Label>
                                <Input
                                    id="edit-name"
                                    required
                                    value={editingPlan.name}
                                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">{t("form.description")}</Label>
                                <Input
                                    id="edit-description"
                                    value={editingPlan.description || ""}
                                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit">{t("actions.save")}</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
