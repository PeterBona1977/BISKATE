
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
    const { data } = await supabase.from('notifications').select('*').limit(1)
    if (data && data.length > 0) {
        console.log('COLUMNS:', Object.keys(data[0]).join(', '))
    } else {
        console.log('TABLE EMPTY - checking schema via RPC or other means is hard here, but I will try to insert a dummy to see error if needed')
    }
}
run()
