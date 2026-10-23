# Engineering lessons

- Webhook readiness probes cannot certify a provider's Test payload contract. Preserve
  safe fixed rejection stage/reason codes (never bodies, URLs, secrets or raw exceptions)
  so a genuine authenticated400 can be traced without weakening validation.

- Environment-only production releases need a new deployment after secret installation.
  A Git redeploy can intentionally cancel on the unchanged-app ignore rule; inspect the
  actual log and use the established CLI release path, preserving permanent ignore logic.

- PostgreSQL data-modifying CTEs share a snapshot: do not UPDATE a row inserted
  by a sibling CTE through a table scan. Return needed identities or perform an
  idempotent follow-up metadata repair. Verify concurrency against real isolated SQL.
- Keep transport uncertainty distinct from failure; a timeout must never trigger a blind resend.
- Inbox Tailwind utilities contribute to shared CSS; reuse existing controls and keep budgets unchanged.
- Treat delivery IDs, provider message IDs and RFC Message-ID headers as distinct identities.
  Preserve opaque ID case; an example hex/UUID shape is not an undocumented provider guarantee.
- Webhook text previews must not silently become full-body context. Signed URLs require verified
  host/media policy and pinned DNS, not just HTTPS or a provider-authenticated envelope.
- A locked deployed receiver should reject missing credentials without reporting a service
  outage. Conditional release authorization does not waive required model-backed checks.
- Vercel env run may export empty production secrets and overlay local dotenv values.
  Never label that fallback as current-production-key proof. Keep non-exportable model
  credentials in-cloud and isolate a build child against evidence data for certification.
