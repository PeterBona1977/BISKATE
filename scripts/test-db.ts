
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

async function testCategoriesSchema() {
    console.log('Testing categories schema...');

    // Try to select the new columns
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, parent_id, margin_percentage, slug, is_active, updated_at')
        .limit(5);

    if (error) {
        console.error('Error querying categories:', error);
        process.exit(1);
    } else {
        console.log('Successfully queried categories with new columns!');
        console.log('Sample data:', JSON.stringify(data, null, 2));

        // Check if we have data and if fields are correct
        if (data && data.length > 0) {
            const first = data[0];
            if (first.hasOwnProperty('parent_id') && first.hasOwnProperty('margin_percentage') && first.hasOwnProperty('slug')) {
                console.log('✅ Schema verification PASSED: All new columns are present.');
            } else {
                console.log('❌ Schema verification FAILED: Some columns are missing in the response.');
            }
        } else {
            console.log('⚠️ No categories found to verify data structure, but query executed without error.');
        }
    }
}

testCategoriesSchema();
