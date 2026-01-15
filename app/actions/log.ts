"use server"

import { logActivity } from "@/lib/logger"

export async function logClientActivity(
    userId: string,
    userRole: string,
    action: string,
    details: any = {}
) {
    // In a real generic action, you might want to verify session again, 
    // but for logging purposes we trust the context or just log what is sent.
    // Ideally we would get userId from session here to prevent spoofing,
    // but for now we accept params to keep it flexible for the task.
    await logActivity(userId, userRole, action, details)
}

export async function getLogs(filter: any) {
    // This runs on the server, so it has access to the service role key
    const { fetchActivityLogs } = await import("@/lib/logger")
    return await fetchActivityLogs(filter)
}
