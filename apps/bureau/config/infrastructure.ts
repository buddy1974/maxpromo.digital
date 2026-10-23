// Where the Agent Bureau's data actually lives — the ONE place public and legal
// text reads it from, so a claim can never drift from the deployment again
// (the "in der EU gehostet" claim stood for months over a US database).
//
// CHANGE ONLY TOGETHER WITH THE INFRASTRUCTURE. When the database moves
// (apps/bureau/scripts/migrate-to-eu.mjs, runbook in
// docs/architecture/control-plane-reconciliation.md), set `databaseRegion` to
// "eu-central-1" in the same release that switches DATABASE_URL.

export const BUREAU_INFRASTRUCTURE = {
  /** Neon region of the Bureau database. us-east-1 until the EU migration runs. */
  databaseRegion: "us-east-1" as "us-east-1" | "eu-central-1",
  /** Vercel function region (apps/bureau/vercel.json). */
  functionRegion: "fra1" as const,
} as const;

export const REGION_LABEL_DE: Record<string, string> = {
  "us-east-1": "USA (AWS us-east-1, Virginia)",
  "eu-central-1": "EU (AWS eu-central-1, Frankfurt)",
  fra1: "EU (Frankfurt)",
};
