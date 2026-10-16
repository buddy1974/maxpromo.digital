# Public number migration

Status: **migrated in the repository 2026-10-16; not deployed.** Owner decision by Marcel,
2026-10-16. The inventory below was recorded first (commit `eea46e8`), then executed.

| | Number | `tel:` | `wa.me` |
|---|---|---|---|
| **Current** public business / legal / WhatsApp number | `+49 174 5910734` | `tel:+491745910734` | `wa.me/491745910734` |
| Retired from the current public identity on 2026-10-16 | `+49 173 3645698` | — | — |

The new number is the real Maxpromo WhatsApp Business number. This migration changes **contact
identity only**: it does not connect the WhatsApp Cloud API, does not enable automation, does not
touch the gateway (`lib/channels/` addresses Meta by phone-number **id**, never by the number text),
and does not apply migration 0012 anywhere.

## How it was done

Not a search-and-replace. In order:

1. **Removed the duplicate source of truth** (risk 100). The Impressum and the privacy notice wrote
   the number themselves, text and `tel:` href. They now read `BUSINESS.phone` and the new derived
   `PHONE_HREF` from `@maxpromo/config`. No other wording on either page changed.
2. **Changed the one value**: `BUSINESS.phone` in `packages/config/legal.ts`. `WHATSAPP_NUMBER`
   (digits for `wa.me`) and `PHONE_HREF` (`tel:+…`) are derived from it, never written out.

The number is now written **once** in the codebase.

## Surfaces migrated

| # | Surface | File | How it gets the number |
|---|---|---|---|
| W1 | Central legal identity | `packages/config/legal.ts` `BUSINESS.phone` | **the value** |
| — | `tel:` href | `packages/config/legal.ts` `PHONE_HREF` (new, exported from `@maxpromo/config`) | derived |
| D1 | `wa.me` digits | `packages/config/legal.ts` `WHATSAPP_NUMBER` | derived |
| W2 | Impressum — Telefon, text and `tel:` link | `apps/web/app/[locale]/impressum/page.tsx` | `BUSINESS.phone`, `PHONE_HREF` (was hard-coded) |
| W3 | Privacy notice — controller contact, text and `tel:` link | `apps/web/app/[locale]/privacy/page.tsx` | `BUSINESS.phone`, `PHONE_HREF` (was hard-coded) |
| D2 | "Chat with us on WhatsApp" on every article (2 links) | `apps/web/app/[locale]/blog/[slug]/page.tsx` | `WHATSAPP_NUMBER` |
| D3 | Organization JSON-LD `contactPoint.telephone` | `apps/web/lib/seo/schema.ts` | `BUSINESS.phone` |
| D4 | Document identity (OS print screens via `/api/os/document-identity`) | `apps/web/lib/documents/identity.ts` | `BUSINESS.phone` |
| D5 | Angebot and Rechnung emails — letterhead line and footer | `apps/web/lib/documents/emailHtml.ts`, `emails.ts` | document identity |
| D5b | Payment-reminder email footer (`reminder.send`) | `apps/web/lib/commercial/capabilities/documents.ts` → `buildEmailFooterHtml` | document identity |
| D6 | Angebot and Rechnung share-by-WhatsApp text | `apps/web/lib/documents/whatsapp.ts` | document identity |

**Checked and not carrying a phone number:** the printed Angebot/Rechnung PDFs (letterhead has no
phone line), the website footer (`© {year} Maxpromo Digital` only), Agent Bureau (`apps/bureau` has
no business phone), environment files (no `WHATSAPP_NUMBER` or phone variable in any `.env*`).

