"use client"

import { useState, useEffect } from "react"
import { getClientDetails, getDroneAssignments } from "@/app/action"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { 
  Mail, 
  MapPin, 
  Network, 
  Server,
  Loader2,
} from "lucide-react"
import { FileUploader, FileInput, FileUploaderContent, FileUploaderItem } from "@/components/clientDashboard/fileUploader"
import { cn } from "@/lib/utils"
import { MissionUploader as MissionUploaderComponent } from "@/components/dashboard/MissionUploader"
import { Sidebar as DashboardSidebar } from "@/components/dashboard/Sidebar"
import { SummaryDashboard } from "@/components/dashboard/SummaryDashboard"
import { Configuration } from "@/components/clientDashboard/Configuration"
import { DroneTable } from "@/components/clientDashboard/DroneTable"
// Import types from the types file
import { 
  View, 
  ClientData, 
  PageProps, 
  VMSettingsUpdateResponse 
} from "@/types/types"

// Remove MissionUploaderProps from import since we don't need it anymore

// Helper function to safely access localStorage
const getStorageItem = (key: string) => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  }
  return null
}

// Helper function to safely set localStorage
const setStorageItem = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

export default function ClientPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  
  const [currentView, setCurrentView] = useState<View>('summary')
  const [client, setClient] = useState<ClientData | null>(null)
  const [droneAssignments, setDroneAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vmPromptShown, setVmPromptShown] = useState(false) // Track if we've shown VM prompt
  const [missionFiles, setMissionFiles] = useState<File[] | null>(null)
  const router = useRouter()
  
  useEffect(() => {
    async function loadData() {
      try {
        if (!id) {
          router.push('/');
          return;
        }
        
        // Check if we have cached data
        const cachedClient = getStorageItem(`client_${id}`);
        const cachedTime = getStorageItem(`client_${id}_time`);
        const now = Date.now();
        
        // Use cached data if it's less than 5 minutes old
        if (cachedClient && cachedTime && (now - cachedTime) < 5 * 60 * 1000) {
          setClient(cachedClient);
          
          // Still check if VM IP is not configured and navigate only on first load
          if (!cachedClient.vm_ip && !vmPromptShown) {
            setCurrentView('config');
            setVmPromptShown(true);
          }
          
          // Load drone assignments later - id is guaranteed to be string here
          await loadDroneAssignments(id);
          setLoading(false);
          return;
        }
    
        // If no valid cache, fetch from server
        const result = await getClientDetails(id);
        if (!result.success || !result.data) {
          router.push('/');
          return;
        }
    
        // Save to cache
        setStorageItem(`client_${id}`, result.data);
        setStorageItem(`client_${id}_time`, Date.now());
        
        setClient(result.data);
        
        // Check if VM IP is not set and automatically navigate to config page
        // But only do this once per session
        if (!result.data.vm_ip && !vmPromptShown) {
          setCurrentView('config');
          setVmPromptShown(true);
          toast.info("Please configure VM IP address");
        }
        
        await loadDroneAssignments(id);
        
      } catch (err) {
        console.error('Error:', err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    
    async function loadDroneAssignments(clientId: string) {
      try {
        const assignments = await getDroneAssignments(clientId)
        setDroneAssignments(assignments)
      } catch (err) {
        console.error('Error fetching drone assignments:', err)
        setDroneAssignments([])
      }
    }
    
    loadData()
  }, [id, router, vmPromptShown])
  
  // Function to update client data after VM IP is set
  const updateClientData = async (): Promise<void> => {
    if (!id) return
    
    try {
      const result = await getClientDetails(id)
      if (result.success && result.data) {
        // Important: update the client state with fresh data
        setClient(result.data)
        
        // Update cache
        setStorageItem(`client_${id}`, result.data)
        setStorageItem(`client_${id}_time`, Date.now())
      }
    } catch (error) {
      console.error('Error updating client data:', error)
    }
  }
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }
 
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar 
        className="w-64" 
        clientName={client?.name || ''}
        onNavigate={(view) => setCurrentView(view)}
        currentView={currentView}
      />
      <div className="flex-1 p-4">
        {currentView === 'summary' ? (
          <SummaryDashboard client={client} droneAssignments={droneAssignments} />
        ) : currentView === 'config' ? (
          <Configuration  
            clientId={client?.id || ''} // Provide empty string as fallback
            vm_ip={client?.vm_ip||''}
            onUpdate={updateClientData}
          />
        ) : (
          <MissionUploaderComponent clientId={client?.id || ''} /> // Provide empty string as fallback
        )}
      </div>
    </div>
  )
}

// Keep the VM settings update function
async function updateClientVMSettings(
  clientId: string, 
  vmIp: string, 
  vmPassword: string | null
): Promise<VMSettingsUpdateResponse> {
  try {
    // TODO: Implement the actual API call to update VM settings
    // For now, simulate a successful update
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update VM settings' }
  }
}

