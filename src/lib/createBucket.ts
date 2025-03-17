import { createClient } from '@supabase/supabase-js';
import { DropzoneOptions } from 'react-dropzone';

/**
 * Creates required storage buckets in Supabase if they don't already exist
 */
export async function createRequiredBuckets() {
  try {
    console.log("Creating required Supabase storage buckets...");
    
    // Use SERVICE_ROLE key (admin privileges) instead of ANON key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
    
    // Create 'image' bucket with public access
    const { data: imageBucketData, error: imageBucketError } = await supabaseAdmin.storage.createBucket(
      'image', 
      { 
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      }
    );
    
    if (imageBucketError) {
      if (imageBucketError.message.includes('already exists')) {
        console.log("'image' bucket already exists");
      } else {
        console.error("Error creating 'image' bucket:", imageBucketError.message);
      }
    } else {
      console.log("Created 'image' bucket successfully");
    }
    
    return { success: true };
  } catch (error) {
    console.error("Failed to create Supabase buckets:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}

/**
 * Uploads a file to an existing Supabase bucket
 * Does NOT attempt to create the bucket - assumes it exists
 */
export async function uploadFileToBucket(
  file: File,
  clientId: string,
  bucketName: string = 'images' // Default to 'image' bucket but allow others
) {
  try {
    console.log(`Uploading file '${file.name}' to ${bucketName} bucket...`);
    
    // Use the standard client for uploads
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY as string
    );
    
    // Generate a unique file path with client ID and timestamp
    const timestamp = new Date().getTime();
    const filePath = `${clientId}/${timestamp}_${file.name}`;
    
    // Upload the file to the specified bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error(`Error uploading file to ${bucketName} bucket:`, error.message);
      return { 
        success: false, 
        error: error.message,
        url: null
      };
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    console.log(`Successfully uploaded file: ${urlData.publicUrl}`);
    
    return { 
      success: true,
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error("Failed to upload file:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred",
      url: null
    };
  }
}

/**
 * Uploads multiple files to a Supabase bucket
 */
export async function uploadMultipleFiles(
  files: File[],
  clientId: string,
  bucketName: string = 'mission'
) {
  const results = await Promise.allSettled(
    files.map(file => uploadFileToBucket(file, clientId, bucketName))
  );
  
  const urls: string[] = [];
  const errors: Error[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (result.value.url) {
        urls.push(result.value.url);
      }
      if (!result.value.success) {
        errors.push(new Error(result.value.error || `Failed to upload ${files[index].name}`));
      }
    } else {
      errors.push(new Error(`Failed to upload ${files[index].name}: ${result.reason}`));
    }
  });
  
  return { urls, errors };
}

// Update the FileUploaderProps type definition in fileUploader.tsx
type FileUploaderProps = {
  value: File[] | null;
  onValueChange: (files: File[] | null) => void;
  dropzoneOptions: DropzoneOptions;
  fileType: "mission";  // Changed from "mission" | "image" to just "image"
  clientId: string;
  onUploadComplete?: (urls: string[]) => void;
  buttonText?: string;
  children: React.ReactNode;
  imageOnly?: boolean;
};