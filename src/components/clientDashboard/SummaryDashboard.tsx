"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown, X, MapPin, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  getAvailableDrones, 
  getAvailablePayloads, 
  createDroneAssignment, 
  assignPayloadsToDrone 
} from "@/app/action";
import { DroneTable } from "./DroneTable";

export function SummaryDashboard({ 
  client, 
  droneAssignments, 
  onAssignmentChange 
}: { 
  client: any, 
  droneAssignments: any,
  onAssignmentChange?: () => void
}) {
  const [availableDrones, setAvailableDrones] = useState<any[]>([]);
  const [availablePayloads, setAvailablePayloads] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState<any>(null);
  const [selectedPayloads, setSelectedPayloads] = useState<any[]>([]);
  const [droneQuantity, setDroneQuantity] = useState(1);
  const [isAssigning, setIsAssigning] = useState(false);
  const [open, setOpen] = useState(false);
  const [payloadOpen, setPayloadOpen] = useState(false);
  
  const droneLogoSrc = "/drone.svg";
  
  useEffect(() => {
    async function fetchOptions() {
      setLoadingOptions(true);
      try {
        const dronesResult = await getAvailableDrones();
        if (dronesResult.success) {
          setAvailableDrones(dronesResult.drones);
        } else {
          toast.error("Failed to load drone options");
        }
        
        const payloadsResult = await getAvailablePayloads();
        if (payloadsResult.success) {
          setAvailablePayloads(payloadsResult.payloads);
        } else {
          toast.error("Failed to load payload options");
        }
      } catch (error) {
        toast.error("Error loading options");
        console.error(error);
      } finally {
        setLoadingOptions(false);
      }
    }
    
    fetchOptions();
  }, []);
  
  const handleAssignDrone = async (e) => {
    e.preventDefault(); // Prevent form submission
    
    if (!selectedDrone) {
      toast.error("Please select a drone model");
      return;
    }
    
    if (!client?.id) {
      toast.error("Client information is missing");
      return;
    }
    
    setIsAssigning(true);
    
    try {
      // First create the drone assignment
      const assignmentResult = await createDroneAssignment(
        client.id,
        selectedDrone.id,
        droneQuantity
      );

      if (!assignmentResult.success) {
        throw new Error(assignmentResult.error);
      }

      if (!assignmentResult.assignment) {
        throw new Error("Assignment data is missing from successful response");
      }

      const { assignment } = assignmentResult;

      if (selectedPayloads.length > 0) {
        const payloadIds = selectedPayloads.map(p => p.id);
        
        const payloadResult = await assignPayloadsToDrone(
          assignment.id,
          payloadIds
        );
        
        if (!payloadResult.success) {
          throw new Error(payloadResult.error);
        }
      }
      
      toast.success(`Successfully assigned ${droneQuantity} ${selectedDrone.name} drone(s) to ${client.name}`);
      
      setSelectedDrone(null);
      setSelectedPayloads([]);
      setDroneQuantity(1);

      if (onAssignmentChange) {
        onAssignmentChange();
      }
    } catch (error: any) {
      toast.error(`Failed to assign drone: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div>
      {!droneAssignments || droneAssignments.length === 0 ? (
        <div className="bg-background rounded-lg shadow-sm p-8">
          <div className="max-w-2xl mx-auto flex flex-col items-center">
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
            
            <div className="w-full max-w-xl space-y-4 border rounded-md p-6 mb-4">
              <h4 className="font-medium text-lg">Assign New Drone</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Drone Model</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                        disabled={loadingOptions}
                      >
                        {loadingOptions ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </div>
                        ) : selectedDrone ? (
                          selectedDrone.name
                        ) : (
                          "Select drone model..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search drone models..." />
                        <CommandList>
                          <CommandEmpty>No drone model found.</CommandEmpty>
                          <CommandGroup>
                            {availableDrones.map((drone) => (
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
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input 
                    type="number" 
                    min="1"
                    max="100" 
                    value={droneQuantity} 
                    onChange={(e) => setDroneQuantity(parseInt(e.target.value) || 1)} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Payloads (Optional)</Label>
                <Popover open={payloadOpen} onOpenChange={setPayloadOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={loadingOptions}
                    >
                      {loadingOptions ? (
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
                      <CommandList>
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
                      </CommandList>
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
                onClick={handleAssignDrone}
                disabled={isAssigning || !selectedDrone}
                type="button"
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
      ) : (
        <DroneTable assignments={droneAssignments} />
      )}
    </div>
  );
}