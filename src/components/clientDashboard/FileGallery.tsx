"use client"

import { useEffect, useState, forwardRef, useImperativeHandle } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { RefreshCw, FileType2, Filter } from "lucide-react"
import { toast } from "sonner"
import { MissionFilesTable } from "./MissionFilesTable"
import { createClient } from "@/lib/supabase/client"
import { getMissionFilesWithSignedUrls, deleteFileFromStorage } from "@/app/action"

// Define a ref handle type to expose the refresh method
export interface FileGalleryHandle {
  refresh: () => Promise<void>;
}

interface FileGalleryProps {
  clientId: string;
}

// Fix the component export - use a named function instead of arrow function with forwardRef
function FileGalleryComponent({ clientId }: FileGalleryProps, ref: React.ForwardedRef<FileGalleryHandle>) {
  const [isLoading, setIsLoading] = useState(true)
  const [files, setFiles] = useState<any[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'size'>('created')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [fileType, setFileType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const bucketName = 'mission'
  
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
  
  // Function to load files from server
  const loadFiles = async () => {
    if (!clientId) {
      toast.error("Client ID is missing")
      return
    }
    
    setIsLoading(true)
    
    try {
      // Use the server action to get files with signed URLs
      const response = await getMissionFilesWithSignedUrls(clientId)
      
      if (response.success) {
        // Sort the files according to current sort settings
        const sortedFiles = sortFiles(response.files, sortBy, sortDirection)
        setFiles(sortedFiles)
      } else {
        console.error("Error loading files:", response.error)
        toast.error(`Failed to load files: ${response.error}`)
        setFiles([])
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error(`Error loading files: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }

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
      console.log(`Attempting to delete file: ${file.path} from bucket: ${file.bucketName || 'mission'}`);
      
      if (!file.path) {
        throw new Error("File path is missing");
      }
      
      // Use server action to delete file with admin permissions
      const result = await deleteFileFromStorage(
        file.path, 
        file.bucketName || 'mission'
      );
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
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

  // Function to handle file viewing/downloading with the provided signed URL
  const handleViewFile = async (file: any) => {
    try {
      // Since we already have a signed URL, we can use it directly
      if (file.url) {
        window.open(file.url, "_blank")
        return true
      }
      
      // As a fallback, generate a new signed URL
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from(file.bucketName)
        .createSignedUrl(file.path, 120) // 2 minutes expiration
      
      if (error) {
        throw new Error(error.message)
      }
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank")
        return true
      } else {
        throw new Error("Could not access file")
      }
    } catch (error) {
      toast.error(`Error viewing file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Mission Files</h2>
        <Button variant="outline" size="sm" onClick={loadFiles}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
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

// Helper function to sort files (keeps this outside component to avoid recreating on each render)
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

