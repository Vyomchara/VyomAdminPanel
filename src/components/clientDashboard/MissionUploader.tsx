"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { 
  MediaUploader, 
  MediaDropzone, 
  MediaList, 
  MediaItem 
} from "@/components/clientDashboard/MediaUploader"
import { saveFilesToClient } from "@/app/action";

export function MissionUploader({ clientId }: { clientId: string }) {
  const [files, setFiles] = useState<File[] | null>(null)
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Mission Uploader</h2>
      </div>
      
      <Card className="p-6 relative">
        <h3 className="text-lg font-semibold mb-4">Upload Mission Files</h3>
        <MediaUploader
          value={files}
          onValueChange={setFiles}
          dropzoneOptions={{
            maxFiles: 5,
            maxSize: 10 * 1024 * 1024, // 10MB
            accept: {
              'application/json': ['.json'],
              'application/xml': ['.xml'],
              'text/plain': ['.txt'],
              'application/zip': ['.zip'],
            }
          }}
          bucket="mission-files"  // Enable Supabase uploads
          path={`client-${clientId}`}
          onUploadComplete={async (urls) => {
            toast.success(`Uploaded ${urls.length} mission files`);
            
            // Save URLs to database
            let allSuccess = true;
            for (const url of urls) {
              const fileName = url.split('/').pop() || 'unknown';
              const result = await saveFilesToClient({
                clientId,
                fileUrl: url,
                fileType: 'mission',
                fileName
              });
              
              if (!result.success) {
                toast.error(`Failed to save file record: ${result.error}`);
                allSuccess = false;
                break;
              }
            }
            
            if (allSuccess) {
              toast.success("All file records saved successfully");
            }
          }}
          buttonText="Upload Mission Files"
        >
          <MediaDropzone>
            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-800/70 hover:bg-gray-100 transition-colors">
              <svg
                className="w-10 h-10 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Drag and drop mission files, or click to select
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                JSON, XML, TXT, ZIP (max 10MB)
              </p>
            </div>
          </MediaDropzone>
          
          {files && files.length > 0 && (
            <MediaList className="mt-4">
              {files.map((file, i) => (
                <MediaItem key={i} index={i} showPreview={false}>
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </MediaItem>
              ))}
            </MediaList>
          )}
        </MediaUploader>
      </Card>
    </div>
  )
}