"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { GooglePlacesInput } from "@/components/shared/google-places-input"

import { useTranslations } from "next-intl"

export function ClientProfile() {
    const t = useTranslations("Dashboard.Profile.Client")
    const { profile, updateProfile } = useAuth()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    // Form states - specifically for CLIENT profile
    const [bio, setBio] = useState("")
    const [phone, setPhone] = useState("")
    const [location, setLocation] = useState("")

    useEffect(() => {
        if (profile) {
            setBio(profile.bio || "")
            setPhone(profile.phone || "")
            setLocation(profile.location || "")
        }
    }, [profile])

    const handleUpdateProfile = async () => {
        if (!profile) return

        setLoading(true)
        try {
            const { error } = await updateProfile({
                bio,
                phone,
                location,
                updated_at: new Date().toISOString(),
            })

            if (error) throw new Error(error)

            toast({
                title: t("toasts.updated"),
                description: t("toasts.updatedDesc"),
            })
        } catch (error: any) {
            toast({
                title: t("toasts.error"),
                description: error.message,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !profile) return

        setLoading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const filePath = `${profile.id}/avatar.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            const { error: updateError } = await updateProfile({
                avatar_url: publicUrl
            })

            if (updateError) throw new Error(updateError)

            toast({
                title: t("toasts.photoUpdated"),
                description: t("toasts.photoUpdatedDesc"),
            })
        } catch (error: any) {
            toast({
                title: t("toasts.uploadError"),
                description: error.message,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    if (!profile) {
        return <div className="p-8 text-center text-gray-500">Loading profile...</div>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("subtitle")}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("sections.personalInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center space-x-6">
                        <Avatar className="h-24 w-24 border">
                            <AvatarImage src={profile.avatar_url || ""} />
                            <AvatarFallback className="text-xl">
                                {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                disabled={loading}
                            />
                            <Button variant="outline" size="sm" asChild>
                                <label htmlFor="avatar-upload" className="cursor-pointer">
                                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                    {t("fields.changePhoto")}
                                </label>
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                {t("fields.photoHint")}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("fields.fullName")}</label>
                            <Input value={profile.full_name || ""} disabled placeholder={t("fields.managedInSettings")} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("fields.email")}</label>
                            <Input value={profile.email} disabled />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("fields.phone")}</label>
                            <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder={t("fields.phonePlaceholder")}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("fields.location")}</label>
                            <GooglePlacesInput
                                value={location}
                                onChange={(value) => setLocation(value)}
                                placeholder={t("fields.locationPlaceholder")}
                                disabled={loading}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium">{t("fields.bio")}</label>
                            <Textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder={t("fields.bioPlaceholder")}
                                rows={4}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleUpdateProfile} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("fields.saving")}
                                </>
                            ) : (
                                t("fields.save")
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
