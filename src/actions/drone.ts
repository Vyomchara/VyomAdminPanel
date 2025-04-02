"use server"

import { db } from "@/drizzle/db"
import { ClientDroneAssignment, Drone, Payload, DronePayloadAssignment, Client } from "@/drizzle/schema"
import { eq, inArray } from "drizzle-orm"

export async function getDroneAssignments(clientId: string) {
  try {
    const assignments = await db
      .select({
        id: ClientDroneAssignment.id,
        quantity: ClientDroneAssignment.quantity,
        drone: {
          id: Drone.id,
          name: Drone.name,
        },
      })
      .from(ClientDroneAssignment)
      .leftJoin(Drone, eq(ClientDroneAssignment.droneId, Drone.id))
      .where(eq(ClientDroneAssignment.clientId, clientId));

    // Get payloads in a separate query to avoid the relation issue
    const payloads = await db
      .select({
        assignmentId: DronePayloadAssignment.assignmentId,
        payload: {
          id: Payload.id,
          name: Payload.name,
        },
      })
      .from(DronePayloadAssignment)
      .leftJoin(Payload, eq(DronePayloadAssignment.payloadId, Payload.id))
      .where(
        inArray(
          DronePayloadAssignment.assignmentId,
          assignments.map((a) => a.id)
        )
      );

    // Combine the results
    return assignments.map((assignment) => ({
      droneAssignment: assignment,
      drone: assignment.drone,
      payloads: payloads
        .filter((p) => p.assignmentId === assignment.id)
        .map((p) => p.payload),
    }));
  } catch (err: any) {
    console.error('Error fetching drone assignments:', err);
    return [];
  }
}

export async function getAvailableDrones() {
  'use server';
  
  try {
    const drones = await db.select().from(Drone);
    return { success: true, drones };
  } catch (error) {
    console.error('Error fetching available drones:', error);
    return { success: false, error: String(error), drones: [] };
  }
}

export async function getAvailablePayloads() {
  'use server';
  
  try {
    const payloads = await db.select().from(Payload);
    return { success: true, payloads };
  } catch (error) {
    console.error('Error fetching available payloads:', error);
    return { success: false, error: String(error), payloads: [] };
  }
}

export async function createDroneAssignment(clientId: string, droneId: number, quantity: number) {
  'use server';
  
  try {
    const [assignment] = await db.insert(ClientDroneAssignment)
      .values({
        clientId,
        droneId,
        quantity
      })
      .returning();
    
    return { success: true, assignment };
  } catch (error) {
    console.error('Error creating drone assignment:', error);
    return { success: false, error: String(error) };
  }
}

export async function assignPayloadsToDrone(assignmentId: string, payloadIds: number[]) {
  'use server';
  
  try {
    if (!payloadIds.length) {
      return { success: true, assignments: [] };
    }
    
    const values = payloadIds.map(payloadId => ({
      assignmentId,
      payloadId
    }));
    
    const assignments = await db.insert(DronePayloadAssignment)
      .values(values)
      .returning();
    
    return { success: true, assignments };
  } catch (error) {
    console.error('Error assigning payloads:', error);
    return { success: false, error: String(error) };
  }
}

export async function getClientDroneAssignments(clientId: string) {
  'use server';
  
  console.log("Server function: getClientDroneAssignments for client", clientId);
  
  try {
    // Check if clientId is valid
    if (!clientId) {
      console.error("Missing client ID in getClientDroneAssignments");
      return { 
        success: false, 
        error: "Missing client ID",
        assignments: [] 
      };
    }

    // First check if client exists
    const clientCheck = await db.select().from(Client).where(eq(Client.id, clientId));
    
    if (clientCheck.length === 0) {
      console.error(`Client with ID ${clientId} not found`);
      return { 
        success: false, 
        error: `Client with ID ${clientId} not found`,
        assignments: [] 
      };
    }
    
    // Get assignments
    const assignments = await db.select().from(ClientDroneAssignment)
      .where(eq(ClientDroneAssignment.clientId, clientId));
    
    console.log(`Found ${assignments.length} drone assignments for client ${clientId}`);
    
    // Add more details to each assignment
    const enrichedAssignments = await Promise.all(assignments.map(async (assignment) => {
      // Get drone details
      const [drone] = await db.select()
        .from(Drone)
        .where(eq(Drone.id, assignment.droneId));
      
      // Get payload assignments
      const payloadAssignments = await db.select()
        .from(DronePayloadAssignment)
        .where(eq(DronePayloadAssignment.assignmentId, assignment.id));
      
      // Get payload details
      const payloads = await Promise.all(payloadAssignments.map(async (pa) => {
        if (!pa.payloadId) return null;
        const [payload] = await db.select()
          .from(Payload)
          .where(eq(Payload.id, pa.payloadId));
        return payload;
      }));
      
      // Filter out null payloads
      const validPayloads = payloads.filter(p => p !== null);
      
      return {
        ...assignment,
        drone,
        payloads: validPayloads
      };
    }));
    
    console.log("Enriched assignments:", enrichedAssignments);
    
    return { 
      success: true, 
      assignments: enrichedAssignments 
    };
  } catch (error) {
    console.error('Error in getClientDroneAssignments:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      assignments: [] 
    };
  }
}

export async function deleteDroneAssignment(assignmentId: string) {
  'use server';
  
  try {
    console.log(`Deleting drone assignment with ID: ${assignmentId}`);
    
    // First delete all payload assignments related to this drone assignment
    await db.delete(DronePayloadAssignment)
      .where(eq(DronePayloadAssignment.assignmentId, assignmentId));
    
    // Then delete the drone assignment itself
    await db.delete(ClientDroneAssignment)
      .where(eq(ClientDroneAssignment.id, assignmentId));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting drone assignment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function updateDroneAssignment(
  assignmentId: string, 
  quantity: number, 
  payloadIds: number[]
) {
  'use server';
  
  try {
    console.log(`Updating drone assignment ID: ${assignmentId}`);
    console.log(`New quantity: ${quantity}, New payload IDs: ${payloadIds.join(', ')}`);
    
    // Update the drone assignment quantity
    await db.update(ClientDroneAssignment)
      .set({ quantity })
      .where(eq(ClientDroneAssignment.id, assignmentId));
    
    // First delete all existing payload assignments
    await db.delete(DronePayloadAssignment)
      .where(eq(DronePayloadAssignment.assignmentId, assignmentId));
    
    // Then add the new payload assignments
    if (payloadIds.length > 0) {
      const values = payloadIds.map(payloadId => ({
        assignmentId,
        payloadId
      }));
      
      await db.insert(DronePayloadAssignment)
        .values(values);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating drone assignment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}