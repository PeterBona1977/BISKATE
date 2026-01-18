"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
    CreditCard,
    History,
    RefreshCcw,
    Search,
    Download,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    ExternalLink,
    Package,
    Users
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

import { PlansManagement } from "./plans-management"
import { supabase } from "@/lib/supabase/client"

export function FinanceManagement() {
    const [payments, setPayments] = useState<any[]>([])
    const [subscriptions, setSubscriptions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [dateRange, setDateRange] = useState({
        startDate: "",
        endDate: ""
    })
    const { toast } = useToast()
    const t = useTranslations("Admin.Finance")

    useEffect(() => {
        fetchFinanceData()
    }, [dateRange])

    useEffect(() => {
        const channel = supabase
            .channel('admin_finance_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions' },
                () => fetchFinanceData()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_subscriptions' },
                () => fetchFinanceData()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchFinanceData = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (dateRange.startDate) params.append("startDate", dateRange.startDate)
            if (dateRange.endDate) params.append("endDate", dateRange.endDate)

            const [paymentsRes, subscriptionsRes] = await Promise.all([
                fetch(`/api/admin/finance/payments?${params.toString()}`),
                fetch("/api/admin/finance/subscriptions")
            ])

            const paymentsData = await paymentsRes.json()
            const subscriptionsData = await subscriptionsRes.json()

            if (paymentsData.data) setPayments(paymentsData.data)
            if (subscriptionsData.data) setSubscriptions(subscriptionsData.data)
        } catch (error) {
            console.error("Error fetching finance data:", error)
            toast({
                title: t("errors.loadingData"),
                description: t("errors.loadingStripe"),
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRefund = async (paymentIntentId: string) => {
        if (!confirm(t("actions.confirmRefund"))) return

        try {
            const res = await fetch("/api/admin/finance/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentIntentId })
            })

            const result = await res.json()
            if (result.error) throw new Error(result.error)

            toast({
                title: t("actions.refundSuccess"),
                description: t("actions.refundSuccessDesc")
            })
            fetchFinanceData()
        } catch (error: any) {
            toast({
                title: t("errors.refund"),
                description: error.message,
                variant: "destructive"
            })
        }
    }

    const handleCancelSubscription = async (subscriptionId: string) => {
        if (!confirm(t("actions.confirmCancel"))) return

        try {
            const res = await fetch("/api/admin/finance/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscriptionId, action: "cancel" })
            })

            const result = await res.json()
            if (result.error) throw new Error(result.error)

            toast({
                title: t("actions.cancelSuccess"),
                description: t("actions.cancelSuccessDesc")
            })
            fetchFinanceData()
        } catch (error: any) {
            toast({
                title: t("errors.cancel"),
                description: error.message,
                variant: "destructive"
            })
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "succeeded":
            case "active":
                return <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3" /> {t("status.completed")}</Badge>
            case "processing":
            case "trialing":
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> {t("status.processing")}</Badge>
            case "requires_payment_method":
            case "past_due":
                return <Badge className="bg-orange-100 text-orange-800 border-orange-200 flex items-center gap-1 w-fit"><AlertTriangle className="h-3 w-3" /> {t("status.pending")}</Badge>
            case "canceled":
            case "failed":
                return <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1 w-fit"><XCircle className="h-3 w-3" /> {t("status.cancelled")}</Badge>
            default:
                return <Badge variant="outline" className="w-fit">{status}</Badge>
        }
    }

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat("pt-PT", {
            style: "currency",
            currency: currency.toUpperCase()
        }).format(amount / 100)
    }

    const totalRevenue = payments
        .filter(p => p.status === "succeeded")
        .reduce((sum, p) => sum + p.amount, 0)

    const activeSubs = subscriptions.filter(s => s.status === "active").length

    // Aggregate revenue by date for chart
    const chartData = payments
        .filter(p => p.status === "succeeded")
        .reduce((acc: any[], payment) => {
            const dateObj = new Date(payment.created * 1000)
            const dateLabel = dateObj.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit' })
            const sortKey = dateObj.toISOString().split('T')[0] // YYYY-MM-DD

            const existing = acc.find(d => d.date === dateLabel)
            if (existing) {
                existing.amount += payment.amount / 100
            } else {
                acc.push({ date: dateLabel, sortKey, amount: payment.amount / 100 })
            }
            return acc
        }, [])
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between md:items-center flex-col md:flex-row gap-4 md:gap-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-gray-500 mt-2">{t("description")}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="start-date" className="text-xs">{t("from")}</Label>
                        <Input
                            id="start-date"
                            type="date"
                            className="w-40 h-9"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        />
                        <Label htmlFor="end-date" className="text-xs">{t("to")}</Label>
                        <Input
                            id="end-date"
                            type="date"
                            className="w-40 h-9"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        />
                    </div>
                    <Button variant="outline" onClick={fetchFinanceData} disabled={loading}>
                        <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button>
                        <Download className="h-4 w-4 mr-2" />
                        {t("export")}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardContent className="pt-6">
                        <div className="text-emerald-600 text-sm font-medium">{t("totalRevenue")}</div>
                        <div className="text-2xl font-bold text-emerald-900">{formatCurrency(totalRevenue, 'eur')}</div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="pt-6">
                        <div className="text-blue-600 text-sm font-medium">{t("activeSubscriptions")}</div>
                        <div className="text-2xl font-bold text-blue-900">{activeSubs}</div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                    <CardContent className="pt-6">
                        <div className="text-purple-600 text-sm font-medium">{t("totalTransactions")}</div>
                        <div className="text-2xl font-bold text-purple-900">{payments.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100">
                    <CardContent className="pt-6">
                        <div className="text-amber-600 text-sm font-medium">{t("pendingOthers")}</div>
                        <div className="text-2xl font-bold text-amber-900">
                            {payments.filter(p => p.status !== "succeeded").length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg">{t("revenueOverview")}</CardTitle>
                    <CardDescription>{t("successfulPayments")}</CardDescription>
                </CardHeader>
                <div className="h-[250px] w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#888' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#888' }}
                                    tickFormatter={(value) => `${value}€`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => [`${Number(value || 0).toFixed(2)}€`, 'Revenue'] as [any, any]}
                                />
                                <Bar
                                    dataKey="amount"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    barSize={32}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 border-2 border-dashed rounded-lg">
                            {t("insufficientData")}
                        </div>
                    )}
                </div>
            </Card>

            <Tabs defaultValue="payments" className="w-full">
                <TabsList className="grid w-full max-w-lg grid-cols-3">
                    <TabsTrigger value="payments" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        {t("tabs.transactions")}
                    </TabsTrigger>
                    <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {t("tabs.users")}
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {t("tabs.plans")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="plans">
                    <PlansManagement />
                </TabsContent>

                <TabsContent value="payments" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{t("history.title")}</CardTitle>
                                    <CardDescription>{t("history.description")}</CardDescription>
                                </div>
                                <div className="relative w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        placeholder={t("history.search")}
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("history.table.date")}</TableHead>
                                        <TableHead>{t("history.table.customer")}</TableHead>
                                        <TableHead>{t("history.table.amount")}</TableHead>
                                        <TableHead>{t("history.table.status")}</TableHead>
                                        <TableHead>{t("history.table.source")}</TableHead>
                                        <TableHead className="text-right">{t("history.table.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">{t("history.loading")}</TableCell></TableRow>
                                    ) : payments.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">{t("history.empty")}</TableCell></TableRow>
                                    ) : (
                                        payments.filter(p =>
                                            p.id.includes(searchTerm) ||
                                            p.receipt_email?.includes(searchTerm) ||
                                            p.customer?.includes(searchTerm)
                                        ).map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="text-sm">
                                                    {new Date(payment.created * 1000).toLocaleDateString("pt-PT")}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium">{payment.receipt_email || "N/A"}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[150px]">{payment.customer || "Anonymous"}</div>
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatCurrency(payment.amount, payment.currency)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(payment.status)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] py-0 h-5">
                                                        {payment.source === 'internal' ? 'Interno' :
                                                            payment.source === 'stripe_pi' ? 'Cartão' :
                                                                payment.source === 'stripe_invoice' ? 'Subscrição' : 'Stripe'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <a href={`https://dashboard.stripe.com/payments/${payment.id}`} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                        {payment.status === "succeeded" && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleRefund(payment.id)}
                                                            >
                                                                {t("actions.refund")}
                                                            </Button>
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
                </TabsContent>

                <TabsContent value="subscriptions" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("subscriptions.title")}</CardTitle>
                            <CardDescription>{t("subscriptions.description")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("subscriptions.table.user")}</TableHead>
                                        <TableHead>{t("subscriptions.table.plan")}</TableHead>
                                        <TableHead>{t("subscriptions.table.status")}</TableHead>
                                        <TableHead>{t("subscriptions.table.nextInvoice")}</TableHead>
                                        <TableHead className="text-right">{t("subscriptions.table.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">{t("subscriptions.loading")}</TableCell></TableRow>
                                    ) : subscriptions.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">{t("subscriptions.empty")}</TableCell></TableRow>
                                    ) : (
                                        subscriptions.map((sub) => (
                                            <TableRow key={sub.id}>
                                                <TableCell>
                                                    <div className="text-sm font-medium">{sub.customer?.email || sub.customer}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[150px]">{sub.id}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {sub.items.data[0].plan.nickname || sub.items.data[0].plan.id}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(sub.status)}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {sub.current_period_end
                                                        ? new Date(sub.current_period_end * 1000).toLocaleDateString("pt-PT")
                                                        : "Sem expiração definida"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <a href={`https://dashboard.stripe.com/subscriptions/${sub.id}`} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                        {sub.status !== "canceled" && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700"
                                                                onClick={() => handleCancelSubscription(sub.id)}
                                                            >
                                                                {t("actions.cancel")}
                                                            </Button>
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
                </TabsContent>
            </Tabs>
        </div>
    )
}
