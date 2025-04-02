import { useState, useEffect } from 'react'
import { getClientDetails, getDroneAssignments } from "@/app/action"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ClientData, View } from '@/types/types'
import { getStorageItem, setStorageItem } from '@/lib/storage'

interface UseClientOptions {
  cacheTime?: number // in milliseconds
  initialView?: View
  redirectOnError?: boolean
}

export function useClient(clientId: string | null, options: UseClientOptions = {}) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    initialView = 'summary',
    redirectOnError = true
  } = options
  
  const [client, setClient] = useState<ClientData | null>(null)
  const [droneAssignments, setDroneAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState(initialView)
  const [vmPromptShown, setVmPromptShown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      console.log("Loading client data for ID:", clientId);
      
      try {
        // Ensure clientId is a string before calling getClientDetails
        if (!clientId) {
          console.error("Client ID is missing");
          setError("Client ID is required");
          setLoading(false);
          return; // Exit early instead of throwing an error
        }
        
        const response = await getClientDetails(clientId);
        console.log("Client data response:", response);
        
        if (response.success && response.data) {
          setClient(response.data);
        } else {
          console.error("Failed to load client:", response.message);
          setError(response.message || "Failed to load client");
          
          if (redirectOnError) {
            router.push('/');
          }
        }
      } catch (err) {
        console.error("Error loading client:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        
        if (redirectOnError) {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (clientId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [clientId, redirectOnError, router]);

  async function loadDroneAssignments(clientId: string) {
    try {
      const assignments = await getDroneAssignments(clientId)
      setDroneAssignments(assignments)
    } catch (error) {
      console.error('Error fetching drone assignments:', error)
      setDroneAssignments([])
    }
  }
  
  async function refreshClientData() {
    if (!clientId) return
    
    try {
      const result = await getClientDetails(clientId)
      if (result.success && result.data) {
        setClient(result.data)
        setStorageItem(`client_${clientId}`, result.data)
        setStorageItem(`client_${clientId}_time`, Date.now())
      }
    } catch (error) {
      console.error('Error refreshing client data:', error)
    }
  }

  return {
    client,
    droneAssignments,
    loading,
    error,
    currentView,
    setCurrentView,
    refreshClientData,
  }
}