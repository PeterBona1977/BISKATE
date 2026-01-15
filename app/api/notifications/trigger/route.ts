import { NextRequest, NextResponse } from "next/server"
import { NotificationServiceServer } from "@/lib/notifications/notification-service-server"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { trigger, data, userId } = body

        if (!trigger || !data) {
            return NextResponse.json(
                { error: "Missing required fields: trigger, data" },
                { status: 400 }
            )
        }

        // Ensure userId is in data for the service to find it
        const finalData = { ...data, userId: data.userId || userId }

        // Trigger the notification (this will handle both in-app and email)
        await NotificationServiceServer.triggerNotification(trigger, finalData)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("❌ Notification API error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to send notification" },
            { status: 500 }
        )
    }
}
