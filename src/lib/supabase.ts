/**
 * File upload utilities using server actions for security
 */

import { uploadFileToServer } from "@/app/action";

/**
 * Upload a single file to Supabase storage via a server action
 */
export async function uploadFileToSupabase(
  file: File, 
  clientId: string,
  fileType: 'mission' | 'image'  // Correctly allows both types
): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Create FormData for server action
    const formData = new FormData();
    formData.append('file', file);
    
    // Match parameter order with server function
    const response = await uploadFileToServer(formData, clientId, fileType);
    
    if (!response.success) {
      throw new Error(response.message || "Upload failed");
    }
    
    return { url: response.url || null, error: null };
  } catch (error) {
    console.error("File upload error:", error);
    return { 
      url: null, 
      error: error instanceof Error ? error : new Error("Unknown error") 
    };
  }
}

/**
 * Upload multiple files to Supabase storage via server actions
 */
export async function uploadFilesToSupabase(
  files: File[], 
  clientId: string,
  fileType: "mission" | "image"  // Fixed to allow both mission and image types
): Promise<{ urls: string[]; errors: Error[] }> {
  const results = await Promise.allSettled(
    files.map(file => uploadFileToSupabase(file, clientId, fileType))
  );
  
  // Rest of the function remains the same
  const urls: string[] = [];
  const errors: Error[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (result.value.url) {
        urls.push(result.value.url);
      }
      if (result.value.error) {
        errors.push(result.value.error);
      }
    } else {
      errors.push(new Error(`Failed to upload ${files[index].name}: ${result.reason}`));
    }
  });
  
  return { urls, errors };
}

/**
 * IMPORTANT: For authentication only
 * DO NOT use this for database operations!
 */
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export const getSupabaseForAuth = () => {
  return createBrowserClient();
};