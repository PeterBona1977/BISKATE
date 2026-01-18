
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function reproduce() {
    const targetId = '1748f89d-080c-4abe-a033-ad07d405f786';

    console.log("1. Fetching...");
    const { data: template, error: fetchError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', targetId)
        .single();

    if (fetchError) {
        console.error("Fetch error:", fetchError);
        return;
    }
    console.log(`Fetched: ${template.name} (${template.slug}) Trigger: ${template.trigger_key}`);

    // 2. Update with SAME data (should succeed)
    console.log("2. Updating with SAME data...");
    const { error: updateError1 } = await supabase
        .from('email_templates')
        .update({
            name: template.name,
            slug: template.slug,
            trigger_key: template.trigger_key
        })
        .eq('id', targetId);

    if (updateError1) console.error("Update 1 failed:", updateError1);
    else console.log("Update 1 Success!");

    // 3. Update with NULL trigger_key (should succeed if unique allows multiple nulls)
    console.log("3. Updating with NULL trigger_key...");
    const { error: updateError2 } = await supabase
        .from('email_templates')
        .update({
            trigger_key: null
        })
        .eq('id', targetId);

    if (updateError2) console.error("Update 2 failed:", updateError2);
    else console.log("Update 2 Success!");

    // Revert
    await supabase.from('email_templates').update({ trigger_key: template.trigger_key }).eq('id', targetId);

    // 4. Update with EMPTY STRING trigger_key (CHECK FOR CONFLICT)
    console.log("4. Updating with EMPTY STRING trigger_key...");
    const { error: updateError3 } = await supabase
        .from('email_templates')
        .update({
            trigger_key: ""
        })
        .eq('id', targetId);

    if (updateError3) {
        console.error("Update 3 failed:", updateError3); // EXPECT 409 if empty strings conflict
    } else {
        console.log("Update 3 Success!");
    }

    // Revert
    if (!updateError3) await supabase.from('email_templates').update({ trigger_key: template.trigger_key }).eq('id', targetId);
}

reproduce().catch(console.error);
