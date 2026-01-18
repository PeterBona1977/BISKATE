"use client"
import Link from "next/link"
import type React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  MessageSquare,
  AlertTriangle,
  Bell,
  Globe,
  MessageCircle,
  BarChart3,
  Settings,
  LogOut,
  X,
  Mail,
  CreditCard,
  Shield,
  FolderTree,
  Package,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useEffect, useRef } from "react"
import { useTranslations } from "next-intl"

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const sidebar = sidebarRef.current
      const overlay = overlayRef.current

      if (overlay && overlay.contains(target) && sidebar && !sidebar.contains(target)) {
        if (onClose) {
          onClose()
        }
      }
    }

    const timeoutId = setTimeout(() => {
      if (window.innerWidth < 1024) {
        document.addEventListener("mousedown", handleClickOutside)
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (onClose && window.innerWidth < 1024) {
      onClose()
    }
  }, [pathname, onClose])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      router.push("/")
    }
  }

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onClose) {
      onClose()
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onClose) {
      onClose()
    }
  }

  const t = useTranslations("Admin.Sidebar")

  const navItems = [
    {
      title: t("overview"),
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: t("users"),
      href: "/admin/users",
      icon: Users,
    },
    {
      title: t("gigs"),
      href: "/admin/gigs",
      icon: Briefcase,
    },
    {
      title: t("providers"),
      href: "/admin/providers",
      icon: Users,
    },
    {
      title: t("categories"),
      href: "/admin/categories",
      icon: Briefcase,
    },
    {
      title: t("responses"),
      href: "/admin/responses",
      icon: MessageSquare,
    },
    {
      title: t("moderation"),
      href: "/admin/moderation",
      icon: AlertTriangle,
    },
    {
      title: t("notifications"),
      href: "/admin/notifications",
      icon: Bell,
    },
    {
      title: t("cms"),
      href: "/admin/cms",
      icon: Globe,
    },
    {
      title: t("emails"),
      href: "/admin/emails",
      icon: Mail,
    },
    {
      title: t("feedback"),
      href: "/admin/feedback",
      icon: MessageCircle,
    },
    {
      title: t("analytics"),
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: t("finance"),
      href: "/admin/finance",
      icon: CreditCard,
    },
    {
      title: t("plans"),
      href: "/admin/plans",
      icon: Package,
    },
    {
      title: t("settings"),
      href: "/admin/settings",
      icon: Settings,
    },
    {
      title: t("siteLogs"),
      href: "/admin/logs/site",
      icon: Shield,
    },
    {
      title: t("userLogs"),
      href: "/admin/logs/users",
      icon: Users,
    },
  ]

  return (
    <>
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          style={{ top: "4rem" }}
          onClick={handleOverlayClick}
          onMouseDown={(e) => e.stopPropagation()}
        />
      )}

      <div
        ref={sidebarRef}
        id="admin-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:static lg:transform-none lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ top: "4rem" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900">{t("menu")}</h2>
            <Button variant="ghost" size="sm" onClick={handleCloseClick} className="p-2">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 py-4 overflow-y-auto">
            <div className="px-3">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight hidden lg:block">Administration</h2>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-50",
                        isActive ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900",
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive ? "text-indigo-600" : "text-gray-400")} />
                      {item.title}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("signOut")}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
