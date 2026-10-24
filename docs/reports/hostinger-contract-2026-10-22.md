# Hostinger contract reconciliation

2026-10-22 · Marcel Tabit Akwe · local continuation of ADR-0020.

WHAT: reconcile the owner's official webhook contract with the existing governed channel.
EFFORT: focused implementation, security review, mutation tests, isolated SQL, regression and UI inspection.
VERIFICATION: deterministic email and database proofs pass; production activation remains separately gated.

1. **Findings.** The prior receiver was deliberately disabled pending a payload contract.
   It now accepts the supplied message.received envelope. Provider delivery ID, mailbox
   event ID and RFC Message-ID are separate identities; previews are never full bodies.
   No second architecture, dependencies, bot or provider intelligence was introduced.
2. **Files changed.** Mail route/parser/ingestion, content retrieval safety/store/worker,
   migration 0014, owner capabilities, Inbox API/rendering, email/SQL proofs and associated
   tests; ADR-0020, architecture, risk register, activation guide and task/review records.
   The replaced disabled-webhook proof is removed. The unrelated .openclaw/project.yaml
   deletion is excluded from commits.
3. **Schema.** Additive 0014 extends messages with RFC headers, independent dates and
   preview/body state; adds deliveries, encrypted expiring content jobs and durable asset
   references. Atomic acceptance/completion functions enforce identities and leases.
   Only the isolated evidence database was migrated; synthetic rows were cleaned.
4. **Authentication.** Canonical HOSTINGER_WEBHOOK_SECRET; strict Bearer header with
   constant-time digest comparison. Missing configuration fails closed. Authentication
   precedes bounded JSON parsing. Generic errors contain no tokens, bodies or signed URLs.
5. **Idempotency.** Mailbox transaction lock, delivery primary key and existing account +
   provider-message uniqueness protect retries and parallel receipt. Rebinding one delivery
   to a different message rejects. Duplicate event IDs under a new delivery record create
   no message/thread/lead/job, notice timestamp, AI work or outbound action.
6. **Threading.** Message-ID, In-Reply-To and References reconstruct an uncontested thread
   only within the same mailbox and external sender. Subject/display-name matching does
   not merge identities. Ambiguous or cross-sender hints isolate; CRM matches stay possible.
7. **Bodies/attachments.** Preview is explicitly labelled in English/German and unavailable
   for model summary/generated reply. Signed locators are authenticated-encrypted with a
   domain-separated existing session key, expire conservatively within one day and clear
   after completion/expiry. Metadata survives independently. Ports support private durable
   retention, bounded downloads, exact verified hosts, public DNS addresses, pinned transport,
   no redirects, filename/magic checks and atomic completion. A review found and fixed a
   reclaimed-job lease race; claim-specific tokens cannot be borrowed by stale workers.
   No live content downloader/scheduler is armed: actual signed hostnames, body format and
   durable backend activation remain unverified. The sample URL is not a hostname contract.
8. **Telegram.** Existing owner.notices/brief capabilities are preserved and tested.
   Proactive notifyActors routing remains an external Mission Control runtime boundary:
   its installation/source is unavailable here. No guessed config, second bot or relaxed
   owner policy. See the exact runtime recovery/verification steps in the activation guide.
9. **Tests.** Email: 166 checks (35 native, 32 real route, 29 rendered UI, 17 owner,
   18 actions, 10 approval engine, 8 notices/brief, 14 Inbox API, 3 source mutations).
   SQL: 36 isolated checks, including concurrent retries, RFC isolation, stale lease,
   full-body promotion and retention. HTML rendering mutation is also detected/restored.
   Commercial dictated workflow: 85/85. Default model-backed workflow: 20 pass, 5 fail
   because the external model account has insufficient credit; cascading draft checks
   cannot pass without that service. No real mail was sent.
10. **Regression/UI.** Final npm run verify passes every gate (29 at the time), including the real
    evidence numbering regression for quotations and invoices. Earlier transient evidence
    WebSocket failures were retried successfully. Workspace typecheck, lint (existing warnings only) and both app
    builds pass. Commercial boundary, WhatsApp gateway, extraction integrity, SEO evidence,
    typography, budgets, public assets and documentation checks pass. Owner authentication,
    governance, notices and briefing proofs pass. WhatsApp stays OFF. Angebot/Rechnung
    delivery code is unchanged. Desktop and 390px mobile fixtures were inspected in Chrome;
    preview/injection text remains inert. No production Telegram delivery was claimed.
11. **Commits.** cc8c0fb contains the focused Hostinger contract implementation and tests.
    The following documentation commit records this report and activation boundary.
12. **Working tree.** Mission changes committed; only the pre-existing unrelated
    .openclaw/project.yaml deletion remains outside this work.
13. **Production webhook URL.** https://www.maxpromo.digital/api/channels/mail — derived
    from the canonical hub domain and actual route. Read-only HEAD returned Vercel 404
    on this date: the reconciled receiver is not deployed.
14. **Environment names.** EMAIL_PROVIDER, HOSTINGER_WEBHOOK_SECRET, existing
    OS_SESSION_SECRET, NEON_DATABASE_URL or DATABASE_URL. No secret values recorded.
    HOSTINGER_MAIL_WEBHOOK_SECRET is replaced, not an alias. API base/token variables
    are not needed or consumed for inbound receipt; outbound remains disabled.
15. **Remaining owner actions.** Separately authorize our migration/account provisioning
    and deployment; provide verified signed-download host/media constraints; then set the
    canonical Vercel configuration. Only after readiness, create a preferably disabled
    Hostinger webhook for info@maxpromo.digital, event message.received, exact URL above;
    save its one-time token directly in Vercel, authorize deployment, use Test and require
    HTTP 200, then deliberately enable. Never regenerate casually. Restore/locate the
    existing Telegram runtime to configure owner-only notifyActors against its real schema.
    Marcel need not write code, SQL or local files. Detailed ordering and rollback:
    [activation guide](../deployment/hostinger-activation.md).
16. **Verdict: NO-GO now for creating/enabling the real webhook.** Local reconciliation is
    ready for review; production is undeployed and not authorized, full-content provider
    constraints are missing, and proactive Telegram routing is not activated. No Hostinger
    connection, token use, real mail, production migration/env change/deployment or push occurred.
