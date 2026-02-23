import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { sendEmailByTrigger } from "@/lib/email/client"
import { PushNotificationServiceServer } from "@/lib/notifications/push-notification-server"

export class NotificationServiceServer {
    /**
     * Dispara uma notificação e envia email se configurado
     * Server-side only
     */
    static async triggerNotification(trigger: string, data: any) {
        console.log(`[NOTIF_DEBUG] 🚀 Triggering: ${trigger}`, {
            userId: data.userId,
            email: data.userEmail || data.email,
            verification_link: data.verification_link ? "PRESENT" : "MISSING"
        });

        // 1. Criar notificação in-app
        // Mapear dados do trigger para notificação in-app
        let title = "Nova Notificação"
        let message = "Você tem uma nova notificação"
        let userId = data.userId

        // Lógica simples de mapeamento (pode ser expandida)
        switch (trigger) {
            case "user_registered":
                title = "Verificação de Email"
                message = `Olá ${data.userName}, por favor confirme o seu email usando o link enviado.`
                break
            case "company_registered":
                title = "Bem-vindo ao Biskate - Empresa"
                message = `Olá ${data.userName}, bem-vindo ao Biskate! Confirme o email da sua empresa para começar.`
                break
            case "welcome_email":
                title = "Bem-vindo ao Biskate! 🎉"
                message = `A sua conta foi confirmada com sucesso. Já pode explorar a plataforma.`
                break
            case "verification_reminder":
                title = "Ainda não confirmou a sua conta? ✉️"
                message = `Olá ${data.userName}, notei que ainda não confirmou o seu email. Por favor, use o link abaixo.`
                break
            case "admin_manual_verification":
                title = "Verificação Manual Necessária 📋"
                message = `O utilizador ${data.userName} não confirmou o email após 3 tentativas.`
                break
            case "gig_created":
                title = "Novo Biskate Criado"
                message = `O biskate "${data.gigTitle}" foi criado com sucesso.`
                break
            case "gig_approved":
                title = "Biskate Aprovado! ✅"
                message = `O seu biskate "${data.gigTitle}" foi aprovado e já está visível.`
                break
            case "gig_rejected":
                title = "Biskate Rejeitado ❌"
                message = `O seu biskate "${data.gigTitle}" foi rejeitado. Motivo: ${data.rejectionReason}`
                break
            case "response_received":
                title = "Nova Proposta Recebida! 📩"
                message = `${data.userName} enviou uma proposta para "${data.gigTitle}"`
                break
            case "contact_viewed":
                title = "Contacto Visualizado! 👁️"
                message = `${data.userName} visualizou o seu contacto para "${data.gigTitle}"`
                break
            case "response_accepted":
                title = "Proposta Aceite! 🎉"
                message = `A sua proposta para "${data.gigTitle}" foi aceite por ${data.userName}`
                break
            case "gig_completed":
                title = "Biskate Concluído! ✅"
                message = `O biskate "${data.gigTitle}" foi marcado como concluído.`
                break
            case "provider_approved":
                title = "Inscrição Aprovada! 🎉"
                message = `Parabéns! A sua inscrição como prestador foi aprovada. Já pode começar a aceitar trabalhos.`
                break
            case "provider_rejected":
                title = "Inscrição Rejeitada ❌"
                message = `A sua inscrição como prestador foi rejeitada. Motivo: ${data.rejectionReason || "Não especificado"}`
                break
            case "provider_application_submitted":
                title = "Candidatura Recebida 📝"
                message = "Sua candidatura para prestador foi recebida e está em análise."
                break
            case "feedback_received":
                title = "Feedback Recebido"
                message = "Obrigado pelo seu feedback! A nossa equipa irá analisar."
                break
            case "response_rejected":
                title = "Proposta Rejeitada ❌"
                message = `A sua proposta para "${data.gigTitle}" foi rejeitada por ${data.userName}. Motivo: ${data.rejectionReason || "Não especificado"}`
                break
            case "plan_upgraded":
                title = "Plano Atualizado! 🚀"
                message = `O seu plano foi atualizado para "${data.planName}" com sucesso.`
                break
            case "wallet_topup":
                title = "Saldo Carregado! 💰"
                message = `Foram adicionados ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(data.amount)} à sua carteira.`
                break
            case "withdrawal_requested":
                title = "Pedido de Levantamento 💸"
                message = `O seu pedido de levantamento de ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(data.amount)} foi recebido.`
                break

            case "admin_requested_changes":
                title = "Ação Necessária: Alterações Solicitadas ⚠️"
                message = `A sua candidatura precisa de alterações. Motivo: ${data.rejectionReason}`
                break
            // Adicionar outros casos conforme necessário
        }

        // Special case: Admin notifications
        if (trigger === "provider_application_submitted") {
            const adminTitle = "Nova Candidatura de Prestador 📋"
            const adminMessage = `O utilizador ${data.userName} submeteu uma candidatura para ser prestador.`
            // Ensure action_url is passed if present in data, otherwise default to admin providers page
            const notificationData = {
                ...data,
                action_url: data.action_url || "/dashboard/admin/providers"
            }
            await this.notifyAdmins(adminTitle, adminMessage, "admin_provider_application", notificationData)
        } else if (trigger === "user_registered") {
            const adminTitle = "Novo Registo de Utilizador 🆕"
            const adminMessage = `O utilizador ${data.userName} (${data.userEmail}) registou-se na plataforma.`
            const notificationData = {
                ...data,
                action_url: "/dashboard/admin/users"
            }
            await this.notifyAdmins(adminTitle, adminMessage, "admin_user_registered", notificationData)
        } else if (trigger === "company_registered") {
            const adminTitle = "Novo Registo de Empresa 🏢"
            const adminMessage = `A empresa ${data.company_name} (${data.userEmail}) registou-se na plataforma.`
            const notificationData = {
                ...data,
                action_url: "/dashboard/admin/users" // TODO: Point to companies list when available
            }
            await this.notifyAdmins(adminTitle, adminMessage, "admin_company_registered", notificationData)
        } else if (trigger === "welcome_email") {
            const adminTitle = "Novo Utilizador Confirmado ✅"
            const adminMessage = `O utilizador ${data.userName} (${data.userEmail}) confirmou o email. Por favor, verifique o número de telefone.`
            await this.notifyAdmins(adminTitle, adminMessage, "admin_user_confirmed", data)
        } else if (trigger === "admin_manual_verification") {
            const adminTitle = "ALERTA: Verificação Manual Pendente ⚠️"
            const adminMessage = `O utilizador ${data.userName} (${data.userEmail}) falhou a confirmação de email 3 vezes. Requer atenção manual.`
            await this.notifyAdmins(adminTitle, adminMessage, "admin_manual_verification_required", data)
        } else if (trigger === "feedback_received") {
            const adminTitle = "Novo Feedback Recebido 💬"
            const adminMessage = `Recebido novo feedback de ${data.userName}: ${data.subject}`
            await this.notifyAdmins(adminTitle, adminMessage, "admin_feedback_received", data)
        } else if (trigger === "sensitive_content_detected") {
            const adminTitle = "Alerta de Moderação ⚠️"
            const adminMessage = `Conteúdo sensível detectado (${data.contentType}) por ${data.userName}`
            await this.notifyAdmins(adminTitle, adminMessage, "admin_moderation_alert", data)
        } else if (trigger === "plan_upgraded") {
            const adminTitle = "Upgrade de Plano! 🚀"
            const adminMessage = `O utilizador ${data.userName || data.userEmail || data.userId} atualizou para o plano "${data.planName}".`
            await this.notifyAdmins(adminTitle, adminMessage, "admin_plan_upgrade", data)
        } else if (trigger === "wallet_topup") {
            const adminTitle = "Novo Depósito 💰"
            const adminMessage = `O utilizador ${data.userName || data.userEmail || data.userId} carregou €${data.amount} na carteira.`
            await this.notifyAdmins(adminTitle, adminMessage, "admin_wallet_topup", data)
        }

        // Determine user_type based on trigger
        let userType = "client"
        const providerTriggers = [
            "provider_approved",
            "provider_rejected",
            "provider_application_submitted",
            "response_accepted",
            "response_rejected",
            "withdrawal_requested",
            "admin_requested_changes",
            "plan_upgraded" // Usually professional plans
        ]

        if (providerTriggers.includes(trigger)) {
            userType = "provider"
        } else if (trigger.startsWith("admin_")) {
            userType = "admin"
        }

        // Create in-app notification (non-blocking) using admin client
        if (userId) {
            try {
                const supabase = getSupabaseAdmin()
                const { error } = await supabase.from("notifications").insert([{
                    user_id: userId,
                    title,
                    message,
                    type: "info",
                    user_type: userType,
                    data: {
                        ...data,
                        user_name: data.userName || data.user_name || "Utilizador",
                        plan_name: data.planName || data.plan_name || "",
                        amount: data.amount || "0",
                    },
                    read: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }] as any)

                if (error) {
                    console.warn(`⚠️ Failed to create in-app notification DB insert:`, error)
                } else {
                    console.log(`✅ In-app notification created for user ${userId}`)
                }
            } catch (error) {
                console.warn(`⚠️ Failed to create in-app notification:`, error)
            }
        }

        // 2. Enviar Push Notification (Fire & Forget)
        if (userId) {
            // Não aguardamos o resultado para não bloquear
            PushNotificationServiceServer.sendToUser(userId, title, message, data || {})
                .then(result => {
                    if (result.success > 0) console.log(`📲 Push notification sent to user ${userId}`)
                })
                .catch(err => console.error("⚠️ Failed to send push notification:", err))
        }

        // 3. Enviar Email (non-blocking)
        let email = data.userEmail

        // Correction: If email is missing but we have userId, let's fetch it from profiles
        if (!email && userId) {
            try {
                const supabase = getSupabaseAdmin()
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("email")
                    .eq("id", userId)
                    .single()

                if (profileData && (profileData as any).email) {
                    email = (profileData as any).email
                    // Also ensure userName is available if missing
                    if (!data.userName) {
                        const { data: nameData } = await supabase
                            .from("profiles")
                            .select("full_name")
                            .eq("id", userId)
                            .single()
                        if (nameData && (nameData as any).full_name) {
                            data.userName = (nameData as any).full_name
                        }
                    }
                    console.log(`🔍 Fetched email for user ${userId}: ${email}`)
                } else if (profileError) {
                    console.warn(`⚠️ Failed to fetch email for user ${userId}:`, profileError.message)
                }
            } catch (err) {
                console.error("⚠️ Error fetching user email path:", err)
            }
        }

        if (email) {
            try {
                // Map the trigger code to the actual database slug for email templates
                // NO REMAPPING needed - database uses snake_case trigger_keys now
                // let emailTemplateSlug = trigger
                // if (trigger === "welcome_email") emailTemplateSlug = "email-verified"
                // if (trigger === "user_registered") emailTemplateSlug = "user-registered"

                const result = await sendEmailByTrigger({
                    to: email,
                    trigger: trigger,
                    variables: {
                        user_name: data.userName || data.user_name || "Utilizador",
                        user_email: email,
                        gig_title: data.gigTitle || data.gig_title || "",
                        plan_name: data.planName || data.plan_name || "",
                        amount: data.amount || "0",
                        platform_name: "Biskate",
                        dashboard_link: `${process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') ? process.env.NEXT_PUBLIC_APP_URL : (process.env.NEXT_PUBLIC_APP_URL || 'https://gighub.pages.dev')}/dashboard/provider`,
                        ...data
                    }
                })

                if (result.success) {
                    console.log(`✅ Email sent successfully to ${email}`)
                } else {
                    console.warn(`⚠️ Email sending failed:`, result.error)
                }
            } catch (error) {
                console.warn(`⚠️ Email sending exception:`, error)
            }
        } else {
            console.log(`ℹ️ No email provided or found for trigger ${trigger} (UserId: ${userId})`)
        }
    }

