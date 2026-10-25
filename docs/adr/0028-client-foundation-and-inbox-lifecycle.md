# ADR-0028 — Client foundation and Inbox lifecycle

**Status:** implemented and production verified 2026-10-25 under Marcel's "Foundation repair" brief (authority to implement,
migrate and deploy); the agent-made decisions below are for Marcel's inspection.
**Context:** the 2026-10-25 State of the Union audit (`docs/governance/state-of-the-union-2026-10-25.md`)
found Clients the weakest daily module (lost website, uncleared fields, ignored country, hard delete
that cascaded history and orphaned invoices, no client page, broken PDF extraction, no duplicate check)
and the Inbox without Trash, Restore, bulk actions or reopenable new-email drafts. Universal Max /
Capture must not be built on that.

## Decisions

1. **Every client write is a capability** (`lib/commercial/capabilities/clients.ts`):
   `client.match`, `client.create`, `client.update`, `client.archive`, `client.restore`, `client.show`
   (GREEN) and `client.delete` (AMBER). `GET /api/os/clients` is read only. The capabilities are the
   reusable boundary for Universal Max, document extraction, quotes, invoices and leads.
2. **Three-state updates.** A field absent from the request is unchanged; `null` or `""` clears it; a
   value sets it (`v.clearable`). Never truthiness or `COALESCE`.
3. **Archive, not delete.** `status = 'archived'` and `archived_at` together (a CHECK keeps them in step).
   Archive removes a client from the working lists only; everything attached stays. Restore reverses it.
4. **Permanent delete only for an empty client**, through an approval, removing only its own lifecycle
   notes in the same statement; the full record goes to `os_audit`. Migration 0024 makes **every foreign
   key onto `os_clients` NO ACTION**, so the database refuses any delete that would cascade or orphan —
   whatever the application does.
5. **One deterministic matcher** (`lib/clients/match.ts`): EXACT / LIKELY / POSSIBLE / NONE with reasons
   (email, website, phone, business email domain, company + city/postcode, name). No model, no fuzzy
   score, never a merge. Free-mail domains are not evidence. Archived clients are matched and flagged.
   `client.create` refuses while candidates exist; Marcel opens the existing client or confirms "a
   different client" (`confirmed_distinct_from`). The invoice auto-save links only on one EXACT match.
6. **One client extraction contract** (`lib/clients/extract.ts`, route `/api/os/ai/scan-client`) for
   text, photos, screenshots, business cards and PDFs. A PDF is sent to the model as a **document**
   (gateway `Part` type `document`: Anthropic `document` block; OpenAI/OpenRouter `file` part) — never
   relabelled as an image. Type is decided by the bytes; ≤ 4 MB (the platform's request limit; large phone
   photos are re-encoded in the browser). The result is a candidate shown in the form; nothing is saved
   until Marcel saves. Document content is data: instruction-like text forces low confidence; there is no
   field for bank details and IBAN-like strings are removed; from pasted text an email, phone or website
   must literally occur in the text.
7. **Client documents** reuse `os_files` with bytes in Postgres (`content`, `storage_ref = 'db'`), the
   attachment type check of draft attachments, 4 MB per file, 50 per client, one row per file. A document
   is history: a client with one is archived, not deleted.
8. **Trash is a reversible OS-level state** (migration 0025): `email.trash` is GREEN (it was AMBER while
   there was no Restore); `email.restore` and `email.bulk` (mark read/unread, archive/unarchive, trash,
   restore; ≤ 100) are GREEN. Trash keeps a conversation's reply / waiting / follow-up state so Restore is
   exact; every view, count and attention list already reads `trashed = false`. A scheduled email in a
   trashed conversation goes back to a draft. A new inbound message brings a trashed conversation back
   (trigger), so a reply is never lost in Trash.
9. **Hostinger is not changed by Trash** — consistent with archive, read and spam, which are OS-local
   (ADR-0023). The OS Trash is the source of truth for Marcel's working state; the mailbox keeps every
   message. Provider-side moves were not implemented: the provider contract for moving messages was not
   proven in this run, and a one-way provider move without a matching restore would split the two states.
10. **No permanent deletion of mail** is offered anywhere.
11. **New-email drafts are listed** in the Drafts view (`thread_id IS NULL`) and reopen in the same
    governed composer (same draft id, revision increments); a conversation with a saved reply draft
    offers "Continue draft".
12. **Daily cron restored**: `CRON_SECRET` set on the OS project (2026-10-25). Register:
    `docs/deployment/scheduled-work.md`.

## Consequences

Universal Max can propose `client.create` / `client.update` / `client.archive` / `email.trash` /
`email.restore` / draft actions through existing, audited capabilities with candidate matching in front
of every create. Not done here: provider-side Trash sync, Ask Max actions, Capture proposals.
