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
