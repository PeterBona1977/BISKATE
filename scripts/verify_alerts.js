
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://dhwsocpykhexdvdfyfwd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod3NvY3B5a2hleGR2ZGZ5ZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDI1NTksImV4cCI6MjA4MjUxODU1OX0.ijkdk5di_maqJGzAoVIDwae7w3SbRBgNulOW0z_bI6A";
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAlerts() {
    console.log("1. Checking if moderation_alerts table has any data...");
    const { data: alerts, error: alertsError, count } = await supabase
        .from('moderation_alerts')
        .select('*', { count: 'exact' })
        .limit(10);

    if (alertsError) {
        console.error("❌ Error fetching alerts:", alertsError);
    } else {
        console.log(`✅ Found ${count} alerts in total`);
        if (alerts && alerts.length > 0) {
            console.table(alerts);
        } else {
            console.log("⚠️ Table is empty!");
        }
    }

    console.log("\n2. Checking admin user role...");
    const { data: profile } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('email', 'pedromiguelbonanca@gmail.com')
        .single();

    if (profile) {
        console.log("Admin profile:", profile);
    }
}

verifyAlerts();
