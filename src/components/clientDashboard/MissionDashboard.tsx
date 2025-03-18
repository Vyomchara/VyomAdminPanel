"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MissionUploader } from "@/components/clientDashboard/MissionUploader"
import { FileGallery } from "@/components/clientDashboard/FileGallery" // Add this import

export function MissionDashboard({ client }: { client: any }) {
  const [activeTab, setActiveTab] = useState("upload")
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mission Management</h1>
      
      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Missions</TabsTrigger>
          <TabsTrigger value="gallery">Mission Gallery</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="pt-4">
          <MissionUploader clientId={client.id} />
        </TabsContent>
        
        <TabsContent value="gallery" className="pt-4">
          <FileGallery clientId={client.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}