
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import path from "path"

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing environment variables")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function fixHomeCategories() {
    console.log("Fixing Home Categories...")

    // 1. Get 'CASA' ID
    const { data: casaCategory, error: casaError } = await supabase
        .from("categories")
        .select("id")
        .eq("name", "CASA")
        .single()

    if (casaError || !casaCategory) {
        console.error("Error finding CASA category:", casaError)
        return
    }

    const casaId = casaCategory.id
    console.log(`CASA ID: ${casaId}`)

    // 2. Identify Orphans to move
    const orphans = [
        "Canalizações",
        "Eletricidade",
        "Jardinagem",
        "Limpeza",
        "Pintura",
        "Reparações"
    ]

    // 3. Update their parent_id
    const { data: updated, error: updateError } = await supabase
        .from("categories")
        .update({ parent_id: casaId })
        .in("name", orphans)
        .select()

    if (updateError) {
        console.error("Error updating orphans:", updateError)
        return
    }

    console.log(`Successfully moved ${updated.length} categories under CASA.`)
    updated.forEach(cat => console.log(`- Moved: ${cat.name}`))
}

fixHomeCategories()
