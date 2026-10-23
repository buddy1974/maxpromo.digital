# Email OS — locked production release

Owner: Marcel Tabit Akwe · executed 2026-10-22, refreshed 2026-10-23.

WHAT: deploy the accepted receiver locked; apply only reviewed mail migrations; stop
before Hostinger activation. EFFORT: local/remote verification, production identity match,
Neon recovery branch, transactional SQL, normal Git/Vercel release and public owner checks.
VERIFICATION: infrastructure is deployed and healthy. Mail is not activated.

## Production environment refresh — 2026-10-23

This follow-up supersedes the absent-secret/readiness state below. Marcel privately installed
HOSTINGER_WEBHOOK_SECRET after deployment dpl_HzZADZ7kT6GVDUFxfEXYGvGYooEJ. UI redeploys
were canceled in1–2s: latest hbvja4mgr build log explicitly reports the Ignored Build Step
returned0. The apps/web/vercel.json git-diff rule saw no watched changes; not a model/build
failure or supersession. Root apps/web, Next.js, Node24 and permanent ignore rule preserved.

Used the established CLI staged-production/force/promote path with a clean ff3fefc worktree.
No application file changed, no dummy commit, no secret export or environment mutation.
A temporary deployment-only build command asserted nonempty HOSTINGER_WEBHOOK_SECRET and
EMAIL_PROVIDER=hostinger in-cloud before the normal npm run build. It printed only
"Mail environment presence verified; values hidden". Build succeeded. No real authenticated
webhook request was used to probe the secret. Fresh Production environment snapshot supplies
the same configured variables to the built runtime; secret correctness awaits Hostinger Test.

New deployment dpl_3eb5eCWCpihA87C9XkLdyzrPE59b, created2026-10-23 07:27:48 Europe/Berlin,
Ready/Production, URL https://maxpromo-digital-rbla7z1ps-buddy1974s-projects.vercel.app.
Created after the secret installation, promoted successfully; inspecting www.maxpromo.digital
resolves to this ID. Source ff3fefcdba4e210b7480d604d343ead75218e51a; runtime code matches
previously certified b21c070 (intervening changes are documentation). Public health commit
is empty for this CLI build, so source identity comes from verified release checkout.

After promotion: GET405, HEAD405, unauthenticated/Basic/wrong-Bearer POST401; owner
Inbox200/configured:true/threads0; authenticated OS/clients/Angebot/Rechnung200; EN/DE
homepages200, health200/ok. WhatsApp503/unconfigured/OFF. Refreshed production SQL:
exactly one enabled hostinger:info@maxpromo.digital binding, mailbox_matches1,
acceptance guard true; messages/events/deliveries/actions/jobs all0. No production writes.

No Hostinger contact/Test/email fetch/send, model call, download activation, mailbox/secret
mutation or Telegram permission change. Downloads remain disabled. No secret value retrieved,
printed or exported. Earlier CLI preparation errors (relative config path and256-character
build-command limit) were corrected locally before the successful build, without touching
production source/settings. SAFE TO PRESS HOSTINGER TEST; agent stops at this boundary.

## Approved mailbox binding follow-up — 2026-10-23

This follow-up supersedes the pending-binding boundary/verdict in items18–20 below;
the earlier migration/deployment observations remain historical evidence.

Marcel explicitly approved only the prepared row. Neon console target was reverified:
maxpromo-automation, project twilight-boat-66649706, production branch br-floral-lab-alnv2a1o,
database neondb, PostgreSQL17.11. Preflight accounts0/matching bindings0, schema exactly
id/address/provider/enabled, no custom triggers. One bounded, locked transaction inserted
exactly one row and committed, asserting row count and the actual acceptance predicate:

    id: hostinger:info@maxpromo.digital
    address: info@maxpromo.digital
    provider: hostinger
    enabled: true

No secret/capability/owner fields were invented. This schema is the existing single-company
OS mailbox store; the owner Inbox API requires session.sub=marcel. No unrelated business
or WhatsApp table was modified. Post-commit accounts1/mailbox_matches1, acceptance guard true;
threads/messages/events/deliveries/action_audit/content_jobs/content_assets/business_links all0.

