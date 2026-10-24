# ADR-0024 — Owner Control Plane notices

Status: **accepted (overnight product run 2026-10-24); implemented and proven offline; production
activation needs migration 0018 and, for the guaranteed daily brief, a `CRON_SECRET` on
`maxpromo-digital` (owner action).** Extends ADR-0021 (Telegram is the Owner Control Plane).

## Context

`owner.notices` already produced stable notice keys (a situation keeps its key while it lasts), but
its only consumer was the legacy OpenClaw door, closed on 2026-10-23 (fails with 503). Apart from
new enquiries, which intake pushes directly, nothing reached Marcel's phone. The notices also
included every email needing a reply, which would make Telegram a second inbox.

## Decision

1. **Push policy** (lib/owner/notices.ts `pushable`): a customer answering a conversation Maxpromo
   wrote in; a critical system email; approvals an agent requested; agent failures, blocks and
   exceptions; newly overdue invoices (weekly key); uncertain sends; the morning brief once a day.
   Not pushed: ordinary email, new enquiries (already pushed at intake), follow-ups and renewals
   (in /os and the brief), agent completions.
2. **Exactly once.** Each key is claimed in `os_owner_notices` (migration 0018) before sending; a
   delivered key is never sent again; a failed send releases its claim so the next trigger retries.
   At most five messages per run, most severe first.
3. **Triggers.** After an inbound email (only after the spam check, so a reply Hostinger files as
   Junk never pings), after agent events and agent requests that need approval, and a daily Vercel
   cron (`/api/cron/owner-notices`, 05:15 UTC) for the brief. The cron route refuses everything
   without `CRON_SECRET`.
4. **Transport** stays lib/telegram.ts (Bot API, `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`, evidence
   sink). Messages are short, escaped, and link to the exact place in /os.
5. **Activation is the owner's.** Pushing starts only when `OWNER_TELEGRAM_NOTICES=1` is set on
   `maxpromo-digital`: the first run delivers whatever is pending (for example a long-overdue
   invoice and the day's brief), so Marcel chooses when that happens.
6. **Owner commands from Telegram** (approve, reply) are not part of this decision: they need the
   Telegram owner client on the signed agent door (ADR-0021), whose runtime is outside this
   repository.
