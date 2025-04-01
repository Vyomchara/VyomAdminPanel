"use client"

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  getAvailableDrones, 
  getAvailablePayloads
} from "@/app/action";
import { DroneTable } from "./DroneTable";
import { DroneAssignmentForm } from "./DroneAssignmentForm"; // We'll create this component

export function SummaryDashboard({ 
  client, 
  droneAssignments, 
  onAssignmentChange 
}: { 
  client: any, 
  droneAssignments: any,
  onAssignmentChange?: () => void
}) {
  const [availableDrones, setAvailableDrones] = useState<any[]>([]);
  const [availablePayloads, setAvailablePayloads] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [open, setOpen] = useState(false);
  
  // Theme support for drone logo
  const { theme, resolvedTheme } = useTheme();
  const isDarkMode = theme === "dark" || resolvedTheme === "dark";
  const droneLogoSrc = isDarkMode ? "/whitedrone.svg" : "/drone.svg";
  
  useEffect(() => {
    async function fetchOptions() {
      setLoadingOptions(true);
      try {
        const dronesResult = await getAvailableDrones();
        if (dronesResult.success) {
          setAvailableDrones(dronesResult.drones);
        } else {
          toast.error("Failed to load drone options");
        }
        
        const payloadsResult = await getAvailablePayloads();
        if (payloadsResult.success) {
          setAvailablePayloads(payloadsResult.payloads);
        } else {
          toast.error("Failed to load payload options");
        }
      } catch (error) {
        toast.error("Error loading options");
        console.error(error);
      } finally {
        setLoadingOptions(false);
      }
    }
    
    fetchOptions();
  }, []);
  
  const handleAssignmentComplete = () => {
    // Close the dialog and refresh data
    setOpen(false);
    if (onAssignmentChange) {
      onAssignmentChange();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Drone button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Drone Assignments</h2>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Drone
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign New Drone</DialogTitle>
              <DialogDescription>
                Assign drones to this client for mission planning and execution.
              </DialogDescription>
            </DialogHeader>
            
            {/* Reuse the drone assignment form */}
            <DroneAssignmentForm
              clientId={client?.id || ''}
              availableDrones={availableDrones}
              availablePayloads={availablePayloads}
              loadingOptions={loadingOptions}
              onComplete={handleAssignmentComplete}
              className="py-4"
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Drone Table */}
      <div className="bg-background rounded-lg shadow-sm">
        <DroneTable 
          assignments={droneAssignments || []} 
          clientId={client?.id || ''}
          droneLogoSrc={droneLogoSrc}
          availableDrones={[]} // Don't need these in the table anymore
          availablePayloads={[]} // Don't need these in the table anymore
          onAssignmentComplete={onAssignmentChange}
        />
      </div>
    </div>
  );
}