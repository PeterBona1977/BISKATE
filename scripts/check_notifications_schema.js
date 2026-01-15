
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://dhwsocpykhexdvdfyfwd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRod3NvY3B5a2hleGR2ZGZ5ZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDI1NTksImV4cCI6MjA4MjUxODU1OX0.ijkdk5di_maqJGzAoVIDwae7w3SbRBgNulOW0z_bI6A";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Fetching a sample notification to see the schema...");

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        if (data && data.length > 0) {
            console.log("Sample notification columns:");
            console.log(Object.keys(data[0]));
            console.log("\nSample data:");
            console.log(data[0]);
        } else {
            console.log("Table is empty, cannot determine schema from data.");
            console.log("Let's try to insert a test notification to reveal the actual columns...");
        }
    }
}

checkSchema();
