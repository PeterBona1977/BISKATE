import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
    console.log("Testing conversations table...")
    // Just try to fetch an emergency conversation to see if the columns exist
    const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .limit(1)

    if (error) {
        console.error("Error:", error)
    } else {
        console.log("Success. Columns on returned data:", Object.keys(data[0] || {}))
    }
}

test()