Live owner Inbox200 now reports configured:true/threads0, proving the missing-account
configuration blocker resolved without bypassing webhook authentication or submitting mail.
Public GET405/HEAD405, unauthenticated/Basic/wrong-Bearer POST401. Owner OS/Inbox/client/
quotation/invoice endpoint checks200, EN/DE homepages200, health200/ok. Public health now
reports release.commit=f4594ae. WhatsApp503/unconfigured, anonymous mail and owner APIs401.
Production environment names rechecked: HOSTINGER_WEBHOOK_SECRET absent; no env values read
or changed. Email-channel177 and isolated evidence SQL40 checks passed after provisioning.
TypeScript check and the production build passed; lint retained only existing warnings.

No Hostinger contact/webhook/Test, mail fetch/send, model invocation or download occurred.
Telegram notifyActors remains external OpenClaw configuration with existing owner restrictions;
full-body/attachment transports remain disabled with SSRF/encrypted-locator protections intact.

**SAFE TO CREATE HOSTINGER WEBHOOK.** Next: Hostinger Agentic Mail → Webhooks → Add webhook,
mailbox info@maxpromo.digital, event message.received, URL https://www.maxpromo.digital/api/channels/mail.
Prefer disabled during setup; keep the one-time generated Bearer token private and install
only in Vercel Production HOSTINGER_WEBHOOK_SECRET, never chat. This mission stops before
creation, secret installation, Test or real acceptance; these remain owner steps.

1. **Real model proof.** 85/85 passed inside Vercel's actual Production build environment
   on candidate dpl_EAAUMZ4CAc2J6bfoEnuHZhA1jhZ8, commit b21c070. The model key remained
   in-cloud; an evidence-only child runtime used fresh agent credentials and simulated
   outbound mail. Exact production endpoint identity matched the reviewed Neon branch.
   The old 20-pass/5-fail insufficient-credit result remains historical FAILED evidence;
   the owner restored credit/key and the new proof passes. Credit is no longer a blocker.
