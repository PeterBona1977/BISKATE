
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function audit() {
    const { data: templates, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name');

    if (error) {
        console.error(error);
        return;
    }

    console.log("--- TEMPLATE DUMP ---");
    // Print minimal info to avoid massive log, but include key fields
    const simplified = templates.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        trigger_key: t.trigger_key
    }));

    console.log(JSON.stringify(simplified, null, 2));
    console.log("---------------------");

    // Check for specific collisions
    const targetKey = 'welcome_email';
    const welcomeOwners = templates.filter(t => t.trigger_key === targetKey);
    console.log(`Owners of '${targetKey}':`, welcomeOwners.map(t => t.id));
}

audit().catch(console.error);
