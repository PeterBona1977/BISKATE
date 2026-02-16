"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, BellRing, CheckCheck, MessageSquare, FileText, User, AlertTriangle, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { notificationService } from "@/lib/notifications/notification-service"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ExternalLink, Calendar as CalendarIcon } from "lucide-react"

export default function ProviderNotificationsPage() {
    const t = useTranslations("Dashboard.Notifications")
    const commonT = useTranslations("Common")
    const { user } = useAuth()
    const router = useRouter()
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedNotification, setSelectedNotification] = useState<any | null>(null)

    useEffect(() => {
        if (user) {
            fetchNotifications()
        }
    }, [user])

    const fetchNotifications = async () => {
        if (!user) return
        setLoading(true)
        const data = await notificationService.getUserNotifications(user.id, 50, "provider")
        setNotifications(data)
        setLoading(false)
    }

    const markAsRead = async (id: string) => {
        const success = await notificationService.markAsRead(id)
        if (success) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            )
        }
    }

    const handleNotificationClick = (notification: any) => {
        if (!notification.read) {
            markAsRead(notification.id)
        }
        setSelectedNotification(notification)
    }

    const markAllAsRead = async () => {
        if (!user) return
        const success = await notificationService.markAllAsRead(user.id, "provider")
        if (success) {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "response_received":
            case "response_accepted":
            case "response_rejected":
                return <MessageSquare className="h-4 w-4" />
            case "provider_approved":
            case "provider_rejected":
                return <User className="h-4 w-4" />
            case "plan_upgraded":
            case "wallet_topup":
            case "withdrawal_requested":
                return <FileText className="h-4 w-4" />
            default:
                return <Bell className="h-4 w-4" />
        }
    }

    const getNotificationColor = (type: string) => {
        switch (type) {
            case "response_accepted":
            case "provider_approved":
            case "wallet_topup":
                return "text-green-600"
            case "response_rejected":
            case "provider_rejected":
                return "text-red-600"
            default:
                return "text-gray-600"
        }
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

        if (diffInMinutes < 1) return t("time.now")
        if (diffInMinutes < 60) return `${diffInMinutes}${t("time.minutes")}`
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}${t("time.hours")}`
        return `${Math.floor(diffInMinutes / 1440)}${t("time.days")}`
    }

    const unreadNotifications = notifications.filter((n) => !n.read)
    const readNotifications = notifications.filter((n) => n.read)

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">{t("loginRequired")}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notificações de Prestador</h1>
                    <p className="text-muted-foreground">Acompanhe as suas oportunidades e ganhos</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/notifications")}>
                        Ir para Cliente
                    </Button>
                    <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadNotifications.length === 0}>
                        <CheckCheck className="h-4 w-4 mr-2" />
                        {t("markAllRead")}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-primary rounded-full" role="status" aria-label="loading">
                        <span className="sr-only">{t("loading")}</span>
                    </div>
                </div>
            ) : notifications.length === 0 ? (
                <Card className="p-20 text-center">
                    <CardContent>
                        <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                        <p className="text-muted-foreground">{t("empty")}</p>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="all" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="all">{t("tabs.all", { count: notifications.length })}</TabsTrigger>
                        <TabsTrigger value="unread">{t("tabs.unread", { count: unreadNotifications.length })}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4">
                        {notifications.map((notification) => (
                            <Card
                                key={notification.id}
                                className={`transition-all hover:bg-muted/50 cursor-pointer ${!notification.read ? "border-l-4 border-l-primary bg-primary/5" : ""}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start space-x-4">
                                        <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className={`font-medium ${!notification.read ? "font-semibold text-primary" : ""}`}>
                                                        {notification.title}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                                                </div>
                                                {!notification.read && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</span>
                                                {!notification.read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(notification.id);
                                                        }}
                                                    >
                                                        {t("actions.markRead")}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                </Tabs>
            )}

            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 border-none shadow-2xl space-y-0">
                    {selectedNotification && (
                        <>
                            <div className="h-2 bg-gradient-to-r from-green-600 to-emerald-600" />
                            <DialogHeader className="p-6 pb-0 text-left">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shadow-inner">
                                        {getNotificationIcon(selectedNotification.type)}
                                    </div>
                                    <div className="text-left">
                                        <DialogTitle className="text-2xl font-black tracking-tight leading-none text-left">{selectedNotification.title}</DialogTitle>
                                        <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest flex items-center gap-1">
                                            <CalendarIcon className="h-3 w-3" />
                                            {new Date(selectedNotification.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="px-6 py-4">
                                <DialogDescription className="text-base text-foreground leading-relaxed font-medium bg-muted/30 p-4 rounded-xl border border-muted/50">
                                    {selectedNotification.message}
                                </DialogDescription>
                            </div>

                            <DialogFooter className="p-6 pt-2 gap-2 sm:gap-0">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedNotification(null)}
                                    className="font-bold uppercase tracking-widest text-xs h-11"
                                >
                                    {commonT("cancel")}
                                </Button>
                                {selectedNotification.data?.action_url && (
                                    <Button
                                        variant="default"
                                        className="font-black uppercase tracking-widest text-xs h-11 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20 ml-2"
                                        onClick={() => {
                                            router.push(selectedNotification.data!.action_url!)
                                            setSelectedNotification(null)
                                        }}
                                    >
                                        Abrir Detalhes
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
