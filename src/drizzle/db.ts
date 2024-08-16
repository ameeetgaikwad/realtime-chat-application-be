import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import dotenv from "dotenv";
dotenv.config();
import postgres from "postgres";

const client = postgres(
    process.env.DATABASE_URL as string,
  { max: 1 }
);
export const db = drizzle(client, { schema, logger: false });
