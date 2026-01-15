"use server";

import { sendEmail } from "@/lib/email/client";

/**
 * Sends a test email using the specified template.
 * detailed logs are imperative for debugging.
 */
export async function sendTestEmailAction(to: string, templateSlug: string) {
    console.log(`Attempting to send test email to ${to} with template ${templateSlug}`);

    // Mock variables for testing - in a real scenario these would be dynamic
    const mockVariables = {
        user_name: "Test User",
        verification_link: `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=123`,
        dashboard_link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        reset_link: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=123`,
        sender_name: "John Doe",
        message_preview: "This is a test message content preview.",
        message_link: `${process.env.NEXT_PUBLIC_APP_URL}/messages/1`,
        amount: "50.00",
        gig_title: "Web Development Project",
        payment_link: `${process.env.NEXT_PUBLIC_APP_URL}/payments/1`
    };

    try {
        const result = await sendEmail({
            to,
            templateName: templateSlug,
            variables: mockVariables,
        });

        if (!result.success) {
            throw result.error;
        }

        return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
        console.error("Action error:", error);
        return { success: false, message: error.message || "Failed to send email" };
    }
}
