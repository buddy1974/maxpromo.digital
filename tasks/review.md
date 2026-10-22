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
