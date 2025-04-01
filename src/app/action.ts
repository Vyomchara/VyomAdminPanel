"use server"

import { ClientService } from "@/services/client"
import { clientCreate, clientCreateSchema, ClientDroneAssignment, Drone, Payload, DronePayloadAssignment, Client } from "@/drizzle/schema"
import { eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/drizzle/db"
import { CreateClient } from "@/lib/supabase/server"
import { v4 as uuid } from "uuid"
import { SUPABASE_URL } from '@/app_config'
import { SUPABASE_SERVICE_KEY } from '@/server_config'
import { getMissionFiles } from "@/lib/uploadToBucket"

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
export async function saveFilesToClient(params: {
  url: string;
  bucketName: string;
  clientId: string;
  fileType?: string;
  fileName?: string;
}) {
  'use server';
  
  try {
    const { url, bucketName, clientId, fileType = 'mission', fileName } = params;
    
    // Extract filename from URL if not provided
    const extractedFileName = fileName || url.split('/').pop() || 'unnamed';
    
    console.log("Saving file metadata:", {
      clientId,
      fileName: extractedFileName,
      bucketName,
      fileType,
      url
    });
    
    // TODO: Add database storage logic here if needed
    
    // Revalidate the path
    revalidatePath(`/client?id=${clientId}`);
    
    return { 
      success: true,
      fileDetails: {
        fileName: extractedFileName,
        extension: extractedFileName.split('.').pop() || '',
        url,
        bucketName,
        fileType
      }
    };
  } catch (error) {
    console.error("Error saving file to client:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
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
  fileTypeOrPath: string | 'mission'  = ''
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
      
      bucket = 'mission';
      fullPath = `clients/${clientId}/${Date.now()}${fileName}`;
      
      // Validate file type for client uploads
      const allowedTypes = fileType === 'mission'
        ? ['application/json', 'text/plain', 'application/xml', 'application/zip', 'application/x-yaml']
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
        url: urlData.publicUrl,
        bucketName: bucket,
        clientId: bucketOrClientId
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

export async function getClientFilesAction(clientId: string, bucketName: string) {
  const supabase = await CreateClient();
  
  console.log(`Fetching files for client ${clientId} from ${bucketName} bucket...`);
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(clientId);
      
    // Rest of implementation...
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: String(error), files: [] };
  }
}


/**
 * Helper function to format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Delete a file from Supabase storage using server credentials
 */
export async function deleteFileFromStorage(filePath: string, bucketName: string = 'mission') {
  try {
    console.log(`[SERVER] Deleting file from ${bucketName}: ${filePath}`);

    // Create server-side Supabase client with admin privileges
    const supabase = await CreateClient();

    if (!filePath) {
      return { success: false, message: "File path is required" };
    }

    // Validate file path to ensure it's not trying to access files outside intended path
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return { success: false, message: "Invalid file path" };
    }

    // Attempt to delete the file
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(`[SERVER] Error deleting file: ${error.message}`);
      return { success: false, message: error.message };
    }

    // TODO: If you're storing file references in a database, remove those as well
    // await db.delete(clientFiles).where(eq(clientFiles.file_path, filePath));

    console.log(`[SERVER] Successfully deleted file: ${filePath}`);
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("[SERVER] File deletion error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Upload client files (mission, images) to appropriate storage
 */
export async function uploadClientFiles(
  files: File[],
  clientId: string,
  fileType: 'mission' | 'image'
): Promise<{ urls: string[]; errors: Error[] }> {
  const urls: string[] = [];
  const errors: Error[] = [];
  
  for (const file of files) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await uploadFileToServer(formData, clientId, fileType);
      
      if (response.success && response.url) {
        urls.push(response.url);
      } else {
        errors.push(new Error(response.message || "Upload failed"));
      }
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error("Unknown upload error"));
    }
  }
  
  return { urls, errors };
}

/**
 * List client files
 */
