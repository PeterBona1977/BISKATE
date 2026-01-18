
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function deleteLegacy() {
    const legacyId = '5a753a3e-d3e5-431e-8a08-87a3a3db512e';
    console.log(`Deleting legacy template ${legacyId} ("Welcome Email") so "Bem-vindo" can take its key...`);

    const { error } = await supabase.from('email_templates').delete().eq('id', legacyId);

    if (error) {
        console.error("Error deleting:", error);
    } else {
        console.log("✅ Successfully deleted legacy 'Welcome Email' template.");
    }
}

deleteLegacy().catch(console.error);
