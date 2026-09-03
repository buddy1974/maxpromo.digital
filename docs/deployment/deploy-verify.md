# Deploy & Verify — this session's changes

Follow this top-to-bottom. Every step is one copy-paste away from done.
Stop and ping me if any step fails — don't continue past a red signal.

```
1. Env setup ............ ~5 min   (PowerShell + Vercel dashboard)
2. Apply migrations ..... ~5 min   (Neon SQL editor or psql)
3. Local smoke tests .... ~10 min  (browser + curl)
4. Production deploy .... ~10 min  (git push + Vercel verify)
                          ───────
                          ~30 min total
```

---

## 1. Env setup

### 1a. Generate the session secret

Run in PowerShell or Node REPL on your machine:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Copy the output — that's your `OS_SESSION_SECRET`. It will look like
`3kLp...` — about 64 characters, base64url-safe. Treat it like a
password: anyone with it can forge OS sessions.

### 1b. Update `.env.local`

Open `.env.local` in this project (already exists). Add or update:

```env
OS_PASSWORD=<your-real-password-min-8-chars>
OS_SESSION_SECRET=<paste-the-generated-string-from-1a>
```

Reference: see `.env.local.example` for the full list of vars and what
each does. `lib/env.ts` will refuse to start if `OS_PASSWORD` < 8
chars or `OS_SESSION_SECRET` < 32 chars.

### 1c. Update Vercel project settings

Go to Vercel → maxpromo.digital project → Settings → Environment
Variables. Add the same two for **Production** and **Preview**:

- `OS_PASSWORD`
- `OS_SESSION_SECRET`

(Use the same secret across environments unless you have a reason to
rotate per-env. Different secrets means re-login when you switch.)

Don't redeploy yet — finish the migrations first.

---

## 2. Apply migrations to Neon

You have three new SQL files in `db/migrations/`. Apply them in order
against your Neon database. Two ways:

### Option A — Neon SQL editor (easiest)

1. Open Neon dashboard → your project → SQL Editor.
2. For each file, paste contents into a new query, hit Run.
   Order: `0001` → `0002` → `0003`.
3. Look for green "Success" — these migrations have no output rows.

### Option B — psql

```bash
# from project root, with NEON_DATABASE_URL exported
psql "$env:NEON_DATABASE_URL" -f db/migrations/0001-document-numbering.sql
psql "$env:NEON_DATABASE_URL" -f db/migrations/0002-angebote-enrichment.sql
psql "$env:NEON_DATABASE_URL" -f db/migrations/0003-multi-tenancy.sql
```

### What each migration does

| File   | What                                               | Risk if you skip                              |
| ------ | -------------------------------------------------- | --------------------------------------------- |
| 0001   | Per-year sequences for invoice/angebot numbering   | Race on duplicate numbers under concurrency   |
| 0002   | `included_items` + `payment_terms` columns         | Free items still fold into notes (works, ugly)|
| 0003   | `owner_id` + `os_owners` table                     | Can't ship multi-user without a later migration|

The route handlers fall back to legacy SELECT-MAX numbering if `0001`
is missing, so nothing breaks if you delay it — but a Vercel cold-start
+ a quick double-click on Save Invoice will issue duplicate numbers
until 0001 is applied.

### Verify the migrations

In the Neon SQL editor, run:

```sql
-- Should return MP-2026-NNN, ANG-2026-NNN
SELECT next_invoice_number(), next_angebot_number();

-- Should list owner_id columns on every os_* table
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'owner_id' AND table_name LIKE 'os_%'
ORDER BY table_name;

-- Should return Marcel (1 row)
SELECT * FROM os_owners;
```

If `next_invoice_number()` doesn't exist after 0001, the migration
didn't run — re-apply.

---

## 3. Local smoke tests

```bash
npm run dev
```

### 3a. Auth lockdown — must reject anonymous

Open a fresh terminal:

