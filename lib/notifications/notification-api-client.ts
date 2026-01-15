/**
 * Client-side wrapper for triggering notifications via the API
 */
export async function triggerNotificationAPI(trigger: string, data: any) {
    try {
        const response = await fetch("/api/notifications/trigger", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ trigger, data }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Failed to trigger notification")
        }

        return await response.json()
    } catch (error) {
        console.error("❌ Failed to trigger notification:", error)
        throw error
    }
}
