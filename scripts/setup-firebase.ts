
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env.local")
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const firebaseConfig = {
    apiKey: "AIzaSyAG3e39WkC9GCBaNPQONn6V_VSnnVrb58w",
    authDomain: "biskate-app.firebaseapp.com",
    projectId: "biskate-app",
    storageBucket: "biskate-app.firebasestorage.app",
    messagingSenderId: "490548668584",
    appId: "1:490548668584:web:0b5a495f71fe4c42f8ba9d",
    measurementId: "G-81969ZG3NR",
    serverKey: "" // To be filled by user
}

async function updateConfig() {
    console.log("🔄 Updating Firebase configuration in database...")

    const { error } = await supabaseAdmin
        .from("platform_integrations")
        .upsert(
            {
                service_name: "firebase",
                config: firebaseConfig,
                is_enabled: true,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "service_name" },
        )

    if (error) {
        console.error("❌ Error updating config:", error)
    } else {
        console.log("✅ Successfully updated Firebase config!")
        console.log("⚠️ NOTE: The 'serverKey' is missing from the provided config.")
        console.log("👉 Please go to /admin/settings and add the Server Key manually to enable push notifications.")
    }
}

updateConfig()
