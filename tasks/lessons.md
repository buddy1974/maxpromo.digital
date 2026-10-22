# Engineering lessons

- PostgreSQL data-modifying CTEs share a snapshot: do not UPDATE a row inserted
  by a sibling CTE through a table scan. Return needed identities or perform an
  idempotent follow-up metadata repair. Verify concurrency against real isolated SQL.
- Keep transport uncertainty distinct from failure; a timeout must never trigger a blind resend.
- Inbox Tailwind utilities contribute to shared CSS; reuse existing controls and keep budgets unchanged.
