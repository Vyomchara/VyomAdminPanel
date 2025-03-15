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
  const router = useRouter()

  useEffect(() => {
    loadClientData()
  }, [clientId])

  async function loadClientData() {
    if (!clientId) {
      if (redirectOnError) router.push('/')
      setLoading(false)
      return
    }

    try {
      // Check cache first
      const cachedClient = getStorageItem<ClientData>(`client_${clientId}`)
      const cachedTime = getStorageItem<number>(`client_${clientId}_time`)
      const now = Date.now()
      
      if (cachedClient && cachedTime && (now - cachedTime) < cacheTime) {
        setClient(cachedClient)
        
        if (!cachedClient.vm_ip && !vmPromptShown) {
          setCurrentView('config')
          setVmPromptShown(true)
        }
        
        await loadDroneAssignments(clientId)
        setLoading(false)
        return
      }
      
      // Fetch fresh data
      const result = await getClientDetails(clientId)
      if (!result.success || !result.data) {
        if (redirectOnError) router.push('/')
        return
      }
      
      setClient(result.data)
      setStorageItem(`client_${clientId}`, result.data)
      setStorageItem(`client_${clientId}_time`, now)
      
      if (!result.data.vm_ip && !vmPromptShown) {
        setCurrentView('config')
        setVmPromptShown(true)
        toast.info("Please configure VM IP address")
      }
      
      await loadDroneAssignments(clientId)
    } catch (error) {
      console.error('Error loading client data:', error)
      if (redirectOnError) router.push('/')
    } finally {
      setLoading(false)
    }
  }
  
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
    currentView,
    setCurrentView,
    refreshClientData,
  }
}