"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Circle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { ProfileCompletionService } from "@/lib/profile/profile-completion-service"

export function ProfileCompletionWidget() {
  const { profile } = useAuth()

  // Use real profile data if available, otherwise use mock data
  const completionData = profile
    ? ProfileCompletionService.calculateCompletion(profile)
    : ProfileCompletionService.getMockCompletionData()

  const { completionPercentage, nextSteps, message, color } = completionData

  const getColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return {
          progress: "bg-green-500",
          badge: "bg-green-100 text-green-800 border-green-200",
          text: "text-green-700",
        }
      case "blue":
        return {
          progress: "bg-blue-500",
          badge: "bg-blue-100 text-blue-800 border-blue-200",
          text: "text-blue-700",
        }
      case "yellow":
        return {
          progress: "bg-yellow-500",
          badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
          text: "text-yellow-700",
        }
      default:
        return {
          progress: "bg-red-500",
          badge: "bg-red-100 text-red-800 border-red-200",
          text: "text-red-700",
        }
    }
  }

  const colorClasses = getColorClasses(color)

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Completude do Perfil</CardTitle>
          <Badge variant="outline" className={colorClasses.badge}>
            {completionPercentage}%
          </Badge>
        </div>
        <div className="space-y-2">
          <Progress value={completionPercentage} className="h-2" />
          <p className={`text-sm ${colorClasses.text}`}>{message}</p>
        </div>
      </CardHeader>

      {nextSteps.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Próximos passos:</h4>
            <div className="space-y-2">
              {nextSteps.map((step) => (
                <Link key={step.id} href={step.href}>
                  <Button variant="ghost" className="w-full justify-start h-auto p-3 hover:bg-muted/50">
                    <div className="flex items-start space-x-3 w-full">
                      <Circle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{step.title}</span>
                          <div className="flex items-center space-x-1">
                            <Badge variant="secondary" className="text-xs">
                              +{step.points}
                            </Badge>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                      </div>
                    </div>
                  </Button>
                </Link>
              ))}
            </div>

            <Link href="/dashboard/profile">
              <Button className="w-full mt-3" size="sm">
                Completar Perfil
              </Button>
            </Link>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
