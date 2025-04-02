import postgres from "postgres"
import { DATABASE_URL } from "../app_config"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from './schema'

const client = postgres(DATABASE_URL)
export const db = drizzle(client, { schema })

