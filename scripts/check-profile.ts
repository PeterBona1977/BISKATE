
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_PROFILE_ID = '80497189-3f49-44c2-a0a1-1639e956711e';

async function checkProfile() {
    console.log(`Checking for profile ID: ${TARGET_PROFILE_ID}`);

    // Check if profile exists using implicit count to avoid RLS 406 if possible, or just select
    const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('id', TARGET_PROFILE_ID);

    if (error) {
        console.error('Error fetching profile:', error);
        if (error.code === 'PGRST116') {
            console.error('Error code suggests data not found or format issue (often associated with .single() on empty result).');
        }
    } else {
        if (data && data.length > 0) {
            console.log('✅ Profile FOUND!');
            console.log(data[0]);
        } else {
            console.log('❌ Profile NOT FOUND in public.profiles table.');
            console.log('This explains the 406 error if the app expects it to exist.');
        }
    }
}

checkProfile();
