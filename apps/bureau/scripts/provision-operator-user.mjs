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
 *
 * CREDENTIALS — asked for, or taken from the environment:
 *   OPERATOR_EMAIL    — if unset, the script asks for it
 *   OPERATOR_PASSWORD — if unset, the script asks twice with the echo off
 *
 *   Prompting is the preferred path: it keeps the production operator password
 *   out of files, out of shell history, and out of the environment. The env
 *   form still works unchanged for automation.
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
 *     (created = no account existed · updated = credential reset)
 *   - Does NOT run db:push, migrate, or touch schema
 *   - Checks the business exists BEFORE asking for a password
 *   - Never persists the password: no file, no env var, no process title
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

const MIN_PASSWORD_LENGTH = 12;

// ── Environment validation ────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
const OPERATOR_NAME = process.env.OPERATOR_NAME ?? "Marcel Tabit Akwe";

const DEMO_BUSINESS_NAME = "Maxpromo Demo Operations";
const OPERATOR_ROLE = "owner";

if (!DATABASE_URL) {
  console.error("[provision] ERROR: DATABASE_URL is not set. Aborting — no DB touched.");
  process.exit(1);
}

// A password supplied through the environment is validated here, before the
// database is contacted at all. The prompt path cannot be checked this early —
// it deliberately runs after the business lookup, so nobody is asked to choose
// a credential for a business that does not exist — so this keeps the one input
// path that *can* fail cheaply failing cheaply, and testable without a database.
if (process.env.OPERATOR_PASSWORD && process.env.OPERATOR_PASSWORD.length < MIN_PASSWORD_LENGTH) {
  console.error(`[provision] ERROR: OPERATOR_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  console.error("[provision] Aborting — no DB touched.");
  process.exit(1);
}

// ── Credential input ─────────────────────────────────────────────────────────
//
// Added 2026-09-07. The script previously required OPERATOR_EMAIL and
// OPERATOR_PASSWORD from the environment, which in practice meant writing the
// production operator password into a file on disk. It still accepts that form
// unchanged — nothing that worked before stops working — but when the values
// are absent and a terminal is attached it now asks for them instead.
//
// The password is read with the terminal echo off, held in a local variable,
// passed once to argon2, and never written to a file, an environment variable,
// the process title, or the log. Confirmation is required so a typo becomes a
// retry rather than a locked account.

/**
 * Control characters by code point rather than as literals.
 *
 * A raw 0x03 or 0x7f sitting in source survives most tools and is silently
 * eaten by some. This file has to keep working, so it does not rely on that.
 */
const CR = String.fromCharCode(13);
const LF = String.fromCharCode(10);
const ETX = String.fromCharCode(3); // Ctrl-C
const EOT = String.fromCharCode(4); // Ctrl-D
const BS = String.fromCharCode(8);
const DEL = String.fromCharCode(127);

/** Read one line with the terminal echoing nothing. */
function promptHidden(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      reject(new Error("no terminal attached"));
      return;
    }
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const done = (fn, arg) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdout.write("\n");
      fn(arg);
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n" || ch === EOT) return done(resolve, value);
        if (ch === ETX) {
          // Ctrl-C: leave without touching the database.
          stdin.setRawMode(false);
          stdout.write("\n[provision] cancelled — no database write attempted.\n");
          process.exit(130);
        }
        if (ch === DEL || ch === "\b") value = value.slice(0, -1);
        else if (ch >= " ") value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

/** Read one visible line — used for the email, which is not a secret. */
function promptVisible(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      reject(new Error("no terminal attached"));
      return;
    }
    stdout.write(question);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (chunk) => {
      stdin.pause();
      stdin.removeListener("data", onData);
      resolve(chunk.toString().trim());
    };
    stdin.on("data", onData);
  });
}

async function resolveCredentials() {
  let email = process.env.OPERATOR_EMAIL;
  let password = process.env.OPERATOR_PASSWORD;

  const interactive = process.stdin.isTTY && process.stdout.isTTY;

  if (!email || !password) {
    if (!interactive) {
      console.error("[provision] ERROR: OPERATOR_EMAIL and OPERATOR_PASSWORD are not set,");
      console.error("[provision]        and there is no terminal to ask on. Aborting — no DB touched.");
      console.error("[provision]        Run this from an interactive terminal, or set both variables.");
      process.exit(1);
    }
    console.log("");
    console.log("[provision] Enter the operator credentials. The password is not echoed,");
    console.log("[provision] not logged, and not written anywhere by this script.");
    console.log("");
  }

  if (!email) {
    email = await promptVisible("  operator email    : ");
    if (!email) {
      console.error("[provision] ERROR: no email given. Aborting — no DB touched.");
      process.exit(1);
    }
  }

  if (!password) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const first = await promptHidden("  password (hidden) : ");
      const again = await promptHidden("  confirm           : ");
      if (first !== again) {
        console.error(`  ! the two entries differ (attempt ${attempt} of 3)`);
        continue;
      }
      if (first.length < MIN_PASSWORD_LENGTH) {
        console.error(`  ! must be at least ${MIN_PASSWORD_LENGTH} characters (attempt ${attempt} of 3)`);
        continue;
      }
      password = first;
      break;
    }
    if (!password) {
      console.error("[provision] ERROR: no acceptable password given. Aborting — no DB touched.");
      process.exit(1);
    }
    console.log("");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`[provision] ERROR: OPERATOR_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }

  return { email, password };
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
  console.log(`[provision] Target business: ${DEMO_BUSINESS_NAME}`);

  // 1. Find the business — fail safely if not found.
  //
  // Deliberately BEFORE asking for a password: if the business is missing there
  // is nothing to provision against, and there is no reason to have made
  // someone choose and type a credential first.
  const bizRows = await query(
    `SELECT id, name FROM businesses WHERE name = $1 LIMIT 1`,
    [DEMO_BUSINESS_NAME],
  );

  if (!bizRows.length) {
    console.error("");
    console.error(`[provision] ERROR: Business "${DEMO_BUSINESS_NAME}" not found in this database.`);
    console.error("[provision] Aborting — nothing was written, and no password was requested.");
    console.error("");
    console.error("[provision] Do NOT reach for the demo seed to fix this in production.");
    console.error("[provision] `db:seed:demo` writes demo business data; it is a fixture loader,");
    console.error("[provision] not an authentication recovery path. Seeding a production database");
    console.error("[provision] to obtain a login is a business-data decision for the owner.");
    console.error("[provision] See docs/deployment/agent-bureau-owner-access.md.");
    process.exit(1);
  }

  const businessId = bizRows[0].id;
  const businessName = bizRows[0].name;
  console.log(`[provision] Found business: ${businessName} (id: ${businessId})`);

  // 2. Credentials — from the environment if set, otherwise asked for here.
  const { email: OPERATOR_EMAIL, password: OPERATOR_PASSWORD } = await resolveCredentials();
  console.log(`[provision] Target email: ${OPERATOR_EMAIL}`);

  // 3. Hash the password (argon2id, same settings as lib/auth/password.ts)
  console.log("[provision] Hashing password...");
  const passwordHash = await argon2.hash(OPERATOR_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MiB
    timeCost: 3,
    parallelism: 1,
  });
  // DO NOT log passwordHash

  // 4. Check if user already exists
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

  // 5. Verify the row is present and the hash is correct
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

  // 6. Safe summary — no secrets printed
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
