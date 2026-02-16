"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, BellRing, CheckCheck, Eye, MessageSquare, FileText, User, AlertTriangle, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { notificationService } from "@/lib/notifications/notification-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExternalLink, Calendar as CalendarIcon } from "lucide-react"

import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

export default function NotificationsPage() {
  const t = useTranslations("Dashboard.Notifications")
  const { user, profile } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null)

  useEffect(() => {
    if (profile?.role === "provider" || profile?.is_provider === true) {
      router.push("/dashboard/provider/notifications")
    }
  }, [profile, router])

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return
    setLoading(true)
    const data = await notificationService.getUserNotifications(user.id, 50, "client")
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
    const success = await notificationService.markAllAsRead(user.id, "client")
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "gig_created":
      case "gig_approved":
      case "gig_rejected":
        return <FileText className="h-4 w-4" />
      case "gig_response":
      case "response_received":
      case "response_accepted":
      case "response_rejected":
        return <MessageSquare className="h-4 w-4" />
      case "user_registered":
        return <User className="h-4 w-4" />
      case "contact_viewed":
        return <Eye className="h-4 w-4" />
      case "sensitive_content":
      case "sensitive_content_detected":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "gig_approved":
      case "response_accepted":
      case "provider_approved":
        return "text-green-600"
      case "gig_rejected":
      case "response_rejected":
      case "provider_rejected":
        return "text-red-600"
      case "sensitive_content":
      case "sensitive_content_detected":
        return "text-orange-600"
      case "contact_viewed":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  const todayCount = notifications.filter(n => {
    const d = new Date(n.created_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length

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
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadNotifications.length === 0}>
            <CheckCheck className="h-4 w-4 mr-2" />
            {t("markAllRead")}
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.total")}</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">{t("stats.notifications")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.unread")}</CardTitle>
            <BellRing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreadNotifications.length}</div>
            <p className="text-xs text-muted-foreground">{t("stats.unreadCount")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.today")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">{t("stats.todayCount")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Notificações */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-primary rounded-full" role="status" aria-label="loading">
            <span className="sr-only">{t("loading")}</span>
          </div>
          <p className="mt-2 text-muted-foreground">{t("loading")}</p>
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
            <TabsTrigger value="read">{t("tabs.read", { count: readNotifications.length })}</TabsTrigger>
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

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className={`font-medium ${!notification.read ? "font-semibold text-primary" : ""}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getPriorityColor(notification.data?.priority || "medium")}>
                            {notification.data?.priority || "medium"}
                          </Badge>
                          {!notification.read && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
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

          <TabsContent value="unread" className="space-y-4">
            {unreadNotifications.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">{t("emptyTabs.unread")}</p>
            ) : unreadNotifications.map((notification) => (
              <Card
                key={notification.id}
                className="border-l-4 border-l-primary bg-primary/5 cursor-pointer hover:bg-muted/50 transition-all"
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-primary">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getPriorityColor(notification.data?.priority || "medium")}>
                            {notification.data?.priority || "medium"}
                          </Badge>
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</span>

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
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="read" className="space-y-4">
            {readNotifications.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">{t("emptyTabs.read")}</p>
            ) : readNotifications.map((notification) => (
              <Card
                key={notification.id}
                className="opacity-75 cursor-pointer hover:opacity-100 hover:bg-muted/50 transition-all"
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>

                        <Badge variant="outline" className={getPriorityColor(notification.data?.priority || "medium")}>
                          {notification.data?.priority || "medium"}
                        </Badge>
                      </div>

                      <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</span>
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
              <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
              <DialogHeader className="p-6 pb-0 text-left">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shadow-inner">
                    {getNotificationIcon(selectedNotification.type)}
                  </div>
                  <div className="text-left">
                    <DialogTitle className="text-2xl font-black tracking-tight leading-none text-left">
                      {selectedNotification.title}
                    </DialogTitle>
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
                  {t("Common.cancel") || "Fechar"}
                </Button>
                {selectedNotification.data?.action_url && (
                  <Button
                    variant="default"
                    className="font-black uppercase tracking-widest text-xs h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 ml-2"
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
