import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/db-schema";

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

export const pool = hasDatabaseUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  : (undefined as unknown as Pool);

export const db = hasDatabaseUrl
  ? drizzle(pool, { schema })
  : (undefined as unknown as ReturnType<typeof drizzle>);
