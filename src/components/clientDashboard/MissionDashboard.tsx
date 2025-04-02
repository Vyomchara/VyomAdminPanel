"use client"

import { FileGallery } from "@/components/clientDashboard/FileGallery"

export function MissionDashboard({ client, clientId }: { client?: any, clientId: string }) {
  return (
    <div className="space-y-8 mt-8">
      <FileGallery 
        clientId={clientId}
      />
    </div>
  );
}