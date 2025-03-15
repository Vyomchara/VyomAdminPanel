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

export function ImageUploader({ clientId }: { clientId: string }) {
  const [images, setImages] = useState<File[] | null>(null)
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Image Gallery</h2>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Images</h3>
        <MediaUploader
          value={images}
          onValueChange={setImages}
          imageOnly={true} // This restricts to only images
          dropzoneOptions={{
            maxFiles: 10,
            maxSize: 5 * 1024 * 1024, // 5MB
          }}
          bucket="client-images"
          path={`client-${clientId}`}
          onUploadComplete={(urls) => {
            toast.success(`Uploaded ${urls.length} images`);
            // Save URLs to database, etc.
          }}
          buttonText="Upload to Gallery"
        >
          <MediaDropzone>
            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Drag and drop images, or click to select
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </MediaDropzone>
          
          {images && images.length > 0 && (
            <MediaList className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((file, i) => (
                <MediaItem 
                  key={i} 
                  index={i} 
                  className="flex-col items-stretch h-full p-0 overflow-hidden"
                >
                  <div className="relative pt-[100%] w-full">
                    <img 
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
                    />
                  </div>
                  <div className="p-2 text-xs truncate">{file.name}</div>
                </MediaItem>
              ))}
            </MediaList>
          )}
        </MediaUploader>
      </Card>
    </div>
  )
}