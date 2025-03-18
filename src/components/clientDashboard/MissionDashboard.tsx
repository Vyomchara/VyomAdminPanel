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
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <h1 className="text-2xl font-bold mb-6">Mission Management</h1>
      
      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Missions</TabsTrigger>
          <TabsTrigger value="gallery">Mission Gallery</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-hidden mt-4">
          <TabsContent value="upload" className="h-full data-[state=active]:flex data-[state=active]:flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-hide pr-2">
              <MissionUploader 
                clientId={client.id} 
                onUploadComplete={handleUploadComplete}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="gallery" className="h-full data-[state=active]:flex data-[state=active]:flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-hide pr-2">
              <FileGallery 
                ref={fileGalleryRef}
                clientId={client.id} 
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}