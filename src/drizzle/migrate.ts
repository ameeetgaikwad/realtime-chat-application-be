import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config();
// for migrations
const migrationClient = postgres(
    "postgresql://neondb_owner:7ergEI8UslYO@ep-blue-wind-a5tyq4ze.us-east-2.aws.neon.tech/neondb?sslmode=require",
  { max: 1 }
);

async function main() {
  await migrate(drizzle(migrationClient), {
    migrationsFolder: "./src/drizzle/migrations",
  });

  await migrationClient.end();
}

main();
