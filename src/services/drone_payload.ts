import {
    Drone,
    DronePayloadAssignment,
    ClientDroneAssignment,
    Client,
    droneAssignmentSelect,
    payloadAssignmentSelect,
    droneAssignmentInsert,
    droneAssignmentSelectSchema
}
from "@/drizzle/schema"
import { db } from "@/drizzle/db"
import { eq } from "drizzle-orm"

export async function getDronesByClientId(id:string) {
    try {
        const drones = await db.select({
            assignmentId: ClientDroneAssignment.id,
            clientId: ClientDroneAssignment.clientId,
            droneId: Drone.id,
            droneName: Drone.name,
            PayloadId: DronePayloadAssignment.payloadId
        })
        .from(ClientDroneAssignment)
        .leftJoin(Drone,eq(ClientDroneAssignment.droneId,Drone.id))
        .leftJoin(DronePayloadAssignment,eq(DronePayloadAssignment.assignmentId,ClientDroneAssignment.clientId))
        .where(eq(ClientDroneAssignment.clientId,id))
        return drones
    } catch (error:any) {
        throw new Error(`Unable to fetch drones from Client id: ${id}, due to ${error}`)
    }
}

export async function getClientsByDroneId(id:number){
    try {
        const clients = await db.select({
            clientId:Client.id,
            clientName: Client.name,
            clientAddress: Client.address,
            clientVmIp: Client.vm_ip
        })
        .from(ClientDroneAssignment)
        .leftJoin(Client,eq(ClientDroneAssignment.clientId,Client.id))
        .where(eq(ClientDroneAssignment.droneId,id))

        return clients
    } catch (error:any) {
        throw new Error(`Unable to get Clients using Drone with id: ${id}, due to ${error}`)
    }
}

export async function getClientsByPayloadId(id:number) {
    try {
        const clients = await db.select({
            clientId: Client.id,
            clientName: Client.name,
            clientAddress: Client.address,
        })
        .from(DronePayloadAssignment)
        .leftJoin(Client,eq(ClientDroneAssignment.clientId,Client.id))
        .leftJoin(DronePayloadAssignment,eq(DronePayloadAssignment.assignmentId,ClientDroneAssignment.id))
        .where(eq(DronePayloadAssignment.payloadId,id))

        return clients
    } catch (err:any) {
        throw new Error(`Unable to get Clients using payload with id: ${id}, due to ${err}`)
    }
}

export async function updateDroneAssignment(quantity:number,assignment_id:string) {
    try {
        var [updatedAssignment]: droneAssignmentSelect[] =[]
        if (quantity==0) {
            await deleteDroneAssignment(assignment_id)
        }else if(quantity <0){
            throw new Error(`Quantity less than zero, got ${quantity}`)
        }else{
            [updatedAssignment] = await db.update(ClientDroneAssignment).set({quantity:quantity}).returning()
        }
        return updatedAssignment
    } catch (err:any) {
        throw new Error(`Unable to update DroneAssignment, due to ${err}`)
    }
}

export async function deleteDroneAssignment(assignmentId:string):Promise<void>{
    try {
        await db.transaction(async(tx)=>{
            await tx.delete(DronePayloadAssignment).where(eq(DronePayloadAssignment.assignmentId,assignmentId))
            await tx.delete(ClientDroneAssignment).where(eq(ClientDroneAssignment.id,assignmentId))
        })
    } catch (err:any) {
        throw new Error(`Unable to delete Assignment with id :${assignmentId}`)
    }
}
//this method is used to remove a payload from the assignment and not the whole assignment just using payload id
//as we have one to many relation between assignment and payloads, so to remove a payload from an assignment we can simply delete the assignment
export async function deletePayloadFromAssignment(payload_id:number):Promise<void> {
    try {
        await db.delete(DronePayloadAssignment).where(eq(DronePayloadAssignment.payloadId,payload_id))
    } catch (err:any) {
        throw new Error(`Unable to delete Assignemnt`)
    }
}

export async function addPayloadToAssignment(assignment_id:string,payload_id:number):Promise<payloadAssignmentSelect> {
    try {
        const [newPayloadAssignment]: payloadAssignmentSelect[] = await db.insert(DronePayloadAssignment).values({payloadId:payload_id,assignmentId:assignment_id}).returning()
        if (!newPayloadAssignment){
            throw new Error(`Unable to add payload with id :${payload_id} to assignment with id: ${assignment_id}`)
        }
        return newPayloadAssignment
    } catch (err:any) {
        throw new Error(`Unable to add payload to assignment due to , ${err}`)
    }
}

export async function createDroneAssignment(data:droneAssignmentInsert):Promise<droneAssignmentSelect> {
    try {
        const [newDroneAssignment] : droneAssignmentSelect[]= await db.insert(ClientDroneAssignment).values({...data}).returning()
        if (!newDroneAssignment){
            throw new Error (`Unable to create new Drone Assignment`)
        }
        return newDroneAssignment
    } catch (err:any) {
        throw new Error(`${err}`)
    }
}