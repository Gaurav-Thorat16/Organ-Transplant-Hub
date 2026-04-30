import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../server/db";

async function main() {
  await migrate(db, { migrationsFolder: "./migrations" });
  console.log("Migrations completed");
}

main()
  .catch((err) => {
    console.error("Migration failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
