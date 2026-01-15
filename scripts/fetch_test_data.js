
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://dhwsocpykhexdvdfyfwd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod3NvY3B5a2hleGR2ZGZ5ZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDI1NTksImV4cCI6MjA4MjUxODU1OX0.ijkdk5di_maqJGzAoVIDwae7w3SbRBgNulOW0z_bI6A";
const supabase = createClient(supabaseUrl, supabaseKey);

async function getData() {
    console.log("Fetching profiles...");
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .limit(5);

    if (profileError) console.error("Profile Error:", profileError);
    else console.log("Profiles:", profiles);

    console.log("\nFetching gigs...");
    const { data: gigs, error: gigError } = await supabase
        .from('gigs')
        .select('id, title, author_id')
        .limit(5);

    if (gigError) console.error("Gig Error:", gigError);
    else console.log("Gigs:", gigs);
}

getData();
