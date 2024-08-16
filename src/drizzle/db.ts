import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import dotenv from "dotenv";
dotenv.config();
import postgres from "postgres";

const client = postgres(
    "postgresql://neondb_owner:7ergEI8UslYO@ep-blue-wind-a5tyq4ze.us-east-2.aws.neon.tech/neondb?sslmode=require",
  { max: 1 }
);
export const db = drizzle(client, { schema, logger: false });
