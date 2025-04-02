"use client"

import { useEffect, useState, forwardRef, useImperativeHandle } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { RefreshCw, FileType2, Filter, Plus, Rocket, FileText, Map } from "lucide-react"
import { toast } from "sonner"
import { MissionFilesTable } from "./MissionFilesTable"
import { listClientFiles } from "@/app/action"
import { MissionFile } from "@/types/files"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  MediaUploader, 
  MediaDropzone, 
  MediaList, 
  MediaItem 
} from "./MediaUploader"
import { saveFilesToClient } from "@/app/action"

// Define a ref handle type to expose the refresh method
export interface FileGalleryHandle {
  refresh: () => Promise<void>;
}

interface FileGalleryProps {
  clientId: string;
}

function FileGalleryComponent({ clientId }: FileGalleryProps, ref: React.ForwardedRef<FileGalleryHandle>) {
  const [files, setFiles] = useState<MissionFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewFileUrl, setViewFileUrl] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'size'>('created')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [fileType, setFileType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[] | null>(null)

  // Get file extensions from the current files for filter dropdown
  const availableFileTypes = Array.from(new Set(files.map(file => file.extension))).filter(Boolean)

  // Filter files based on search query and file type filter
  const filteredFiles = files.filter(file => {
    const matchesSearch = searchQuery ? 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) : 
      true
    
    const matchesType = fileType !== "all" ? 
      file.extension === fileType : 
      true
      
    return matchesSearch && matchesType
  })

  // Enhanced loadFiles function with better error handling
  const loadFiles = async () => {
    //console.log("FileGallery loadFiles called with clientId:", clientId);
    setIsLoading(true);
    
    if (!clientId) {
      console.error("Missing client ID");
      toast.error("Client ID is missing. Please select a valid client.");
      setFiles([]);
      setIsLoading(false);
      return;
    }
    
    try {
     // console.log("Calling listClientFiles with clientId:", clientId);
      const response = await listClientFiles(clientId);
      // console.log("listClientFiles response:", response);
      
      if (response.success && response.files) {
        // Convert the response files to match the MissionFile type
        const formattedFiles: MissionFile[] = response.files.map(file => ({
          name: file.name,
          url: file.url,
          path: file.path || '',
          extension: file.extension || file.name.split('.').pop()?.toLowerCase() || '',
          createdAt: new Date(file.createdAt || file.created_at || Date.now()),
          sizeFormatted: file.sizeFormatted || 'Unknown',
          bucketName: file.bucketName || 'mission',
          metadata: {
            size: typeof file.metadata?.size === 'number' ? file.metadata.size : 0,
            mimetype: file.metadata?.mimetype
          }
        }));
        
        // Apply sorting before setting files to state
        const sortedFiles = sortFiles(formattedFiles, sortBy, sortDirection);
        setFiles(sortedFiles);
      } else {
        console.error("Error loading files:", response.error);
        setFiles([]);
      }
    } catch (error) {
      console.error("Error in loadFiles:", error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose the loadFiles method via ref
  useImperativeHandle(ref, () => ({
    refresh: loadFiles
  }))
  
  // Initial load when component mounts or clientId changes
  useEffect(() => {
    if (clientId) {
      loadFiles()
    }
  }, [clientId])
  
  // Handle sort change from the table component
  const handleSortChange = (column: 'name' | 'created' | 'size', direction: 'asc' | 'desc') => {
    setSortBy(column)
    setSortDirection(direction)
    
    // Re-sort the files immediately for better UX
    setFiles(sortFiles(files, column, direction))
  }
  
  // Function to handle file deletion
  const handleDeleteFile = async (file: any) => {
    try {
      toast.success("File deleted successfully");
      
      // Refresh file list after successful deletion
      await loadFiles();
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  // Function to handle file viewing/downloading
  const handleViewFile = async (file: any) => {
    try {
      if (file.url) {
        window.open(file.url, "_blank")
        return true
      }
      
      toast.error("File viewing not implemented");
      return false;
    } catch (error) {
      toast.error(`Error viewing file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }

  // Function to handle file upload completion
  const handleUploadComplete = async (urls: string[]) => {
    toast.success(`Uploaded ${urls.length} mission files`);
    
    // Save URLs to database
    let allSuccess = true;
    for (const url of urls) {
      const fileName = url.split('/').pop() || 'unknown';
      const result = await saveFilesToClient({
        clientId,
        url,
        bucketName: 'mission',
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
      // Close dialog and refresh file list
      setUploadDialogOpen(false);
      await loadFiles();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center">
          <Rocket className="h-5 w-5 mr-2 text-primary" />
          Mission Files
          {/* <span className="ml-2 text-sm font-normal text-muted-foreground">
            (mission bucket)
          </span> */}
        </h2>
        <div className="flex space-x-2">
          {/* Add Mission File button */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Mission Files
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Upload Mission Files</DialogTitle>
                <DialogDescription>
                  Upload mission files for this client. Supported formats: JSON, XML, TXT, ZIP.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <MediaUploader
                  value={uploadFiles}
                  onValueChange={setUploadFiles}
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
                  fileType="mission"
                  clientId={clientId}
                  onUploadComplete={handleUploadComplete}
                  buttonText="Upload Mission Files"
                >
                  <MediaDropzone>
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-800/70 hover:bg-gray-100 transition-colors">
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
                  
                  {uploadFiles && uploadFiles.length > 0 && (
                    <MediaList className="mt-4">
                      {uploadFiles.map((file, i) => (
                        <MediaItem key={i} index={i} showPreview={false}>
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </MediaItem>
                      ))}
                    </MediaList>
                  )}
                </MediaUploader>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Existing refresh button */}
          <Button variant="outline" size="sm" onClick={loadFiles}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Card className="p-6">
        {/* Filter section */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <FileType2 className="h-4 w-4 text-muted-foreground" />
            <Select
              value={fileType}
              onValueChange={(value) => setFileType(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All file types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All file types</SelectItem>
                {availableFileTypes.map(type => (
                  <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[240px]">
            <div className="relative">
              <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search files by name..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <MissionFilesTable
          files={filteredFiles}
          isLoading={isLoading}
          onDeleteFile={handleDeleteFile}
          onViewFile={handleViewFile}
          onSortChange={handleSortChange}
        />
      </Card>
    </div>
  )
}

// Apply forwardRef to the function component and export with proper displayName
export const FileGallery = forwardRef<FileGalleryHandle, FileGalleryProps>(FileGalleryComponent)

// Set displayName properly
FileGallery.displayName = "FileGallery"

// Helper function to sort files
function sortFiles(filesList: any[], sortField: string, direction: 'asc' | 'desc') {
  return [...filesList].sort((a, b) => {
    if (sortField === 'name') {
      return direction === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name)
    } else if (sortField === 'created') {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return direction === 'asc' ? dateA - dateB : dateB - dateA
    } else if (sortField === 'size') {
      const sizeA = a.metadata?.size || 0
      const sizeB = b.metadata?.size || 0
      return direction === 'asc' ? sizeA - sizeB : sizeB - sizeA
    }
    return 0
  })
}

