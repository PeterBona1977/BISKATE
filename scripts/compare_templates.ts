
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function compare() {
    const { data: t1 } = await supabase.from('email_templates').select('*').eq('trigger_key', 'welcome_email').single();
    const { data: t2 } = await supabase.from('email_templates').select('*').eq('trigger_key', 'email_verified').single();

    fs.writeFileSync('comparison.json', JSON.stringify({ t1, t2 }, null, 2));
    console.log("Wrote comparison to comparison.json");
}

compare().catch(console.error);
