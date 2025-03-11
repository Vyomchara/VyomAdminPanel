"use server"

import { ClientService } from "@/services/client"
import { clientCreate, clientCreateSchema} from "@/drizzle/schema"
import { revalidatePath } from "next/cache";

const serviceMethods = new ClientService()

export async function clientCreateAction(data:clientCreate) {
    try {
        const parsedData = clientCreateSchema.parse(data)

        await serviceMethods.createClient(parsedData)
        revalidatePath('/'); // Revalidate the home page
        return {success:true, message:`Client ${parsedData.name} added successfully`}
    } catch (err:any) {
        return {success:false, message: `Unable to add Client ${data.name}, due to ${err}`}
    }
}