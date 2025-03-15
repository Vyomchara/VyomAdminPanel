import { updateClientVMIP } from "@/app/action"
import { VMSettingsUpdateResponse } from "@/types/types"

/**
 * Update a client's VM IP address and optionally password
 * 
 * @param clientId Client identifier
 * @param vmIp VM IP address
 * @param vmPassword Optional VM password
 * @returns Result object with success status
 */
export async function updateClientVMSettings(
  clientId: string, 
  vmIp: string, 
  vmPassword: string | null = null
): Promise<VMSettingsUpdateResponse> {
  try {
    // Currently the API only supports updating the VM IP address
    const result = await updateClientVMIP(clientId, vmIp)
    
    if (!result.success) {
      return { 
        success: false, 
        error: result.message || 'Failed to update VM settings' 
      }
    }
    
    // TODO: Add password support when the backend API supports it
    
    return { success: true }
  } catch (error) {
    console.error('VM settings update error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update VM settings' 
    }
  }
}

/**
 * Check if a VM is reachable via ping
 * 
 * @param vmIp IP address to check
 * @returns Promise resolving to ping status
 */
export async function checkVMReachability(vmIp: string): Promise<{
  reachable: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    // In a real implementation, this would call a server action to ping the VM
    // For now we'll simulate a response
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // For demo, return success if IP starts with 192.168
    const reachable = vmIp.startsWith('192.168')
    
    return {
      reachable,
      latency: reachable ? Math.floor(Math.random() * 50) + 5 : undefined,
      error: reachable ? undefined : 'VM not reachable'
    }
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : 'Error checking VM'
    }
  }
}