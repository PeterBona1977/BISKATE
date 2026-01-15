
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://dhwsocpykhexdvdfyfwd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod3NvY3B5a2hleGR2ZGZ5ZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDI1NTksImV4cCI6MjA4MjUxODU1OX0.ijkdk5di_maqJGzAoVIDwae7w3SbRBgNulOW0z_bI6A";
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestAlert() {
    console.log("Inserting test moderation alert...");

    const { data, error } = await supabase
        .from('moderation_alerts')
        .insert({
            type: 'spam',
            severity: 'high',
            status: 'pending',
            target_type: 'gig',
            target_id: '711d0fa6-c228-430e-823d-9114802030e5',
            description: 'TESTE: Venda de itens proibidos. Este é um alerta de teste criado automaticamente.',
            metadata: { source: 'node_script_insert', test: true }
        })
        .select()
        .single();

    if (error) {
        console.error("❌ Error inserting alert:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ Alert inserted successfully!");
        console.log("Alert ID:", data.id);
        console.log("Alert data:", data);
    }
}

insertTestAlert();
