"use client";

import { useState } from "react";
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
import { CircleAlertIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

export function DroneTable({ assignments }: { assignments: any[] }) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [data, setData] = useState<any[]>(assignments);
  
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
              <TableHead>Drone ID</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No drones assigned
                </TableCell>
              </TableRow>
            ) : (
              data.map((drone, index) => (
                <TableRow key={drone.id || `no-id-${index}`}>
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
      </div>
    </div>
  );
}