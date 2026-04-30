import { sql } from "drizzle-orm";
import { db, pool } from "../server/db";

async function main() {
  await db.execute(sql`TRUNCATE TABLE transplant_requests, organ_availability, hospitals, users CASCADE`);

  const { storage } = await import("../server/storage");
  const stats = await storage.getStats();

  console.log("Database reseeded");
  console.log(`Hospitals: ${stats.totalHospitals}`);
  console.log(`Available organs: ${stats.totalAvailableOrgans}`);
}

main()
  .catch((err) => {
    console.error("Reseed failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
