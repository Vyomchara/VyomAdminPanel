"use client"

import { useSearchParams } from "next/navigation"
import { useClient } from "@/hooks/useClient"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { SummaryDashboard } from "@/components/clientDashboard/SummaryDashboard"
import { Configuration } from "@/components/clientDashboard/Configuration"
import { MissionUploader } from "@/components/clientDashboard/MissionUploader"
import { FileGallery, FileGalleryHandle } from "@/components/clientDashboard/FileGallery" 
import { useRef } from "react"

export default function ClientPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const fileGalleryRef = useRef<FileGalleryHandle>(null)
  
  const {
    client, droneAssignments, loading, currentView, setCurrentView, refreshClientData
  } = useClient(id, {initialView: 'summary', redirectOnError: true})
  
  // Function to refresh the file gallery
  const handleUploadComplete = () => {
    fileGalleryRef.current?.refresh();
  }
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Fixed-width sidebar with full height */}
      <Sidebar 
        className="w-64 h-full shrink-0" 
        clientName={client?.name || ''}
        onNavigate={(view) => setCurrentView(view)}
        currentView={currentView}
      />
      
      {/* Main content area with scrolling contained within */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide p-4">
          {currentView === 'summary' && (
            <SummaryDashboard 
              client={client} 
              droneAssignments={droneAssignments} 
            />
          )}
          
          {currentView === 'config' && (
            <Configuration  
              clientId={client?.id || ''} 
              vm_ip={client?.vm_ip || ''}
              vm_password={client?.vm_password || null}
              onUpdate={refreshClientData}
            />
          )}
          
          {currentView === 'missions' && (
            <div className="space-y-8">
              <MissionUploader 
                clientId={client?.id || ''} 
                onUploadComplete={handleUploadComplete} 
              />
              <FileGallery 
                ref={fileGalleryRef}
                clientId={client?.id || ''} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

