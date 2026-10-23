# Email mission review

Reviewed owner-only routes, CSRF, untrusted body rendering, exact-recipient approvals,
state audit attribution, duplicate ingestion, changed-replay identity, notice filtering,
evidence network gates and existing commercial transport boundaries.

Defects found and fixed: sibling-CTE event reference invisibility; stale classification
after urgent follow-up; unsubscribe footer hiding security/payment attention; approval
dedupe prefix mismatch; missing detail unread state; missing local state actor attribution.

No new packages installed or dependencies declared. Owner/render evidence harnesses live
under apps/web/scripts/email so they use their owning workspace's declared dependencies.
The real SQL harness stays in shared tooling alongside existing isolated database proofs;
no second database client is introduced into application runtime code.
The shared tooling command orchestrates them without importing an application module.

No production writes, mailbox access, real mail, DNS changes, pushes or deployment.
Pre-existing deletion of .openclaw/project.yaml must remain outside mission commits.

## Hostinger contract continuation

Reviewed provider IDs, Bearer authentication, atomic receipt, hostile previews, SSRF ports,
URL encryption/expiry, RFC association, notice stability and worker leases. Fixed a stale
worker race by carrying each claim's immutable token through completion and failure;
regression proves reclaimed work cannot lend a newer token to an older worker.
No new dependencies, real mailbox access, production writes, deployment or push.
Final verification: all 29 verify gates, 166 email checks, 36 isolated mail SQL checks,
85 dictated commercial checks, typecheck, lint and builds passed. Model-backed commercial
checks remain externally blocked by insufficient credit. Desktop/390px mobile inspected.

## Locked production preparation review

Reviewed no-secret401, GET/HEAD405, no database import side effects, no content scheduler/
provider factory, WhatsApp default OFF and unchanged owner-only notice lane. Migration
replay preserves complete synthetic records; fresh PostgreSQL17 proves baseline-only
compatibility and failed transactional rollback. Vercel actual production catalog was
inspected SELECT-only:17.11, prerequisites present, mail tables absent. No production writes.
Updated existing Next.js/ESLint to16.4.2, sharp0.35.5; dependency audit now passes without
new direct dependencies or waivers. Shared SQL test driver belongs to web's declared package.
Final verify29 gates, email172, evidence storage40, fresh SQL9, built HTTP10, security11,
typecheck/lint/build/docs passed. Required commercial model proof20pass/5fail from insufficient
credit, including Vercel-provided model environment; dictated85/85. Conditional push/deploy
not exercised. Pre-existing OpenClaw deletion remains excluded.

## Locked production release — 2026-10-23

Owner explicitly authorized locked migration/deploy independently of historical billing;
then restored credit/key. Real commercial proof85/85 passed in Vercel's Production build
using current non-exportable model credential, evidence-only child and simulated sends.
Expected Neon production endpoint matched in-cloud. Main b21c070 passed remote CI/Vercel.
Only mail0013/0014 applied in a bounded transaction through existing Neon SQL editor,
after recovery branch br-nameless-block-alpbxno2.9 tables/18 indexes/2 functions, all mail
counts0; public/chat catalog unchanged. Mailbox binding remains pending owner decision.
Public GET/HEAD405, rejected POST401; owner login/OS/Inbox/client/Angebot/Rechnung200;
homepages200, health200/ok. WhatsApp503/unconfigured/OFF. No mail/Hostinger/model request
from locked route, no Telegram runtime changes/download transport activation.
Local verify29, email177, SQL40, fresh9, built HTTP10, security11; dependency audit clean.
Final dictated85/85 after isolated rerun. Only unrelated original OpenClaw deletion retained.

### Approved mailbox binding — 2026-10-23

Reverified same Neon production project/branch/database, account schema and no existing
bindings/custom triggers. Exact reviewed row inserted atomically with count assertion;
accounts1/mailbox_matches1 and acceptance predicate true. All eight activity tables zero.
Owner Inbox200/configured:true/threads0, public405/401 and OS/document/homepage/health checks
pass; WhatsApp503/OFF. HOSTINGER_WEBHOOK_SECRET absent. Email177/storage40 passed without
production fixtures or Hostinger contact. No secret, Telegram runtime or download changes.

### Production environment refresh — 2026-10-23

UI cancellation log proves ignored-build exit0, no application changes. Permanent rule
preserved; clean certified ff3fefc CLI force/stage/promote succeeded after secret installation.
In-cloud secret-presence/provider assertion passed without values. Production Ready
dpl_3eb5eCWCpihA87C9XkLdyzrPE59b serves www; actual public405/401 and OS/site200 checks pass,
one enabled binding/all mail activity0, WhatsApp OFF. No Hostinger Test/request/send/fetch,
downloads or Telegram permissions changed. Ready for Marcel's first provider Test.

### First genuine provider Test400 — 2026-10-23

