
import { createClient } from "@supabase/supabase-js"
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

const clientConfig = {
    apiKey: "AIzaSyAG3e39WkC9GCBaNPQONn6V_VSnnVrb58w",
    authDomain: "biskate-app.firebaseapp.com",
    projectId: "biskate-app",
    storageBucket: "biskate-app.firebasestorage.app",
    messagingSenderId: "490548668584",
    appId: "1:490548668584:web:0b5a495f71fe4c42f8ba9d",
    measurementId: "G-81969ZG3NR"
}

async function fixConfig() {
    console.log("🛠️ Repairing Firebase Configuration...")

    try {
        // 1. Fetch current (broken) config from DB
        const { data: configData, error: configError } = await supabaseAdmin
            .from("platform_integrations")
            .select("config")
            .eq("service_name", "firebase")
            .single()

        if (configError || !configData) {
            console.error("❌ Could not fetch configuration:", configError)
            return
        }

        const currentConfig = configData.config

        // 2. Extract Service Account JSON
        let serviceAccountJson = ""

        // Check if current config IS the service account object
        if (currentConfig.type === "service_account" && currentConfig.private_key) {
            console.log("✅ Found Service Account overwriting root config.")
            serviceAccountJson = JSON.stringify(currentConfig)
        } else if (currentConfig.serviceAccountJson) {
            console.log("✅ Found Service Account in correct field.")
            serviceAccountJson = currentConfig.serviceAccountJson
        } else {
            console.warn("⚠️ No Service Account found to preserve! You might need to re-enter it.")
        }

        // 3. Construct Correct Config
        const correctConfig = {
            ...clientConfig,
            serviceAccountJson: serviceAccountJson || "",
            serverKey: "" // Legacy key cleared as we use V1 now
        }

        // 4. Update DB
        const { error: updateError } = await supabaseAdmin
            .from("platform_integrations")
            .update({
                config: correctConfig,
                updated_at: new Date().toISOString()
            })
            .eq("service_name", "firebase")

        if (updateError) {
            console.error("❌ Failed to update configuration:", updateError)
        } else {
            console.log("✅ Configuration successfully repaired!")
            console.log("   - Client keys restored")
            console.log("   - Service Account JSON nested correctly")
        }

    } catch (err) {
        console.error("❌ Unexpected error:", err)
    }
}

fixConfig()
