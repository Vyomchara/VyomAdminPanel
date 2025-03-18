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

/**
 * Lists files for a specific client from a Supabase bucket
 */
import { createClient as createBrowserClient } from "@/lib/supabase/client"; // Add proper import

export async function getClientFiles(
  clientId: string, 
  bucketName: string = 'mission'
) {
  try {
    console.log(`Listing files for client ${clientId} from ${bucketName} bucket...`);
    
    // Use your existing client implementation with proper import
    const supabase = createBrowserClient();
    console.log("Supabase client:", supabase);
    
    console.log(`Using client ${clientId} and bucket ${bucketName}`);
    
    // List files from client's folder in the bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(clientId);
    
    console.log("List result:", data, error); // Log the response from Supabase
    
    if (error) {
      console.error(`Error listing files from ${bucketName} bucket:`, error.message);
      return { success: false, error: error.message, files: [] };
    }
    
    if (!data || data.length === 0) {
      console.log(`No files found for client ${clientId} in ${bucketName} bucket`);
      return { success: true, files: [] };
    }
    
    // For each file, get its public URL
    const filesWithUrls = await Promise.all(
      data.map(async (fileObj) => {
        // Fix: The getPublicUrl method now expects the path as an argument
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`${clientId}/${fileObj.name}`);
        
        return {
          ...fileObj,
          url: urlData.publicUrl,
          path: `${clientId}/${fileObj.name}`,
          bucketName
        };
      })
    );
    
    return { success: true, files: filesWithUrls };
  } catch (error) {
    console.error("Failed to list files:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred",
      files: [] 
    };
  }
}

/**
 * Enhanced function to retrieve mission files with advanced options
 * 
 * @param clientId - The ID of the client whose files to retrieve
 * @param options - Configuration options for file retrieval
 * @returns Object containing success status, files array, and any error information
 */
export async function getMissionFiles(
  clientId: string,
  options: {
    bucketName?: string;
    fileType?: string | string[];
    sortBy?: 'name' | 'created' | 'size';
    sortDirection?: 'asc' | 'desc';
    limit?: number;
  } = {}
) {
  try {
    // Default options
    const {
      bucketName = 'mission',
      fileType,
      sortBy = 'name',
      sortDirection = 'asc',
      limit
    } = options;

    if (!clientId) {
      return { success: false, error: "Client ID is required", files: [] };
    }

    const supabase = createBrowserClient();
    
    // List files from client's folder in the bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(clientId, {
        limit: limit,
        sortBy: { column: sortBy === 'name' ? 'name' : 'created_at', order: sortDirection }
      });
    
    if (error) {
      return { success: false, error: error.message, files: [] };
    }
    
    if (!data || data.length === 0) {
      return { success: true, files: [] };
    }

    // Apply file type filtering if specified
    let filteredData = data;
    if (fileType) {
      const fileTypes = Array.isArray(fileType) ? fileType : [fileType];
      filteredData = data.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        return fileTypes.includes(extension);
      });
    }
    
    // Get public URLs and additional metadata for each file
    const filesWithUrls = await Promise.all(
      filteredData.map(async (fileObj) => {
        const filePath = `${clientId}/${fileObj.name}`;
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        
        // Extract creation date from filename if it contains a timestamp
        const timestampMatch = fileObj.name.match(/^(\d+)_/);
        const createdAt = timestampMatch 
          ? new Date(parseInt(timestampMatch[1]))
          : new Date(fileObj.created_at || Date.now());
        
        // Extract file extension for type identification
        const extension = fileObj.name.split('.').pop()?.toLowerCase() || '';
        
        return {
          ...fileObj,
          url: urlData.publicUrl,
          path: filePath,
          bucketName,
          extension,
          createdAt,
          // Format the file size for display
          sizeFormatted: formatFileSize(fileObj.metadata?.size || 0)
        };
      })
    );
    
    // Sort the results if needed
    if (sortBy === 'created') {
      filesWithUrls.sort((a, b) => {
        const dateA = a.createdAt.getTime();
        const dateB = b.createdAt.getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (sortBy === 'size') {
      filesWithUrls.sort((a, b) => {
        const sizeA = a.metadata?.size || 0;
        const sizeB = b.metadata?.size || 0;
        return sortDirection === 'asc' ? sizeA - sizeB : sizeB - sizeA;
      });
    }
    
    return { 
      success: true, 
      files: filesWithUrls,
      totalCount: data.length
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred",
      files: [] 
    };
  }
}

/**
 * Helper function to format file size into human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
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