"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { PushNotificationService } from "@/lib/notifications/push-notification-service"
import { Bell, BellOff, Smartphone, Shield, Save, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface NotificationPreferences {
    push_notifications: boolean
    email_notifications: boolean
    gig_created: boolean
    gig_approved: boolean
    gig_rejected: boolean
    response_received: boolean
    response_accepted: boolean
    contact_viewed: boolean
    marketing_emails: boolean
}

interface SettingsViewProps {
    mode: "client" | "provider"
}

import { useTranslations } from "next-intl"

export function SettingsView({ mode }: SettingsViewProps) {
    const t = useTranslations("Settings")
    const { user, profile, refreshProfile } = useAuth()
    const { toast } = useToast()

    const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
        push_notifications: true,
        email_notifications: true,
        gig_created: true,
        gig_approved: true,
        gig_rejected: true,
        response_received: true,
        response_accepted: true,
        contact_viewed: true,
        marketing_emails: true,
    })

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [pushTokenStatus, setPushTokenStatus] = useState<"checking" | "active" | "inactive" | "unsupported">("checking")

    useEffect(() => {
        if (user && profile) {
            loadSettings()
            checkPushNotificationStatus()
        }
    }, [user, profile])

    const loadSettings = async () => {
        try {
            setLoading(true)

            const { data: prefsData } = await supabase
                .from("user_notification_preferences")
                .select("*")
                .eq("user_id", user!.id)
                .maybeSingle()

            if (prefsData) {
                setNotificationPrefs({
                    push_notifications: prefsData.push_notifications,
                    email_notifications: prefsData.email_notifications,
                    gig_created: prefsData.gig_created,
                    gig_approved: prefsData.gig_approved,
                    gig_rejected: prefsData.gig_rejected,
                    response_received: prefsData.response_received,
                    response_accepted: prefsData.response_accepted,
                    contact_viewed: prefsData.contact_viewed,
                    marketing_emails: prefsData.marketing_emails,
                })
            }
        } catch (error) {
            console.error("Error loading settings:", error)
        } finally {
            setLoading(false)
        }
    }

    const checkPushNotificationStatus = async () => {
        try {
            if (typeof window === "undefined" || !("Notification" in window)) {
                setPushTokenStatus("unsupported")
                return
            }

            const { data: tokenData } = await supabase
                .from("user_device_tokens")
                .select("*")
                .eq("user_id", user!.id)
                .eq("is_active", true)
                .limit(1)

            if (tokenData && tokenData.length > 0) {
                setPushTokenStatus("active")
            } else {
                setPushTokenStatus("inactive")
            }
        } catch (error) {
            console.error("Error checking push status:", error)
            setPushTokenStatus("inactive")
        }
    }

    const handlePushNotificationToggle = async (enabled: boolean) => {
        try {
            if (enabled) {
                const token = await PushNotificationService.requestPermissionAndRegisterToken()
                if (token) {
                    setPushTokenStatus("active")
                    await supabase.from("user_notification_preferences").upsert(
                        {
                            user_id: user!.id,
                            push_notifications: true,
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: "user_id" }
                    )
                } else {
                    setPushTokenStatus("inactive")
                }
            } else {
                const { data: tokens } = await supabase
                    .from("user_device_tokens")
                    .select("token")
                    .eq("user_id", user!.id)
                    .eq("is_active", true)

                if (tokens) {
                    for (const tokenData of tokens) {
                        await PushNotificationService.deactivateToken(tokenData.token)
                    }
                }
                setPushTokenStatus("inactive")
                await supabase.from("user_notification_preferences").upsert(
                    {
                        user_id: user!.id,
                        push_notifications: false,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id" }
                )
            }
        } catch (error) {
            console.error("Error toggling push notifications:", error)
        }
    }

    const saveSettings = async () => {
        try {
            setSaving(true)

            const { error: prefsError } = await supabase.from("user_notification_preferences").upsert(
                {
                    user_id: user!.id,
                    ...notificationPrefs,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" },
            )

            if (prefsError) throw prefsError

            toast({
                title: t("saved"),
                description: t("savedDesc"),
            })
        } catch (error) {
            console.error("Error saving settings:", error)
            toast({
                title: t("error"),
                description: t("errorDesc"),
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold capitalize">{t("title", { mode: mode === "client" ? "Cliente" : "Prestador" })}</h1>
                    <p className="text-muted-foreground">{t("subtitle")}</p>
                </div>
            </div>

            <Tabs defaultValue="notifications" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" /> {t("tabs.notifications")}
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> {t("tabs.privacy")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5" /> {t("notifications.pushTitle")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {pushTokenStatus === "active" ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : pushTokenStatus === "unsupported" ? (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    ) : (
                                        <BellOff className="h-5 w-5 text-gray-400" />
                                    )}
                                    <div>
                                        <p className="font-medium">
                                            {pushTokenStatus === "active" ? t("notifications.pushActive") : t("notifications.pushInactive")}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {pushTokenStatus === "active"
                                                ? t("notifications.pushActiveDesc")
                                                : t("notifications.pushInactiveDesc")}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={pushTokenStatus === "active"}
                                    disabled={pushTokenStatus === "unsupported" || pushTokenStatus === "checking"}
                                    onCheckedChange={handlePushNotificationToggle}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" /> {t("notifications.preferencesTitle")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>{t("notifications.emailTitle")}</Label>
                                <Switch
                                    checked={notificationPrefs.email_notifications}
                                    onCheckedChange={(checked) => setNotificationPrefs(p => ({ ...p, email_notifications: checked }))}
                                />
                            </div>

                            <hr />

                            <div className="space-y-4 pt-2">
                                <h4 className="text-sm font-semibold uppercase text-gray-500 tracking-wider">{t("notifications.updates")}</h4>

                                {mode === "client" ? (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <Label>{t("notifications.types.gigApproved")}</Label>
                                            <Switch
                                                checked={notificationPrefs.gig_approved}
                                                onCheckedChange={(checked) => setNotificationPrefs(p => ({ ...p, gig_approved: checked }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label>{t("notifications.types.responseReceived")}</Label>
                                            <Switch
                                                checked={notificationPrefs.response_received}
                                                onCheckedChange={(checked) => setNotificationPrefs(p => ({ ...p, response_received: checked }))}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <Label>{t("notifications.types.newMatchingGigs")}</Label>
                                            <Switch
                                                checked={notificationPrefs.gig_created}
                                                onCheckedChange={(checked) => setNotificationPrefs(p => ({ ...p, gig_created: checked }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label>{t("notifications.types.responseAccepted")}</Label>
                                            <Switch
                                                checked={notificationPrefs.response_accepted}
                                                onCheckedChange={(checked) => setNotificationPrefs(p => ({ ...p, response_accepted: checked }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label>{t("notifications.types.profileViews")}</Label>
                                            <Switch
                                                checked={notificationPrefs.contact_viewed}
                                                onCheckedChange={(checked) => setNotificationPrefs(p => ({ ...p, contact_viewed: checked }))}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center justify-between">
                                    <Label>{t("notifications.marketing")}</Label>
                                    <Switch
                                        checked={notificationPrefs.marketing_emails}
                                        onCheckedChange={(checked) => setNotificationPrefs(p => ({ ...p, marketing_emails: checked }))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="privacy">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("privacy.title")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-medium text-blue-900 mb-2">{t("privacy.dataProtection")}</h4>
                                    <p className="text-sm text-blue-800">
                                        {t("privacy.dataProtectionDesc")}
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full justify-start italic">{t("privacy.exportData")}</Button>
                                <Button variant="outline" className="w-full justify-start text-red-600">{t("privacy.deleteAccount")}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {t("save")}
                </Button>
            </div>
        </div>
    )
}
