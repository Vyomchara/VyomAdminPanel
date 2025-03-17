"use server"

import { ClientService } from "@/services/client"
import { clientCreate, clientCreateSchema, ClientDroneAssignment, Drone, Payload, DronePayloadAssignment, Client } from "@/drizzle/schema"
import { eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/drizzle/db"
import { CreateClient } from "@/lib/supabase/server"
import { v4 as uuid } from "uuid"

// Remove auth client - using middleware instead
// const auth = CreateClient();

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

export async function updateClientVMIPAndPassword(clientId:string, data:{
  vmIp:string,
  vmPassword:string
 }){
  'use server';
  try {
    if (!data.vmIp.trim() || !/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(data.vmIp)) {
      return { success: false, message: "Invalid VM IP address format" };
    }
    if (/^\s*$/.test(data.vmPassword)) {
      return { success: false, message: "Password cannot be empty" };
    }
    await serviceMethods.updateClient(clientId, { vm_ip: data.vmIp, vm_password: data.vmPassword });
    revalidatePath(`/client?id=${clientId}`);    
    return { success: true, message: "VM IP and password updated successfully" };
  } catch (err:any) {
    return { success: false, message: `Unable to update VM IP and VM Password: ${err.message}` };
  }
 }

export async function updateClientVMIP(clientId: string, data:{vm_ip: string}) {
  'use server';
  try {
    // Validate IP address format
    if (!data.vm_ip.trim() || !/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(data.vm_ip)) {
      return { success: false, message: "Invalid VM IP address format" };
    }
    
    // Continue with update
    await serviceMethods.updateClient(clientId, { vm_ip: data.vm_ip });
    
    revalidatePath(`/client?id=${clientId}`);
    return { success: true, message: "VM IP updated successfully" };
  } catch (err: any) {
    return { success: false, message: `Unable to update VM IP: ${err.message}` };
  }
}

/**
 * Update client information
 */
export async function updateClientAction(clientId: string, data: { name: string, email: string, address: string}) {
  'use server';
  
  // Remove authentication check - handled by middleware
  
  try {
    // Validate the input data (add more validation as needed)
    if (  !data.name.trim()) {
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
export async function saveFilesToClient(data: {
  clientId: string;
  fileUrl: string;
  fileType: 'mission' | 'image';
  fileName: string;
}) {
  try {
    // TODO: Implement database logic to save the file URLs
    // Example:
    // const file = {
    //   client_id: data.clientId,
    //   file_url: data.fileUrl,
    //   file_type: data.fileType,
    //   file_name: data.fileName,
    //   created_at: new Date()
    // };
    // 
    // await db.insert(clientFiles).values(file);
    
    // Revalidate paths to update UI
    revalidatePath(`/client?id=${data.clientId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error saving file URL:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Upload a file to storage
 * Supports two use cases:
 * 1. Client files: (formData, clientId, fileType)
 * 2. Generic files: (formData, bucket, path)
 */
export async function uploadFileToServer(
  formData: FormData,
  bucketOrClientId: string,
  fileTypeOrPath: string | 'mission' | 'image' = ''
): Promise<{ success: boolean; url?: string; message?: string }> {
  'use server';
  
  try {
    // Get the file from FormData
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, message: "No file provided" };
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, message: `File too large. Maximum size is 10MB` };
    }
    
    // Create a server-side Supabase client
    const supabase = await CreateClient();
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuid()}.${fileExt}`;
    
    // Determine if this is a client file upload or generic bucket upload
    const isClientUpload = fileTypeOrPath === 'mission' || fileTypeOrPath === 'image';
    
    let bucket: string;
    let fullPath: string;
    
    if (isClientUpload) {
      // Client file upload case
      const clientId = bucketOrClientId;
      const fileType = fileTypeOrPath;
      
      bucket = 'client-files';
      fullPath = `clients/${clientId}/${fileType}s/${fileName}`;
      
      // Validate file type for client uploads
     // const allowedTypes = fileType === 'mission'
     const allowedTypes = fileType === 'image' 
        ? ['application/json', 'application/x-yaml']
        : ['image/jpeg', 'image/png', 'image/gif'];
        
      if (!allowedTypes.includes(file.type)) {
        return { 
          success: false, 
          message: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` 
        };
      }
    } else {
      // Generic upload case
      bucket = bucketOrClientId;
      const path = fileTypeOrPath;
      fullPath = `${path}/${fileName}`.replace(/\/+/g, '/');
    }
    
    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false
      });
      
    if (error) {
      console.error("Upload error:", error);
      return { success: false, message: error.message };
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fullPath);
      
    // For client uploads, save to database
    if (isClientUpload) {
      await saveFilesToClient({
        clientId: bucketOrClientId,
        fileUrl: urlData.publicUrl,
        fileType: fileTypeOrPath as 'mission' | 'image',
        fileName: file.name
      });
    }
    
    return { 
      success: true, 
      url: urlData.publicUrl,
      message: "File uploaded successfully"
    };
  } catch (error) {
    console.error("Server upload error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}