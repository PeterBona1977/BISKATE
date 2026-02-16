"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Bell, Check } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { useRouter } from "next/navigation"

import { notificationService } from "@/lib/notifications/notification-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExternalLink, Calendar as CalendarIcon, MessageSquare, Info, AlertTriangle, CheckCircle2 } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
  data?: {
    action_url?: string
    [key: string]: any
  }
}

export function NotificationsDropdown({ mode }: { mode?: "client" | "provider" | "admin" }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  useEffect(() => {
    if (user) {
      fetchNotifications()

      // Set up realtime listener for new notifications
      const channel = notificationService.subscribeToUserNotifications(user.id, () => {
        console.log("🔔 Realtime notification received!")
        fetchNotifications()
      }, mode)

      return () => {
        notificationService.unsubscribeFromUserNotifications(channel)
      }
    }
  }, [user, mode])

  const fetchNotifications = async () => {
    if (!user) return
    const data = await notificationService.getUserNotifications(user.id, 10, mode)
    setNotifications(data as Notification[])
    const count = await notificationService.getUnreadCount(user.id, mode)
    setUnreadCount(count)
  }

  const handleNotificationClick = (notification: Notification) => {
    console.log("NOTIF_CLICKED", notification.id)

    // 0. Visual feedback (Top priority)
    // We do this immediately to show the click was registered
    try {
      toast({
        title: "Carregando...",
        description: notification.title,
      })
    } catch (e) {
      console.error("Toast failed:", e)
    }

    // 1. Mark as read (background)
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // 2. Open Detail Modal
    // Using a slightly longer timeout (300ms) to ensure DropdownMenu 
    // is fully unmounted/closed before Dialog starts its entry animation.
    setTimeout(() => {
      setSelectedNotification(notification)
      console.log("MODAL_OPEN_TRIGGERED", notification.id)
    }, 300)
  }

  const markAsRead = async (id: string) => {
    const success = await notificationService.markAsRead(id)
    if (success) {
      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const markAllAsRead = async () => {
    if (!user) return
    const success = await notificationService.markAllAsRead(user.id, mode)
    if (success) {
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
      setUnreadCount(0)
    }
  }

  const getNotificationIcon = (type: Notification["type"], size: "sm" | "lg" = "sm") => {
    const iconClass = size === "lg" ? "h-6 w-6" : "h-4 w-4"
    switch (type) {
      case "success":
        return <CheckCircle2 className={`${iconClass} text-green-500`} />
      case "warning":
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />
      case "error":
        return <AlertTriangle className={`${iconClass} text-red-500`} />
      case "emergency_response_received":
      case "emergency_response_accepted":
      case "emergency_journey_started":
        return <Info className={`${iconClass} text-blue-500`} />
      default:
        return <Info className={`${iconClass} text-gray-500`} />
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative hover:bg-white/10 transition-colors">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold border-2 border-background animate-in fade-in zoom-in duration-300"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 shadow-2xl border-none p-0 overflow-hidden" align="end" forceMount>
          <DropdownMenuLabel className="flex items-center justify-between p-4 bg-muted/50">
            <span className="font-bold text-lg">Notificações</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-auto px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground"
              >
                Limpar tudo
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="m-0" />

          {notifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Tudo limpo por aqui!</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto scrollbar-hide py-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex flex-col items-start p-4 cursor-pointer focus:bg-accent/50 outline-none border-b border-muted/30 last:border-0",
                    !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                  )}
                  onSelect={() => {
                    handleNotificationClick(notification)
                  }}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                      !notification.read ? "bg-white dark:bg-gray-800" : "bg-muted"
                    )}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          "text-sm font-bold truncate",
                          !notification.read ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{notification.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 font-medium pt-1 uppercase tracking-tighter">
                        {new Date(notification.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}

          <DropdownMenuSeparator className="m-0" />
          <DropdownMenuItem
            className="p-2 focus:bg-transparent cursor-pointer"
            onSelect={() => {
              const path = mode === 'provider' ? '/dashboard/provider/notifications' : '/dashboard/notifications';
              router.push(path);
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full font-bold text-xs uppercase text-muted-foreground tracking-widest hover:bg-muted"
            >
              Ver histórico completo
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 border-none shadow-2xl space-y-0">
          {selectedNotification && (
            <>
              <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
              <DialogHeader className="p-6 pb-0">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shadow-inner">
                    {getNotificationIcon(selectedNotification.type, "lg")}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black tracking-tight leading-none">{selectedNotification.title}</DialogTitle>
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
                  Fechar
                </Button>
                {selectedNotification.data?.action_url && (
                  <Button
                    variant="default"
                    className="font-black uppercase tracking-widest text-xs h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
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
    </>
  )
}
