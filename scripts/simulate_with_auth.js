
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://dhwsocpykhexdvdfyfwd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod3NvY3B5a2hleGR2ZGZ5ZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDI1NTksImV4cCI6MjA4MjUxODU1OX0.ijkdk5di_maqJGzAoVIDwae7w3SbRBgNulOW0z_bI6A";
const supabase = createClient(supabaseUrl, supabaseKey);

const gigId = '711d0fa6-c228-430e-823d-9114802030e5';

async function simulate() {
    const email = `reporter.${Date.now()}@gmail.com`;
    const password = 'password123';

    console.log(`Signing up as ${email}...`);
    const { data: { session }, error: authError } = await supabase.auth.signUp({
        email,
        password
    });

    if (authError) {
        console.error("Auth Error:", authError);
        return;
    }

    if (!session) {
        console.warn("User created but no session (email confirmation likely required).");
        console.warn("Attempting to sign in (in case auto-confirm is on but session wasn't returned immediately)...");
        const { data: { session: signInSession }, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInError || !signInSession) {
            console.error("Could not get session. Cannot bypass RLS.");
            return;
        }
    }

    console.log("Authenticated. Reporting content...");

    // Need to recreate client with auth headers if using supabase-js in node sometimes, 
    // but usually global client handles it if setSession is used. 
    // Easier just to use the returned access token in a new client or rely on the instance if it updated.
    // Actually, createClient doesn't auto-update with session in Node environment easily same way as browser.

    const authClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${session ? session.access_token : ''}` } }
    });

    const { data: alert, error: alertError } = await authClient
        .from('moderation_alerts')
        .insert({
            type: 'spam',
            severity: 'high',
            status: 'pending',
            target_type: 'gig',
            target_id: gigId,
            // reporter_id is usually inferred from auth.uid() by RLS policies, 
            // but we can try sending it explicitly if the table allows.
            // If RLS uses auth.uid() for default, we don't even need to send it if column has default.
            // Let's send it to be safe.
            reporter_id: session?.user?.id,
            description: 'O utilizador está a vender itens proibidos (Simulação Autenticada).',
            metadata: { source: 'simulation_with_auth_script' }
        })
        .select()
        .single();

    if (alertError) {
        console.error("Error creating alert:", alertError);

        // If error is still RLS, print the SQL for user.
        if (alertError.code === '42501') {
            console.log("\nRLS Blocking. Please run this SQL in your Supabase Dashboard:");
            console.log(`INSERT INTO moderation_alerts (type, severity, status, target_type, target_id, description, metadata) VALUES ('spam', 'high', 'pending', 'gig', '${gigId}', 'Manual SQL Alert', '{"manual": true}');`);
        }
    } else {
        console.log("Alert created successfully:", alert.id);
    }
}

simulate();
