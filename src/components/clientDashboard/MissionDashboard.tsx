"use client"

import { useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MissionUploader } from "@/components/clientDashboard/MissionUploader"
import { FileGallery, FileGalleryHandle } from "@/components/clientDashboard/FileGallery"

export function MissionDashboard({ client }: { client: any }) {
  const [activeTab, setActiveTab] = useState("upload")
  const fileGalleryRef = useRef<FileGalleryHandle>(null)
  
  // Function to refresh gallery when upload completes
  const handleUploadComplete = () => {
    fileGalleryRef.current?.refresh();
    
    // Optionally switch to gallery tab after upload
    setActiveTab("gallery");
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mission Management</h1>
      
      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Missions</TabsTrigger>
          <TabsTrigger value="gallery">Mission Gallery</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="pt-4">
          <MissionUploader 
            clientId={client.id} 
            onUploadComplete={handleUploadComplete}
          />
        </TabsContent>
        
        <TabsContent value="gallery" className="pt-4">
          <FileGallery 
            ref={fileGalleryRef}
            clientId={client.id} 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}