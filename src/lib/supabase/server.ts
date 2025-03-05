import {createServerClient} from "@supabase/ssr"
import {cookies} from "next/headers"
import {SUPABASE_URL, SUPABASE_ANON_KEY} from "@/app_config"

export async function CreateClient(){
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: ()=> cookieStore.getAll(),
                setAll: (cookiesToSet)=> {
                    for (const {name, value, options} of cookiesToSet){
                        cookieStore.set(name,value,options)
                    }
                }
            }
        }
    )
}