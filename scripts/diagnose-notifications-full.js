
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://dhwsocpykhexdvdfyfwd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod3NvY3B5a2hleGR2ZGZ5ZndkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk0MjU1OSwiZXhwIjoyMDgyNTE4NTU5fQ.ukjctcvfVfKM8i_-OkWo8KXVj5q3c8sC6JhVaHNXJEk"; // Using Service Role Key for full access
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log("🔍 DIAGNOSING NOTIFICATION SYSTEM...");
    console.log("=====================================");

    try {
        // 1. Check notifications table
        console.log("\n1. Checking 'notifications' table...");
        const { error: notifError, count: notifCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true });

        if (notifError) {
            console.error("❌ 'notifications' table check failed:", notifError.message);
        } else {
            console.log(`✅ 'notifications' table exists. Count: ${notifCount}`);
            // Check structure by fetching one
            const { data: sampleNotif } = await supabase.from('notifications').select('*').limit(1);
            if (sampleNotif && sampleNotif.length > 0) {
                console.log("   Columns detected:", Object.keys(sampleNotif[0]).join(", "));
            } else {
                console.log("   Table is empty, cannot verify columns dynamically.");
            }
        }

        // 2. Check user_device_tokens table
        console.log("\n2. Checking 'user_device_tokens' table...");
        const { error: tokenError, count: tokenCount } = await supabase
            .from('user_device_tokens')
            .select('*', { count: 'exact', head: true });

        if (tokenError) {
            console.error("❌ 'user_device_tokens' table check failed:", tokenError.message);
        } else {
            console.log(`✅ 'user_device_tokens' table exists. Count: ${tokenCount}`);
        }

        // 3. Check platform_integrations (Firebase)
        console.log("\n3. Checking 'platform_integrations' for Firebase...");
        const { data: integrations, error: intError } = await supabase
            .from('platform_integrations')
            .select('*')
            .eq('service_name', 'firebase');

        if (intError) {
            console.error("❌ 'platform_integrations' check failed:", intError.message);
        } else {
            if (integrations && integrations.length > 0) {
                const firebaseConfig = integrations[0];
                console.log("✅ Firebase configuration found.");
                console.log("   Enabled:", firebaseConfig.is_enabled);
                const config = firebaseConfig.config || {};
                console.log("   Config keys:", Object.keys(config).join(", "));
                console.log("   Has apiKey:", !!config.apiKey);
                console.log("   Has messagingSenderId:", !!config.messagingSenderId);
                console.log("   Has vapidKey:", !!config.vapidKey);
            } else {
                console.log("⚠️ Firebase configuration NOT found in 'platform_integrations'.");
            }
        }

        // 4. Check user_notification_preferences
        console.log("\n4. Checking 'user_notification_preferences'...");
        const { error: prefError, count: prefCount } = await supabase
            .from('user_notification_preferences')
            .select('*', { count: 'exact', head: true });

        if (prefError) {
            console.error("❌ 'user_notification_preferences' table check failed:", prefError.message);
        } else {
            console.log(`✅ 'user_notification_preferences' table exists. Count: ${prefCount}`);
        }

    } catch (err) {
        console.error("❌ Unexpected error during diagnosis:", err);
    }
    console.log("\n=====================================");
    console.log("DIAGNOSIS COMPLETE");
}

diagnose();
