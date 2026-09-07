# Agent Bureau — owner and operator access

**Status:** Current operating procedure.
**Applies to:** `agents.maxpromo.digital` (`apps/bureau`).
**Written:** 2026-09-07, after the platform owner had no way to sign in and the
only existing procedure was buried in `history/`.

This document contains no secrets and never will. Nothing here asks anyone to
send a password to anybody.

---

## How authentication works

| | |
|---|---|
| Library | NextAuth v4 (Auth.js) |
| Provider | **Credentials only** — email + password |
| Hashing | argon2id, 64 MiB memory cost, time cost 3 |
| Sessions | JWT, 8 hours, no database adapter |
| Accounts | `app_users`, scoped to a `business_id` |
| Rate limit | 10 login attempts per 15 minutes, keyed by email |

The session token carries `userId`, `businessId` and `role`, so tenant context
is available without a database round-trip.

**There is no public signup, and that is deliberate.** `auth.ts` states it:
accounts are provisioned by Maxpromo during client onboarding. It keeps tenant
boundaries auditable.

---

## What does not exist

Read this before looking for it:

- **No signup page.**
- **No password reset.**
- **No forgot-password link** on `/login`.
- **No invitation flow.**
- **No admin UI for creating users.**

A wrong password and an account that does not exist fail identically, on
purpose — nothing on the outside reveals whether an email is registered.

**So there is exactly one way in, and it is the procedure below.** Losing the
credential is recoverable; it is not, however, recoverable *from the browser*.

---

## The procedure

Provisioning runs from a developer machine against the production database. The
trust boundary is deliberate: whoever holds the production database URL can
establish an operator account, and nobody else can.

### What it does

`apps/bureau/scripts/provision-operator-user.mjs` — `npm run auth:provision-operator`

- Asks for the database connection string if it is not in the environment,
  with the terminal echo off.
- Finds the business record. **Never creates one.**
- Asks for an email, then a password twice, with the terminal echo off.
- Hashes the password with argon2id.
- Inserts the operator row, or updates the existing one.
- Prints a summary with **no secret in it**.

It is idempotent, and the word it prints tells you which case you were in:

| Printed | Meaning |
|---|---|
| `action : created` | No account existed for that email. One now does. |
| `action : updated` | An account existed. Its password has been reset to what you just typed. |

**`updated` is the password reset.** There is no other one.

### Rules the script enforces

- **Minimum 12 characters.** Refused below that, from the prompt or the
  environment.
- **Typed twice.** A mismatch is a retry, not a locked account — three attempts.
- **Never persisted.** The password is held in a local variable, passed once to
  argon2, and written to no file, no environment variable, no process title and
  no log. Neither the password nor the hash is ever printed.
- **The business is checked first.** If it is missing, the script stops *before*
  asking for a credential.
- **Parameterised SQL only**, and it never runs `db:push`, a migration, or any
  schema change.

### Where the connection string comes from — read this first

**Not from Vercel.** All five Agent Bureau environment variables are stored
there as **sensitive**, which means write-only: Vercel never returns the value
to the CLI, to the API, or to the project owner. There is no flag and no
permission that changes this. It is a deliberate Vercel security property and
the right setting for these variables.

The consequence is a trap, and it caught us on 2026-09-07:

```
$ npx vercel env pull --environment=production .env.local
Downloading `production` Environment Variables …
+ DATABASE_URL
+ AUTH_SECRET
Updated .env.local file
```

That output is a success message. The file it wrote contains
`DATABASE_URL=""` — every key present, every value empty. Nothing warns you.

**The connection string's source of truth is Neon**, which is where the
database actually lives. Get it from the Neon console: your project →
**Connection string** → the pooled string.

### Steps

From `apps/bureau`:

```bash
npm run auth:provision-operator
```

That is the whole command. It asks, in order, and echoes none of the secrets:

1. **database url** — paste the pooled Neon connection string
2. **operator email**
3. **password**, then **confirm**

It must run in a real terminal, because it needs a keyboard. In a
non-interactive context it refuses rather than hanging.

**You do not need `vercel env pull` for this, and it will not help.** If you
already have an `.env.local` with empty values from an earlier attempt, the
script recognises that exact case and says so rather than repeating
"DATABASE_URL is not set".

The environment form (`DATABASE_URL`, `OPERATOR_EMAIL`, `OPERATOR_PASSWORD`)
still works for automation, but prompting is preferred: it keeps production
secrets out of files, out of shell history, and out of the environment.

### Delete a pulled `.env.local` — it breaks the local build

If you already pulled one, remove it. This is not tidiness; an env file whose
values are all empty **stops `npm run verify` from passing**:

```
Error occurred prerendering page "/_not-found"
TypeError: Invalid URL
    at module evaluation (components/auth/Providers.tsx)
  { code: 'ERR_INVALID_URL', input: '' }
```

`next-auth/react` builds its base URL from `NEXTAUTH_URL` or `VERCEL_URL`. A
variable that is *absent* falls back correctly; one that is *present and empty*
is used, and `new URL("")` throws. The pulled file sets `VERCEL_URL=""`, so the
bureau build fails at prerender — with an error naming neither the file nor the
variable.

```bash
rm .env.local
```

Verified 2026-09-07: the build fails with the file present and passes without
it, on identical source.

---

## If the business record is missing

The script stops with `Business "Maxpromo Demo Operations" not found`.

**Do not run `db:seed:demo` to get past this.**

`db:seed:demo` is a fixture loader. It writes demo agents, proposals, audit
findings, documents and activity into whatever database it is pointed at.
Running it against production to obtain a login would mean inventing business
records in order to authenticate — a data decision disguised as a recovery step,
and one that puts fabricated content into a live tenant.

If the business record is genuinely absent from production, that is a finding to
report, not an obstacle to route around. It belongs to Marcel, and the
right answer is a deliberate decision about what the production workspace should
contain — not a seed run in the middle of a login attempt.

---

## Verifying access without exposing anything

- The script's own output answers *"did I already have an account?"* —
  `created` versus `updated` — without revealing anything.
- `GET /api/auth/providers` and `GET /api/auth/csrf` on
  `agents.maxpromo.digital` confirm NextAuth is correctly configured. Both are
  public and involve no credential.
- `GET /api/health` reports the `authentication` check, which asserts the
  session secret is present without disclosing it.

**Do not probe `/login` with guessed passwords.** It is rate-limited by email,
and guessing is not a diagnostic.

---

## Required configuration

Names and purpose only. The values live in Vercel as **sensitive** entries and
cannot be read back from there by anyone; `DATABASE_URL`'s source of truth is
the Neon console.

| Variable | Purpose | Production |
|---|---|---|
| `AUTH_SECRET` | Signs and verifies the session JWT | present, **sensitive** — cannot be read back |
| `DATABASE_URL` | Neon connection for `app_users` and everything else | present, **sensitive** — cannot be read back |
| `NEXTAUTH_URL` | Callback base URL | absent — NextAuth resolves it from the request host, verified working |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Shared login rate limiting | absent — falls back to an in-memory limiter, which is per-instance and resets on deploy. Recorded in `governance/known-risks.md` |

---

## What this procedure is not

It is not a backdoor, and it must not become one. It requires the production
database URL, which is the same level of access as being able to read the table
directly. Anyone proposing to make owner access easier than that is proposing to
make it easier for everyone else too.

If a future change needs self-service recovery, it needs an ADR first, and it
needs to answer how a reset email proves ownership of an account that has no
verified email flow today.

---

See `governance/known-risks.md` for what is open, and
`history/agent-bureau-decision-log.md` for the original Auth-1C decision this
procedure came from.
