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

import { useRouter } from "next/navigation"

import { notificationService } from "@/lib/notifications/notification-service"

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
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

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

  const handleNotificationClick = async (notification: Notification) => {
    // 1. Mark as read
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // 2. Navigate if action_url exists
    if (notification.data?.action_url) {
      router.push(notification.data.action_url)
    }
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

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "✅"
      case "warning":
        return "⚠️"
      case "error":
        return "❌"
      default:
        return "ℹ️"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-1 text-xs">
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">Sem notificações</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start space-x-2 flex-1">
                    <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p
                          className={`text-sm font-medium truncate ${!notification.read ? "text-blue-600" : "text-gray-900"}`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 ml-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(notification.id)
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center justify-center">
          <Button variant="ghost" size="sm" className="w-full">
            Ver todas as notificações
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
