"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, LayoutDashboard, Briefcase } from "lucide-react"
import { useTranslations } from "next-intl"

export function HeaderUserMenu() {
    const t = useTranslations("UserMenu")
    const { user, profile, signOut } = useAuth()
    const [isOpen, setIsOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
    }

    if (!user) return null

    const userInitials = profile?.full_name
        ? profile.full_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : user.email
            ? user.email[0].toUpperCase()
            : "U"

    const isAdmin = profile?.role === "admin"
    const displayName = profile?.full_name || user.email?.split("@")[0] || t("user")

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2">
                    <Avatar className="h-9 w-9 border border-gray-200">
                        <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700">{userInitials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        {isAdmin && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 w-fit mt-1">
                                {t("administrator")}
                            </span>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {isAdmin ? (
                    <>
                        <DropdownMenuItem asChild>
                            <Link href="/admin" className="flex items-center cursor-pointer">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>{t("adminPanel")}</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/admin/users" className="flex items-center cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span>{t("manageUsers")}</span>
                            </Link>
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/my-gigs" className="flex items-center cursor-pointer">
                                <Briefcase className="mr-2 h-4 w-4" />
                                <span>{t("myWorks")}</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/profile" className="flex items-center cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span>{t("myProfile")}</span>
                            </Link>
                        </DropdownMenuItem>
                    </>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link href={isAdmin ? "/admin/settings" : "/dashboard/settings"} className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t("settings")}</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("logout")}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