```powershell
# Should redirect to /os/login (302 with Location header)
curl -i http://localhost:3000/os/clients

# Should return JSON 401
curl -i http://localhost:3000/api/os/clients

# Login itself is publicly reachable (200)
curl -i http://localhost:3000/api/os/login -X POST `
  -H "Content-Type: application/json" `
  -d '{"password":"wrong"}'

# Above must be 401 (wrong password). Now the right one:
curl -i http://localhost:3000/api/os/login -X POST `
  -H "Content-Type: application/json" `
  -d '{"password":"<your-real-OS_PASSWORD>"}'
# Look for: Set-Cookie: maxpromo_os_session=...; HttpOnly; SameSite=Lax
```

❌ If `/api/os/clients` returns 200 instead of 401 — the middleware
isn't matching. Check `middleware.ts` exists at the project root and
the dev server has been restarted.

### 3b. OS login flow (browser)

1. Visit `http://localhost:3000/os` → should redirect to `/os/login`.
2. Enter wrong password → red error "Incorrect access code".
3. Enter `OS_PASSWORD` → lands on `/os` dashboard.
4. Hard-refresh `/os/clients` → still authed (cookie persists).
5. Click Sign Out → returns to `/os/login`. Try `/os/clients` directly
   → redirects back to login. ✅

### 3c. Raw-data enhancer (the headline feature)

Visit `http://localhost:3000/os/angebote/new`. Click **◈ AI Generate**.
Paste this into the textarea:

```text
AMAKA CITY – IMPROVEMENT PLAN

WEBSITE + ONLINE
* Domain (1 year) → 20 €
* Hosting (1 year) → 80 €
* Website design + build → 500 €
👉 Website Package: 600 € (complete)
✔ Check: 20 + 80 + 500 = 600 € ✅

BOOKING SYSTEM
* Simple booking setup → 100 €

SOCIAL MEDIA
* Setup (Facebook + Instagram) → 80 €
* First content + structure → 70 €
👉 Social Media total: 150 €

DESIGN
* New flyer design → 80 €
* Business card design → 40 €
👉 Design total: 120 €

PRINTING
* 2,500 flyers → 120 €
* 1,000 business cards → 65 €
👉 Printing total: 185 €

INCLUDED (FREE)
* Offers for new clients
* Packages (3x / 5x / couple)
* Voucher system
* Pricing structure

💰 TOTAL COST: 1,155 €

PAYMENT
* Payment in 2 parts possible
* Can start step by step
```

Click **Generate with AI →**. Within ~5 seconds you should see:

- ✅ A **green confidence banner** ("high" or "medium").
- ✅ Five line items (Website Package €600, Booking €100, Social Media
  €150, Design €120, Printing €185) — packaged at the section level,
  NOT as ten sub-items.
- ✅ A **green "Inklusive (kostenlos)" block** with the four free items
  (offers, packages, voucher, pricing structure). These should NOT be
  in the priced line items.
- ✅ An **orange "Zahlungsbedingungen" block** with "Payment in 2 parts
  possible" or German equivalent.
- ✅ Subtotal of **€1,155** (the line items sum).
- ✅ No red warning banner (the math reconciles).

❌ If included items appear as priced lines — the model didn't honour
the schema. Re-run; if it persists, the prompt in `lib/prompts.ts`
needs strengthening.

❌ If the subtotal is €600 + €600 + €100 + … (i.e. doubled because the
package + sub-lines were both taken) — same fix.

Now click **Save Angebot**. You should land on `/os/angebote` with a
new draft `ANG-2026-NNN` row visible. Open it — included items and
payment terms are folded into Notes (until you apply the column-level
work in a future PR).

### 3d. /discovery public flow

Visit `http://localhost:3000/discovery` (signed out — incognito tab is
easiest). You should see the brief form. Paste the same Amaka City
text. Click **◈ Structure with AI** — same structured preview should
render. Submit with a real name + email — you should see the green
"Brief received" panel and `info@maxpromo.digital` should get an
email (or your dev console logs the mock email).

