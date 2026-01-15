
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://dhwsocpykhexdvdfyfwd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod3NvY3B5a2hleGR2ZGZ5ZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDI1NTksImV4cCI6MjA4MjUxODU1OX0.ijkdk5di_maqJGzAoVIDwae7w3SbRBgNulOW0z_bI6A";
const supabase = createClient(supabaseUrl, supabaseKey);

const offenderId = '7986b014-d65b-40cf-a359-15b91b49dbbc';
const reporterId = 'ed596e20-fb04-42b8-b370-62e150672ad8';

async function simulate() {
    console.log("Creating dummy Gig...");
    const { data: gig, error: gigError } = await supabase
        .from('gigs')
        .insert({
            title: 'Serviço Suspeito de Teste',
            description: 'Este é um gig criado automaticamente para testar o sistema de moderação. Contém termos que violam as regras.',
            author_id: offenderId,
            category: 'outros',
            price: 100
        })
        .select()
        .single();

    if (gigError) {
        console.error("Error creating gig:", gigError);
        return;
    }
    console.log("Gig created:", gig.id);

    console.log("Creating Moderation Alert...");
    const { data: alert, error: alertError } = await supabase
        .from('moderation_alerts')
        .insert({
            type: 'spam',
            severity: 'high',
            status: 'pending',
            target_type: 'gig',
            target_id: gig.id,
            reporter_id: reporterId,
            description: 'O utilizador está a vender itens proibidos e o título é enganoso.',
            metadata: { source: 'simulation_script' }
        })
        .select()
        .single();

    if (alertError) {
        console.error("Error creating alert:", alertError);
    } else {
        console.log("Alert created successfully:", alert.id);
    }
}

simulate();
