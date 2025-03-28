"use client";

import { useState } from "react";
import Image from "next/image"; // Added Image import
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Added Input import
import { Label } from "@/components/ui/label"; // Added Label import
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
} from "@/components/ui/alert-dialog";
import { CircleAlertIcon, TrashIcon, Edit, Trash2, Loader2, Plus } from "lucide-react"; // Added Loader2 and Plus
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

export function DroneTable({ assignments, payloads }: { 
  assignments: any[],
  payloads?: any[]
}) {
  // Existing state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [data, setData] = useState<any[]>(assignments);
  const [open, setOpen] = useState(false);
  
  // Added missing state variables
  const [selectedDrone, setSelectedDrone] = useState<any>(null);
  const [selectedPayloads, setSelectedPayloads] = useState<any[]>([]);
  const [droneQuantity, setDroneQuantity] = useState(1);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Define drone logo source
  const droneLogoSrc = "/drone.svg"; // Default image path
  
  // Toggle a single row selection
  const toggleRowSelection = (droneId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(droneId)) {
      newSelected.delete(droneId);
    } else {
      newSelected.add(droneId);
    }
    setSelectedRows(newSelected);
  };
  
  // Toggle all rows selection
  const toggleAllSelection = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(drone => drone.id || `no-id-${Math.random()}`)));
    }
  };
  
  // Handle deleting selected drones
  const handleDeleteDrones = () => {
    // Filter out the selected drones
    const updatedData = data.filter(drone => !selectedRows.has(drone.id || `no-id-${Math.random()}`));
    setData(updatedData);
    setSelectedRows(new Set()); // Clear selection
    
    // Show success toast
    toast.success(`${selectedRows.size} drone${selectedRows.size > 1 ? 's' : ''} unassigned successfully`);
    
    // Here you would typically call an API to update the assignments
    // For example: await unassignDrones(Array.from(selectedRows));
  };

  // Add the missing handleAssignDrone function
  const handleAssignDrone = async () => {
    if (!selectedDrone) {
      toast.error("Please select a drone model");
      return;
    }
    
    setIsAssigning(true);
    try {
      // Here you would typically call an API to assign drones
      // For example: await assignDrone(clientId, selectedDrone.id, droneQuantity, selectedPayloads);
      
      // Mock success for now
      setTimeout(() => {
        toast.success("Drone assigned successfully");
        // Reset form or update data as needed
        setIsAssigning(false);
      }, 1000);
    } catch (error) {
      toast.error("Failed to assign drone");
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add the delete button if rows are selected */}
      {selectedRows.size > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="ml-auto" variant="outline">
              <TrashIcon
                className="-ms-1 opacity-60"
                size={16}
                aria-hidden="true"
              />
              Unassign Drone
              <span className="bg-background text-muted-foreground/70 -me-1 ml-2 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                {selectedRows.size}
              </span>
            </Button>
          </AlertDialogTrigger>
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
                  This will unassign {selectedRows.size} selected{" "}
                  {selectedRows.size === 1 ? "drone" : "drones"} from this client.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDrones}>
                Unassign
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedRows.size > 0}
                  onCheckedChange={toggleAllSelection}
                  aria-label="Select all drones"
                />
              </TableHead>
              <TableHead className="w-[60px]">S.No</TableHead>
              <TableHead>Drone ID</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow key="empty-row">
                <TableCell colSpan={5} className="h-24 text-center">
                  No drones assigned
                </TableCell>
              </TableRow>
            ) : (
              data.map((drone, index) => (
                <TableRow key={drone.id || `drone-row-${index}`}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedRows.has(drone.id || `no-id-${index}`)}
                      onCheckedChange={() => toggleRowSelection(drone.id || `no-id-${index}`)}
                      aria-label={`Select drone ${drone.id || index + 1}`}
                    />
                  </TableCell>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {drone.id ? drone.id : <span className="text-muted-foreground italic">No Drone ID</span>}
                  </TableCell>
                  <TableCell>{drone.model || "Vyom-1"}</TableCell>
                  <TableCell>
                    {drone.payload ? drone.payload : <span className="text-muted-foreground italic">No Payload</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div> */}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Drone Model</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Payloads</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow key="empty-assignments">
                <TableCell colSpan={4} className="h-24 text-center">
                  No assignments found
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment, index) => (
                <TableRow key={assignment.id || `assignment-row-${index}`}>
                  <TableCell className="font-medium">{assignment.drone?.name || 'Unknown'}</TableCell>
                  <TableCell>{assignment.quantity || 1}</TableCell>
                  <TableCell>
                    {assignment.payloads && assignment.payloads.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assignment.payloads.map((payload: any) => (
                          <Badge key={payload.id} variant="outline" className="text-xs">
                            {payload.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No payloads</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Only render the form when there are no assignments */}
      {(!assignments || assignments.length === 0) && (
        <div className="bg-background rounded-lg shadow-sm p-8">
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
            
            <div className="w-full max-w-sm space-y-4 border rounded-md p-4">
              <h4 className="font-medium">Assign New Drone</h4>
              
              {/* Drone Model Dropdown */}
              <div className="space-y-2">
                <Label>Drone Model</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedDrone ? selectedDrone.name : "Select drone model..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search drone models..." />
                      <CommandEmpty>No drone model found.</CommandEmpty>
                      <CommandGroup>
                        {[
                          { id: 1, name: "Vyom-1" },
                          { id: 2, name: "Vyom-2" },
                          { id: 3, name: "Vyom-X Pro" }
                        ].map((drone) => (
                          <CommandItem
                            key={drone.id}
                            value={drone.name}
                            onSelect={() => {
                              setSelectedDrone(drone);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedDrone?.id === drone.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {drone.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Quantity Input */}
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={droneQuantity} 
                  onChange={(e) => setDroneQuantity(parseInt(e.target.value) || 1)} 
                />
              </div>
              
              {/* Payloads Dropdown */}
              <div className="space-y-2">
                <Label>Payloads (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedPayloads.length > 0 
                        ? `${selectedPayloads.length} selected`
                        : "Select payloads..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search payloads..." />
                      <CommandEmpty>No payload found.</CommandEmpty>
                      <CommandGroup>
                        {[
                          { id: 1, name: "Camera" },
                          { id: 2, name: "Infrared Sensor" },
                          { id: 3, name: "LiDAR" },
                          { id: 4, name: "Thermal Imaging" }
                        ].map((payload) => (
                          <CommandItem
                            key={payload.id}
                            value={payload.name}
                            onSelect={() => {
                              // Toggle selection
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
              
              {/* Display selected payloads */}
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
              
              {/* Submit Button */}
              <Button 
                className="w-full mt-2"
                onClick={handleAssignDrone}
                disabled={isAssigning || !selectedDrone}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Drone
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}