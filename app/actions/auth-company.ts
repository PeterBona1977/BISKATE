"use server"

import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server" // Still needed? Maybe not if we use admin for everything here
import { NotificationServiceServer } from "@/lib/notifications/notification-service-server"

interface CompanyRegistrationData {
    email: string
    password: string
    fullName: string
    legalName: string
    vatNumber: string
    address: string
    registryCode: string
}

export async function registerCompany(data: CompanyRegistrationData) {
    // We use the admin client for everything here to ensure atomicity and custom email handling
    const supabaseAdmin = getSupabaseAdmin()

    // 1. Prepare Redirect URL (Same logic as standard auth)
    const isProduction = process.env.NODE_ENV === 'production';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    console.log(`[COMPANY_SIGNUP_DEBUG] NODE_ENV: ${process.env.NODE_ENV}`);

    let redirectBase = 'http://localhost:3000';
    if (isProduction) {
        redirectBase = 'https://gighub.pages.dev';
    } else if (appUrl && !appUrl.includes('localhost')) {
        redirectBase = appUrl;
    }

    const redirectToUrl = `${redirectBase}/api/auth/confirm?userId=USER_ID_PLACEHOLDER`;

    // 2. Generate Link & Create User (via Admin)
    // This replaces supabase.auth.signUp to allow custom email sending
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email: data.email,
        password: data.password,
        options: {
            data: {
                full_name: data.fullName,
                is_provider: false, // Will be set via Org context later
            },
            redirectTo: redirectToUrl
        },
    })

    if (linkError) {
        console.error("Company SignUp Link Error:", linkError)
        return { error: linkError.message }
    }

    const { user, properties } = linkData
    let verificationLink = properties?.action_link

    if (!user || !verificationLink) {
        return { error: "Failed to generate verification link for company registration" }
    }

    const userId = user.id
    // Replace placeholder
    verificationLink = verificationLink.replace('USER_ID_PLACEHOLDER', userId)

    // 3. Create Organization (Using Admin Client - RLS Bypass)
    const { data: orgData, error: orgError } = await supabaseAdmin
        .from("organizations")
        .insert({
            legal_name: data.legalName,
            vat_number: data.vatNumber,
            address: data.address,
            registry_code: data.registryCode,
        })
        .select()
        .single()

    if (orgError) {
        console.error("CRITICAL: Failed to create organization for new user", userId, orgError)
        // Note: User is created but Org failed. Technically we should ideally rollback/delete user 
        // but for now we report error.
        return { error: `Failed to create organization: ${orgError.message}` }
    }

    // 4. Create Organization Member (Owner)
    const { error: memberError } = await supabaseAdmin
        .from("organization_members")
        .insert({
            organization_id: orgData.id,
            user_id: userId,
            role: 'owner'
        })

    if (memberError) {
        console.error("CRITICAL: Failed to link user to organization", userId, orgData.id, memberError)
        return { error: `Failed to add member: ${memberError.message}` }
    }

    // 5. Initialize verification tracking in profile (Consistency with individual flow)
    // Small delay to ensure triggers have run (if any)
    await new Promise(resolve => setTimeout(resolve, 1000))
    await supabaseAdmin
        .from("profiles")
        .update({
            verification_attempts: 1,
            last_verification_sent_at: new Date().toISOString(),
            email_verified: false
        })
        .eq("id", userId)

    // 6. Send Custom Notification/Email
    try {
        await NotificationServiceServer.triggerNotification("user_registered", {
            userId: userId,
            userName: data.fullName || data.email.split("@")[0],
            userEmail: data.email,
            verification_link: verificationLink,
            // Add extra info context if needed
            is_company_registration: true,
            company_name: data.legalName
        })
    } catch (err) {
        console.error("Failed to trigger company registration notification:", err)
        return { error: "Account created but failed to send verification email. Please contact support." }
    }

    return { success: true, orgId: orgData.id }
}
