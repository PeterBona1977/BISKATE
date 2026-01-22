"use server"

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { NotificationServiceServer } from "@/lib/notifications/notification-service-server"

export async function signUpUser(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string

    if (!email || !password) {
        return { error: "Email and password are required" }
    }

    // 1. Generate the verification link via Admin API
    const supabase: any = getSupabaseAdmin()

    const isProduction = process.env.NODE_ENV === 'production';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    console.log(`[SIGNUP_DEBUG] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[SIGNUP_DEBUG] NEXT_PUBLIC_APP_URL: ${appUrl}`);

    // Force specific logic for debugging
    let redirectBase = 'http://localhost:3000';
    if (isProduction) {
        redirectBase = 'https://gighub.pages.dev';
    } else if (appUrl && !appUrl.includes('localhost')) {
        redirectBase = appUrl;
    }

    const redirectToUrl = `${redirectBase}/api/auth/confirm?userId=USER_ID_PLACEHOLDER`;
    console.log(`[SIGNUP_DEBUG] Generated redirectTo: ${redirectToUrl}`);

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
            // We use a placeholder and replace it after we have the user ID
            redirectTo: redirectToUrl
        },
    })

    if (linkError) {
        console.error("Link generation error:", linkError)
        return { error: linkError.message }
    }

    const { user, properties } = linkData
    let verificationLink = properties?.action_link

    if (!user || !verificationLink) {
        return { error: "Failed to generate verification link" }
    }

    // Replace the placeholder with the actual userId
    verificationLink = verificationLink.replace('USER_ID_PLACEHOLDER', user.id)

    // 2. Initialize verification tracking in the profile
    // Small delay to allow trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000))
    await supabase
        .from("profiles")
        .update({
            verification_attempts: 1,
            last_verification_sent_at: new Date().toISOString(),
            email_verified: false
        })
        .eq("id", user.id)

    // 3. Trigger the "User Registered" notification with the link
    try {
        await NotificationServiceServer.triggerNotification("user_registered", {
            userId: user.id,
            userName: fullName || email.split("@")[0],
            userEmail: email,
            verification_link: verificationLink,
        })
    } catch (err) {
        console.error("Failed to trigger notification:", err)
        // We don't block success, but user won't get email
        return { error: "Account created but failed to send verification email. Please contact support." }
    }

    return { success: true }
}

export async function resendVerificationEmail(formData: FormData) {
    const email = formData.get("email") as string

    if (!email) {
        return { error: "Email is required" }
    }

    const supabase = getSupabaseAdmin()

    // 1. Generate new link (Magic Link acts as verification)
    const isProduction = process.env.NODE_ENV === 'production';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    let redirectBase = 'http://localhost:3000';
    if (isProduction) {
        redirectBase = 'https://gighub.pages.dev';
    } else if (appUrl && !appUrl.includes('localhost')) {
        redirectBase = appUrl;
    }

    // We need to resolve the user ID to pass it correctly in the redirect URL if we want consistency
    // But generateLink with magiclink returns the user object.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
            redirectTo: redirectBase // We can handle the final destination in the dashboard or just let them in
        }
    })

    if (linkError) {
        // Don't reveal if user exists or not for security, but for now helpful error
        console.error("Resend link error:", linkError)
        return { error: "Erro ao gerar link. Verifique se o email está correto." }
    }

    const { user, properties } = linkData
    const verificationLink = properties?.action_link

    if (!user || !verificationLink) {
        return { error: "Não foi possível gerar o link." }
    }

    // 2. Send Email
    try {
        await NotificationServiceServer.triggerNotification("verification_reminder", {
            userId: user.id,
            userName: user.user_metadata?.full_name || email.split("@")[0],
            userEmail: email,
            verification_link: verificationLink,
        })
    } catch (err) {
        console.error("Failed to trigger resend notification:", err)
        return { error: "Falha ao enviar email." }
    }

    return { success: true }
}
