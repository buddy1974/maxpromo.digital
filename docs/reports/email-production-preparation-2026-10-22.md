# Email OS — locked production preparation

Owner: Marcel Tabit Akwe · 2026-10-22 · **NO-GO for creating the Hostinger webhook**.

WHAT: prepare the accepted channel for a code-only locked production deployment.
EFFORT: focused migration/env/release inspection, safe methods, real SQL replay/fresh
PostgreSQL proofs, dependency security fix, regression and built HTTP verification.
VERIFICATION: engineering checks pass; the required model-backed commercial release
proof is blocked by insufficient credit. No release gate was waived.

1. **Findings.** Normal path is main → linked maxpromo-digital Vercel project, apps/web
   root. Branch unprotected, but repository policy and Marcel's section 6 require passing
   checks before push/deploy. A Hostinger secret is unnecessary for a locked code deploy.
2. **Changes.** Missing/invalid secret 401 instead of 503; GET/HEAD 405/Allow:POST/no-store,
   no DB work. Added actual-route tests, guarded delivery-ID ALTER, populated migration
   replay and fresh PostgreSQL proof. SQL proof dependencies belong to the web workspace;
   shared commands and one application DB resolver preserved. No new direct dependency.
   CI verification now selects Node24, matching the tested native TypeScript proof APIs;
   the former Node20 job cannot execute stripTypeScriptTypes. Remote CI awaits the gated push.
   Updated existing Next.js/matching ESLint to 16.4.2 across both apps/shared tooling,
   sharp 0.35.5, resolving the critical [vendor advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw).
3. **Commits.** 939e22f (security), 0c309b8 (locked receiver/migration/CI proofs), followed
   by this documentation commit. Accepted cc8c0fb and 30961a8 are retained. Mission working
   tree is committed; only pre-existing unrelated .openclaw/project.yaml deletion remains.
4. **Push.** Not performed: required model-backed proof failed. A future normal main
   push includes five previously local WhatsApp/public-number commits preceding mail;
   it is not an email-only tree diff. No Meta configuration/schema activation is implied.
5. **Deployment.** None created; no production deployment ID/commit for this preparation.
   Remote main inspected: aff497c42e6d62ab46169e978fe82467d4f76355. Local artifact is built
   and tested; no new production readiness claim.
6. **Migration.** Vercel's actual production configuration injected into SELECT-only
   catalog inspection, without printing/writing secrets: PostgreSQL 170011, baseline
   client/lead id/email columns, UUID/hash functions, public schema usage, CRM SELECT and
   CREATE-schema privileges present;
   mail tables 0, preview column 0. No production migration/account provisioning.
   Fresh PostgreSQL 17: 9 checks; isolated evidence storage: 40. Both ordered mail migrations
   replay populated rows unchanged; deliberate failed transaction rolls back DDL/data.
   Mail does not require 0011/0012. Use existing reviewed Neon/psql after backup, bounded
   transactional application; [database instructions](../../apps/web/db/README.md).
7. **Public route.** https://www.maxpromo.digital/api/channels/mail remains 404.
   Homepage /en and /os/login 200; anonymous /api/os/clients 401. These are pre-deployment
   observations, not post-deployment proof.
8. **HTTP.** Current public receiver GET/HEAD/POST 404. Local production-build receiver
   GET/HEAD 405; unauthenticated/Basic/wrong-Bearer POST 401 even malformed JSON with
   EMAIL_PROVIDER=hostinger and secret absent. No body/DB work. Existing rate limit can
   return 429 under flood. Authenticated unavailable remaining config/DB 503; durable
   acceptance 200. No fake successful receipt.
9. **Environment.** Production already has NEON_DATABASE_URL, OS_SESSION_SECRET,
   OS_AGENT_SECRET/OS_AGENT_ALLOWED_ACTORS and existing Telegram/commercial variables.
   Missing: EMAIL_PROVIDER, HOSTINGER_WEBHOOK_SECRET. Intentionally unchanged; no
   placeholder, alias or duplicate DATABASE_URL. HOSTINGER_MAIL_API_BASE/TOKEN are not
   consumed for inbound receipt; outbound remains disabled.
10. **Telegram.** Existing owner.notices/filtering/brief preserved. notifyActors schema
    and Gateway installation live outside this repo and are unavailable locally.
    Existing MC actor telegram-6090014884/profile owner; OS actor telegram:6090014884.
    max-agents only openclaw_mobile, dmPolicy allowlist, allowFrom=[6090014884], groups
    disabled. Inspect real plugin schema before owner-only wiring. No guessed JSON,
    legacy form-notifier reuse, second bot or broadened permissions.
11. **Downloads.** Encrypted expiring locators, preview labels, leases/private durable
    references and SSRF/pinned ports preserved. No live transport/scheduler/allowlist.
    Host/media contract gates later full-content activation. Safe preview receipt does
    not require downloading; jobs stay blocked_policy.
12. **Marcel actions.** Restore credit on the existing configured model account so we
    can rerun the required proof and finish the conditional release. No repository work
    for Marcel. Separately authorize reviewed production mail migration/account setup
    with backup. Existing Gateway installation/schema is needed for push; signed-download
    host/media facts only for later full content.
13. **Next Hostinger UI step.** None yet. Do not click Add webhook or generate a token
    before deployed receiver/database readiness is proven. Afterwards the
    [activation guide](../deployment/hostinger-activation.md) defines mailbox/event/URL
    and secure one-time-token/Test ordering.
14. **Verdict.** NO-GO for creating/enabling the real webhook. Required model-backed
    commercial proof: 20 pass/5 fail (insufficient credit, reproduced with Vercel-provided
    model environment); dictated 85/85. Email 172, SQL 40, fresh PostgreSQL 9, security 11,
    verify 29 gates and dependency audit pass. Actual production artifact HTTP proof 10/10:
    `node apps/web/scripts/email/prove-email-locked-build.ts` after build. Audit reports 13 remaining advisories:
    5 high development-only/8 moderate, no production High/Critical. No security exceptions.
    No Hostinger contact, real email, production DB writes/migration, production environment
    changes, deployment, push, content fetching or WhatsApp activation occurred.

Recovery uses existing Vercel previous-deployment rollback/git revert. Retain additive
mail data/audit after a later migration; no destructive down migration. Backup restoration
after real receipt is a separate recovery decision to avoid losing newer business data.
