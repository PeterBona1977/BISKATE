
import { createClient } from "@supabase/supabase-js"
import * as admin from "firebase-admin"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials in .env.local")
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function verifyConfig() {
    console.log("🔄 Verifying Firebase Configuration...")

    try {
        // 1. Fetch config from DB
        const { data: configData, error: configError } = await supabaseAdmin
            .from("platform_integrations")
            .select("config, is_enabled")
            .eq("service_name", "firebase")
            .single()

        if (configError || !configData) {
            console.error("❌ Could not fetch configuration:", configError)
            return
        }

        if (!configData.is_enabled) {
            console.warn("⚠️ Firebase integration is disabled in DB.")
        }

        const config = configData.config

        console.log("✅ Config found in database:", JSON.stringify(config, null, 2))

        // Check if the user accidentally pasted the service account as the ROOT of the config
        if (config.type === "service_account" && config.private_key) {
            console.warn("⚠️ It looks like you pasted the Service Account JSON as the ENTIRE config.")
            console.warn("   Should correct this to put it inside the 'serviceAccountJson' field.")
            // For verification purposes, we can try to use it directly
            config.serviceAccountJson = JSON.stringify(config)
        }

        if (!config.serviceAccountJson) {
            console.error("❌ Service Account JSON is missing from config.")
            return
        }

        // 2. Parse JSON
        let serviceAccount
        try {
            serviceAccount = typeof config.serviceAccountJson === 'string'
                ? JSON.parse(config.serviceAccountJson)
                : config.serviceAccountJson

            console.log("✅ JSON parsed successfully.")
            console.log(`   Project ID: ${serviceAccount.project_id}`)
            console.log(`   Client Email: ${serviceAccount.client_email}`)
        } catch (e) {
            console.error("❌ Failed to parse Service Account JSON:", e)
            return
        }

        // 3. Attempt Firebase Init
        try {
            if (admin.apps.length > 0) {
                await Promise.all(admin.apps.map(app => app?.delete()))
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            })

            console.log("✅ Firebase Admin SDK initialized successfully!")
            console.log("🎉 The configuration is valid and ready for V1 API usage.")

        } catch (e) {
            console.error("❌ Failed to initialize Firebase Admin SDK:", e)
            console.error("   This usually means the Private Key is invalid or malformed.")
        }

    } catch (err) {
        console.error("❌ Unexpected error:", err)
    }
}

verifyConfig()
