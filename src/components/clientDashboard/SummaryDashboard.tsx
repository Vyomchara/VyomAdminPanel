"use client"

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Eye, 
  EyeOff, 
  Lock, 
  Server, 
  Download,
  Loader2,
  User,
  Mail
} from "lucide-react";
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
import { 
  checkForClientPemFile, 
  createSignedUrl 
} from "@/actions/file";
import { DroneTable } from "./DroneTable";
import { DroneAssignmentForm } from "./DroneAssignmentForm";
import Image from "next/image";

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
  
  // VM Info Display states
  const [showVmIp, setShowVmIp] = useState(false);
  const [showVmPassword, setShowVmPassword] = useState(false);
  const [pemFileInfo, setPemFileInfo] = useState<{
    exists: boolean,
    loading: boolean,
    url?: string
  }>({
    exists: false,
    loading: true
  });
  
  // Theme support for drone logo
  const { theme, resolvedTheme } = useTheme();
  const isDarkMode = theme === "dark" || resolvedTheme === "dark";
  const droneLogoSrc = isDarkMode ? "/whitedrone.svg" : "/drone.svg";
  
  // Check for PEM file when component mounts
  useEffect(() => {
    async function checkPemFile() {
      if (!client?.id) return;
      
      try {
        setPemFileInfo(prev => ({ ...prev, loading: true }));
        const result = await checkForClientPemFile(client.id);
        
        setPemFileInfo({
          exists: result.success && result.fileExists,
          loading: false,
          url: result.fileUrl
        });
      } catch (error) {
        console.error("Error checking for PEM file:", error);
        setPemFileInfo({
          exists: false,
          loading: false
        });
      }
    }
    
    checkPemFile();
  }, [client?.id]);
  
  // Function to handle PEM file download
  const handleDownloadPem = async () => {
    if (!client?.id) return;
    
    try {
      toast.loading("Preparing download link");
      const result = await createSignedUrl(client.id);
      
      if (!result.success || !result.url) {
        throw new Error(result.error ?? "Download URL not available");
      }
      
      window.location.href = result.url;
      toast.success("Download started");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to download PEM file: ${errorMessage}`);
    }
  };
  
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
      } finally {
        setLoadingOptions(false);
      }
    }
    
    fetchOptions();
  }, []);
  
  const handleAssignmentComplete = () => {
    setOpen(false);
    if (onAssignmentChange) {
      onAssignmentChange();
    }
  };

  return (
    <div className="space-y-6">
      {/* Client Information Card (with VM details included) */}
      <div className="bg-background rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold flex items-center mb-6">
          <User className="h-5 w-5 mr-2 text-primary" />
          Client Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Name */}
          <div className="flex items-center">
            <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-full mr-3">
              <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Client Name</p>
              <p className="text-sm font-medium">
                {client?.name || 'Not available'}
              </p>
            </div>
          </div>

          {/* Client Email */}
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full mr-3">
              <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">
                {client?.email || 'Not available'}
              </p>
            </div>
          </div>
          
          {/* VM IP Address with colorized background */}
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full mr-3">
              <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">VM IP Address</p>
              <div className="flex items-center">
                <p className="text-sm font-medium mr-2">
                  {client?.vm_ip
                    ? (showVmIp ? client.vm_ip : '••••••••')
                    : 'Not configured'}
                </p>
                {client?.vm_ip && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0" 
                    onClick={() => setShowVmIp(!showVmIp)}
                  >
                    {showVmIp ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Authentication Field */}
          <div className="flex items-center">
            <div className="bg-amber-100 dark:bg-amber-900/20 p-2 rounded-full mr-3">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Authentication</p>
              <div className="flex items-center">
                {client?.vm_password ? (
                  // Password authentication
                  <>
                    <p className="text-sm font-medium mr-2">
                      {showVmPassword ? client.vm_password : '••••••••'}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={() => setShowVmPassword(!showVmPassword)}
                    >
                      {showVmPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </>
                ) : pemFileInfo.exists ? (
                  // PEM file authentication
                  <>
                    <p className="text-sm font-medium mr-2">
                      PEM File
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={handleDownloadPem}
                      title="Download PEM file"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : pemFileInfo.loading ? (
                  // Loading state
                  <div className="flex items-center">
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    <span className="text-sm text-muted-foreground">Checking...</span>
                  </div>
                ) : (
                  // Not configured
                  <p className="text-sm font-medium">Not configured</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header with Add Drone button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center">
          <Image 
            src={droneLogoSrc} 
            alt="Drone" 
            width={24} 
            height={24} 
            className="mr-2 mb-[-8px]" 
          />
          Drone Assignments
        </h2>
        
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
          onAssignmentComplete={onAssignmentChange}
        />
      </div>
    </div>
  );
}