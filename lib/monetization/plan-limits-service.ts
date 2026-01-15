// =====================================================
// BISKATE - PLAN LIMITS SERVICE
// Core service for subscription-based limitations
// =====================================================

import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export interface PlanLimits {
    plan_tier: string
    contact_views_limit: number
    proposals_limit: number
    gig_responses_limit: number
    has_search_boost: boolean
    has_profile_highlight: boolean
    badge_text: string | null
    reset_period: string
    price?: number
    currency?: string
    features: Record<string, any>
}

export interface UserQuotas {
    plan_tier: string
    contact_views_used: number
    contact_views_limit: number
    contact_views_remaining: number
    proposals_used: number
    proposals_limit: number
    proposals_remaining: number
    gig_responses_used: number
    gig_responses_limit: number
    gig_responses_remaining: number
    next_reset_date: string
}

export interface QuotaCheckResult {
    allowed: boolean
    reason?: string
    remaining?: number
    limit?: number
    nextReset?: string
}

export type ActionType = "proposal" | "gig_response" | "contact_view"

export class PlanLimitsService {
    /**
     * Get plan limits configuration for a specific plan
     */
    static async getPlanLimits(planTier: string): Promise<PlanLimits | null> {
        try {
            const { data, error } = await supabase
                .from("plan_limits")
                .select("*")
                .eq("plan_tier", planTier)
                .single()

            if (error) {
                console.error("❌ Error fetching plan limits:", error)
                return null
            }

            if (!data) {
                console.warn(`⚠️ No plan limits found for tier: ${planTier}. Quotas might not reset correctly.`)
            }

            return data as PlanLimits
        } catch (err) {
            console.error("❌ Exception fetching plan limits:", err)
            return null
        }
    }

    /**
     * Get all plan limits (for pricing page, admin panel)
     */
    static async getAllPlanLimits(): Promise<PlanLimits[]> {
        try {
            const { data, error } = await supabase
                .from("plan_limits")
                .select("*")
                .order("plan_tier")

            if (error) {
                console.error("❌ Error fetching all plan limits:", error)
                return []
            }

            return data as PlanLimits[]
        } catch (err) {
            console.error("❌ Exception fetching all plan limits:", err)
            return []
        }
    }

    /**
     * Get user's current quota status
     */
    static async getUserQuotas(userId: string): Promise<UserQuotas | null> {
        try {
            const { data, error } = await supabase.rpc("get_user_quotas", {
                p_user_id: userId,
            })

            if (error) {
                console.error("❌ Error fetching user quotas:", error)
                return null
            }

            if (!data || data.length === 0) {
                return null
            }

            return data[0] as UserQuotas
        } catch (err) {
            console.error("❌ Exception fetching user quotas:", err)
            return null
        }
    }

    /**
     * Check if user can perform an action (check quota)
     */
    static async canPerformAction(
        userId: string,
        actionType: ActionType,
    ): Promise<QuotaCheckResult> {
        try {
            // First check and reset quotas if needed
            await this.checkAndResetQuotas(userId)

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("plan, proposals_used, gig_responses_used, responses_used, proposals_reset_date, gig_responses_reset_date, responses_reset_date")
                .eq("id", userId)
                .single()

            if (error || !profile) {
                return {
                    allowed: false,
                    reason: "profile_not_found",
                }
            }

            // Get plan limits
            const limits = await this.getPlanLimits(profile.plan)
            if (!limits) {
                return {
                    allowed: false,
                    reason: "plan_limits_not_found",
                }
            }

            // Check specific action quota
            let used = 0
            let limit = 0
            let resetDate = ""

            switch (actionType) {
                case "proposal":
                    used = profile.proposals_used || 0
                    limit = limits.proposals_limit
                    resetDate = profile.proposals_reset_date
                    break
                case "gig_response":
                    used = profile.gig_responses_used || 0
                    limit = limits.gig_responses_limit
                    resetDate = profile.gig_responses_reset_date
                    break
                case "contact_view":
                    used = profile.responses_used || 0
                    limit = limits.contact_views_limit
                    resetDate = profile.responses_reset_date
                    break
            }

            const remaining = Math.max(0, limit - used)

            if (remaining <= 0) {
                return {
                    allowed: false,
                    reason: "quota_exceeded",
                    remaining: 0,
                    limit,
                    nextReset: resetDate,
                }
            }

            return {
                allowed: true,
                remaining,
                limit,
                nextReset: resetDate,
            }
        } catch (err) {
            console.error("❌ Exception checking quota:", err)
            return {
                allowed: false,
                reason: "error",
            }
        }
    }

    /**
     * Consume quota for an action
     */
    static async consumeQuota(
        userId: string,
        actionType: ActionType,
        targetId?: string,
        targetType?: string,
        metadata?: Record<string, any>,
    ): Promise<{ success: boolean; error?: string; remaining?: number }> {
        try {
            // Check if action is allowed
            const check = await this.canPerformAction(userId, actionType)
            if (!check.allowed) {
                return {
                    success: false,
                    error: this.getErrorMessage(check.reason || "unknown"),
                }
            }

            // Get current profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("plan, proposals_used, gig_responses_used, responses_used")
                .eq("id", userId)
                .single()

            if (!profile) {
                return {
                    success: false,
                    error: "Perfil não encontrado",
                }
            }

            // Determine which field to update
            let updateField = ""
            let currentUsed = 0

            switch (actionType) {
                case "proposal":
                    updateField = "proposals_used"
                    currentUsed = profile.proposals_used || 0
                    break
                case "gig_response":
                    updateField = "gig_responses_used"
                    currentUsed = profile.gig_responses_used || 0
                    break
                case "contact_view":
                    updateField = "responses_used"
                    currentUsed = profile.responses_used || 0
                    break
            }

            // Update quota
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    [updateField]: currentUsed + 1,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", userId)

            if (updateError) {
                console.error("❌ Error updating quota:", updateError)
                return {
                    success: false,
                    error: "Erro ao atualizar quota",
                }
            }

            // Record in usage history
            await supabase.from("usage_history").insert({
                user_id: userId,
                action_type: actionType,
                target_id: targetId,
                target_type: targetType,
                credits_used: 1,
                plan_tier: profile.plan,
                metadata: metadata || {},
            })

            const remaining = (check.remaining || 1) - 1

            console.log(`✅ Quota consumed: ${actionType} for user ${userId}, remaining: ${remaining}`)

            return {
                success: true,
                remaining,
            }
        } catch (err) {
            console.error("❌ Exception consuming quota:", err)
            return {
                success: false,
                error: "Erro interno do sistema",
            }
        }
    }

