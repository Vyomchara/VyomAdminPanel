import {createBrowserClient} from "@supabase/ssr"
import {SUPABASE_ANON_KEY,SUPABASE_URL} from "@/app_config"

export function createClient(){
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}