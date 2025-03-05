"use server"

import {redirect} from "next/navigation"
import {CreateClient} from "@/lib/supabase/server"

export async function login(formdata:FormData) {
    const supabase = await CreateClient()
    const { error } = await supabase.auth.signInWithPassword({
        email: formdata.get('email') as string,
        password: formdata.get('password') as string
    })

    console.log('Logged in successfully')
    if (error) {
        redirect('/error')
    }

    redirect('/')
}