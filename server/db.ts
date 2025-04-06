import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

// Check if required environment variables are set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL);

// Initialize Drizzle with the database connection
export const db = drizzle(sql, { schema });
