
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function getPlans() {
    const { data, error } = await supabase.from('plan_limits').select('*')
    if (error) {
        console.error('Error fetching plans:', error)
    } else {
        fs.writeFileSync('plans_data.json', JSON.stringify(data, null, 2), 'utf-8')
        console.log('Plans saved to plans_data.json')
    }
}

getPlans()
