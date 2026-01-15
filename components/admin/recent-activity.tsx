"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { enGB } from "date-fns/locale"

type Activity = {
  id: string
  type: string
  description: string
  created_at: string
  user_email?: string
}

export function RecentActivity({ loading: parentLoading = false }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentActivity() {
      if (parentLoading) return

      try {
        setLoading(true)

        // Fetch recent gigs as activity
        const { data: recentGigs, error: gigsError } = await supabase
          .from("gigs")
          .select(`
            id,
            title,
            created_at,
            profiles:author_id (email)
          `)
          .order("created_at", { ascending: false })
          .limit(3)

        if (gigsError) throw gigsError

        // Fetch recent responses as activity
        const { data: recentResponses, error: responsesError } = await supabase
          .from("gig_responses")
          .select(`
            id,
            gig_id,
            created_at,
            profiles:responder_id (email)
          `)
          .order("created_at", { ascending: false })
          .limit(3)

        if (responsesError) throw responsesError

        // Combine and format activities
        const formattedGigs = (recentGigs || []).map((gig) => ({
          id: gig.id,
          type: "gig_created",
          description: `New gig created: ${gig.title}`,
          created_at: gig.created_at,
          user_email: gig.profiles?.email,
        }))

        const formattedResponses = (recentResponses || []).map((response) => ({
          id: response.id,
          type: "gig_response",
          description: `New response to gig ${response.gig_id.substring(0, 8)}...`,
          created_at: response.created_at,
          user_email: response.profiles?.email,
        }))

        // Combine, sort by date and limit to 5
        const allActivities = [...formattedGigs, ...formattedResponses]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)

        setActivities(allActivities)
      } catch (err) {
        console.error("Error fetching recent activity:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivity()
  }, [parentLoading])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {loading || parentLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center 
                  ${activity.type === "gig_created" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}
                >
                  {activity.type === "gig_created" ? "B" : "R"}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{activity.description}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>{activity.user_email}</span>
                    <span className="mx-1">•</span>
                    <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: enGB })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent activity found.</p>
        )}
      </CardContent>
    </Card>
  )
}
