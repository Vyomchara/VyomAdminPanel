"use client"

import { useState } from "react"
import { FileUploader, FileUploaderContent, FileUploaderItem, FileInput } from "./fileUploader"
import { uploadFilesToSupabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { UploadCloud, FileText } from "lucide-react"

interface SupabaseFileUploaderProps {
  bucket: string
  path?: string
  maxFiles?: number
  acceptedFileTypes?: Record<string, string[]>
  maxSize?: number
  onUploadComplete?: (urls: string[]) => void
  buttonText?: string
}

export function SupabaseFileUploader({
  bucket,
  path = "",
  maxFiles = 5,
  acceptedFileTypes = {
    "application/pdf": [".pdf"],
    "image/*": [".png", ".jpg", ".jpeg"],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  onUploadComplete,
  buttonText = "Upload Files"
}: SupabaseFileUploaderProps) {
  const [files, setFiles] = useState<File[] | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // Handle file upload to Supabase
  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast.error("Please select files to upload")
      return
    }
    
    setIsUploading(true)
    
    try {
      const { urls, errors } = await uploadFilesToSupabase(files, bucket, path)
      
      if (errors.length > 0) {
        toast.error(`${errors.length} files failed to upload`)
      }
      
      if (urls.length > 0) {
        toast.success(`Successfully uploaded ${urls.length} files`)
        onUploadComplete?.(urls)
        // Clear files after successful upload
        setFiles(null)
      }
    } catch (error) {
      toast.error("An error occurred during upload")
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }
  
  // Get file icon based on file type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return (
        <div className="w-5 h-5 rounded-sm bg-muted flex items-center justify-center overflow-hidden">
          <img
            src={URL.createObjectURL(file)}
            alt="thumbnail"
            className="w-full h-full object-cover"
            onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
          />
        </div>
      )
    }
    
    return <FileText className="w-4 h-4" />
  }
  
  return (
    <div className="space-y-4">
      <FileUploader
        value={files}
        onValueChange={setFiles}
        dropzoneOptions={{
          accept: acceptedFileTypes,
          maxFiles,
          maxSize,
          multiple: maxFiles > 1,
        }}
      >
        <FileInput className="border-2 border-dashed p-6 hover:border-primary/50 transition-colors">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Max {maxFiles} file{maxFiles !== 1 ? "s" : ""} up to {maxSize / 1024 / 1024}MB each
            </p>
          </div>
        </FileInput>
        
        {files && files.length > 0 && (
          <FileUploaderContent className="mt-4">
            {files.map((file, i) => (
              <FileUploaderItem key={i} index={i} className="flex items-center gap-2">
                {getFileIcon(file)}
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[180px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              </FileUploaderItem>
            ))}
          </FileUploaderContent>
        )}
      </FileUploader>
      
      {files && files.length > 0 && (
        <Button 
          onClick={handleUpload} 
          className="w-full" 
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : buttonText}
        </Button>
      )}
    </div>
  )
}