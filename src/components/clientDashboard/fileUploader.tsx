"use client";

import { useState, useCallback, forwardRef, createContext, useContext } from "react";
import { useDropzone, DropzoneOptions, FileRejection } from "react-dropzone";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UploadCloud, CheckCircle2, Trash2, FileText } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? 
  createClient(supabaseUrl, supabaseAnonKey) : 
  null;

// Context for sharing state between components
type FileUploaderContextType = {
  files: File[] | null;
  setFiles: (files: File[] | null) => void;
  removeFile: (index: number) => void;
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
  isUploading: boolean;
};

const FileUploaderContext = createContext<FileUploaderContextType | null>(null);

const useFileUploader = () => {
  const context = useContext(FileUploaderContext);
  if (!context) {
    throw new Error("File uploader components must be used within a FileUploader");
  }
  return context;
};

type FileUploaderProps = {
  value: File[] | null;
  onValueChange: (files: File[] | null) => void;
  dropzoneOptions: DropzoneOptions;
  bucket?: string;
  path?: string;
  onUploadComplete?: (urls: string[]) => void;
  buttonText?: string;
  children: React.ReactNode;
};

/**
 * Upload a file to Supabase Storage
 */
async function uploadFileToSupabase(
  file: File,
  bucket: string,
  path?: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string | null; error: Error | null }> {
  if (!supabase) {
    return { url: null, error: new Error('Supabase client not initialized') };
  }

  try {
    // Create a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop() || 'file';
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get the public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading file to Supabase:', error);
    return { url: null, error: error as Error };
  }
}

export const FileUploader = forwardRef<
  HTMLDivElement,
  FileUploaderProps & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      className,
      value,
      onValueChange,
      dropzoneOptions,
      bucket,
      path = '',
      onUploadComplete,
      buttonText = "Upload Files",
      children,
      ...props
    },
    ref,
  ) => {
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback(
      (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        // Use existing files or initialize to empty array
        const currentFiles = value || [];
        const newFiles = [...currentFiles, ...acceptedFiles];
        
        // Check max files limitation
        const { maxFiles = Infinity } = dropzoneOptions;
        if (newFiles.length > maxFiles) {
          toast.error(`You can only upload a maximum of ${maxFiles} files`);
          onValueChange(newFiles.slice(0, maxFiles));
        } else {
          onValueChange(newFiles);
        }
        
        // Handle rejected files
        if (rejectedFiles.length > 0) {
          for (const rejection of rejectedFiles) {
            const errorCode = rejection.errors[0]?.code;
            const { maxSize } = dropzoneOptions;
            
            if (errorCode === "file-too-large") {
              toast.error(`File is too large. Max size is ${maxSize ? (maxSize / 1024 / 1024) : 10}MB`);
            } else if (errorCode === "file-invalid-type") {
              toast.error("File type not accepted");
            } else {
              toast.error(rejection.errors[0]?.message || "File rejected");
            }
          }
        }
      },
      [value, onValueChange, dropzoneOptions],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      ...dropzoneOptions,
      onDrop,
    });

    const removeFile = (index: number) => {
      if (!value) return;
      const newFiles = [...value];
      newFiles.splice(index, 1);
      onValueChange(newFiles.length ? newFiles : null);
    };

    // Handle file upload to Supabase if bucket is provided
    const handleUpload = async () => {
      if (!value || value.length === 0 || !bucket) {
        toast.error("Please select files to upload");
        return;
      }
      
      setIsUploading(true);
      const urls: string[] = [];
      const errors: Error[] = [];
      
      try {
        for (const file of value) {
          const { url, error } = await uploadFileToSupabase(file, bucket, path);
          
          if (error) {
            errors.push(error);
            toast.error(`Failed to upload ${file.name}`);
          } else if (url) {
            urls.push(url);
          }
        }
        
        if (urls.length > 0) {
          toast.success(`Successfully uploaded ${urls.length} file${urls.length > 1 ? 's' : ''}`);
          onUploadComplete?.(urls);
          // Clear files after upload
          onValueChange(null);
        }
      } catch (error) {
        toast.error("An error occurred during upload");
        console.error("Upload error:", error);
      } finally {
        setIsUploading(false);
      }
    };

    return (
      <FileUploaderContext.Provider 
        value={{ 
          files: value, 
          setFiles: onValueChange, 
          removeFile, 
          getRootProps, 
          getInputProps, 
          isDragActive, 
          isUploading 
        }}
      >
        <div 
          ref={ref} 
          className={cn("space-y-4", className)}
          {...props}
        >
          {children}
          
          {/* Upload button appears if bucket is provided and files are selected */}
          {bucket && value && value.length > 0 && (
            <Button 
              onClick={handleUpload} 
              className="w-full"
              disabled={isUploading}
            >
              {isUploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {buttonText}
                </span>
              )}
            </Button>
          )}
        </div>
      </FileUploaderContext.Provider>
    );
  }
);

FileUploader.displayName = "FileUploader";

// FileInput component
export const FileInput = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { getRootProps, getInputProps, isDragActive, files } = useFileUploader();
  const { maxFiles = Infinity } = getRootProps().item?.dropzoneOptions || {};
  const isMaxFilesReached = files && files.length >= maxFiles;
  
  return (
    <div
      ref={ref}
      className={cn("w-full", isMaxFilesReached && "opacity-50 cursor-not-allowed")}
      {...props}
    >
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer transition-colors",
          isDragActive && "border-primary ring-2 ring-primary/30",
          isMaxFilesReached && "pointer-events-none",
          className
        )}
      >
        {children}
        <Input {...getInputProps()} className="hidden" />
      </div>
    </div>
  );
});

FileInput.displayName = "FileInput";

// FileUploaderContent component
export const FileUploaderContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("w-full", className)}
      {...props}
    >
      {children}
    </div>
  );
});

FileUploaderContent.displayName = "FileUploaderContent";

// FileUploaderItem component
interface FileUploaderItemProps {
  index: number;
  children: React.ReactNode;
}

export const FileUploaderItem = forwardRef<
  HTMLDivElement,
  FileUploaderItemProps & React.HTMLAttributes<HTMLDivElement>
>(({ className, index, children, ...props }, ref) => {
  const { removeFile, isUploading } = useFileUploader();
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between p-2 rounded-md border bg-background",
        className
      )}
      {...props}
    >
      <div className="flex-1 truncate">
        {children}
      </div>
      
      <button
        type="button"
        onClick={() => removeFile(index)}
        className="ml-2 text-muted-foreground hover:text-destructive focus:outline-none"
        disabled={isUploading}
      >
        <span className="sr-only">Remove</span>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
});

FileUploaderItem.displayName = "FileUploaderItem";