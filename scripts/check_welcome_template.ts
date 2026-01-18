
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
    const { data: t } = await supabase
        .from('email_templates')
        .select('id, name, slug, trigger_key')
        .eq('id', '1748f89d-080c-4abe-a033-ad07d405f786') // The active one
        .single();

    console.log("Current State of 'Bem-vindo (Email Confirmado)':", t);
}

check().catch(console.error);
