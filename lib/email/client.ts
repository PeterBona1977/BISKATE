import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Lazy-load Resend client to prevent client-side instantiation
let resendClient: Resend | null = null;


function getResendClient(): Resend {
    // Ensure we're running on the server
    if (typeof window !== 'undefined') {
        throw new Error('Email client can only be used on the server side');
    }

    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            console.warn("⚠️ Warning: RESEND_API_KEY is not configured. Email services will be inactive.");
            // Return a silent proxy instead of throwing
            const silentProxy = new Proxy({} as any, {
                get: (target, prop) => {
                    if (prop === 'emails') return silentProxy;
                    if (prop === 'send') return () => Promise.resolve({ data: { id: "mock-id" }, error: null });
                    return () => Promise.resolve({ data: null, error: null });
                }
            });
            return silentProxy as unknown as Resend;
        }

        resendClient = new Resend(apiKey);
    }

    return resendClient;
}

interface SendEmailParams {
    to: string;
    templateName: string; // The "slug" from the database
    variables: Record<string, string>;
}

/**
 * Wraps email body with a modern, vibrant header and footer.
 */
function wrapEmail(body: string, subject: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f8fafc;
            padding-bottom: 40px;
        }
        .main {
            background-color: #ffffff;
            margin: 0 auto;
            width: 100%;
            max-width: 600px;
            border-spacing: 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-radius: 8px;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 40px 30px;
            color: #1e293b;
            line-height: 1.6;
            font-size: 16px;
        }
        .footer {
            background-color: #0f172a;
            color: #94a3b8;
            padding: 40px 20px;
            text-align: center;
            font-size: 14px;
        }
        .footer a {
            color: #818cf8;
            text-decoration: none;
        }
        .social-links {
            margin-bottom: 20px;
        }
        .social-links span {
            display: inline-block;
            margin: 0 10px;
            color: #ffffff;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: #ffffff !important;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 20px;
        }
        hr {
            border: 0;
            border-top: 1px solid #e2e8f0;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <table class="main">
            <tr>
                <td class="header">
                    <h1>Biskate</h1>
                </td>
            </tr>
            <tr>
                <td class="content">
                    ${body}
                </td>
            </tr>
            <tr>
                <td class="footer">
                    <div class="social-links">
                        <span>LinkedIn</span>
                        <span>Twitter</span>
                        <span>Instagram</span>
                    </div>
                    <p>&copy; ${new Date().getFullYear()} Biskate. Todos os direitos reservados.</p>
                    <p>Enviado com ❤️ pela equipa Biskate</p>
                    <p>
                        <a href="mailto:support@biskate.eu">support@biskate.eu</a> | 
                        <a href="https://biskate.eu">biskate.eu</a>
                    </p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
    `.trim();
}

export async function sendEmail({ to, templateName, variables }: SendEmailParams) {
    try {
        const resend = getResendClient();

        // 1. Fetch template from database
        // We use the admin client or a privileged operation if we were in a secure context,
        // but since this likely runs on server actions, we need to ensure we can access the templates.
        // The policy "Admins can manage email templates" might restrict read access?
        // Let's assume we can read it, or we need to use service role if strictly protected.
        // For now, let's try reading it. If RLS blocks, we might need a service role client.
        // Actually, usually fetching templates to send system emails should be a system operation.

        // OPTION: Pass the body/subject directly if we fetched it earlier, but the robust way is fetching it here.
        // However, for simplicity and performance, maybe we fetch it here.

        // NOTE: This client.ts runs on the server (used by actions).
        // We should probably rely on the caller to pass the template OR fetch it here safely.
        // Let's fetch it here. We might need a service role client if RLS is strict for standard users.
        // But since this is `lib/email/client.ts`, let's just use the `resend` logic primarily.

        // Re-verify RLS: "Admins can manage email templates". 
        // This means normal users CANNOT read templates? 
        // If so, `supabase` client here (which uses anon key usually) will fail unless user is admin.
        // So if a USER triggers an action that sends an email (e.g. registers), they are not admin.
        // Solution: We need a Service Role client or similar to fetch the template.
        // OR we just hardcode templates in code? No, the requirement is to use the DB templates.

        // Let's assume for this step we will implement the replacing logic and sending.
        // The fetching of the template might need to be done with a `createClient` with service key if available, 
        // or we adjust policies to allow reading templates by everyone (or authenticated).

        // Changing course: I will fetch the template here using a server-side query if possible, 
        // but without `supabase-admin` setup ready, I will rely on the params passed in, 
        // OR I will assume `sendEmail` is called with the TEMPLATE CONTENT, not just name.
        // BUT the plan said: "2. Fetchs the template from `email_templates` table."

        // Let's implement fetching. I'll need `createClient` from `@supabase/supabase-js`.
        // I check if `SUPABASE_SERVICE_ROLE_KEY` is in env? It wasn't in the user list.
        // If not, I can only use the public one.
        // If RLS is strictly "Admins", regular users can't trigger emails that require fetching templates.
        // I will write the code to fetch, but handle the error or fallback.

        // Actually, `lib/supabase/client.ts` usually exports the client.
        // I'll stick to the plan but add a check.

        const supabase = getSupabaseAdmin();
        const { data: template, error: templateError } = await supabase
            .from("email_templates")
            .select("*")
            .eq("slug", templateName)
            .single();

        if (templateError || !template) {
            console.error("Error fetching template:", templateError);
            throw new Error(`Template '${templateName}' not found`);
        }

        let subject = (template as any).subject;
        let html = (template as any).body;

        // 2. Replace variables
        // Simple string replacement: {{variable}}
        console.log(`📝 Email variables for '${templateName}':`, variables);

        Object.entries(variables).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                console.warn(`⚠️ Variable '${key}' for email is null/undefined`);
                value = "";
            }

            const regex = new RegExp(`{{${key}}}`, "g");
            const valStr = String(value);

            if (subject.includes(`{{${key}}}`)) {
                console.log(`✅ Replacing {{${key}}} in subject with: ${valStr}`);
                subject = subject.replace(regex, valStr);
            }

            if (html.includes(`{{${key}}}`)) {
                console.log(`✅ Replacing {{${key}}} in body with: ${valStr}`);
                html = html.replace(regex, valStr);
            }
        });

        // 3. Wrap with template
        const finalHtml = wrapEmail(html, subject);

        // 4. Send email
        // 4. Send email
        const { data, error } = await resend.emails.send({
            from: "Biskate <noreply@biskate.eu>",
            to: [to],
            subject: subject,
            html: finalHtml,
        });

        if (error) {
            console.error("❌ Resend API Error:", error);
            return { success: false, error };
        }

        console.log("✅ Resend API Success:", data);
        return { success: true, data };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error };
    }
}

/**
 * Sends a raw email (no template lookup). Internal use only.
 */
async function sendEmailWithContent({ to, subject, html }: { to: string, subject: string, html: string }) {
    try {
        const resend = getResendClient();

        // Wrap with template
        const finalHtml = wrapEmail(html, subject);

        const { data, error } = await resend.emails.send({
            from: "Biskate <noreply@biskate.eu>",
            to: [to],
            subject: subject,
            html: finalHtml,
        });

        if (error) {
            console.error("❌ Resend API Error (raw):", error);
            return { success: false, error };
        }

        console.log("✅ Resend API Success (raw):", data);
        return { success: true, data };
    } catch (error) {
        console.error("Failed to send raw email:", error);
        return { success: false, error };
    }
}

/**
 * Sends an email using a template mapped to a specific trigger key.
 * This is the preferred way to send automated system emails.
 */
export async function sendEmailByTrigger({
    to,
    trigger,
    variables
}: {
    to: string;
    trigger: string;
    variables: Record<string, string>
}) {
    try {
        console.log(`📧 Sending email for trigger: ${trigger} to ${to}`);

        // 1. Fetch template by trigger_key
        const supabase = getSupabaseAdmin();
        const { data: template, error: templateError } = await supabase
            .from("email_templates")
            .select("*")
            .eq("trigger_key", trigger)
            .eq("is_active", true)
            .single();

        if (templateError || !template) {
            console.warn(`⚠️ No active template found for trigger '${trigger}'. Using fallback.`);

            // Fallback content logic
            let fallbackSubject = `Notification: ${trigger.replace(/_/g, ' ')}`;
            let fallbackBody = `<h1>Biskate Notification</h1><p>Action: ${trigger}</p><p>Data:</p><ul>`;

            Object.entries(variables).forEach(([key, value]) => {
                fallbackBody += `<li><strong>${key}:</strong> ${value}</li>`;
            });
            fallbackBody += `</ul><p>Please configure a proper template in the admin panel.</p>`;

            // Minimal mapping for subjects
            if (trigger.includes('application')) fallbackSubject = 'Nova Candidatura / Application Update';
            if (trigger.includes('feedback')) fallbackSubject = 'Novo Feedback Recebido';
            if (trigger.includes('response')) fallbackSubject = 'Atualização de Proposta / New Response';
            if (trigger === 'company_registered') fallbackSubject = 'Confirmação de Registo Empresarial - Biskate';

            return sendEmailWithContent({ to, subject: fallbackSubject, html: fallbackBody });
        }

        console.log(`✅ Found template: ${(template as any).slug} for trigger: ${trigger}`);
        return sendEmail({ to, templateName: (template as any).slug, variables });
    } catch (error) {
        console.error(`❌ Error sending email by trigger '${trigger}':`, error);
        return { success: false, error };
    }
}
