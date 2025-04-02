"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { FileText, Download, Image as ImageIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type ClientFile = {
  id: string;
  file_url: string;
  file_type: 'mission' | 'image';
  created_at: string;
  file_name?: string;
}

export function ClientFiles({ clientId, files }: { clientId: string, files: ClientFile[] }) {
  const [selectedTab, setSelectedTab] = useState<'mission' | 'image'>('mission');
  
  const filteredFiles = files.filter(file => file.file_type === selectedTab);
  
  const getFileNameFromUrl = (url: string) => {
    const segments = url.split('/');
    const fileName = segments[segments.length - 1];
    
    // Handle encoded file names
    return decodeURIComponent(fileName.split('?')[0]);
  };
  
  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="h-6 w-6" />;
    }
    
    return <FileText className="h-6 w-6" />;
  };
  
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Client Files</h2>
        
        <div className="flex space-x-2">
          <Button 
            variant={selectedTab === 'mission' ? "default" : "outline"}
            onClick={() => setSelectedTab('mission')}
            size="sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            Mission Files
          </Button>
          <Button 
            variant={selectedTab === 'image' ? "default" : "outline"}
            onClick={() => setSelectedTab('image')}
            size="sm"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Images
          </Button>
        </div>
      </div>
      
      {filteredFiles.length > 0 ? (
        selectedTab === 'image' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div key={file.id} className="relative group">
                <div className="aspect-square rounded-md overflow-hidden bg-muted">
                  <img 
                    src={file.file_url}
                    alt={file.file_name || getFileNameFromUrl(file.file_url)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-white hover:text-white hover:bg-white/20"
                    onClick={() => window.open(file.file_url, '_blank')}
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs truncate mt-1">
                  {file.file_name || getFileNameFromUrl(file.file_url)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 rounded-md border bg-background">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.file_url)}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate">
                        {file.file_name || getFileNameFromUrl(file.file_url)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Uploaded on {new Date(file.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  asChild
                >
                  <a href={file.file_url} download target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <p>No {selectedTab} files uploaded yet.</p>
        </div>
      )}
    </Card>
  );
}