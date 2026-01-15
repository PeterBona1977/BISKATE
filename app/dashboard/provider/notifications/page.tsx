"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, BellRing, CheckCheck, MessageSquare, FileText, User, AlertTriangle, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { notificationService } from "@/lib/notifications/notification-service"

export default function ProviderNotificationsPage() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

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

        if (diffInMinutes < 1) return "Agora"
        if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`
        return `${Math.floor(diffInMinutes / 1440)}d atrás`
    }

    const unreadNotifications = notifications.filter((n) => !n.read)
    const readNotifications = notifications.filter((n) => n.read)

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Por favor, faça login para ver as suas notificações.</p>
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
                    <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadNotifications.length === 0}>
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Marcar todas como lidas
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-primary rounded-full" role="status" aria-label="loading">
                        <span className="sr-only">Carregando...</span>
                    </div>
                </div>
            ) : notifications.length === 0 ? (
                <Card className="p-20 text-center">
                    <CardContent>
                        <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                        <p className="text-muted-foreground">Sem notificações de prestador.</p>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="all" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="all">Todas ({notifications.length})</TabsTrigger>
                        <TabsTrigger value="unread">Não Lidas ({unreadNotifications.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4">
                        {notifications.map((notification) => (
                            <Card
                                key={notification.id}
                                className={`transition-colors hover:bg-muted/50 ${!notification.read ? "border-l-4 border-l-primary bg-primary/5" : ""}`}
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
                                                    <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                                                        Marcar como lida
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
        </div>
    )
}
