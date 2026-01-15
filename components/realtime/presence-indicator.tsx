"use client"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserPresence } from "@/hooks/use-user-presence"
import { Circle } from "lucide-react"

interface PresenceIndicatorProps {
  userId: string
  userName: string
  userAvatar?: string
  showName?: boolean
  size?: "sm" | "md" | "lg"
}

export function PresenceIndicator({
  userId,
  userName,
  userAvatar,
  showName = false,
  size = "md",
}: PresenceIndicatorProps) {
  const { getUserStatus, isUserOnline } = useUserPresence()
  const status = getUserStatus(userId)
  const online = isUserOnline(userId)

  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      case "busy":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "online":
        return "Online"
      case "away":
        return "Ausente"
      case "busy":
        return "Ocupado"
      default:
        return "Offline"
    }
  }

  const avatarSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10"
  const indicatorSize = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <Avatar className={avatarSize}>
          <AvatarImage src={userAvatar || "/placeholder.svg"} />
          <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div
          className={`absolute -bottom-1 -right-1 ${indicatorSize} rounded-full border-2 border-white ${getStatusColor()}`}
        />
      </div>

      {showName && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{userName}</span>
          <Badge
            variant="outline"
            className={`text-xs ${
              online ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"
            }`}
          >
            <Circle className={`w-2 h-2 mr-1 fill-current ${getStatusColor().replace("bg-", "text-")}`} />
            {getStatusText()}
          </Badge>
        </div>
      )}
    </div>
  )
}
