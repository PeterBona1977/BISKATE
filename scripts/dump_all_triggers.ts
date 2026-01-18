
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function dumpTriggers() {
    console.log("Fetching all email templates...");
    const { data: templates, error } = await supabase
        .from('email_templates')
        .select('id, name, slug, trigger_key, is_active')
        .order('name');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${templates.length} templates.`);
    console.table(templates.map(t => ({
        id: t.id,
        name: t.name.substring(0, 30),
        slug: t.slug,
        // explicitly show null vs empty vs undefined
        trigger_key: t.trigger_key === null ? 'NULL' : `'${t.trigger_key}'`,
        active: t.is_active
    })));

    // Check specifically for duplicates in JS to be sure
    const seen = new Set();
    const duplicates = [];
    for (const t of templates) {
        if (t.trigger_key) {
            if (seen.has(t.trigger_key)) {
                duplicates.push(t.trigger_key);
            }
            seen.add(t.trigger_key);
        }
    }

    if (duplicates.length > 0) {
        console.log("\n⚠️ DETECTED DUPLICATE TRIGGER KEYS IN DB:", duplicates);
    } else {
        console.log("\n✅ No duplicate trigger keys found in current data.");
    }
}

dumpTriggers().catch(console.error);
