/**
 * scripts/provision-operator-user.mjs
 *
 * Auth-1C: One-off operator user provisioning script.
 *
 * PURPOSE:
 *   Creates or updates a Maxpromo operator account in the demo business.
 *   Intended for local use by Marcel during initial setup and re-provisioning.
 *   This is NOT a public signup path — it must only be run by the operator.
 *
 * USAGE:
 *   npm run auth:provision-operator
 *   (or: node --env-file=.env.local scripts/provision-operator-user.mjs)
 *
 * REQUIRED ENV:
 *   DATABASE_URL      — Neon connection string
 *   OPERATOR_EMAIL    — email for the operator account
 *   OPERATOR_PASSWORD — plaintext password (hashed here, never stored plain)
 *
 * OPTIONAL ENV:
 *   OPERATOR_NAME     — display name (default: "Marcel Tabit Akwe")
 *
 * SAFETY:
 *   - Does NOT log password or password_hash
 *   - Does NOT print secrets to stdout
 *   - Fails safely if business is not found (never creates a business)
 *   - Uses parameterized SQL only (no string interpolation into queries)
 *   - Idempotent: safe to run again to update credentials
 *   - Does NOT run db:push, migrate, or touch schema
 *
 * ROLE:
 *   Uses "owner" role — the standard provisioned account role per ADR-001.
 *   WHY "owner" not "operator": ADR-001 locked the Credentials provider to
 *   the `app_users` table which uses "owner" as the default provisioned role.
 *   Admin/operator role distinctions are deferred to Auth-6.
 */

import { neon } from "@neondatabase/serverless";

// argon2 is a CJS package — default import gives us the full module.exports
// which includes { hash, verify, argon2id, ... }
import argon2 from "argon2";

// ── Environment validation ────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
const OPERATOR_EMAIL = process.env.OPERATOR_EMAIL;
const OPERATOR_PASSWORD = process.env.OPERATOR_PASSWORD;
const OPERATOR_NAME = process.env.OPERATOR_NAME ?? "Marcel Tabit Akwe";

const DEMO_BUSINESS_NAME = "Maxpromo Demo Operations";
const OPERATOR_ROLE = "owner";

if (!DATABASE_URL) {
  console.error("[provision] ERROR: DATABASE_URL is not set. Aborting — no DB touched.");
  process.exit(1);
}
if (!OPERATOR_EMAIL) {
  console.error("[provision] ERROR: OPERATOR_EMAIL is not set. Aborting.");
  process.exit(1);
}
if (!OPERATOR_PASSWORD) {
  console.error("[provision] ERROR: OPERATOR_PASSWORD is not set. Aborting.");
  process.exit(1);
}
if (OPERATOR_PASSWORD.length < 12) {
  console.error("[provision] ERROR: OPERATOR_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

// ── DB client (same pattern as run-demo-seed.mjs) ────────────────────────────

const sql = neon(DATABASE_URL);

/**
 * Parameterized query bridge.
 * neon() is a tagged-template function. This helper converts the seed-style
 * sql.query(text, params) calls into the tagged-template form neon expects.
 */
function query(text, params = []) {
  const parts = text.split(/\$\d+/g);
  const tpl = Object.assign(parts, { raw: parts });
  return sql(tpl, ...params);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("[provision] Starting operator user provisioning...");
  console.log(`[provision] Target email: ${OPERATOR_EMAIL}`);
  console.log(`[provision] Target business: ${DEMO_BUSINESS_NAME}`);

  // 1. Find the demo business — fail safely if not found
  const bizRows = await query(
    `SELECT id, name FROM businesses WHERE name = $1 LIMIT 1`,
    [DEMO_BUSINESS_NAME],
  );

  if (!bizRows.length) {
    console.error(
      `[provision] ERROR: Business "${DEMO_BUSINESS_NAME}" not found in DB.`,
    );
    console.error("[provision] Ensure the demo seed has been run first: npm run db:seed:demo");
    process.exit(1);
  }

  const businessId = bizRows[0].id;
  const businessName = bizRows[0].name;
  console.log(`[provision] Found business: ${businessName} (id: ${businessId})`);

  // 2. Hash the password (argon2id, same settings as lib/auth/password.ts)
  console.log("[provision] Hashing password...");
  const passwordHash = await argon2.hash(OPERATOR_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MiB
    timeCost: 3,
    parallelism: 1,
  });
  // DO NOT log passwordHash

  // 3. Check if user already exists
  const existingRows = await query(
    `SELECT id, email, role FROM app_users WHERE email = $1 AND business_id = $2 LIMIT 1`,
    [OPERATOR_EMAIL.toLowerCase().trim(), businessId],
  );

  let action;
  if (existingRows.length) {
    // UPDATE existing user — refresh hash and ensure correct business + role
    const userId = existingRows[0].id;
    await query(
      `UPDATE app_users
       SET password_hash = $1,
           role = $2,
           business_id = $3
       WHERE id = $4`,
      [passwordHash, OPERATOR_ROLE, businessId, userId],
    );
    action = "updated";
  } else {
    // INSERT new user
    await query(
      `INSERT INTO app_users (business_id, email, name, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        businessId,
        OPERATOR_EMAIL.toLowerCase().trim(),
        OPERATOR_NAME,
        OPERATOR_ROLE,
        passwordHash,
      ],
    );
    action = "created";
  }

  // 4. Verify the row is present and the hash is correct
  const verifyRows = await query(
    `SELECT id, email, name, role, business_id,
            (password_hash IS NOT NULL) AS has_hash
     FROM app_users
     WHERE email = $1 AND business_id = $2 LIMIT 1`,
    [OPERATOR_EMAIL.toLowerCase().trim(), businessId],
  );

  if (!verifyRows.length || !verifyRows[0].has_hash) {
    console.error("[provision] ERROR: Post-write verification failed. Row not found or hash missing.");
    process.exit(1);
  }

  // 5. Safe summary — no secrets printed
  console.log("");
  console.log("[provision] ✓ Operator user provisioned successfully");
  console.log("─────────────────────────────────────────────");
  console.log(`  provisioned : true`);
  console.log(`  action      : ${action}`);
  console.log(`  email       : ${verifyRows[0].email}`);
  console.log(`  name        : ${verifyRows[0].name}`);
  console.log(`  role        : ${verifyRows[0].role}`);
  console.log(`  business    : ${businessName}`);
  console.log(`  business_id : ${verifyRows[0].business_id}`);
  console.log("─────────────────────────────────────────────");
  console.log("[provision] You may now log in at /login with the provisioned credentials.");
}

main().catch((err) => {
  console.error("[provision] FATAL:", err.message ?? err);
  process.exit(1);
});
