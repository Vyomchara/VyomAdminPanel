"use client"

import { MissionUploader } from "@/components/clientDashboard/MissionUploader"
import { FileGallery } from "@/components/clientDashboard/FileGallery"

export function MissionDashboard({ client, clientId }: { client?: any, clientId: string }) {
  return (
    <div className="space-y-8">
      <MissionUploader 
        clientId={clientId} // Pass the clientId directly
        onUploadComplete={() => {}} 
      />
      <FileGallery 
        clientId={clientId} // Pass the clientId directly
      />
    </div>
  );
}