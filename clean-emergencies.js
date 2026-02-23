require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanEmergencies() {
    console.log('🧹 Starting Emergency Data Cleanup...');

    try {
        // 1. Delete all emergency_responses
        console.log('⏳ Deleting all Emergency Responses...');
        const { error: respError } = await supabase
            .from('emergency_responses')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

        if (respError) throw respError;
        console.log('✅ Emergency Responses deleted.');

        // 2. Delete all emergency_requests
        console.log('⏳ Deleting all Emergency Requests...');
        const { error: reqError } = await supabase
            .from('emergency_requests')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

        if (reqError) throw reqError;
        console.log('✅ Emergency Requests deleted.');

        // 3. Delete related notifications (optional but good for a clean state)
        console.log('⏳ Deleting Emergency Notifications...');
        const { error: notifError } = await supabase
            .from('notifications')
            .delete()
            .like('title', '%Emergência%');

        if (notifError) console.error('⚠️ Could not delete notifications:', notifError.message);
        else console.log('✅ Emergency Notifications deleted.');

        console.log('\n🎉 Cleanup Complete! The database is ready for fresh testing.');
    } catch (error) {
        console.error('\n❌ Error during cleanup:', error.message || error);
    }
}

cleanEmergencies();
