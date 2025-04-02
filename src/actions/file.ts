"use server"

import { CreateClient } from "@/lib/supabase/server"
import { v4 as uuid } from "uuid"
import { revalidatePath } from "next/cache"
import { SUPABASE_URL } from '@/app_config'
import { SUPABASE_SERVICE_KEY } from '@/server_config'
import { getMissionFiles } from "@/lib/uploadToBucket"

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

export async function uploadFileToServer(
  formData: FormData,
  bucketOrClientId: string,
  fileTypeOrPath: string | 'mission' = ''
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
        public: false,
        fileSizeLimit: 5242880,
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