2. **Verification.** Full verify:29 gates, local and remote CI. Email:177 checks including
   five release-build isolation guards. Evidence SQL:40, fresh PostgreSQL17:9, actual local
   production-build HTTP:10, security decision gate:11. Typecheck/lint/build pass (existing
   lint warnings remain). Dependency audit passes:0 critical,5 high development-only,
   8 moderate. WhatsApp gateway229 properties and evidence isolation46 pass. An overlapping
   lab run produced a transient dictated84/85; the final sequential dictated run passed85/85
   and restored its rows/sequences, retaining12 append-only evidence audit rows by design.
   [GitHub verification](https://github.com/buddy1974/maxpromo.digital/actions/runs/39845400070).
3. **Production migration.** Only0013 then0014, through the existing Neon SQL editor on
   maxpromo-automation / production, br-floral-lab-alnv2a1o, PostgreSQL17.11. No evidence
   migration tool was aimed at production. Full recovery branch pre-email-os-20261022:
   br-nameless-block-alpbxno2, Frankfurt, expires2026-10-29. One transaction, lock_timeout5s,
   statement_timeout60s;31 statements including assertions and COMMIT succeeded. Nine mail
   tables,18 indexes,2 functions; public/chat catalog identities unchanged. Post-deployment
   counts:messages0/events0/deliveries0/actions0/jobs0/accounts0. No test/evidence mail rows.
   SQL source SHA256:A1EE89383E362316C6B6BBD883C793CDBD26A42CA2DA534488B8C8203D0CD5F1.
4. **Commits.** Accepted939e22f/0c309b8/4d558f3 retained. ed69611 adds opt-in in-cloud
   certification; b21c070 binds the release preflight to the reviewed production database.
   The following docs commit records the result. No unrelated change was staged.
5. **Push.** Normal origin/main advanced aff497c → b21c070 successfully. GitHub/Vercel
   statuses passed. Existing prior WhatsApp/public-number code travels with those ancestors;
   no WhatsApp provider configuration, migration or activation was performed.
6. **Production deployment.** Promoted production deployment dpl_EAAUMZ4CAc2J6bfoEnuHZhA1jhZ8,
   https://maxpromo-digital-2czi3drpv-buddy1974s-projects.vercel.app, Ready. Production model
   certification candidate dpl_EAAUMZ4CAc2J6bfoEnuHZhA1jhZ8 is the same application commit.
7. **Production SHA.** b21c070dd989c51b84fa047c83b68829fa99a18a, confirmed by the remote
   commit and Vercel deployment status association. Public health's release.commit field
   is empty; commit identity is taken from deployment/Git metadata rather than fabricated.
8. **Environment names/state.** EMAIL_PROVIDER present (owner set hostinger),
   ANTHROPIC_API_KEY present and exercised in-cloud; OS_SESSION_SECRET and NEON_DATABASE_URL
   existing/working. HOSTINGER_WEBHOOK_SECRET absent. No secret was invented/exported/printed,
   no existing value was rotated by this mission, EMAIL_PROVIDER was not changed by us.
   EMAIL_RELEASE_MODEL_PROOF / EMAIL_RELEASE_EVIDENCE_DB / EMAIL_RELEASE_EXPECTED_DB_ENDPOINT
   were temporary build-only proof inputs, not additional runtime settings.
9. **Public GET.** https://www.maxpromo.digital/api/channels/mail →405.
10. **Public HEAD.** Same route →405 with no response body.
11. **Public POST.** No Authorization, Basic and wrong Bearer →401, even malformed JSON.
    No404 and no missing-secret5xx. No payload reaches storage, model or provider.
12. **OS health.** Owner login200; authenticated HEAD /os,/os/inbox,/api/os/clients,
    /api/os/angebote,/api/os/invoices all200. Owner Inbox API200, threads0, configured:false.
    Anonymous mail API401 and unsigned owner-agent API401. Cookies/password never printed.
13. **Website health.** /en and/de200, /os/login200, /api/health200/state:ok. Registry,
    database, documents and authentication checks are ok. AI/email remain unvalidated in
    the health contract because that cheap probe intentionally does not contact providers.
14. **WhatsApp.** Runtime credentials absent; public unsigned POST returns503/not configured,
    before ingestion. Automation defaults OFF. No Meta connection, number migration,
    WhatsApp schema/data change or owner runtime modification.
15. **Mail/secret safety.** Production messages/events/deliveries/action audit/content jobs
    remained0 after rejection tests. No real mail sent or ingested. No Hostinger webhook
    was created by this mission and Hostinger was not contacted; external account state
    was deliberately not queried. No Hostinger API/MCP/intelligence/download was activated.
    Public route availability does not invoke Anthropic or Telegram.
16. **Telegram.** Existing owner.notices/brief path preserved. notifyActors is external
    OpenClaw/Mission Control configuration; plugin schema/install unavailable here. Required
    owner mapping remains MC telegram-6090014884/profile owner, OS telegram:6090014884,
    max-agents/openclaw_mobile only, DM allowlist6090014884, groups disabled. No guessed
    JSON, second bot or permission broadening.
17. **Downloads.** Still disabled. Encrypted locators, expiry, preview/full-body separation,
    SSRF/DNS-pinning policy and private durable-asset architecture remain intact. Verified
    Hostinger download host/media facts are needed before any later transport activation.
18. **Remaining readiness boundary.** Migrations intentionally seed no mailbox account.
    Provisioning the real info@maxpromo.digital internal binding needs the pending owner
    decision beyond the migrations-only production-data instruction. It creates no mail
    and cannot unlock receipt without the missing secret. Exact proposed action:

    INSERT INTO mail.accounts(id,address,provider,enabled)
    VALUES('hostinger:info@maxpromo.digital','info@maxpromo.digital','hostinger',true);

    No coding or SQL execution is requested from Marcel; the agent performs it after approval.
    Until that binding exists, a genuine authenticated Test would return503/account unavailable.
19. **Next Hostinger UI action.** Wait for binding readiness. Then Agentic Mail → Webhooks
    → Add webhook: mailbox info@maxpromo.digital; event message.received; HTTPS URL above.
    Prefer disabled during setup. Hostinger generates the Bearer token once; Marcel places
    it privately in Vercel HOSTINGER_WEBHOOK_SECRET, never chat. This mission does not
    create the webhook, install a placeholder, press Test or send test email.
20. **Verdict: DO NOT CREATE HOSTINGER WEBHOOK yet.** Locked infrastructure deployment is
    complete; mailbox-binding approval is the remaining owner boundary before Test readiness.
    Model credit is resolved. Full mail activation additionally needs genuine secret,
    successful Hostinger Test and controlled real-email acceptance. Downloads/Telegram push
    remain separate pending integrations; no full Email OS production certification claimed.

Rollback: existing Vercel previous deployment/git revert. Retain additive mail schema and
audit. Recovery branch expires2026-10-29; restoring it is a deliberate data-recovery decision,
not routine code rollback. Working tree retains only the pre-existing .openclaw/project.yaml
deletion outside these commits.
