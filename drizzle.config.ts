import {Config} from "drizzle-kit"
import { DATABASE_URL } from "@/app_config";

export default {
    dialect: "postgresql",
    schema: "./src/drizzle/schema.ts",
    out: "./src/drizzle/migrations",
    dbCredentials: {
        url: DATABASE_URL
    },
    verbose: true,
    strict: true,
} as Config;
