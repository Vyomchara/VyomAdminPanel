"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CircleAlertIcon, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { deleteDroneAssignment, updateDroneAssignment, getAvailablePayloads } from "@/actions/drone";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DroneTable({ 
  assignments, 
  clientId,
  droneLogoSrc = "/drone.svg",
  onAssignmentComplete
}: { 
  assignments: any[],
  clientId: string,
  droneLogoSrc?: string,
  onAssignmentComplete?: () => void
}) {
  const [tableData, setTableData] = useState<any[]>([]);
  const [droneToUnassign, setDroneToUnassign] = useState<any | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [droneToEdit, setDroneToEdit] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editQuantity, setEditQuantity] = useState(1);
  const [selectedPayloads, setSelectedPayloads] = useState<any[]>([]);
  const [availablePayloads, setAvailablePayloads] = useState<any[]>([]);
  const [loadingPayloads, setLoadingPayloads] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [payloadOpen, setPayloadOpen] = useState(false);

  useEffect(() => {
    //console.log("DroneTable received assignments:", assignments);
    setTableData(assignments || []);
  }, [assignments]);
  
  const handleUnassignDrone = async () => {
    if (!droneToUnassign) return;
    
    try {
      const result = await deleteDroneAssignment(droneToUnassign.id);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to unassign drone");
      }
      
      const updatedData = tableData.filter(item => item.id !== droneToUnassign.id);
      setTableData(updatedData);
      
      toast.success(`Drone ${droneToUnassign.drone?.name || "Unknown"} unassigned successfully`);
    } catch (error: any) {
      console.error("Error unassigning drone:", error);
      toast.error(`Failed to unassign drone: ${error.message || "Unknown error"}`);
    } finally {
      setDroneToUnassign(null);
      setShowConfirmDialog(false);
      
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    }
  };

  const handleEditDrone = (assignment: any) => {
    setDroneToEdit(assignment);
    setEditQuantity(assignment.quantity || 1);
    setSelectedPayloads(assignment.payloads || []);
    setShowEditDialog(true);
    
    if (availablePayloads.length === 0) {
      setLoadingPayloads(true);
      getAvailablePayloads().then(result => {
        if (result.success) {
          setAvailablePayloads(result.payloads);
        } else {
          toast.error("Failed to load payloads");
        }
        setLoadingPayloads(false);
      });
    }
  };

  const handleUpdateDrone = async () => {
    if (!droneToEdit) return;
    
    setIsUpdating(true);
    
    try {
      const payloadIds = selectedPayloads.map(p => p.id);
      
      const result = await updateDroneAssignment(
        droneToEdit.id,
        editQuantity,
        payloadIds
      );
      
      if (!result.success) {
        throw new Error(result.error || "Failed to update drone assignment");
      }
      
      const updatedData = tableData.map(item => {
        if (item.id === droneToEdit.id) {
          return {
            ...item,
            quantity: editQuantity,
            payloads: selectedPayloads
          };
        }
        return item;
      });
      
      setTableData(updatedData);
      toast.success(`Drone updated successfully`);
      
      setShowEditDialog(false);
      setDroneToEdit(null);
      
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    } catch (error: any) {
      console.error("Error updating drone:", error);
      toast.error(`Failed to update drone: ${error.message || "Unknown error"}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <CircleAlertIcon className="opacity-80" size={16} />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to unassign?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will unassign the {droneToUnassign?.drone?.name || "selected drone"} from this client.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDroneToUnassign(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnassignDrone}>
              Unassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Drone Assignment</DialogTitle>
            <DialogDescription>
              Update drone quantity and payload assignments.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="drone-model">Drone Model</Label>
              <Input 
                id="drone-model"
                value={droneToEdit?.drone?.name || "Unknown Drone"} 
                disabled
                className="bg-muted/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity"
                type="number" 
                min="1"
                max="100" 
                value={editQuantity} 
                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payloads">Payloads</Label>
              <Popover open={payloadOpen} onOpenChange={setPayloadOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="payloads"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={loadingPayloads}
                  >
                    {loadingPayloads ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </div>
                    ) : selectedPayloads.length > 0 ? (
                      `${selectedPayloads.length} selected`
                    ) : (
                      "Select payloads..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search payloads..." />
                    <CommandEmpty>No payload found.</CommandEmpty>
                    <CommandGroup>
                      {availablePayloads.map((payload) => (
                        <CommandItem
                          key={payload.id}
                          value={payload.name}
                          onSelect={() => {
                            setSelectedPayloads(current => 
                              current.some(p => p.id === payload.id) 
                                ? current.filter(p => p.id !== payload.id)
                                : [...current, payload]
                            );
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPayloads.some(p => p.id === payload.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {payload.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            {selectedPayloads.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedPayloads.map(payload => (
                  <Badge key={payload.id} variant="secondary">
                    {payload.name}
                    <button 
                      className="ml-1 rounded-full hover:bg-muted" 
                      onClick={() => setSelectedPayloads(p => p.filter(item => item.id !== payload.id))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            <Button 
              className="w-full mt-4"
              onClick={handleUpdateDrone}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Drone"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">S.No</TableHead>
              <TableHead>Drone Model</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Payloads</TableHead>
              <TableHead className="text-right">  </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.length === 0 ? (
              <TableRow key="empty-row">
                <TableCell colSpan={5} className="h-24 text-center">
                  No drones assigned
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((assignment, index) => (
                <TableRow key={assignment.id || `assignment-row-${index}`}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {assignment.drone?.name || "Unknown Drone"}
                  </TableCell>
                  <TableCell>{assignment.quantity || 1}</TableCell>
                  <TableCell>
                    {assignment.payloads && assignment.payloads.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-1">
                          {assignment.payloads.slice(0, 3).map((payload: any) => (
                            <Badge key={payload.id} variant="outline" className="text-xs">
                              {payload.name}
                            </Badge>
                          ))}
                        </div>
                        
                        {assignment.payloads.length > 3 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assignment.payloads.slice(3).map((payload: any) => (
                              <Badge key={payload.id} variant="outline" className="text-xs">
                                {payload.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No payloads</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditDrone(assignment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setDroneToUnassign(assignment);
                        setShowConfirmDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {tableData.length === 0 && (
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
            <p className="text-muted-foreground">
              This client doesn't have any drones assigned yet. Use the "Add Drone" button above to assign drones.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}