export async function listClientFiles(clientId: string) {
  'use server';
  
  console.log("Server action: listClientFiles for client", clientId);
  
  // Validate clientId early
  if (!clientId) {
    console.error("listClientFiles called with empty clientId");
    return { 
      success: false, 
      error: "Missing client ID", 
      files: [] 
    };
  }
  
  try {
    console.log("Attempting to get mission files for clientId:", clientId);
    const result = await getMissionFiles(clientId);
    
    console.log("Files fetched result:", result);
    
    if (!result || !result.success) {
      return { 
        success: false, 
        error: result?.error || "Failed to load files", 
        files: [] 
      };
    }
    
    return {
      success: true,
      files: result.files || []
    };
  } catch (error) {
    console.error("Error in listClientFiles:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      files: []
    };
  }
}

/**
 * Create a signed URL for file access
 */
export async function createSignedUrl(
  filePath: string,
  bucketName: string = 'mission',
  expirySeconds: number = 60 * 60 // 1 hour default
) {
  try {
    const supabase = await CreateClient();
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expirySeconds);
    
    if (error) {
      throw error;
    }
    
    return { 
      success: true,
      url: data.signedUrl,
      error: null
    };
  } catch (error) {
    console.error("Error creating signed URL:", error);
    return { 
      success: false, 
      url: null,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  filePath: string,
  
) {
  return deleteFileFromStorage(filePath, 'mission');
}

/**
 * Upload a PEM file for a client's VM SSH authentication
 */
export async function uploadPemFile(clientId: string, file: File): Promise<{ success: boolean; fileUrl?: string; message?: string }> {
  'use server';
  
  try {
    if (!file) {
      return { success: false, message: "No PEM file provided" };
    }
    
    // Check if file has .pem extension
    if (!file.name.endsWith('.pem')) {
      return { success: false, message: "Invalid file format. Please upload a .pem file" };
    }
    
    // Check if a PEM file already exists
    const checkResult = await checkForClientPemFile(clientId);
    if (checkResult.success && checkResult.fileExists) {
      return { success: false, message: "A PEM file already exists. Please delete it first before uploading a new one." };
    }
    
    // Create FormData for the upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Use uploadFileToServer with the pemfile bucket
    const uploadResult = await uploadFileToServer(formData, 'pemfile', `${clientId}/vm`);
    
    return uploadResult;
  } catch (error) {
    console.error("Error uploading PEM file:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}

/**
 * Check if a PEM file exists for a client
 */
export async function checkForClientPemFile(clientId: string): Promise<{ 
  success: boolean; 
  fileExists: boolean;
  fileUrl?: string;
  message?: string;
}> {
  'use server';
  
  try {
    const supabase = await CreateClient();
    
    // Check if the pemfile bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some(b => b.name === 'pemfile')) {
      await supabase.storage.createBucket('pemfile', {
        public: false,  // PEM files should be private
        fileSizeLimit: 5242880,  // 5MB limit for key files
      });
    }
    
    // Check for files in the client's VM folder
    const { data, error } = await supabase.storage
      .from('pemfile')
      .list(`${clientId}/vm`);
      
    if (error) {
      // If the error is "not found", the folder doesn't exist yet, which is fine
      if (error.message.includes('not found')) {
        return { success: true, fileExists: false };
      }
      
      return { success: false, fileExists: false, message: error.message };
    }
    
    // Check if any .pem files exist
    const pemFile = data?.find(file => file.name.endsWith('.pem'));
    if (!pemFile) {
      return { success: true, fileExists: false };
    }
    
    // Create a signed URL for the PEM file (short-lived)
    const { data: urlData } = await supabase.storage
      .from('pemfile')
      .createSignedUrl(`${clientId}/vm/${pemFile.name}`, 60); // 1 minute expiry
      
    return { 
      success: true, 
      fileExists: true,
      fileUrl: urlData?.signedUrl
    };
  } catch (error) {
    console.error("Error checking for PEM file:", error);
    return { 
      success: false, 
      fileExists: false,
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}

/**
 * Delete a client's PEM file
 */
export async function deleteClientPemFile(clientId: string): Promise<{ success: boolean; message?: string }> {
  'use server';
  
  try {
    const supabase = await CreateClient();
    
    // List files to find the PEM file
    const { data, error: listError } = await supabase.storage
      .from('pemfile')
      .list(`${clientId}/vm`);
      
    if (listError) {
      return { success: false, message: listError.message };
    }
    
    // Find PEM files
    const pemFiles = data?.filter(file => file.name.endsWith('.pem')) || [];
    if (pemFiles.length === 0) {
      return { success: false, message: "No PEM file found" };
    }
    
    // Delete the PEM files (usually there should be only one)
    const filesToDelete = pemFiles.map(file => `${clientId}/vm/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from('pemfile')
      .remove(filesToDelete);
      
    if (deleteError) {
      return { success: false, message: deleteError.message };
    }
    
    return { success: true, message: "PEM file deleted successfully" };
  } catch (error) {
    console.error("Error deleting PEM file:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

// Add these action functions for drone and payload management

export async function getAvailableDrones() {
  'use server';
  
  try {
    const drones = await db.select().from(Drone);
    return { success: true, drones };
  } catch (error) {
    console.error('Error fetching available drones:', error);
    return { success: false, error: String(error), drones: [] };
  }
}

export async function getAvailablePayloads() {
  'use server';
  
  try {
    const payloads = await db.select().from(Payload);
    return { success: true, payloads };
  } catch (error) {
    console.error('Error fetching available payloads:', error);
    return { success: false, error: String(error), payloads: [] };
  }
}

export async function createDroneAssignment(clientId: string, droneId: number, quantity: number) {
  'use server';
  
  try {
    const [assignment] = await db.insert(ClientDroneAssignment)
      .values({
        clientId,
        droneId,
        quantity
      })
      .returning();
    
    return { success: true, assignment };
  } catch (error) {
    console.error('Error creating drone assignment:', error);
    return { success: false, error: String(error) };
  }
}

export async function assignPayloadsToDrone(assignmentId: string, payloadIds: number[]) {
  'use server';
  
  try {
    if (!payloadIds.length) {
      return { success: true, assignments: [] };
    }
    
    const values = payloadIds.map(payloadId => ({
      assignmentId,
      payloadId
    }));
    
    const assignments = await db.insert(DronePayloadAssignment)
      .values(values)
      .returning();
    
    return { success: true, assignments };
  } catch (error) {
    console.error('Error assigning payloads:', error);
    return { success: false, error: String(error) };
  }
}

export async function getClientDroneAssignments(clientId: string) {
  'use server';
  
  try {
    // Check if clientId is valid
    if (!clientId) {
      console.error("Missing client ID in getClientDroneAssignments");
      return { 
        success: false, 
        error: "Missing client ID",
        assignments: [] 
      };
    }

    // First check if client exists
    const clientCheck = await db.select().from(Client).where(eq(Client.id, clientId));
    
    if (clientCheck.length === 0) {
      console.error(`Client with ID ${clientId} not found`);
      return { 
        success: false, 
        error: `Client with ID ${clientId} not found`,
        assignments: [] 
      };
    }
    
    const assignments = await db.select().from(ClientDroneAssignment)
      .where(eq(ClientDroneAssignment.clientId, clientId));
    
    const enrichedAssignments = await Promise.all(assignments.map(async (assignment) => {
      const [drone] = await db.select().from(Drone)
        .where(eq(Drone.id, assignment.droneId));
      
      const payloadAssignments = await db.select().from(DronePayloadAssignment)
        .where(eq(DronePayloadAssignment.assignmentId, assignment.id));
      
      const payloads = await Promise.all(payloadAssignments.map(async (pa) => {
        if (pa.payloadId === null) return null;
        const [payload] = await db.select().from(Payload)
          .where(eq(Payload.id, pa.payloadId));
        return payload;
      }));
      
      return {
        ...assignment,
        drone,
        payloads
      };
    }));
    
    return { success: true, assignments: enrichedAssignments };
  } catch (error) {
    console.error('Error fetching client drone assignments:', error);
    return { success: false, error: String(error), assignments: [] };
  }
}

const accept = {
  'application/json': ['.json'],
  'application/xml': ['.xml'],
  'text/plain': ['.txt'],
  'application/zip': ['.zip'],
};