    /**
     * Check and reset quotas if needed
     */
    static async checkAndResetQuotas(userId: string): Promise<void> {
        try {
            const { data: profile } = await supabase
                .from("profiles")
                .select("plan, proposals_reset_date, gig_responses_reset_date, responses_reset_date")
                .eq("id", userId)
                .single()

            if (!profile || profile.plan === "unlimited") {
                return
            }

            // Fetch reset period from plan limits
            const limits = await this.getPlanLimits(profile.plan)
            const resetPeriod = limits?.reset_period || "monthly"

            if (!limits) {
                console.warn(`⚠️ Using default 'monthly' reset for plan: ${profile.plan} because no plan limits were found.`)
            }

            const now = new Date()
            const updates: Record<string, any> = {}

            const getNextResetDate = (period: string) => {
                const date = new Date()
                switch (period) {
                    case "daily":
                        date.setDate(date.getDate() + 1)
                        break
                    case "weekly":
                        date.setDate(date.getDate() + 7)
                        break
                    case "biweekly":
                        date.setDate(date.getDate() + 14)
                        break
                    case "yearly":
                        date.setFullYear(date.getFullYear() + 1)
                        break
                    case "monthly":
                    default:
                        date.setMonth(date.getMonth() + 1)
                        break
                }
                return date.toISOString()
            }

            // Check proposals reset
            if (profile.proposals_reset_date && new Date(profile.proposals_reset_date) < now) {
                updates.proposals_used = 0
                updates.proposals_reset_date = getNextResetDate(resetPeriod)
            }

            // Check gig responses reset
            if (profile.gig_responses_reset_date && new Date(profile.gig_responses_reset_date) < now) {
                updates.gig_responses_used = 0
                updates.gig_responses_reset_date = getNextResetDate(resetPeriod)
            }

            // Check contact views reset
            if (profile.responses_reset_date && new Date(profile.responses_reset_date) < now) {
                updates.responses_used = 0
                updates.responses_reset_date = getNextResetDate(resetPeriod)
            }

            // Apply updates if any
            if (Object.keys(updates).length > 0) {
                updates.updated_at = new Date().toISOString()
                await supabase.from("profiles").update(updates).eq("id", userId)
                console.log(`✅ Quotas reset for user ${userId}`)
            }
        } catch (err) {
            console.error("❌ Error checking/resetting quotas:", err)
        }
    }

    /**
     * Reset monthly quotas for all users (cron job function)
     */
    static async resetMonthlyQuotas(): Promise<number> {
        try {
            const { data, error } = await supabase.rpc("reset_user_quotas")

            if (error) {
                console.error("❌ Error resetting monthly quotas:", error)
                return 0
            }

            console.log(`✅ Reset quotas for ${data} users`)
            return data || 0
        } catch (err) {
            console.error("❌ Exception resetting monthly quotas:", err)
            return 0
        }
    }

    /**
     * Get usage statistics for a user
     */
    static async getUserUsageStats(
        userId: string,
        days: number = 30,
    ): Promise<{
        totalActions: number
        byType: Record<ActionType, number>
        byDay: Array<{ date: string; count: number }>
    }> {
        try {
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - days)

            const { data, error } = await supabase
                .from("usage_history")
                .select("action_type, created_at")
                .eq("user_id", userId)
                .gte("created_at", startDate.toISOString())
                .order("created_at", { ascending: false })

            if (error) {
                console.error("❌ Error fetching usage stats:", error)
                return { totalActions: 0, byType: {} as any, byDay: [] }
            }

            const byType: Record<string, number> = {}
            const byDay: Record<string, number> = {}

            data?.forEach((record) => {
                // Count by type
                byType[record.action_type] = (byType[record.action_type] || 0) + 1

                // Count by day
                const day = record.created_at.split("T")[0]
                byDay[day] = (byDay[day] || 0) + 1
            })

            const byDayArray = Object.entries(byDay).map(([date, count]) => ({
                date,
                count,
            }))

            return {
                totalActions: data?.length || 0,
                byType: byType as Record<ActionType, number>,
                byDay: byDayArray,
            }
        } catch (err) {
            console.error("❌ Exception fetching usage stats:", err)
            return { totalActions: 0, byType: {} as any, byDay: [] }
        }
    }

    /**
     * Convert error code to user-friendly message
     */
    private static getErrorMessage(reason: string): string {
        const messages: Record<string, string> = {
            quota_exceeded: "Limite de quota atingido. Faça upgrade do seu plano para continuar.",
            profile_not_found: "Perfil não encontrado",
            plan_limits_not_found: "Configuração de plano não encontrada",
            error: "Erro interno do sistema",
            unknown: "Erro desconhecido",
        }

        return messages[reason] || messages.unknown
    }
}
