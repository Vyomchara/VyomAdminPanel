import {text, pgTable, serial, uuid, integer, timestamp} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema, CreateUpdateSchema} from "drizzle-zod"
import {z} from "zod"
//import {v4 as uuid} from "uuid"

export const Client = pgTable("client", {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    address: text('address').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    vm_ip: text('vm_ip'), // Keep vm_ip
    // Remove vm_password field
})

export const Drone = pgTable("drone",{
    id: serial('id').primaryKey(),
    name: text('name').notNull()
})

export const Payload = pgTable("payload",{
    id: serial('id').primaryKey(),
    name: text('name').notNull()
})

export const ClientDroneAssignment = pgTable("client_drone_assignment",{
    id: uuid('id').defaultRandom().primaryKey(),
    quantity: integer('quantity').$default(()=>1),
    droneId: serial('drone_id').references(()=>Drone.id),
    clientId: uuid('client_id').references(()=>Client.id)
})

export const DronePayloadAssignment = pgTable("drone_payload_assignment",{
    id: uuid('id').defaultRandom().primaryKey(),
    assignmentId: uuid('assignment_id').references(()=>ClientDroneAssignment.id),
    payloadId: integer('payload_id').references(()=>Payload.id)
})


export const clientCreateSchema = createInsertSchema(Client,{
    name: z.string().nonempty(),
    email: z.string().nonempty().email(),
    address: z.string().nonempty().max(200),
    vm_ip: z.string().ip({version:"v4"}).optional(), // Keep vm_ip validation
    // Remove vm_password validation
})
export const clientUpdateSchema = createUpdateSchema(Client)
export const clientSelectSchema = createSelectSchema(Client)
export const payloadAssignmentSelectSchema = createSelectSchema(DronePayloadAssignment) 
export const payloadAssignmentInsertSchema = createInsertSchema(DronePayloadAssignment) 
export const payloadAssignmentUpdateSchema = createUpdateSchema(DronePayloadAssignment) 
export const droneAssignmentSelectSchema = createSelectSchema(ClientDroneAssignment) 
export const droneAssignmentUpdateSchema = createUpdateSchema(ClientDroneAssignment) 
export const droneAssignmentInsertSchema = createInsertSchema(ClientDroneAssignment) 

export type clientCreate = z.infer<typeof clientCreateSchema>
export type clientUpdate = z.infer<typeof clientUpdateSchema>
export type clientSelect = z.infer<typeof clientSelectSchema>
export type droneAssignmentSelect = z.infer<typeof droneAssignmentSelectSchema>
export type droneAssignmentUpdate = z.infer<typeof droneAssignmentInsertSchema>
export type droneAssignmentInsert = z.infer<typeof droneAssignmentUpdateSchema>
export type payloadAssignmentSelect = z.infer<typeof payloadAssignmentSelectSchema>
export type payloadAssignmentUpdate = z.infer<typeof payloadAssignmentUpdateSchema>
export type payloadAssignmentInsert = z.infer<typeof payloadAssignmentInsertSchema>

export type DroneSelect = typeof Drone.$inferSelect;
export type PayloadSelect = typeof Payload.$inferSelect;
export type ClientDroneAssignmentSelect = typeof ClientDroneAssignment.$inferSelect;
