
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://dhwsocpykhexdvdfyfwd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod3NvY3B5a2hleGR2ZGZ5ZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDI1NTksImV4cCI6MjA4MjUxODU1OX0.ijkdk5di_maqJGzAoVIDwae7w3SbRBgNulOW0z_bI6A";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActualSchema() {
    console.log("Querying information_schema for notifications table...\n");

    // Query the actual schema from PostgreSQL
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications'
      ORDER BY ordinal_position;
    `
    });

    if (error) {
        console.error("RPC Error (trying direct query):", error);

        // Fallback: Try to insert minimal data to see what fails
        console.log("\nAttempting test insert to reveal required columns...");
        const { error: insertError } = await supabase
            .from('notifications')
            .insert({
                user_id: 'ed596e20-fb04-42b8-b370-62e150672ad8',
                title: 'Test'
            });

        if (insertError) {
            console.error("Insert error:", insertError);
            console.log("\nThis reveals what columns are ACTUALLY in the table.");
        }
    } else {
        console.log("Actual notifications table schema:");
        console.table(data);
    }
}

checkActualSchema();