Two production serverless400 records confirm reachability and passed Bearer authentication;
deployed400 path rejects body/JSON/schema before account/storage. Original payload/response
body/reason not retained: exact rejected field remains external evidence boundary, no blind
Test compatibility bypass added. Safe fixed-code diagnostics added; full verify29, email185,
route46 and SQL40 pass. Intentional log-payload mutation caught/restored, route46 rerun clean.
All production mail counts0 and one enabled binding; public405/401 and OS/site healthy.
Do not retry Hostinger Test until actual redacted Test request/response detail is reconciled.

### Exact displayed Hostinger connectivity contract

Owner-supplied sample reproduced authenticated400/wrong_mailbox before DB; correcting only
mailbox exposed unsafe placeholder attachment/body URLs. Real parser untouched. Exact full
synthetic fixture now acknowledged after authentication/config gates, no DB open/ingestion/
downloads/model/notices/actions; changes fall through strict parsing. Full verify29/email202
(38 native/59 route), SQL40 and explicit tsc pass. Unconditional-detector mutation caught;
four safety mutations total. No production Test or secret use. Retry verdict follows actual
production health/mail0 verification; this is connectivity only, not real-message certification.

Production850b427 / dpl_6ntgsvX8ze3LjmiAiZjwhxsLHUbK Ready and canonical domain verified;
public405/401, OS/site200 and health ok, Inbox configured:true/threads0, one account and
all mail activity0, WhatsApp OFF. Safe owner retry; no agent Hostinger Test or secret use.

### Second genuine Test invalid_event_id

Authoritative request875lg-1792750845538-f09330a94976/10:20:45.538Z on6ntgsv returned400,
validation/invalid_event_id. Auth passed; matcher false; real eventId is bounded string
outside accepted ID grammar, exact length/value unknown. No unsupported discriminator added.
Known-field-only structural diagnostics added and proved value-private/bounded; empty and
invalid-character synthetic class fixtures retain400/no DB. Full verify29/email213(native40/
route67)/SQL40/tsc/lint/build pass. Five mutations caught including raw structural value leak.
Deploy then prove canonical route/health/counts before any owner diagnostic retry.

Verified c1bab75 / dpl_CUufN295SyNCE1cefW2ZvRNhs2TJ Ready/Production on canonical www.
GET/HEAD405, rejected POST401, OS/site200 and health ok; Inbox configured:true/threads0,
one binding and messages/events/deliveries/actions/jobs0; WhatsApp OFF. One owner diagnostic
retry is now safe and structurally decisive, not a promise of successful acknowledgement.


### Independent takeover review — contract resolution

Found two unrecorded genuine Tests in production logs proving an empty eventId. Rejected the
invented id grammar and the exact-sample bypass; content faults no longer refuse receipts.
Verify exit 0; route 67, native 39, mutations 6, SQL 43, UI 31. 016ceb5 live on
dpl_GQwE9b3vtfvKRFcMt1EdwLrRSNvy; schema/function md5 verified read-only. Owner Test is next.

### First real inbound mail

One genuine POST (dm56h-1792762908253-322021585cdf) → 200 created:true degraded [], no retry.
Owner API/UI: one thread, one message, lead/needs reply, unread, preview only, PDF metadata
exact (1,548,450 B), no URL exposed; filters and search correct; Leads 0 by documented design.
Business objects unchanged, Sent empty since arrival, WhatsApp 503, health ok. Email-channel
pass; storage 43/43 (evidence-DB transport flaky). Owner-approved read-only SQL: exactly 1 delivery/event/message/thread/content job
(blocked_policy, 0 attempts)/asset (pending, no storage_ref/sha256), sealed locator only,
links/audit/approvals/agent/chat 0 since arrival, dedupe keys live. Mission GREEN.

### Control-plane reconciliation (ADR-0021)

**Containment:** the legacy door was closed in production, with a live deployment proving it.
The shadow Bureau was retired except for its running deployment, which needs an owner pause.

**Contract:**
- per-client secrets and authority on the existing signed door;
- the Bureau can run its allow-listed capabilities and report events, never execute or reject;
- executor bound to the requester or the owner.

**Implemented:**
- `lead.intake` is idempotent forever (receipt ledger) and the Intake agent forwards through an
  outbox, so the Bureau keeps no lead;
- `/os` leads with the shared attention model and `/os/approvals` decides;
- owner direct sends are idempotent and audited, documents come from the stored record,
  mark-paid records the payment, and issued invoices cannot be deleted.

**Proofs:**
- SQL 30/30, with two mutations caught;
- HTTP 7/7;
- boundary 48/48; numbering 35/35;
- EU rehearsal 35/35;
- local browser checks at desktop and 390 px.

**Production:** migration 0015 applied; fresh trust provisioned.
**Owner:** push, pause the shadow project, create the EU Neon project.
