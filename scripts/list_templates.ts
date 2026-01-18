
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function listAll() {
    const { data: templates, error } = await supabase
        .from('email_templates')
        .select('id, name, slug, trigger_key, category');

    if (error) {
        console.error(error);
        return;
    }

    console.log(JSON.stringify(templates, null, 2));
}

listAll().catch(console.error);
