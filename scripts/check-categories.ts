
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

import fs from "fs"

async function checkCategories() {
    console.log("Fetching full category hierarchy...")

    const { data: allCategories, error } = await supabase
        .from("categories")
        .select("id, name, parent_id")
        .eq("is_active", true)

    if (error) {
        console.error("Error fetching categories:", error)
        return
    }

    const categoriesMap = new Map()
    const rootCategories: any[] = []

    allCategories.forEach(cat => {
        categoriesMap.set(cat.id, { ...cat, children: [] })
    })

    allCategories.forEach(cat => {
        if (cat.parent_id) {
            const parent = categoriesMap.get(cat.parent_id)
            if (parent) {
                parent.children.push(categoriesMap.get(cat.id))
            }
        } else {
            rootCategories.push(categoriesMap.get(cat.id))
        }
    })

    fs.writeFileSync("category_hierarchy.json", JSON.stringify(rootCategories, null, 2))
    console.log("Hierarchy written to category_hierarchy.json")
}

checkCategories()
