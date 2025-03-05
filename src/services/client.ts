import { 
    Client,
    type clientCreate,
    type clientSelect,
    type clientUpdate
} from "@/drizzle/schema";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";


// export async function createClient(client: clientCreate):Promise<clientSelect> {
//     try {
//         const [newClient] : clientSelect[] = await db.insert(Client).values(client).returning()
//         if (!newClient){
//             throw new Error(`unable to create new user`)
//         }
//         return newClient
//     } catch (error:any) {
//         throw new Error(`Unable to create client, due to: ${error}`)
//     }
// }

// export async function updateClient(client_id:string,data:clientUpdate):Promise<clientSelect> {
//     try{
//         const [updatedClient]: clientSelect[] = await db.update(Client).set(data).where(eq(Client.id,client_id)).returning()
//         if (!updatedClient){
//             throw new Error('unable to update client')
//         }
//         return updatedClient
//     }catch(error:any){
//         throw new Error(`Unable to update client, due to: ${error}`)
//     }
// }

// export async function getAllClient():Promise<clientSelect[]> {
//    try {
//         const clients: clientSelect[] = await db.select().from(Client)
//         return clients
//    } catch (error:any) {
//         throw new Error(`Unable to get clients, due to: ${error}`)
//    } 
// }

// export async function getClientById(id:string):Promise<clientSelect> {
//     try {
//         const [client]: clientSelect[] = await db.select().from(Client).where(eq(Client.id,id))
//         if (!client){
//             throw new Error(`unable to find client with id: ${id} or doesn't exists`)
//         }
//         return client
//     } catch (error:any) {
//         throw new Error(`unable to get client, due to ${error}`)
//     }
// }

export class ClientService {
    db
    constructor() {
        this.db = db
    }

    async createClient(client: clientCreate):Promise<clientSelect> {
        try {
            const [newClient] : clientSelect[] = await this.db.insert(Client).values(client).returning()
            if (!newClient){
                throw new Error(`unable to create new user`)
            }
            return newClient
        } catch (error:any) {
            throw new Error(`Unable to create client, due to: ${error}`)
        }
    }

    async updateClient(client_id:string,data:clientUpdate):Promise<clientSelect> {
        try{
            const [updatedClient]: clientSelect[] = await this.db.update(Client).set(data).where(eq(Client.id,client_id)).returning()
            if (!updatedClient){
                throw new Error('unable to update client')
            }
            return updatedClient
        }catch(error:any){
            throw new Error(`Unable to update client, due to: ${error}`)
        }
    }

    async getAllClient(n?:number,reverse?:boolean):Promise<clientSelect[]> {
       try {
            const clients: clientSelect[] = await this.db.select().from(Client)
            if (reverse){
                clients.sort((a,b)=> (new Date(b.created_at).getTime())- (new Date(a.created_at)).getTime())
            }
            if (n && n>0){
                return clients.slice(0,n)
            }
            return clients
       } catch (error:any) {
            throw new Error(`Unable to get clients, due to: ${error}`)
       } 
    }

    async getClientById(id:string):Promise<clientSelect> {
        try {
            const [client]: clientSelect[] = await this.db.select().from(Client).where(eq(Client.id,id))
            if (!client){
                throw new Error(`unable to find client with id: ${id} or doesn't exists`)
            }
            return client
        } catch (error:any) {
            throw new Error(`unable to get client, due to ${error}`)
        }
    }
}