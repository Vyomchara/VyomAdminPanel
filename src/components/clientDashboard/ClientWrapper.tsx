"use client"

import { useRef, useState, useEffect } from "react";
import { useClient } from "@/hooks/useClient";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SummaryDashboard } from "@/components/clientDashboard/SummaryDashboard";
import { Configuration } from "@/components/clientDashboard/Configuration";
import { MissionDashboard } from "@/components/clientDashboard/MissionDashboard";
import { FileGallery, FileGalleryHandle } from "@/components/clientDashboard/FileGallery";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getClientDroneAssignments } from "@/actions/drone";

export function ClientWrapper({ 
  clientId, 
  initialDroneAssignments 
}: { 
  clientId: string;
  initialDroneAssignments: any[];
}) {
 // console.log("ClientWrapper rendered with clientId:", clientId);

  const fileGalleryRef = useRef<FileGalleryHandle>(null);
  const [droneAssignments, setDroneAssignments] = useState(initialDroneAssignments);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();

  const {
    client, 
    loading, 
    error,
    currentView, 
    setCurrentView, 
    refreshClientData
  } = useClient(clientId || null, {
    initialView: 'summary', 
    redirectOnError: false
  });

  useEffect(() => {
   // console.log("ClientWrapper received clientId:", clientId);
    
    if (!clientId) {
      console.error("ClientWrapper: Missing client ID");
      // Consider redirecting to home page if no clientId
    }
  }, [clientId]);

  useEffect(() => {
    if (!loading && error && isInitialLoad) {
      console.error("Client data error:", error);
      if (isInitialLoad) {
        setIsInitialLoad(false);
        // Only redirect for authentication/permission errors, not data errors
        if (error.includes("not authorized") || error.includes("permission")) {
          router.push('/');
        }
      }
    } else if (!loading && client) {
      setIsInitialLoad(false);
    }
  }, [loading, error, client, router, isInitialLoad]);

  useEffect(() => {
    //console.log("View changed to:", currentView);
   // console.log("Using clientId:", clientId);
    
    // If changing navigation, don't lose the clientId!
  }, [currentView, clientId]);

  useEffect(() => {
    if (clientId) {
      refreshDroneAssignments();
    }
  }, [clientId]); // Only depend on clientId, so it runs once when clientId is available

  useEffect(() => {
    // Only check and potentially update the view when client data is first loaded
    if (!loading && client && isInitialLoad) {
      // Check if VM IP is not configured
      if (!client.vm_ip) {
        // Redirect to config tab instead of summary
        setCurrentView('config');
      }
      setIsInitialLoad(false);
    }
  }, [loading, client, isInitialLoad, setCurrentView]);

  const handleUploadComplete = () => {
    fileGalleryRef.current?.refresh();
  }

  const refreshDroneAssignments = async () => {
    try {
      if (clientId) {
        const result = await getClientDroneAssignments(clientId);
        
        if (result.success) {
          //console.log("Received drone assignments:", result.assignments);
          setDroneAssignments(result.assignments);
        } else {
          console.error("Failed to get drone assignments:", result.error);
          toast.error("Could not refresh drone assignments");
        }
      }
    } catch (error) {
      console.error("Error fetching drone assignments:", error);
    }
  };

  if (loading || (error && isInitialLoad)) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (error && !isInitialLoad) {
    return <div className="flex items-center justify-center h-screen">Error loading client data</div>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        className="w-64 h-full shrink-0" 
        clientName={client?.name || ''}
        onNavigate={(view) => setCurrentView(view)}
        currentView={currentView}
      />
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide p-4">
          {currentView === 'summary' && client && (
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
            <>
              <MissionDashboard 
                client={client} 
                clientId={clientId} // Explicitly pass clientId here
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}