    /**
     * Notifica todos os administradores
     */
    static async notifyAdmins(title: string, message: string, trigger: string, data: any) {
        console.log(`📢 Notifying admins for trigger: ${trigger}`)

        try {
            const supabase = getSupabaseAdmin()
            // 1. Fetch all admin users
            const { data: admins, error } = await supabase
                .from("profiles")
                .select("id, email, full_name")
                .eq("role", "admin")

            if (error) {
                console.error("❌ Error fetching admins:", error)
                return
            }

            if (!admins || admins.length === 0) {
                console.warn("⚠️ No admin users found to notify.")
                return
            }

            console.log(`👥 Found ${admins.length} admins to notify.`)

            // 2. Send to each admin
            const adminPromises = admins.map(async (admin) => {
                const adminId = (admin as any).id
                // Removed self-skip check to allow testing/verification
                // if (adminId === data.userId) { ... }

                // In-app notification
                const { error: insertError } = await supabase.from("notifications").insert([{
                    user_id: adminId,
                    title,
                    message,
                    type: "admin_alert",
                    user_type: "admin",
                    data: { ...data, admin_id: adminId },
                    read: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }] as any)

                if (insertError) {
                    console.warn(`⚠️ Failed to create in-app notification for ${adminId}:`, insertError)
                }

                // Push notification
                PushNotificationServiceServer.sendToUser(adminId, title, message, data).catch(err =>
                    console.error(`⚠️ Failed to send push to ${adminId}:`, err)
                )

                // Email notification
                const adminEmail = (admin as any).email
                if (adminEmail) {
                    sendEmailByTrigger({
                        to: adminEmail,
                        trigger,
                        variables: {
                            admin_name: (admin as any).full_name || "Administrador",
                            user_name: data.userName || data.user_name || data.userEmail || "Utilizador",
                            user_email: data.userEmail || data.user_email || "",
                            plan_name: data.planName || data.plan_name || "",
                            amount: data.amount || "0",
                            platform_name: "Biskate",
                            ...data
                        }
                    }).catch(err =>
                        console.error(`⚠️ Failed to send admin email to ${adminEmail}:`, err)
                    )
                }
            })

            await Promise.all(adminPromises)
            console.log(`✅ ${admins.length} admins notified successfully for ${trigger}`)
        } catch (error) {
            console.error("❌ Error in notifyAdmins:", error)
        }
    }
}
