"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { ReviewService } from "@/lib/reviews/review-service"
import type { Database } from "@/lib/supabase/database.types"

type UserBadge = Database["public"]["Tables"]["user_badges"]["Row"] & {
  badge: Database["public"]["Tables"]["badges"]["Row"]
}

interface UserBadgesProps {
  userId: string
  showTitle?: boolean
  maxBadges?: number
  size?: "sm" | "md" | "lg"
}

export function UserBadges({ userId, showTitle = true, maxBadges, size = "md" }: UserBadgesProps) {
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBadges()
  }, [userId])

  const fetchBadges = async () => {
    try {
      const { data, error } = await ReviewService.getUserBadges(userId)
      if (error) {
        console.error("Error fetching badges:", error)
        return
      }

      let badgesToShow = data
      if (maxBadges) {
        badgesToShow = badgesToShow.slice(0, maxBadges)
      }

      setBadges(badgesToShow)
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "rare":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "epic":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "legendary":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getBadgeSize = () => {
    switch (size) {
      case "sm":
        return "text-xs px-2 py-1"
      case "lg":
        return "text-base px-4 py-2"
      default:
        return "text-sm px-3 py-1"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-PT", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (badges.length === 0) {
    return showTitle ? (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">Nenhum badge conquistado ainda</p>
        </CardContent>
      </Card>
    ) : null
  }

  const BadgesList = () => (
    <div className="flex flex-wrap gap-2">
      {badges.map((userBadge) => (
        <div key={userBadge.id} className="group relative">
          <Badge
            className={`${getRarityColor(userBadge.badge.rarity)} ${getBadgeSize()} cursor-help transition-all hover:scale-105`}
            style={{ borderColor: userBadge.badge.color }}
          >
            <span className="mr-1">{userBadge.badge.icon}</span>
            {userBadge.badge.name}
          </Badge>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            <div className="font-medium">{userBadge.badge.name}</div>
            <div className="text-gray-300">{userBadge.badge.description}</div>
            <div className="text-gray-400 text-xs mt-1">Conquistado em {formatDate(userBadge.earned_at)}</div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
          </div>
        </div>
      ))}
    </div>
  )

  if (!showTitle) {
    return <BadgesList />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">🏆 Badges ({badges.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <BadgesList />
      </CardContent>
    </Card>
  )
}