**Not the business's number, unchanged:** `outreach.ts` `wa.me/${phone}` (a lead's number),
`apps/web/lib/documents/whatsapp.ts` `wa.me/?text=` (no recipient), `lib/telegram.ts` `tel:` helper and
`api/max-agent/submit` (a sender's number), test harnesses (fictional `+49 1520 000xxxx` range).

## Every remaining occurrence of the old number — classification

`git grep -E "3645698|364 ?56 ?98|173[ ./-]?364"` over every tracked file after the migration.
**Zero occurrences in code, configuration, templates or tests.** Every remaining occurrence is in
documentation:

| File | Why it is kept | Class |
|---|---|---|
| `docs/governance/public-number-migration.md` (this file) | names the retired number | **EXPECTED HISTORICAL** |
| `docs/adr/decision-log.md` (two entries) | the decisions as made: "stays until a controlled migration", and the migration itself | **EXPECTED HISTORICAL** |
| `docs/history/change-log.md` | records the change from the old value | **EXPECTED HISTORICAL** |
| `docs/governance/known-risks.md` risk 98 | describes the defect it resolved | **EXPECTED HISTORICAL** |
| `docs/architecture/whatsapp-gateway.md` (reuse table, owner actions §14) | "migrated from `+49 173 3645698`" | **EXPECTED HISTORICAL** |

No occurrence is classed **BUG / MISSED CURRENT REFERENCE**.

**Outside the tracked tree, intentionally untouched:** Angebote and Rechnungen already issued and
their sent emails (Resend) keep the number they were issued with; rows in the production database
are not modified. Evidence images under `docs/evidence/` are not text-searchable and were not
rewritten; check any one before republishing it.

## Verification (2026-10-16)

1. **Source-level render** of the real modules (scratch harness resolving `@/` and
   `@maxpromo/config`, nothing stubbed): `BUSINESS.phone` = `+49 174 5910734`; `PHONE_HREF` =
   `tel:+491745910734`; `WHATSAPP_NUMBER` = `491745910734`; document identity phone new;
   `buildAngebotEmail` and `buildInvoiceEmail` in DE and EN each carry the new number twice (header,
   footer) and the old one nowhere; `buildEmailFooterHtml` (reminder) DE/EN new; both WhatsApp share
   texts new; Organization JSON-LD `"telephone":"+49 174 5910734"`. 13/13 passed.
2. **Rendered pages** from the production build (`next start`), see the table below.
3. **`npm run verify`** — all gates, typecheck, lint, build, budgets, public-assets.
4. **Deep search** — old number in every spelling: only the documentation rows above.

Rendered from the production build (`next start`, Host header per domain). Counts include the
React payload, which repeats visible text:

| Page | HTTP | New number | `tel:+491745910734` | `wa.me/491745910734` | JSON-LD telephone | Old number |
|---|---|---|---|---|---|---|
| `maxpromo.digital/de/impressum`, `/en/impressum` | 200 | yes | yes | — | new | **0** |
| `maxpromo.digital/de/privacy`, `/en/privacy` | 200 | yes | yes | — | new | **0** |
| `maxpromo.digital/de`, `/en` | 200 | yes | — | — | new | **0** |
| an article, `/de/blog/…` and `/en/blog/…` | 200 | — | — | 4 (no other `wa.me` number) | — | **0** |
| `restaurant-os.de/impressum` (product domain, operator's Impressum) | 200 | yes | yes | — | — | **0** |

The old number appears in no file under `apps/web/.next/static` or `.next/server`.
`npm run verify` passed (exit 0; every gate, including `prove:whatsapp-gateway`, typecheck, lint,
build, budgets, public-assets). One unrelated incident on the way: the first run failed typecheck on
the dev-server route types under `.next/dev/types`, a gitignored file generated by a dev server and found
garbled (two writes interleaved, 15:00 that day); the generated folder was removed and the rerun
passed. No source file was involved.

## Production and deployment status

- **Not deployed.** Nothing pushed. The live `maxpromo.digital` and the product domains keep
  showing `+49 173 3645698` until Marcel deploys `maxpromo-web`; the change goes live with that
  deploy and needs no other step (no environment variable carries the number).
- WhatsApp Cloud API not connected; `WHATSAPP_AUTOMATION` unset (off); production migration 0012
  not applied; no production secret added.

## Outside this repository — Marcel's manual updates

Google Business Profile · the WhatsApp Business App profile (already the new number — check the
profile's displayed contact details, website and description) · Facebook page · Instagram profile ·
LinkedIn and any other social or directory profiles · email signatures (Gmail and any other client)
· printed material (business cards, flyers, letterhead stock) · Mission Control / OpenClaw
configuration if it names a contact number · Resend or other sender profiles if they carry one ·
the old line: keep it reachable or forwarded while issued documents naming it are current.
