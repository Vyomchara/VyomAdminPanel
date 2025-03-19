"use client"

import { DroneTable } from "./DroneTable"
import { toast } from "sonner"
import { Mail, MapPin, Server, Trash2, Edit2, Plus, Eye, EyeOff, Lock, Download, Upload } from "lucide-react" // Added Plus, Eye, EyeOff, Download, and Upload icons
import Image from "next/image"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react" // Added useEffect for countdown
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox" // Added Checkbox import
import { updateClientAction, deleteClientAction, checkForClientPemFile, createSignedUrl } from "@/app/action" // Import PEM file check function

export function SummaryDashboard({ client, droneAssignments }: { client: any, droneAssignments: any }) {
  const { theme, resolvedTheme } = useTheme()
  const router = useRouter()
  const [editData, setEditData] = useState({
    name: client?.name || "",
    email: client?.email || "",
    address: client?.address || ""
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false) // Added state for checkbox
  const [countdown, setCountdown] = useState(5) // Added countdown state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false) // Added state to control alert dialog
  const [countdownActive, setCountdownActive] = useState(false) // Track if countdown is active
  const [showVmIp, setShowVmIp] = useState(false) // Added state to track IP visibility
  const [vmConfigDialogOpen, setVmConfigDialogOpen] = useState(false) // Added state to control VM config dialog
  const [showVmPassword, setShowVmPassword] = useState(false) // Add this for password visibility
  
  // Add state for PEM file
  const [pemFileInfo, setPemFileInfo] = useState<{
    exists: boolean,
    loading: boolean,
    url?: string
  }>({
    exists: false,
    loading: true
  })
  
  // Check for PEM file when component mounts
  useEffect(() => {
    async function checkPemFile() {
      if (!client?.id) return
      
      try {
        setPemFileInfo(prev => ({ ...prev, loading: true }))
        const result = await checkForClientPemFile(client.id)
        
        setPemFileInfo({
          exists: result.success && result.fileExists,
          loading: false,
          url: result.fileUrl
        })
      } catch (error) {
        console.error("Error checking for PEM file:", error)
        setPemFileInfo({
          exists: false,
          loading: false
        })
      }
    }
    
    checkPemFile()
  }, [client?.id])
  
  // Function to handle PEM file download
  const handleDownloadPem = async () => {
    if (!client?.id) return
    
    try {
      toast.loading("Preparing download link")
      const result = await createSignedUrl(client.id)
      
      if (!result.success || !result.url) {
        throw new Error(result.error ?? "Download URL not available")
      }
      
      window.location.href = result.url
      toast.success("Download started")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to download PEM file: ${errorMessage}`)
      console.error("Error downloading PEM file:", error)
    }
  }
  
  // Effect for countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (countdownActive && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, countdownActive]);
  
  // Reset countdown and checkbox when dialog closes
  useEffect(() => {
    if (!showDeleteDialog) {
      setCountdown(5);
      setDeleteConfirmed(false);
      setCountdownActive(false);
    }
  }, [showDeleteDialog]);
  
  // Determine which drone SVG to use based on theme
  const droneLogoSrc = 
    theme === "dark" || resolvedTheme === "dark" 
      ? "/whitedrone.svg" 
      : "/drone.svg"
  
  // Handle client deletion
  const handleDeleteClient = async () => {
    if (!client?.id) {
      toast.error("Client ID is missing")
      return
    }
    
    setIsDeleting(true)
    
    try {
      const result = await deleteClientAction(client.id)
      
      if (!result.success) {
        throw new Error(result.message)
      }
      
      toast.success("Client deleted successfully")
      // Navigate back to the clients list
      router.push('/')
    } catch (error: any) {
      toast.error(`Failed to delete client: ${error.message}`)
      console.error("Error deleting client:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }
  
  // Start countdown when checkbox is checked
  const handleConfirmChange = (checked: boolean) => {
    setDeleteConfirmed(checked);
    if (checked) {
      setCountdownActive(true);
    } else {
      setCountdownActive(false);
      setCountdown(5);
    }
  };
  
  // Handle input changes for edit form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Handle client update
  const handleUpdateClient = async () => {
    if (!client?.id) {
      toast.error("Client ID is missing")
      return
    }
    
    // Basic validation
    if (!editData.name.trim()) {
      toast.error("Client name is required")
      return
    }
    
    if (!editData.email.trim()) {
      toast.error("Email is required")
      return
    }
    
    setIsUpdating(true)
    
    try {
      const result = await updateClientAction(client.id, editData)
      
      if (!result.success) {
        throw new Error(result.message)
      }
      
      // Update the client data in the UI
      Object.assign(client, editData)
      
      toast.success("Client updated successfully")
      setEditDialogOpen(false)
    } catch (error: any) {
      toast.error(`Failed to update client: ${error.message}`)
      console.error("Error updating client:", error)
    } finally {
      setIsUpdating(false)
    }
  }
  
  return (
    <div>
      {/* Header with title and action buttons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">{client.name}</h1>
        </div>
        
        {/* Action buttons container */}
        <div className="flex space-x-2">
          {/* Edit Client Button & Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Client Details
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Client Information</DialogTitle>
                <DialogDescription>
                  Make changes to the client details. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={editData.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={editData.email}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={editData.address}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={handleUpdateClient} 
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Delete Client Button */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Client
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this client?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the client account
                  and remove all associated data including drone assignments and mission records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              {/* Checkbox confirmation */}
              <div className="flex items-center space-x-2 my-4">
                <Checkbox 
                  id="delete-confirm" 
                  checked={deleteConfirmed} 
                  onCheckedChange={handleConfirmChange}
                />
                <label
                  htmlFor="delete-confirm"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I understand that this action cannot be undone
                </label>
              </div>
              
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteClient}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting || !deleteConfirmed || countdown > 0}
                >
                  {isDeleting 
                    ? 'Deleting...' 
                    : deleteConfirmed 
                      ? countdown > 0 
                        ? `Delete in ${countdown}s` 
                        : 'Delete Now' 
                      : 'Delete'
                  }
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    
      {/* Rest of the component remains unchanged */}
      {/* Client Information Section */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information Card (Left) */}
          <div className="p-4 bg-background rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-full mr-3">
                  <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email Address</p>
                  <p className="text-sm font-medium truncate" title={client?.email}>
                    {client?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full mr-3">
                  <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Physical Address</p>
                  <p className="text-sm font-medium truncate" title={client?.address}>
                    {client?.address}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* VM Information Card (Right) */}
          <div className="p-4 bg-background rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Virtual Machine</h3>
              {/* {client?.vm_ip && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                  onClick={() => {
                    // Navigate to VM configuration
                    router.push(`/client/vm-config?id=${client.id}`);
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  Configure
                </Button>
              )} */}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full mr-3">
                  <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">
                      {client?.vm_ip 
                        ? (showVmIp ? client.vm_ip : '•••••••••••')
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
              
              <div className="flex items-center">
                <div className="bg-amber-100 dark:bg-amber-900/20 p-2 rounded-full mr-3">
                  <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Authentication</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">
                      {client?.vm_password 
                        ? (showVmPassword ? client.vm_password : '•••••••••••')
                        : client?.vm_ip 
                          ? <span className="text-muted-foreground">Key-based access</span>
                          : 'Not configured'}
                    </p>
                    {client?.vm_password && (
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
              
              {/* PEM File Download Section */}
              <div className="flex items-center">
                <div className="bg-gray-100 dark:bg-gray-900/20 p-2 rounded-full mr-3">
                  <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">PEM File</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">
                      {pemFileInfo.loading 
                        ? 'Checking...' 
                        : pemFileInfo.exists 
                          ? 'Available' 
                          : 'Not available'}
                    </p>
                    {pemFileInfo.exists && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        onClick={handleDownloadPem}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {!client?.vm_ip && (
              <Button 
                variant="secondary"
                size="sm"
                className="w-full mt-4"
                onClick={() => {
                  // Open configuration dialog
                  setVmConfigDialogOpen(true);
                }}
              >
                <Server className="h-4 w-4 mr-2" />
                Configure VM Settings
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Drones Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Assigned Drones</h2>
        </div>
        
        {droneAssignments && droneAssignments.length > 0 ? (
          <DroneTable assignments={droneAssignments} />
        ) : (
          <div className="bg-background rounded-lg shadow-sm p-8 text-center">
            <div className="max-w-md mx-auto flex flex-col items-center">
              <Image 
                src={droneLogoSrc}
                alt="No drones"
                width={64}
                height={64}
                className="mb-4"
              />
              <h3 className="text-lg font-medium mb-2">No drones assigned</h3>
              <p className="text-muted-foreground mb-6">
                This client doesn't have any drones assigned yet. Assign drones to enable mission planning and monitoring.
              </p>
              <Button 
                className="flex items-center"
                onClick={() => {
                  toast.info("Drone assignment feature coming soon")
                }}
              >
                <Plus className="h-4 w-4" />
                Assign Drones
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}