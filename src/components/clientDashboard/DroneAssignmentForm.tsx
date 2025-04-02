"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
import { createDroneAssignment, assignPayloadsToDrone } from "@/app/action";

interface DroneAssignmentFormProps {
  clientId: string;
  availableDrones: any[];
  availablePayloads: any[];
  loadingOptions?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function DroneAssignmentForm({
  clientId,
  availableDrones,
  availablePayloads,
  loadingOptions = false,
  onComplete,
  className
}: DroneAssignmentFormProps) {
  const [selectedDrone, setSelectedDrone] = useState<any>(null);
  const [selectedPayloads, setSelectedPayloads] = useState<any[]>([]);
  const [droneQuantity, setDroneQuantity] = useState(1);
  const [isAssigning, setIsAssigning] = useState(false);
  const [open, setOpen] = useState(false);
  const [payloadOpen, setPayloadOpen] = useState(false);
  
  const handleAssignDrone = async () => {
    if (!selectedDrone) {
      toast.error("Please select a drone model");
      return;
    }
    
    if (!clientId) {
      toast.error("Client ID is missing. Please reload the page.");
      return;
    }
    
    setIsAssigning(true);
    
    try {
      // Create the drone assignment
      const assignmentResult = await createDroneAssignment(
        clientId,
        selectedDrone.id,
        droneQuantity
      );

      if (!assignmentResult.success) {
        throw new Error(assignmentResult.error || "Failed to create drone assignment");
      }

      const { assignment } = assignmentResult;

      // If payloads are selected, assign them
      if (selectedPayloads.length > 0) {
        if (!assignment || !assignment.id) {
          throw new Error("Assignment data is invalid or missing");
        }
        
        const payloadIds = selectedPayloads.map(p => p.id);
        
        const payloadResult = await assignPayloadsToDrone(
          assignment.id,
          payloadIds
        );
        
        if (!payloadResult.success) {
          throw new Error(payloadResult.error || "Failed to assign payloads");
        }
      }
      
      toast.success(`Successfully assigned ${droneQuantity} ${selectedDrone.name} drone(s)`);
      
      // Reset form
      setSelectedDrone(null);
      setSelectedPayloads([]);
      setDroneQuantity(1);

      // Call completion callback
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error("Drone assignment error:", error);
      toast.error(`Failed to assign drone: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="drone-model">Drone Model</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="drone-model"
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
              {/* <CommandEmpty>No drone model found.</CommandEmpty> */}
              <CommandGroup>
                {availableDrones.length === 0 && loadingOptions ? (
                  <div className="p-2 text-center">
                    <Loader2 className="h-4 w-4 mx-auto animate-spin mb-2" />
                    Loading drone models...
                  </div>
                ) : (
                  availableDrones.map((drone) => (
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
                  ))
                )}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input 
          id="quantity"
          type="number" 
          min="1"
          max="100" 
          value={droneQuantity} 
          onChange={(e) => setDroneQuantity(parseInt(e.target.value) || 1)} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="payloads">Payloads (Optional)</Label>
        <Popover open={payloadOpen} onOpenChange={setPayloadOpen}>
          <PopoverTrigger asChild>
            <Button
              id="payloads"
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
              {/* <CommandEmpty>No payload found.</CommandEmpty> */}
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
        className="w-full mt-2"
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
  );
}