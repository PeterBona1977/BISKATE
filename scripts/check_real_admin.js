
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://dhwsocpykhexdvdfyfwd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod3NvY3B5a2hleGR2ZGZ5ZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDI1NTksImV4cCI6MjA4MjUxODU1OX0.ijkdk5di_maqJGzAoVIDwae7w3SbRBgNulOW0z_bI6A";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmin() {
    console.log("Checking pmbonanca@gmail.com...");
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('email', 'pmbonanca@gmail.com');

    if (error) console.error("Error:", error);
    else {
        if (profiles.length === 0) {
            console.log("User pmbonanca@gmail.com NOT FOUND in profiles table.");
        } else {
            console.table(profiles);
        }
    }
}

checkAdmin();
