import { supabase } from "@/lib/supabase/client"

export interface AnalyticsEvent {
  event_name: string
  event_category: string
  event_data?: Record<string, any>
  page_url?: string
  referrer?: string
  user_agent?: string
  device_type?: string
  browser?: string
  os?: string
}

export interface DailyMetrics {
  date: string
  total_users: number
  new_users: number
  active_users: number
  total_gigs: number
  new_gigs: number
  approved_gigs: number
  total_proposals: number
  new_proposals: number
  total_revenue: number
  platform_revenue: number
  avg_rating: number
  total_reviews: number
}

export interface AnalyticsInsight {
  id: string
  insight_type:
  | "growth_opportunity"
  | "performance_alert"
  | "trend_detection"
  | "anomaly_detection"
  | "recommendation"
  | "warning"
  title: string
  description: string
  severity: "info" | "warning" | "critical"
  metric_name?: string
  current_value?: number
  previous_value?: number
  change_percentage?: number
  suggested_actions?: string[]
  is_read: boolean
  is_dismissed: boolean
  created_at: string
  expires_at?: string
}

export class AnalyticsService {
  // Tracking de eventos
  static async trackEvent(event: AnalyticsEvent, userId?: string) {
    try {
      const sessionId = this.getSessionId()

      const { error } = await supabase.from("analytics_events").insert({
        user_id: userId,
        session_id: sessionId,
        ...event,
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        referrer: document.referrer,
        device_type: this.getDeviceType(),
        browser: this.getBrowser(),
        os: this.getOS(),
      })

      if (error) throw error
    } catch (error) {
      console.error("Error tracking event:", error)
    }
  }

  // Buscar métricas diárias
  static async getDailyMetrics(days = 30): Promise<DailyMetrics[]> {
    try {
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("*")
        .order("date", { ascending: false })
        .limit(days)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching daily metrics:", error)
      return []
    }
  }

  // Buscar insights
  static async getInsights(limit = 10): Promise<AnalyticsInsight[]> {
    try {
      const { data, error } = await supabase
        .from("business_insights")
        .select("*")
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching insights:", error)
      return []
    }
  }

  // Marcar insight como lido
  static async markInsightAsRead(insightId: string) {
    try {
      const { error } = await supabase.from("business_insights").update({ is_read: true }).eq("id", insightId)

      if (error) throw error
    } catch (error) {
      console.error("Error marking insight as read:", error)
    }
  }

  // Descartar insight
  static async dismissInsight(insightId: string) {
    try {
      const { error } = await supabase.from("business_insights").update({ is_dismissed: true }).eq("id", insightId)

      if (error) throw error
    } catch (error) {
      console.error("Error dismissing insight:", error)
    }
  }

  // Calcular KPIs principais
  static async getKPIs() {
    try {
      const today = new Date().toISOString().split("T")[0]
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]

      const [todayMetrics, yesterdayMetrics] = await Promise.all([
        supabase.from("daily_metrics").select("*").eq("date", today).single(),
        supabase.from("daily_metrics").select("*").eq("date", yesterday).single(),
      ])

      const current = todayMetrics.data || {}
      const previous = yesterdayMetrics.data || {}

      return {
        totalUsers: {
          value: current.total_users || 0,
          change: this.calculateChange(current.total_users, previous.total_users),
        },
        newUsers: {
          value: current.new_users || 0,
          change: this.calculateChange(current.new_users, previous.new_users),
        },
        totalGigs: {
          value: current.total_gigs || 0,
          change: this.calculateChange(current.total_gigs, previous.total_gigs),
        },
        totalRevenue: {
          value: current.total_revenue || 0,
          change: this.calculateChange(current.total_revenue, previous.total_revenue),
        },
        avgRating: {
          value: current.avg_rating || 0,
          change: this.calculateChange(current.avg_rating, previous.avg_rating),
        },
      }
    } catch (error) {
      console.error("Error fetching KPIs:", error)
      return {
        totalUsers: { value: 0, change: 0 },
        newUsers: { value: 0, change: 0 },
        totalGigs: { value: 0, change: 0 },
        totalRevenue: { value: 0, change: 0 },
        avgRating: { value: 0, change: 0 },
      }
    }
  }

  // Utilitários
  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem("analytics_session_id")
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem("analytics_session_id", sessionId)
    }
    return sessionId
  }

  private static getDeviceType(): string {
    const userAgent = navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return "tablet"
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent))
      return "mobile"
    return "desktop"
  }

  private static getBrowser(): string {
    const userAgent = navigator.userAgent
    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari")) return "Safari"
    if (userAgent.includes("Edge")) return "Edge"
    return "Other"
  }

  private static getOS(): string {
    const userAgent = navigator.userAgent
    if (userAgent.includes("Windows")) return "Windows"
    if (userAgent.includes("Mac")) return "macOS"
    if (userAgent.includes("Linux")) return "Linux"
    if (userAgent.includes("Android")) return "Android"
    if (userAgent.includes("iOS")) return "iOS"
    return "Other"
  }

  private static calculateChange(current: number, previous: number): number {
    if (!previous || previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }
}
