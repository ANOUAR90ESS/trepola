import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: dbUrl
    ? {
        url: dbUrl,
        ssl: dbUrl.includes("supabase") ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.SQL_HOST || "localhost",
        user: process.env.SQL_ADMIN_USER || process.env.SQL_USER || "postgres",
        password: process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || "",
        database: process.env.SQL_DB_NAME || "postgres",
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT) : 5432,
        ssl: false,
      },
  verbose: true,
});
