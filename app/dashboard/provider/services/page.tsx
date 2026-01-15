"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ServiceSelector } from "@/components/provider/service-selector"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

export default function MyServicesPage() {
    const { profile, refreshProfile, loading: authLoading } = useAuth()
    const [selectedServices, setSelectedServices] = useState<string[]>([])

    useEffect(() => {
        if (profile?.skills) {
            setSelectedServices(profile.skills)
        }
    }, [profile])



    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-3xl py-8">
            <Card>
                <CardHeader>
                    <CardTitle>My Services</CardTitle>
                    <CardDescription>
                        Manage the services you offer to clients. Select all that apply to your expertise.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="border rounded-md p-4">
                        <ServiceSelector
                            userId={profile?.id}
                            initialSelectedServices={selectedServices}
                            onSelectionChange={setSelectedServices}
                            onSave={async () => {
                                await refreshProfile()
                            }}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
