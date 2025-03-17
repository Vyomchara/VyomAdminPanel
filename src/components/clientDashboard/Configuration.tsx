"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Network, Server, Loader2, Eye, EyeOff, Lock } from "lucide-react"
import { toast } from "sonner"
import { getClientDetails, updateClientVMIP, updateClientVMIPAndPassword } from "@/app/action"

interface ConfigurationProps {
  clientId: string
  vm_ip: string | null
  vm_password?: string | null
  onUpdate: () => Promise<void>
}

export function Configuration({ 
  clientId, 
  vm_ip, 
  vm_password = null,  // Add with default value
  onUpdate 
}: ConfigurationProps) {
  const [vmIpState, setVmIpState] = useState(vm_ip)
  const [vmPassword, setVmPassword] = useState<string | null>(vm_password) // Initialize with prop value
  const [showVmPassword, setShowVmPassword] = useState(false) // Add visibility toggle
  const [isDialogOpen, setIsDialogOpen] = useState(!vm_ip) // Auto-open if VM IP is not set
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showVmIp, setShowVmIp] = useState(false) // Add this state for IP visibility toggle

  // Function to refresh client data
  const refreshData = async () => {
    if (!clientId) return

    setIsRefreshing(true)

    try {
      // First call the parent's update function to update global state
      await onUpdate()

      // Then get the latest data for local state
      const result = await getClientDetails(clientId)
      if (result.success && result.data) {
        // Update local state with fresh data from server
        setVmIpState(result.data.vm_ip)

        // Since vm_password isn't implemented yet, don't try to access it
        // Instead, we'll use the password from the form submission
        // This avoids the TypeScript error while maintaining functionality
        console.log("before VM password from server:", result.data.vm_password)
        setVmPassword(result.data.vm_password || null)
        console.log("after VM password from server:", result.data.vm_password)
      }
    } catch (error) {
      console.error('Error refreshing client data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // This effect runs when vm_ip or vm_password props change
  useEffect(() => {
    setVmIpState(vm_ip)
    setVmPassword(vm_password) // Update password state when prop changes
  }, [vm_ip, vm_password])

  // Automatically show dialog when component mounts if VM IP is not set
  useEffect(() => {
    if (!vmIpState) {
      setIsDialogOpen(true)
    }
  }, []) // Empty dependency array ensures this runs only once on mount

  // Handle Tailscale setup
  const handleTailscaleSetup = () => {
    toast.info("Tailscale setup coming soon")
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold"></h2>
      </div>

      {/* VM Info Card - Full Width */}
      <div className="p-6 bg-background pb-[h/2] rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Virtual Machine Settings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* VM IP Address with colorized background */}
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full mr-3">
              <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">VM IP Address</p>
              <div className="flex items-center">
                <p className="text-sm font-medium mr-2">
                  {vmIpState
                    ? (showVmIp ? vmIpState : '••••••••')
                    : 'Not configured'}
                </p>
                {vmIpState && (
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

          {/* VM Password Field with colorized background */}
          <div className="flex items-center">
            <div className="bg-amber-100 dark:bg-amber-900/20 p-2 rounded-full mr-3">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">VM Password</p>
              <div className="flex items-center">
                <p className="text-sm font-medium mr-2">
                  {vmPassword
                    ? (showVmPassword ? vmPassword : '••••••••')
                    : 'Not configured'}
                </p>
                {vmPassword && (
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
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Setup Actions - Within the same card, now stacked vertically */}
        <div className="border-t pt-6">
          <h4 className="text-base font-medium mb-4">Setup Actions</h4>

          <div className="flex flex-col space-y-3 ">
            {/* VM Setup Button */}
            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center justify-center p-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Server className="mr-2 h-5 w-5" />
              <span>{vmIpState ? 'Update VM Settings' : 'Setup VM'}</span>
            </button>

            {/* Tailscale Setup Button */}
            <button
              onClick={handleTailscaleSetup}
              className="flex items-center justify-center p-4 bg-secondary border-2  text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              <Network className="mr-2 h-5 w-5" />
              <span>Setup Tailscale</span>
            </button>
          </div>
        </div>
      </div>

      {/* VM Config Dialog with escape option */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        // If user is trying to close the dialog
        if (!open) {
          // If VM IP is not set, show warning but still allow closing
          if (!vmIpState) {
            // Show warning but don't prevent closing
            toast.warning("VM IP address is not configured. Some features may be unavailable.", {
              description: "You can configure it later from the Configuration page."
            });
          }
          // Always allow dialog to close
          setIsDialogOpen(open);
        } else {
          // Opening the dialog - just set state
          setIsDialogOpen(open);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {vmIpState ? "Update VM Settings" : "Configure VM"}
            </DialogTitle>
          </DialogHeader>
          <VMConfigForm
            clientId={clientId}
            currentIP={vmIpState}
            onUpdate={async () => {
              await refreshData() // Make sure to await this
              setIsDialogOpen(false)
            }}
          />
         
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Create a separate form component for the VM config 
function VMConfigForm({ clientId, currentIP, onUpdate }: {
  clientId: string,
  currentIP: string | null,
  onUpdate: () => Promise<void>
}) {
  const [vmIp, setVmIp] = useState(currentIP || '')
  const [vmPassword, setVmPassword] = useState('')
  const [usePasswordAuth, setUsePasswordAuth] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vmIp) {
      toast.error("VM IP address is required")
      return
    }

    setIsUpdating(true)

    try {
      // Only send password if password authentication is enabled
      const passwordToSend = usePasswordAuth ? vmPassword : null
      const result = await updateClientVMSettings(clientId, vmIp, passwordToSend)

      if (result.success) {
        // This is critical - wait for the onUpdate to complete
        await onUpdate()
        toast.success("VM settings updated successfully")
      } else {
        throw new Error(result.error || "Failed to update VM settings")
      }
    } catch (error) {
      console.error("Error updating VM settings:", error)
      toast.error("Failed to update VM settings")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="vm_ip">VM IP Address</Label>
        <Input
          id="vm_ip"
          value={vmIp}
          onChange={(e) => setVmIp(e.target.value)}
          placeholder="192.168.1.100"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="use_password_auth"
          checked={usePasswordAuth}
          onChange={(e) => setUsePasswordAuth(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <Label htmlFor="use_password_auth" className="text-sm font-normal">
          Enable password authentication
        </Label>
      </div>

      {usePasswordAuth && (
        <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <Label htmlFor="vm_password">VM Password</Label>
          <Input
            id="vm_password"
            type="password"
            value={vmPassword}
            onChange={(e) => setVmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isUpdating}>
        {isUpdating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Updating...</span>
          </>
        ) : (
          <span>Save VM Settings</span>
        )}
      </Button>
    </form>
  )
}

// Helper function for VM settings update
async function updateClientVMSettings(
  clientId: string,
  vmIp: string,
  vmPassword: string | null
): Promise<{ success: boolean, error?: string }> {
  try {
    // Use if/else instead of a ternary for executing different code blocks
    if (vmPassword !== null) {
     
      // Password update logic
      const passwordResult = await updateClientVMIPAndPassword(clientId, {
        vmIp: vmIp, 
        vmPassword: vmPassword
      });
      if (!passwordResult) {
        return {
          success: false,
          error: "Failed to update VM settings - no response received"
        };
      }

      if (!passwordResult.success) {
        // If password update fails, still return partial success
        return {
          success: true,
          error: "IP updated, but password update failed: " + passwordResult.message
        };
      }
      
      return { success: true };
    } else {
      // IP-only update logic
      const ipResult = await updateClientVMIP(clientId, {
        vm_ip: vmIp
      });

      if (!ipResult.success) {
        return {
          success: false,
          error: ipResult.message || "Failed to update VM IP address"
        };
      }

      return { success: true };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}