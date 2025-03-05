import {CreateClient} from "@/lib/supabase/server";

export async function uploadFile(bucket:string,path:string,file:File|Blob) {
    const client = await CreateClient()
    const {data,error} = await client.storage.from(bucket).upload(path,file)

    if (error){
        throw new Error(`unable to upload file, due to the following reason: ${error.message}`)
    }

    return data
}