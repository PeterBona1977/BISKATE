"use server"

import { NotificationServiceServer } from "@/lib/notifications/notification-service-server"

export async function triggerNotificationAction(trigger: string, data: any) {
    try {
        await NotificationServiceServer.triggerNotification(trigger, data)
        return { success: true }
    } catch (error) {
        console.error("Failed to trigger notification:", error)
        return { success: false, error: "Failed to trigger notification" }
    }
}
