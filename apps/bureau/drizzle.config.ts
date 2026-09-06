import type { Config } from "drizzle-kit";

// Drizzle Kit config — schema lives under lib/db/schema, migrations under lib/db/migrations.
// DATABASE_URL points at Neon (EU region — see README / DSGVO note in PLAN.md).
export default {
  schema: "./lib/db/schema/index.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
