
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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

    const simplified = templates.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        trigger_key: t.trigger_key
    }));

    // Write to absolute path in the workspace
    const outputPath = path.resolve(process.cwd(), 'audit_output.json');
    fs.writeFileSync(outputPath, JSON.stringify(simplified, null, 2));
    console.log(`Dumped ${simplified.length} templates to ${outputPath}`);
}

audit().catch(console.error);
