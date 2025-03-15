"use client"

import { DroneTable } from "../clientDashboard/DroneTable"
import { toast } from "sonner"
import { Mail, MapPin, Server, Trash2, Edit2, Plus } from "lucide-react" // Added Plus icon
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
import { updateClientAction, deleteClientAction } from "@/app/action"

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
                <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email Address</p>
                  <p className="text-sm font-medium truncate" title={client?.email}>
                    {client?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
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
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Virtual Machine</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Server className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">VM IP Address</p>
                  <p className="text-sm font-medium">{client?.vm_ip || 'Not configured'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="h-5 w-5 mr-3 text-muted-foreground"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <div>
                  <p className="text-xs text-muted-foreground">VM Password</p>
                  <p className="text-sm font-medium">
                    {client?.vm_password 
                      ? '••••••••' 
                      : client?.vm_ip 
                        ? <span className="text-muted-foreground italic">Key-based authentication</span> 
                        : 'Not configured'}
                  </p>
                </div>
              </div>
            </div>
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