### 3e. Rate limiting (optional sanity check)

```powershell
# Hammer the contact endpoint 10x — sixth+ should 429
1..10 | ForEach-Object {
  curl -s -o NUL -w "%{http_code}`n" -X POST http://localhost:3000/api/contact `
    -H "Content-Type: application/json" `
    -d '{"name":"x","email":"x@y.z","organisation":"o","message":"m"}'
}
# Expect: 200 200 200 200 200 429 429 429 429 429
```

---

## 4. Production deploy

### 4a. Verify the diff before pushing

```bash
git status
git diff --stat
```

You should see additions in: `app/api/os/ai/enhance/`, `app/api/os/login/`,
`app/api/os/logout/`, `app/discovery/`, `app/blog/`, `app/portfolio/`,
`app/os/login/page.tsx`, `app/os/(protected)/layout.tsx`,
`app/os/(protected)/angebote/new/page.tsx`,
`app/os/(protected)/invoices/new/page.tsx`,
`app/api/os/clients/route.ts`, `app/api/os/invoices/route.ts`,
`app/api/os/angebote/route.ts`, `app/api/contact/route.ts`,
`app/api/audit/route.ts`, `app/api/chat/route.ts`,
`app/api/estimate/send/route.ts`, `lib/auth.ts`, `lib/env.ts`,
`lib/rate-limit.ts`, `lib/prompts.ts`, `middleware.ts`, `db/`, `docs/`,
`.gitignore`, `.env.local.example`.

### 4b. Type-check + build

```bash
npm run lint
npm run build
```

Both must pass clean. If `npm run build` fails on `lib/env.ts`
("OS_SESSION_SECRET must be set"), it means env validation is firing
in build context — that's expected if you didn't add the var to your
build environment yet. Either set it, or skip build verification and
let Vercel handle it (Vercel will use the Production env vars you set
in step 1c).

### 4c. Push and let Vercel deploy

```bash
git add .
git commit -m "feat: raw-data enhancer + auth lockdown + multi-tenant foundation"
git push
```

Watch Vercel logs. You're looking for:

- ✅ Build succeeds.
- ✅ No red boot errors mentioning `OS_PASSWORD` or `OS_SESSION_SECRET`.

### 4d. Production smoke

After deploy lands, repeat 3a (auth) and 3c (enhancer) against
`https://maxpromo.digital`. The 404s you reported should be gone:

```powershell
# All should be 200
curl -I https://maxpromo.digital/discovery
curl -I https://maxpromo.digital/blog
curl -I https://maxpromo.digital/portfolio
```

---

## Rollback

If anything goes sideways in production:

- **Auth issue locking you out**: revert `middleware.ts` to a no-op
  (`return NextResponse.next()` for everything) and redeploy. You'll
  lose the lockdown but regain access.
- **Enhancer broken**: forms fall back to the legacy
  `/api/os/ai/generate-invoice` and `/api/os/ai/scan-invoice` routes
  — switch the fetch URLs back in `angebote/new/page.tsx` and
  `invoices/new/page.tsx`. Both old endpoints still exist.
- **Migration regret**: `0001` and `0002` are additive only — nothing
  to undo. `0003` adds NOT NULL `owner_id` columns; if you need to
  back out, set them nullable again and you're back to single-tenant
  behaviour.

---

## What "done" looks like

- [ ] `OS_PASSWORD` and `OS_SESSION_SECRET` set in `.env.local` AND Vercel.
- [ ] Three migrations applied. `next_invoice_number()` returns a value.
- [ ] Local: `/api/os/clients` returns 401 without cookie, 200 after login.
- [ ] Local: Amaka City paste produces 5 line items + 4 included free
      items + payment terms + reconciled €1,155 subtotal.
- [ ] Production: same checks pass at `https://maxpromo.digital`.
- [ ] `/discovery`, `/blog`, `/portfolio` all return 200 in prod.

When all six boxes are ticked, ping me and we'll pick the next track.
