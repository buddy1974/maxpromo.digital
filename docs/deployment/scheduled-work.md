# Scheduled work register

The canonical inventory of everything Maxpromo runs without Marcel clicking. One row per job.
Updated 2026-10-25 (foundation repair). If a job is added, it is added here in the same change.

## Authentication

Vercel cron sends `Authorization: Bearer <CRON_SECRET>` when the project has a `CRON_SECRET`
environment variable. Every cron route checks it with `lib/cron.ts` `cronAuthorized` (SHA-256 digests,
constant-time compare, at least 16 characters) and **fails closed**: no variable → 503
`cron_not_configured`, wrong or missing bearer → 401. The value lives only in Vercel (sensitive);
never in git, chat or documentation.

| Project | `CRON_SECRET` |
|---|---|
| `maxpromo-digital` (OS) | **set 2026-10-25** (generated locally, installed through the Vercel CLI, never displayed) |
| `maxpromo-agents` (Bureau) | set (earlier) |

`vercel.json` schedules one **daily** run. A more frequent schedule was not added: cron frequency depends on
the Vercel plan, which was not confirmed in this run. Anything that should happen sooner also runs while
the OS is open (shell poll, every minute) or after the event that causes it (`after()`).

## Register

| Job | Schedule | Trigger | Auth | Action | Idempotency | Failure behaviour | Owner visibility |
|---|---|---|---|---|---|---|---|
| **Daily OS run** `GET /api/cron/owner-notices` | 05:15 UTC daily (`apps/web/vercel.json`) | Vercel cron | `CRON_SECRET` bearer | (1) owner notices + morning brief, (2) scheduled-mail sweep, (3) lead sweep | (1) each notice claimed in `os_owner_notices` before sending; (2) a scheduled draft is claimed `scheduled → sending` once, never retried; (3) reply rule uses deterministic request ids; research claims the lead; at most one research per run | each part catches its own error; the response says `failed` per part; scheduled-mail failures are written to `os_audit` (`email.scheduled.send`) and return the draft to `draft` with `schedule_error` | Vercel runtime log `owner.notices`; Inbox shows a failed scheduled send on its conversation; Attention lists uncertain sends |
| ↳ owner notices / brief push | (inside the daily run) | — | — | Telegram message to Marcel | as above | **off**: nothing is claimed or sent unless `OWNER_TELEGRAM_NOTICES=1` (not set — owner decision) | the brief is always on `/os` |
| ↳ scheduled mail | (inside the daily run) | — | — | sends confirmed "send later" emails whose time has come through `deliverDraft` (Hostinger) | claim-once; a revision changed after confirmation cannot be sent | uncertain outcome kept as uncertain, never resent | Inbox banner, Attention |
| ↳ lead sweep | (inside the daily run) | — | — | rule 5 always (a reply stops outreach); rules 1–4 only with `LEAD_WORKFLOW=1` (**off**) | see ADR-0027 §3 | per-lead failure recorded on the lead | lead timeline |
| **Scheduled mail (frequent)** `GET /api/cron/mail-schedule` | **not scheduled** (frequency depends on the Vercel plan; owner decision). The Inbox says so: a scheduled email goes at the next run after its time (ADR-0033 A5) | callable by an authorised cron | `CRON_SECRET` bearer | the scheduled-mail sweep alone | claim-once | as above | as above |
| **OS-open sweep** `GET /api/os/shell` | every minute while an OS screen is open | owner session | session cookie | badge counts; after the response: scheduled-mail sweep and lead sweep | same claims as the daily run | errors swallowed after the response; next poll retries | badges |
| **Provider spam check** | after each webhook, Inbox load and conversation open | `after()` | internal | reads Hostinger folder state; quarantines `provider_junk`; then applies a lead reply (rule 5) | per message state | unverified messages stay unverified; rule 5 waits ≤ 15 min for the verdict (risk 146) | Spam view |
| **Owner notices (opportunistic)** | after inbound mail, agent events, attention, Stripe events | `after()` (`lib/owner/schedule.ts`) | internal | same dispatch as above | claimed per notice key | off without `OWNER_TELEGRAM_NOTICES=1` | `/os` |
| **Bureau intake flush** `GET /api/agents/intake/flush` | 06:00 daily (`apps/bureau/vercel.json`) | Vercel cron (Bureau) | Bureau `CRON_SECRET` | delivers queued public-form leads to the OS (`lead.intake`, signed) | OS idempotent by source + external ref; outbox row removed on success | up to 20 attempts, then left for a person; `agent_runs` failed row | Bureau Overview live panel; OS lead + activity |

## Not scheduled (deliberately)

Stripe events arrive by signed webhook, not polling. Approval expiry is applied when approvals are
read. Trash has no purge (nothing is deleted; Hostinger keeps the message). Client archive has no expiry.
