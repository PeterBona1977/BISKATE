
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://dhwsocpykhexdvdfyfwd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod3NvY3B5a2hleGR2ZGZ5ZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDI1NTksImV4cCI6MjA4MjUxODU1OX0.ijkdk5di_maqJGzAoVIDwae7w3SbRBgNulOW0z_bI6A";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testModAlertSchema() {
    console.log("Testing moderation_alerts schema with minimal update...\n");

    // Get an alert first
    const { data: alerts } = await supabase
        .from('moderation_alerts')
        .select('id')
        .limit(1);

    if (!alerts || alerts.length === 0) {
        console.log("No alerts to test with");
        return;
    }

    const testId = alerts[0].id;
    console.log("Testing with alert ID:", testId);

    // Try to update with the fields the code is trying to use
    const { error } = await supabase
        .from('moderation_alerts')
        .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: 'ed596e20-fb04-42b8-b370-62e150672ad8',
            resolution_action: 'approve'
        })
        .eq('id', testId);

    if (error) {
        console.error("Update error:", error);
        console.log("\nThis reveals which column doesn't exist.");

        // Try without resolution_action
        console.log("\nRetrying without resolution_action...");
        const { error: error2 } = await supabase
            .from('moderation_alerts')
            .update({
                status: 'resolved',
                resolved_at: new Date().toISOString(),
                resolved_by: 'ed596e20-fb04-42b8-b370-62e150672ad8'
            })
            .eq('id', testId);

        if (error2) {
            console.error("Still fails:", error2);
        } else {
            console.log("✅ Success! resolution_action column doesn't exist in the table.");
        }
    } else {
        console.log("✅ Update succeeded - all columns exist");
    }
}

testModAlertSchema();
