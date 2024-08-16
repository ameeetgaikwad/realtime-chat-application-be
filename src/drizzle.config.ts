import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config();
export default defineConfig({
  schema: "./src/drizzle/schema.ts",
  out: "./src/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://neondb_owner:7ergEI8UslYO@ep-blue-wind-a5tyq4ze.us-east-2.aws.neon.tech/neondb?sslmode=require",
  },
  verbose: true,
  strict: true,
});
