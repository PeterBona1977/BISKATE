
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkEmpty() {
    const { data, error } = await supabase
        .from('email_templates')
        .select('id, trigger_key')
        .or('trigger_key.eq.,trigger_key.is.null'); // Check for empty string or null

    if (error) console.error(error);
    else {
        const emptyStrings = data.filter(r => r.trigger_key === "");
        const nulls = data.filter(r => r.trigger_key === null);
        console.log(`Found ${emptyStrings.length} empty strings.`);
        console.log(`Found ${nulls.length} nulls.`);
        if (emptyStrings.length > 0) console.log("Empty strings:", emptyStrings);
    }
}

checkEmpty().catch(console.error);
