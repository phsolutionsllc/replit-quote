import { defineConfig } from "drizzle-kit";

// Neon database connection string
const connectionString = 'postgresql://neondb_owner:npg_HE6ujqc7xZXC@ep-proud-block-a5sc0bmn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  }
});
