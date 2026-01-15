"use client"

import { LogOut, User, Settings, Home, ShieldCheck, Loader2, RefreshCw } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

export function UserNav() {
  const { profile, loading, signOut, refreshProfile, isAdmin } = useAuth()
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "free":
        return "bg-gray-100 text-gray-800"
      case "essential":
        return "bg-blue-100 text-blue-800"
      case "pro":
        return "bg-purple-100 text-purple-800"
      case "unlimited":
        return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleSignOut = async () => {
    try {
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

  const displayName = profile?.full_name || "Utilizador"
  const displayEmail = profile?.email || "carregando..."
  const displayPlan = profile?.plan || "free"
  const displayRole = profile?.role || "user"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700 font-medium">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          {loading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-500">Carregando perfil...</span>
            </div>
          ) : (
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
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`text-xs ${getPlanColor(displayPlan)}`}>{displayPlan.toUpperCase()}</Badge>
                <Badge variant={isAdmin ? "destructive" : "outline"} className="text-xs">
                  {displayRole.toUpperCase()}
                </Badge>
              </div>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => router.push("/admin")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Painel Admin</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
