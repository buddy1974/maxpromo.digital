# Email operating system — local engineering report

Historical initial report. Webhook details are superseded by the
[Hostinger contract reconciliation](hostinger-contract-2026-10-22.md).

2026-10-22 · Marcel Tabit Akwe · **NO-GO for connecting the real mailbox**.

WHAT: governed email inside the existing OS and owner capability lane.
EFFORT: forensic inspection, verified API research, local implementation, adversarial
proofs, isolated SQL tests, regression, responsive inspection, documentation and commits.
VERIFICATION: merge verification passes; production and external runtime activation remain blocked.

1. **Forensic findings.** The OS lives in apps/web; Bureau has a separate database. Inbox
   was an activity log. Resend already owns commercial delivery; shared templates/legal
   identity stay intact. Telegram's conversational runtime is external Mission Control.
   WhatsApp has a deliberately public, restricted tool lane and is not reused for mail.
2. **Final architecture.** Provider-neutral EmailProvider → normalized local mail store →
   OS Inbox/business links → existing commercial capabilities/approvals → existing private
   owner API. Hostinger adapter is denied by default. [ADR-0020](../adr/0020-email-is-a-governed-os-channel.md).
3. **Hostinger verified.** Official REST authentication, folder-scoped metadata/list/search,
   folders, flags/move/send, pagination and documented reply/forward attachment payloads.
   Webhook authentication is Bearer secret; currently documented inbound event is
   message.received. Full event schema/retry/UID validity guarantees and send idempotency
   remain unresolved. SDK naming differs between official sources; no SDK installed.
4. **OS Inbox built.** Responsive bilingual list/detail, local search, unread/reply/waiting
   and business/classification filters; safe text, attachment metadata and business labels.
   Actual local read-state and saved-draft actions. No simulated send/delete UI.
5. **Max Agents capabilities.** Eleven registry capabilities: email.search, read, attachments,
   draft, send, state, trash, link, save_lead, summary and triage. Generated summaries/drafts
   are bounded untrusted outputs; recipients are stored message data, never model output.
6. **Telegram experience.** Existing signed owner API exposes these capabilities and returns
   durable thread/draft focus. No second bot. External natural-language routing, focus
   retention and proactive delivery have not been modified or certified.
7. **Governance.** GREEN internal/read/draft; AMBER exact-payload send/trash with expiry,
   single-use claims and stale draft checks. Real provider actions currently refuse even
   after approval. Permanent delete, arbitrary tools and email-authorized actions absent.
8. **Morning brief.** Existing owner.brief and owner.notices include important/reply/waiting
   threads. Routine mail suppressed, stable notice keys; system alerts retain attention.
   Risk 90 still depends on external notifyActors configuration in risk 89.
9. **Database.** Additive migration 0013 prepares accounts, threads, messages, business_links,
   events and action_audit in schema mail. Attachments are metadata on messages. Existing
   OS audit/approval/result records reused. Migration applied only to guarded evidence DB.
10. **Security/adversarial.** HTML remains inert; spoofed display-name addresses/header
    injection rejected; actual byte limits, safe attachment names, metadata-only handling,
    owner/CSRF guards, changed-replay protection, safe link confidence, stale/replayed/
    concurrent approvals proved. Real source mutations remove the evidence gate and webhook
    authentication in memory and are caught; unsafe HTML-rendering mutation also caught.
11. **Test counts.** 114 offline email assertions; 17 real isolated SQL assertions; 85 dictated
    commercial-agent regression checks; 229 WhatsApp gateway properties; 46 evidence-isolation
    checks. npm run verify passes every gate (29 at the time), including typecheck, lint, both builds and
    budgets. Existing warnings remain. Full certification remains blocked by the pre-existing
    undeclared Neon import in tooling; documentation findings introduced here were fixed.
12. **UI/mobile.** Actual component rendered with synthetic mail and the application's built
    CSS, inspected desktop and 390px mobile. Mobile Back cascade bug fixed. This is isolated
    component evidence, not a real-mailbox authenticated browser journey.
13. **Regressions.** Dictated commercial regression passed 85/85 with evidence transport
    suppression, lab restoration and 12 append-only audit rows retained. Angebot/Rechnung,
    owner API security/replays and notices remain intact. Original model-backed regression
    stopped after security/lead checks because the configured Anthropic account lacks credit;
    its downstream failures are not represented as a pass. No production WhatsApp changes.
14. **Commits.** Implementation: a26682a, feat(email): add governed local mailbox channel
    and owner inbox. This report and completed task record are in the following docs(email) commit.
    No push or deployment.
15. **Working tree.** Mission changes committed. Pre-existing deletion of .openclaw/project.yaml
    deliberately excluded and retained; the repository therefore is not globally clean.
16. **Production.** No Hostinger access, keys, production webhook, DNS, production database
    modification, real mail, push or deployment. Existing provider paths remain staged.
17. **External actions required.** Authorize a mailbox-scoped credential and mailbox resource
    identity; authorize/capture a redacted real Test delivery fixture in controlled staging;
    provide its one-time Bearer secret securely. Owner approval of later migration/deployment
    is separate. Do not install today's 503 webhook as a production receiver. No coding or
    manual local file creation is requested from Marcel.
18. **Environment names only.** New implemented requirement: HOSTINGER_MAIL_WEBHOOK_SECRET.
    Existing names: OS_SESSION_SECRET; OS_AGENT_SECRET; OS_AGENT_ALLOWED_ACTORS;
    TELEGRAM_BOT_TOKEN; TELEGRAM_CHAT_ID; MAXPROMO_EVIDENCE_MODE; EVIDENCE_DATABASE_URL;
    NEON_DATABASE_URL; DATABASE_URL; ANTHROPIC_API_KEY; OPENAI_API_KEY. Provider API token
    and mailboxResourceId are explicit constructor options, not yet environment-wired;
    no speculative API-token environment name is presented as implemented.
19. **Webhook configuration.** Current production configuration: none. Candidate future
    endpoint https://maxpromo.digital/api/channels/mail, POST, message.received,
    Authorization Bearer secret. Today valid authenticated requests return 503
    webhook_contract_not_verified. No invented HMAC or GET handshake.
20. **Risks/backlog.** Activation blockers: real event normalization/UID identity, full body
    synchronization (documented text fetch changes Seen), reconciliation/checkpoints,
    provider mutation ledger and uncertain-send reconciliation, atomic draft revision/send
    coordination, external Telegram routing/notifyActors, retention and byte-download privacy.
    P2: richer indexed search, large-thread pagination, explicit reply-all/forward recipient
    review, attachment scanning/storage, separately verified alias administration. Existing
    dependency audit reports 13 advisories (5 high development-only, 8 moderate) and a
    pre-existing tooling Neon declaration finding; no dependencies were changed.
21. **Verdict.** Local foundation is built and merge-verified. **NO-GO for the real
    info@maxpromo.digital mailbox.** It is intentionally impossible to turn this into live
    processing with an environment flag alone. Engineering activation remains ours after
    the external Hostinger contract evidence is available; this report does not claim the
    full live email operating system is complete.

The [architecture and activation runbook](../architecture/email-channel.md) records exact
boundaries, staged Resend migration, security posture and rollback.
