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
export async function saveFilesToClient(data: {
  clientId: string;
  fileUrl: string;
  fileType: 'mission';
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
        fileType: fileTypeOrPath as 'mission',
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
 * List client files with filtering and sorting capabilities
 */
export async function listClientFiles(
  clientId: string,
  fileType: string = 'all',
  sortBy: 'name' | 'created' | 'size' = 'name',
  sortDirection: 'asc' | 'desc' = 'asc'
) {
  console.log(`[SERVER] listClientFiles: Starting for client ${clientId}, fileType: ${fileType}`);
  
  try {
    // Fetch files directly using client ID
    console.log(`[SERVER] listClientFiles: Fetching files for ${clientId}`);
    const response = await getMissionFiles(clientId);
    
    console.log(`[SERVER] listClientFiles: Got response:`, 
      { success: response.success, fileCount: response.files?.length || 0 });
    
    if (!response.success) {
      console.error(`[SERVER] listClientFiles: Error from getMissionFilesWithSignedUrls:`, response.error);
      return response;
    }
    
    let files = response.files || [];
    
    // Apply file type filter if specified
    if (fileType !== 'all') {
      const preFilterCount = files.length;
      files = files.filter(file => {
        if (!file) return false;
        const extension = file.extension?.toLowerCase();
        return extension === fileType.toLowerCase();
      });
      console.log(`[SERVER] listClientFiles: Filtered by type '${fileType}': ${preFilterCount} → ${files.length} files`);
    }
    
    // Sort files as requested
    files = files.sort((a, b) => {
      if (sortBy === 'name') {
        if (a && b) {
          return sortDirection === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
      }
      else if (sortBy === 'created') {
        if (a && b) {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
      }
      else if (sortBy === 'size') {
        if (a && b) {
          const sizeA = a.metadata?.size || 0;
          const sizeB = b.metadata?.size || 0;
          return sortDirection === 'asc' ? sizeA - sizeB : sizeB - sizeA;
        }
      }
      return 0;
    });
    
    console.log(`[SERVER] listClientFiles: Returning ${files.length} sorted files`);
    
    return { 
      success: true, 
      files,
      error: null
    };
  } catch (error) {
    console.error("[SERVER] Error listing client files:", error);
    return { 
      success: false, 
      files: [],
      error: error instanceof Error ? error.message : "Unknown error"
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