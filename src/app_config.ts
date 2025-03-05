import dotenv from "dotenv"

dotenv.config({path:".env.local"})

if (!process.env.DATABASE_URL){
    throw new Error(`No Database Url Found ${process.env.DATABASE_URL}`)
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL){
    throw new Error (`No Supabase Url Found ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY){
    throw new Error (`No Anon Key Found ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)
}


export const DATABASE_URL:string = process.env.DATABASE_URL as string
export const SUPABASE_URL:string = process.env.SUPABASE_URL as string
export const SUPABASE_ANON_KEY:string = process.env.SUPABASE_ANON_KEY as string
