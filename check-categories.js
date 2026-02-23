
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Service Role Key")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCategories() {
    const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name, parent_id')
        .eq('is_active', true)

    if (error) {
        console.error("Error fetching categories:", error)
        return
    }

    console.log("Total categories found:", categories.length)

    const canalizacoes = categories.find(c => c.name === 'Canalizações')
    if (canalizacoes) {
        console.log("Found 'Canalizações':", canalizacoes)
        const children = categories.filter(c => c.parent_id === canalizacoes.id)
        console.log(`Found ${children.length} services under 'Canalizações':`)
        children.forEach(child => console.log(` - ${child.name} (${child.id})`))
    } else {
        console.log("'Canalizações' not found in active categories.")
    }

    // List all top level categories
    const topLevel = categories.filter(c => c.parent_id === null)
    console.log("\nTop Level Categories:")
    topLevel.forEach(c => console.log(` - ${c.name} (${c.id})`))
}

checkCategories()
