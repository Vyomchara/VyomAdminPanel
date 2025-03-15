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

export type View = 'summary' | 'config' | 'mission'

interface PageProps {}

interface ClientData {
  id: string;
  name: string;
  email: string;
  address: string;
  created_at: Date;
  vm_ip: string | null;
  vm_password: string | null;
}

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
  const [client, setClient] = useState<any>(null)
  const [droneAssignments, setDroneAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vmPromptShown, setVmPromptShown] = useState(false) // Track if we've shown VM prompt
  const [missionFiles, setMissionFiles] = useState<File[] | null>(null)
  const router = useRouter()
  
  useEffect(() => {
    async function loadData() {
      try {
        if (!id) {
          router.push('/')
          return
        }

        // Check if we have cached data
        const cachedClient = getStorageItem(`client_${id}`)
        const cachedTime = getStorageItem(`client_${id}_time`)
        const now = Date.now()
        
        // Use cached data if it's less than 5 minutes old
        if (cachedClient && cachedTime && (now - cachedTime) < 5 * 60 * 1000) {
          setClient(cachedClient)
          
          // Still check if VM IP is not configured and navigate only on first load
          if (!cachedClient.vm_ip && !vmPromptShown) {
            setCurrentView('config')
            setVmPromptShown(true)
          }
          
          // Load drone assignments later
          loadDroneAssignments(id)
          setLoading(false)
          return
        }

        // If no valid cache, fetch from server
        const result = await getClientDetails(id)
        if (!result.success || !result.data) {
          router.push('/')
          return
        }

        // Save to cache
        setStorageItem(`client_${id}`, result.data)
        setStorageItem(`client_${id}_time`, Date.now())
        
        setClient(result.data)
        
        // Check if VM IP is not set and automatically navigate to config page
        // But only do this once per session
        if (!result.data.vm_ip && !vmPromptShown) {
          setCurrentView('config')
          setVmPromptShown(true)
          toast.info("Please configure VM IP address")
        }
        
        await loadDroneAssignments(id)
        
      } catch (err) {
        console.error('Error:', err)
        router.push('/')
      } finally {
        setLoading(false)
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
  
  // Function to update client data after VM IP is set - make this return void
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
        
        // Don't return any data, just update state
      }
    } catch (error) {
      console.error('Error updating client data:', error)
    }
    // No return value (implicitly returns undefined which is compatible with void)
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
            clientId={client?.id} 
            vm_ip={client?.vm_ip}
            onUpdate={updateClientData} // Pass update function to Configuration
          />
        ) : (
          <MissionUploaderComponent clientId={client?.id} />
        )}
      </div>
    </div>
  )
}

interface SidebarProps {
  className?: string;
  clientName: string;
  onNavigate: (view: View) => void;
  currentView: View;
}

// Add a new MissionUploader component
function MissionUploader({ clientId }: { clientId: string }) {
  const [files, setFiles] = useState<File[] | null>(null)
  const [isUploading, setIsUploading] = useState(false)   
  
  const handleFileUpload = async (uploadedFiles: File[]) => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Simulated upload - replace with your actual upload logic
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success("Mission files uploaded successfully")
      setFiles(null) // Clear files after successful upload
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload mission files")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Mission Uploader</h2>
        {isUploading && (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Uploading...</span>
          </div>
        )}
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Mission Files</h3>
        <div className="space-y-4">
          <FileUploader
            value={files}
            onValueChange={(files) => {
              setFiles(files);
              if (files && files.length > 0) {
                handleFileUpload(files);
              }
            }}
            dropzoneOptions={{
              maxFiles: 5,
              maxSize: 10 * 1024 * 1024, // 10MB
              accept: {
                'application/json': ['.json'],
                'application/xml': ['.xml'],
                'text/plain': ['.txt'],
                'application/zip': ['.zip'],
              }
            }}
          >
            <FileInput>
              <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Drag and drop mission files, or click to select
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JSON, XML, TXT, ZIP (max 10MB)
                </p>
              </div>
            </FileInput>
            
            {files && files.length > 0 && (
              <FileUploaderContent className="mt-4">
                {files.map((file, i) => (
                  <FileUploaderItem key={i} index={i}>
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </FileUploaderItem>
                ))}
              </FileUploaderContent>
            )}
          </FileUploader>
        </div>
      </Card>
    </div>
  )
}

function AppSidebar() {
  // Your sidebar component code
}
async function updateClientVMSettings(clientId: string, vmIp: string, vmPassword: string | null): Promise<{ success: boolean, error?: string }> {
  try {
    // TODO: Implement the actual API call to update VM settings
    // For now, simulate a successful update
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update VM settings' }
  }
}

