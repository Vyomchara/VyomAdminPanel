"use server"

import { ClientService } from "@/services/client"
import { clientCreate, clientCreateSchema, ClientDroneAssignment, Drone, Payload, DronePayloadAssignment, Client } from "@/drizzle/schema"
import { eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/drizzle/db"

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

export async function getClientDetails(clientId: string) {
  try {
    const client = await serviceMethods.getClientById(clientId)
    return {
      success: true,
      data: client
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Unable to fetch client details: ${err.message}`
    }
  }
}

export async function getDroneAssignments(clientId: string) {
  try {
    const assignments = await db
      .select({
        id: ClientDroneAssignment.id,
        quantity: ClientDroneAssignment.quantity,
        drone: {
          id: Drone.id,
          name: Drone.name,
        },
      })
      .from(ClientDroneAssignment)
      .leftJoin(Drone, eq(ClientDroneAssignment.droneId, Drone.id))
      .where(eq(ClientDroneAssignment.clientId, clientId));

    // Get payloads in a separate query to avoid the relation issue
    const payloads = await db
      .select({
        assignmentId: DronePayloadAssignment.assignmentId,
        payload: {
          id: Payload.id,
          name: Payload.name,
        },
      })
      .from(DronePayloadAssignment)
      .leftJoin(Payload, eq(DronePayloadAssignment.payloadId, Payload.id))
      .where(
        inArray(
          DronePayloadAssignment.assignmentId,
          assignments.map((a) => a.id)
        )
      );

    // Combine the results
    return assignments.map((assignment) => ({
      droneAssignment: assignment,
      drone: assignment.drone,
      payloads: payloads
        .filter((p) => p.assignmentId === assignment.id)
        .map((p) => p.payload),
    }));
  } catch (err: any) {
    console.error('Error fetching drone assignments:', err);
    return [];
  }
}

export async function updateClientVMIP(clientId: string, vmIp: string) {
  try {
    await db
      .update(Client)
      .set({ vm_ip: vmIp })
      .where(eq(Client.id, clientId));
    
    revalidatePath(`/client?id=${clientId}`);
    return { success: true, message: "VM IP updated successfully" };
  } catch (err: any) {
    return { success: false, message: `Unable to update VM IP: ${err.message}` };
  }
}

/**
 * Update client information
 */
export async function updateClientAction(clientId: string, data: { name: string, email: string, address: string }) {
  try {
    // Validate the input data (add more validation as needed)
    if (!data.name.trim()) {
      return { success: false, message: "Client name is required" }
    }
    
    if (!data.email.trim()) {
      return { success: false, message: "Email is required" }
    }
    
    // Call the service method to update the client
    await serviceMethods.updateClient(clientId, data)
    
    // Revalidate both the home page and the client page
    revalidatePath('/')
    revalidatePath(`/client?id=${clientId}`)
    
    return { success: true, message: "Client updated successfully" }
  } catch (err: any) {
    console.error("Error updating client:", err)
    return { success: false, message: `Unable to update client: ${err.message}` }
  }
}

/**
 * Delete client
 */
export async function deleteClientAction(clientId: string) {
  try {
    // First delete all drone assignments related to this client
    await db.delete(ClientDroneAssignment).where(eq(ClientDroneAssignment.clientId, clientId))
    
    // Then delete the client
    await db.delete(Client).where(eq(Client.id, clientId))
    
    // Revalidate the home page
    revalidatePath('/')
    
    return { success: true, message: "Client deleted successfully" }
  } catch (err: any) {
    console.error("Error deleting client:", err)
    return { success: false, message: `Unable to delete client: ${err.message}` }
  }
}

/**
 * Save file URLs to database
 */
export async function saveFilesToClient(
  clientId: string, 
  fileUrls: string[], 
  fileType: 'mission' | 'image'
) {
  try {
    // TODO: Implement database logic to save the file URLs
    // Example:
    // const files = fileUrls.map(url => ({
    //   client_id: clientId,
    //   file_url: url,
    //   file_type: fileType,
    //   created_at: new Date()
    // }));
    // 
    // await db.insert(clientFiles).values(files);
    
    // Revalidate paths to update UI
    revalidatePath(`/client?id=${clientId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error saving file URLs:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}