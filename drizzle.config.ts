import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/postgres";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/db-schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
