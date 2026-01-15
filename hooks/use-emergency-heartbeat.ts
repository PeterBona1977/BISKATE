"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { EmergencyService } from "@/lib/emergency/emergency-service"

export function useEmergencyHeartbeat() {
    const { user, profile } = useAuth()
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const updateLocation = async () => {
        if (!user || !profile || !profile.is_online) return

        if (typeof window !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords
                    console.log(`📡 Updating heartbeat location: ${latitude}, ${longitude}`)
                    await EmergencyService.updateLiveLocation(user.id, latitude, longitude)
                },
                (error) => {
                    console.error("❌ Geolocation error in heartbeat:", error)
                },
                { enableHighAccuracy: true }
            )
        }
    }

    useEffect(() => {
        // Only run for providers who are online
        if (profile?.role === 'provider' && profile?.is_online) {
            // Immediate update
            updateLocation()

            // Set interval (every 30 seconds for emergency tracking)
            intervalRef.current = setInterval(updateLocation, 30000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [profile?.is_online, profile?.role, user?.id])

    return null
}
