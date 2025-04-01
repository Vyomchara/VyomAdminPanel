"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  DownloadCloud, 
  FileText, 
  FileCog,
  FileJson, 
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  Trash2,
  ArrowUpDown
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { MissionFile } from "@/types/files"

interface MissionFilesTableProps {
  files: MissionFile[]
  isLoading?: boolean
  onDeleteFile?: (file: MissionFile) => Promise<boolean>
  onViewFile?: (file: MissionFile) => Promise<boolean> // Add this prop
  onSortChange?: (column: 'name' | 'created' | 'size', direction: 'asc' | 'desc') => void
}

export function MissionFilesTable({ 
  files, 
  isLoading = false,
  onDeleteFile,
  onViewFile, // Add this prop
  onSortChange 
}: MissionFilesTableProps) {
  const [sortColumn, setSortColumn] = useState<'name' | 'created' | 'size'>('created')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [deletingFile, setDeletingFile] = useState<string | null>(null)
  const [viewingFile, setViewingFile] = useState<string | null>(null)

  // Get the appropriate icon for a file based on its extension
  const getFileIcon = (file: MissionFile) => {
    switch(file.extension) {
      case 'json':
        return <FileJson className="h-5 w-5 text-blue-500" />
      case 'txt':
        return <FileText className="h-5 w-5 text-gray-500" />
      case 'xml':
        return <FileText className="h-5 w-5 text-orange-500" />
      case 'csv':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />
      case 'zip':
      case 'tar':
      case 'gz':
        return <FileArchive className="h-5 w-5 text-purple-500" />
      case 'yaml':
      case 'yml':
        return <FileCog className="h-5 w-5 text-yellow-500" />
      default:
        return <FileIcon className="h-5 w-5 text-gray-400" />
    }
  }

  // Handle sort toggling
  const handleSort = (column: 'name' | 'created' | 'size') => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortColumn(column)
    setSortDirection(newDirection)
    
    // Trigger parent component sort handler if provided
    if (onSortChange) {
      onSortChange(column, newDirection)
    }
  }

  // Handle file download/view
  const handleDownload = async (file: MissionFile) => {
    if (onViewFile) {
      try {
        setViewingFile(file.path)
        await onViewFile(file)
        toast.success(`Opening ${file.name}`)
      } catch (error) {
        toast.error(`Error opening file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setViewingFile(null)
      }
    } else {
      // Fall back to direct download if no view handler
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success(`Downloading ${file.name}`)
    }
  }

  // Handle file deletion
  const handleDelete = async (file: MissionFile) => {
    if (!onDeleteFile) return
    
    try {
      setDeletingFile(file.path)
      
      // Log detailed file information to help diagnose issues
      console.log("Deleting file:", {
        name: file.name,
        path: file.path,
        bucket: file.bucketName,
        fullDetails: file
      })
      
      const success = await onDeleteFile(file)
      
      if (success) {
        toast.success(`Deleted ${file.name.replace(/^\d+_/, '')}`)
      } else {
        toast.error(`Failed to delete ${file.name.replace(/^\d+_/, '')}`)
      }
    } catch (error) {
      console.error("Delete operation error:", error)
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeletingFile(null)
    }
  }

  // Format date for display
  const formatDate = (date: Date): string => {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>
          {isLoading ? (
            "Loading mission files..."
          ) : files.length === 0 ? (
            "No mission files found. Upload some files to get started."
          ) : (
            `${files.length} mission file${files.length === 1 ? '' : 's'}`
          )}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-[40%]">
              <Button
                variant="ghost"
                onClick={() => handleSort('name')}
                className="px-0 hover:bg-transparent"
              >
                File Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('created')}
                className="px-0 hover:bg-transparent"
              >
                Uploaded
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('size')}
                className="px-0 hover:bg-transparent"
              >
                Size
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading mission files...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : files.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No mission files found
              </TableCell>
            </TableRow>
          ) : (
            files.map((file, i) => (
              <TableRow key={file.path}>
                <TableCell>
                  <div className="flex justify-center">
                    {getFileIcon(file)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {file.name.replace(/^\d+_/, '')}
                </TableCell>
                <TableCell>{formatDate(file.createdAt)}</TableCell>
                <TableCell>{file.sizeFormatted}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(file)}
                      disabled={viewingFile === file.path}
                    >
                      {viewingFile === file.path ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <DownloadCloud className="h-4 w-4" />
                      )}
                      <span className="sr-only">Download</span>
                    </Button>
                    
                    {onDeleteFile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file)}
                        disabled={deletingFile === file.path}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        {deletingFile === file.path ? (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
