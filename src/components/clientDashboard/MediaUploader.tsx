"use client";

import { useState, useCallback, forwardRef, createContext, useContext, useMemo, useEffect } from "react";
import { useDropzone, DropzoneOptions, FileRejection } from "react-dropzone";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UploadCloud, CheckCircle2, Trash2, FileText, Image as ImageIcon, File } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? 
  createClient(supabaseUrl, supabaseAnonKey) : 
  null;

// Context for sharing state between components
type MediaUploaderContextType = {
  files: File[] | null;
  setFiles: (files: File[] | null) => void;
  removeFile: (index: number) => void;
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
  isUploading: boolean;
  previewUrls: Record<number, string>;
};

const MediaUploaderContext = createContext<MediaUploaderContextType | null>(null);

const useMediaUploader = () => {
  const context = useContext(MediaUploaderContext);
  if (!context) {
    throw new Error("Media uploader components must be used within a MediaUploader");
  }
  return context;
};

type MediaUploaderProps = {
  value: File[] | null;
  onValueChange: (files: File[] | null) => void;
  dropzoneOptions: DropzoneOptions;
  bucket?: string;
  path?: string;
  onUploadComplete?: (urls: string[]) => void;
  buttonText?: string;
  children: React.ReactNode;
  imageOnly?: boolean;
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

export const MediaUploader = forwardRef<
  HTMLDivElement,
  MediaUploaderProps & React.HTMLAttributes<HTMLDivElement>
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
      imageOnly = false,
      children,
      ...props
    },
    ref,
  ) => {
    const [isUploading, setIsUploading] = useState(false);
    
    // Generate preview URLs for images
    const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
    
    // Update preview URLs when files change
    useEffect(() => {
      const urls: Record<number, string> = {};
      
      if (value) {
        value.forEach((file, index) => {
          if (file.type.startsWith('image/')) {
            urls[index] = URL.createObjectURL(file);
          }
        });
      }
      
      setPreviewUrls(urls);
      
      // Clean up object URLs when component unmounts or files change
      return () => {
        Object.values(urls).forEach(URL.revokeObjectURL);
      };
    }, [value]);

    const onDrop = useCallback(
      (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        // Filter out non-image files if imageOnly is true
        const filteredFiles = imageOnly 
          ? acceptedFiles.filter(file => file.type.startsWith('image/'))
          : acceptedFiles;
          
        if (imageOnly && filteredFiles.length < acceptedFiles.length) {
          toast.error("Only image files are allowed");
        }
        
        // Use existing files or initialize to empty array
        const currentFiles = value || [];
        const newFiles = [...currentFiles, ...filteredFiles];
        
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
      [value, onValueChange, dropzoneOptions, imageOnly],
    );

    // Setup dropzone options
    const finalDropzoneOptions = useMemo(() => {
      let options = {...dropzoneOptions};
      
      // If imageOnly is true, restrict accept to only image types
      if (imageOnly) {
        options.accept = {'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']};
      }
      
      return options;
    }, [dropzoneOptions, imageOnly]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      ...finalDropzoneOptions,
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
      <MediaUploaderContext.Provider 
        value={{ 
          files: value, 
          setFiles: onValueChange, 
          removeFile, 
          getRootProps, 
          getInputProps, 
          isDragActive, 
          isUploading,
          previewUrls
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
      </MediaUploaderContext.Provider>
    );
  }
);

MediaUploader.displayName = "MediaUploader";

// MediaDropzone component
export const MediaDropzone = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { getRootProps, getInputProps, isDragActive, files } = useMediaUploader();
  const { maxFiles = Infinity } = getRootProps()?.item?.dropzoneOptions || {};
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

MediaDropzone.displayName = "MediaDropzone";

// MediaList component
export const MediaList = forwardRef<
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

MediaList.displayName = "MediaList";

// MediaItem component
interface MediaItemProps {
  index: number;
  children?: React.ReactNode;
  showPreview?: boolean;
}

export const MediaItem = forwardRef<
  HTMLDivElement,
  MediaItemProps & React.HTMLAttributes<HTMLDivElement>
>(({ className, index, children, showPreview = true, ...props }, ref) => {
  const { removeFile, isUploading, files, previewUrls } = useMediaUploader();
  
  if (!files) return null;
  
  const file = files[index];
  const isImage = file.type.startsWith('image/');
  const previewUrl = isImage && showPreview ? previewUrls[index] : null;
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between p-3 rounded-md border bg-background",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {previewUrl ? (
          <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
            <img 
              src={previewUrl} 
              alt={file.name} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
            {isImage ? (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <File className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {children ? (
            children
          ) : (
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate">
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </div>
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

MediaItem.displayName = "MediaItem";

// For backward compatibility
export const FileUploader = MediaUploader;
export const FileInput = MediaDropzone;
export const FileUploaderContent = MediaList;
export const FileUploaderItem = MediaItem;