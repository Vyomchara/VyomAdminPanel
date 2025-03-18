"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { RefreshCw, FileType2, Filter } from "lucide-react"
import { toast } from "sonner"
import { getMissionFiles } from "@/lib/uploadToBucket"
import { MissionFilesTable } from "./MissionFilesTable"
import { createClient } from "@/lib/supabase/client"

export function FileGallery({ clientId }: { clientId: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [files, setFiles] = useState<any[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'size'>('created')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [fileType, setFileType] = useState<string | null>("all")  // Changed from null to "all"
  const [searchQuery, setSearchQuery] = useState("")
  
  // Get file extensions from the current files for filter dropdown
  const availableFileTypes = Array.from(new Set(files.map(file => file.extension))).filter(Boolean)
  
  // Filter files based on search query and file type filter
  const filteredFiles = files.filter(file => {
    const matchesSearch = searchQuery ? 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) : 
      true
    
    const matchesType = fileType && fileType !== "all" ? 
      file.extension === fileType : 
      true
      
    return matchesSearch && matchesType
  })
  
  const loadFiles = async () => {
    if (!clientId) return
    
    setIsLoading(true)
    
    try {
      const response = await getMissionFiles(clientId, {
        bucketName: 'mission',
        sortBy,
        sortDirection,
      })
      
      if (response.success) {
        setFiles(response.files)
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
  
  // Function to handle file deletion
  const handleDeleteFile = async (file: any) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase.storage
        .from(file.bucketName)
        .remove([file.path])
        
      if (error) {
        throw new Error(error.message)
      }
      
      // Refresh file list after deletion
      loadFiles()
      return true
    } catch (error) {
      console.error("Error deleting file:", error)
      return false
    }
  }
  
  // Handle sort change from the table component
  const handleSortChange = (column: 'name' | 'created' | 'size', direction: 'asc' | 'desc') => {
    setSortBy(column)
    setSortDirection(direction)
  }
  
  // Initial load and reload when sort parameters change
  useEffect(() => {
    if (clientId) {
      loadFiles()
    }
  }, [clientId, sortBy, sortDirection])
  
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
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <FileType2 className="h-4 w-4 text-muted-foreground" />
            <Select
              value={fileType || "all"}
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
          onSortChange={handleSortChange}
        />
      </Card>
    </div>
  )
}
