"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import { getClientFiles } from "@/lib/uploadToBucket" 
import { Download, Eye, FileIcon, Trash2, Image, FilePlus } from "lucide-react"

// File type definition
interface FileItem {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: any;
  url: string;
  path: string;
  bucketName: string;
  size: number;
}

// Update the component props to accept a bucketName
export function FileGallery({ 
  clientId, 
  bucketName = 'mission' // Default to images but allow override
}: { 
  clientId: string;
  bucketName?: string;
}) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch files when component mounts
  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      try {
        // Use the bucketName prop instead of hardcoded value
        const result = await getClientFiles(clientId, bucketName);
        
        if (result && result.success) {
          setFiles(result.files.map(file => 
            Object.assign({}, file, { size: (file as any).size || 0 })
          ));
          setError(null);
        } else {
          setError(result?.error || "Failed to fetch files");
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFiles();
  }, [clientId, bucketName]); // Add bucketName to dependencies
  
  // Function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };
  
  // Function to format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Function to determine if file is an image
  const isImage = (name: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
  };
  
  // Get file name without the timestamp prefix
  const getDisplayName = (fullName: string) => {
    const parts = fullName.split('_');
    if (parts.length > 1) {
      // Remove the timestamp prefix
      return parts.slice(1).join('_');
    }
    return fullName;
  };

  const deleteFile = async (path: string, bucketName: string) => {
    // Implement file deletion logic here
    toast.info("File deletion would happen here");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          File Gallery 
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({bucketName} bucket)
          </span>
        </h2>
        <div className="space-x-2">
          <Button onClick={() => window.location.reload()}>
            <FilePlus className="h-4 w-4 mr-2" />
            Refresh Files
          </Button>
        </div>
      </div>
      
      <Card className="p-6 relative">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center p-8 text-red-500">{error}</div>
        ) : files.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No files found for this client
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.path}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {isImage(file.name) ? (
                          <Image className="h-5 w-5 mr-2 text-blue-500" />
                        ) : (
                          <FileIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                        )}
                        <span className="truncate max-w-[200px]" title={getDisplayName(file.name)}>
                          {getDisplayName(file.name)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{isImage(file.name) ? 'Image' : 'Document'}</TableCell>
                    <TableCell>{formatFileSize(file.size || 0)}</TableCell>
                    <TableCell>{file.created_at ? formatDate(file.created_at) : 'Unknown'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => window.open(file.url, '_blank')}
                          title={isImage(file.name) ? "Preview image" : "Download file"}
                        >
                          {isImage(file.name) ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => deleteFile(file.path, file.bucketName)}
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}

// Import the existing client implementations
import { createClient } from "@/lib/supabase/client";

/**
 * Lists files for a specific client from a Supabase bucket
 */
