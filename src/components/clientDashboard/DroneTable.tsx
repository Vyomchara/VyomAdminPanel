"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import React from "react";
import { createDroneAssignment } from "@/app/action"; // Added createDroneAssignment import

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    selected?: boolean, 
    disabled?: boolean, 
    value?: string,
    onSelect?: (value: string) => void 
  }
>(({ className, selected, disabled, value, onSelect, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none",
      selected && "bg-accent text-accent-foreground",
      disabled && "pointer-events-none opacity-50",
      className
    )}
    data-selected={selected || undefined}
    data-disabled={disabled || undefined}
    onClick={() => onSelect && value && onSelect(value)}
    {...props}
  />
));

export function DroneTable({ 
  assignments, 
  clientId,
  droneLogoSrc = "/drone.svg",
  availableDrones = [],
  availablePayloads = [],
  loadingOptions = false,
  onAssignmentComplete
}: { 
  assignments: any[],
  clientId: string,
  droneLogoSrc?: string,
  availableDrones?: any[],
  availablePayloads?: any[],
  loadingOptions?: boolean,
  onAssignmentComplete?: () => void
}) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [data, setData] = useState<any[]>(assignments);
  const [open, setOpen] = useState(false);
  
  const [selectedDrone, setSelectedDrone] = useState<any>(null);
  const [selectedPayloads, setSelectedPayloads] = useState<any[]>([]);
  const [droneQuantity, setDroneQuantity] = useState(1);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [tableData, setTableData] = useState<any[]>([]);

  useEffect(() => {
    console.log("DroneTable received assignments:", assignments);
    setTableData(assignments || []);
  }, [assignments]);

  const toggleRowSelection = (droneId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(droneId)) {
      newSelected.delete(droneId);
    } else {
      newSelected.add(droneId);
    }
    setSelectedRows(newSelected);
  };
  
  const toggleAllSelection = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(drone => drone.id || `no-id-${Math.random()}`)));
    }
  };
  
  const handleDeleteDrones = () => {
    const updatedData = data.filter(drone => !selectedRows.has(drone.id || `no-id-${Math.random()}`));
    setData(updatedData);
    setSelectedRows(new Set());
    
    toast.success(`${selectedRows.size} drone${selectedRows.size > 1 ? 's' : ''} unassigned successfully`);
  };

  const handleAssignDrone = async () => {
    if (!selectedDrone) {
      toast.error("Please select a drone model");
      return;
    }
    
    setIsAssigning(true);
    try {
      const assignmentResult = await createDroneAssignment(
        clientId,
        selectedDrone.id,
        droneQuantity
      );

      if (!assignmentResult.success) {
        throw new Error(assignmentResult.error || "Failed to create drone assignment");
      }

      const { assignment } = assignmentResult;

      setTimeout(() => {
        toast.success("Drone assigned successfully");
        setIsAssigning(false);
        if (onAssignmentComplete) {
          onAssignmentComplete();
        }
      }, 1000);
    } catch (error) {
      toast.error("Failed to assign drone");
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-4">
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

      <div className="rounded-md border">
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
              <TableHead>Drone Model</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Payloads</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.length === 0 ? (
              <TableRow key="empty-row">
                <TableCell colSpan={6} className="h-24 text-center">
                  No drones assigned
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((assignment, index) => (
                <TableRow key={assignment.id || `assignment-row-${index}`}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedRows.has(assignment.id)}
                      onCheckedChange={() => toggleRowSelection(assignment.id)}
                      aria-label={`Select assignment ${index + 1}`}
                    />
                  </TableCell>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {assignment.drone?.name || "Unknown Drone"}
                  </TableCell>
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
                  <TableCell className="text-right">
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