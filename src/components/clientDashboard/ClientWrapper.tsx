"use client"

import { useRef, useState, useCallback } from "react";
import { useClient } from "@/hooks/useClient";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SummaryDashboard } from "@/components/clientDashboard/SummaryDashboard";
import { Configuration } from "@/components/clientDashboard/Configuration";
import { MissionUploader } from "@/components/clientDashboard/MissionUploader";
import { FileGallery, FileGalleryHandle } from "@/components/clientDashboard/FileGallery";
import { getClientDroneAssignments } from '@/app/action'; // Import directly instead of dynamic import

export function ClientWrapper({ 
  clientId, 
  initialDroneAssignments 
}: { 
  clientId: string;
  initialDroneAssignments: any[]
}) {
  const fileGalleryRef = useRef<FileGalleryHandle>(null);
  const [droneAssignments, setDroneAssignments] = useState(initialDroneAssignments);
  const isRefreshing = useRef(false);

  const {
    client, loading, currentView, setCurrentView, refreshClientData
  } = useClient(clientId || null, {initialView: 'summary', redirectOnError: true});

  // Function to refresh the file gallery
  const handleUploadComplete = () => {
    fileGalleryRef.current?.refresh();
  }

  // Function to refresh drone assignments - use memoized callback to prevent recreating
  const refreshDroneAssignments = useCallback(async () => {
    // Prevent duplicate refresh calls and racing conditions
    if (isRefreshing.current) return;
    isRefreshing.current = true;
    
    try {
      // Use direct import instead of dynamic import to prevent issues
      const result = await getClientDroneAssignments(clientId);
      if (result.success) {
        setDroneAssignments(result.assignments);
      }
    } catch (error) {
      console.error("Failed to refresh drone assignments:", error);
    } finally {
      isRefreshing.current = false;
    }
  }, [clientId]);

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
              onAssignmentChange={refreshDroneAssignments}
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
  );
}