"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Settings, LogOut, RefreshCw, Loader2, Menu, Globe, ExternalLink } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/ui/logo"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"
import { useTranslations } from "next-intl"

interface AdminHeaderProps {
  onMobileMenuToggle?: () => void
}

export function AdminHeader({ onMobileMenuToggle }: AdminHeaderProps) {
  const t = useTranslations("Admin.Header")
  const { profile, loading, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getInitials = (name: string | null) => {
    if (!name) return "A"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSignOut = async () => {
    try {
      setIsOpen(false)
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      router.push("/")
    }
  }

  const handleRefreshProfile = async () => {
    setIsRefreshing(true)
    await refreshProfile()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleMobileMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()

    if (onMobileMenuToggle) {
      setTimeout(() => {
        onMobileMenuToggle()
      }, 10)
    }
  }

  const displayName = profile?.full_name || "Administrator"
  const displayEmail = profile?.email || "loading..."

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100"
                onClick={handleMobileMenuClick}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                aria-label="Open navigation menu"
                type="button"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              <Logo size="small" href="/admin" />
              <Badge className="bg-red-100 text-red-800 font-semibold hidden sm:inline-flex">
                {t("panelName")}
              </Badge>
              <Badge className="bg-red-100 text-red-800 font-semibold sm:hidden text-xs">ADMIN</Badge>

              <Link href="/?view=website" target="_blank" className="hidden md:block">
                <Button variant="outline" size="sm" className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
                  <Globe className="mr-2 h-3.5 w-3.5" />
                  {t("viewWebsite")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationsDropdown />
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 h-10 px-3 rounded-lg hover:bg-gray-100"
                onClick={() => setIsOpen(!isOpen)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-red-100 text-red-700 font-medium">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </Button>

              {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[9999]">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={handleRefreshProfile}
                          disabled={isRefreshing}
                        >
                          <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                      <Badge className="bg-red-100 text-red-800 text-xs w-fit">{t("administrator")}</Badge>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/?view=website"
                      target="_blank"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      <Globe className="mr-3 h-4 w-4" />
                      <span>{t("viewWebsite")}</span>
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      <span>{t("settings")}</span>
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>{t("signOut")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
