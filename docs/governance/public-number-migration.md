# Public number migration — inventory

Status: **inventory only; nothing changed.** Recorded 2026-10-16 on Marcel's decision.

| | Number |
|---|---|
| Current public / legal number | `+49 173 3645698` |
| Intended new public business / WhatsApp number (owner decision 2026-10-16) | `+49 174 5910734` |

Marcel decided the new number is the intended public number **and** that it is not to be swapped
in blindly. This is the inventory for a controlled migration. It covers every tracked file in the
repository (`git grep` for every spelling of the old number, and every consumer of
`BUSINESS.phone` / `WHATSAPP_NUMBER`). Legal identity is locked (`CLAUDE.md`): changing it is
Marcel's call, made on this list.

## Where the number is written

The number is written out **three** times. It should be written once.

| # | File | Line | Class | How |
|---|---|---|---|---|
| W1 | `packages/config/legal.ts` | `BUSINESS.phone` | **configuration / runtime** — the source of truth | literal |
| W2 | `apps/web/app/[locale]/impressum/page.tsx` | Telefon (`tel:` href + text) | **legal / Impressum** | **hard-coded literal, not read from W1** |
| W3 | `apps/web/app/[locale]/privacy/page.tsx` | controller contact (`tel:` href + text) | **legal / privacy notice** | **hard-coded literal, not read from W1** |

## Where it is derived from `BUSINESS.phone` (changes with W1 automatically)

| # | File | Use | Class |
|---|---|---|---|
| D1 | `packages/config/legal.ts` `WHATSAPP_NUMBER` | digits for `wa.me` | **WhatsApp / wa.me** |
| D2 | `apps/web/app/[locale]/blog/[slug]/page.tsx` (2 links) | "Chat with us on WhatsApp" on every article | **WhatsApp / wa.me** · public contact |
| D3 | `apps/web/lib/seo/schema.ts` | JSON-LD `contactPoint.telephone` (Organization) | **structured data** |
| D4 | `apps/web/lib/documents/identity.ts` → `BUSINESS.phone` | document identity, served to the OS print screens by `/api/os/document-identity` | **invoices / documents** |
| D5 | `apps/web/lib/documents/emailHtml.ts` (letterhead line and footer) | Angebot and Rechnung emails | **invoices / documents** |
| D6 | `apps/web/lib/documents/whatsapp.ts` (2 messages) | the business's number printed inside the share-by-WhatsApp text of an Angebot / Rechnung | **invoices / documents** |

## Not affected

| Item | Why |
|---|---|
| `apps/web/lib/commercial/capabilities/outreach.ts` `wa.me/${phone}` | the *recipient's* number (a lead's), not the business's |
| `apps/web/lib/documents/whatsapp.ts` `wa.me/?text=` | no recipient number; the user picks the chat |
| WhatsApp gateway (`lib/channels/`) | addressed by Meta's phone-number **id** (`WHATSAPP_PHONE_NUMBER_ID`), never by the number text |
| Test harnesses | fictional `+49 1520 000xxxx` range only |

## Historical / reference — never rewritten

| Item | Class |
|---|---|
| Angebote and Rechnungen already sent, and their emails (Resend) | **historical** — issued documents keep the number they were issued with |
| `docs/architecture/whatsapp-gateway.md`, `docs/governance/known-risks.md` (risk 98), this file | **reference** — they name the old number in order to describe the mismatch |
| Evidence images under `docs/evidence/` | **not verified** — images are not searchable as text; check before republishing any |

## Outside this repository (not inventoried here)

Google Business Profile, the WhatsApp Business App profile, email signatures, printed material,
social profiles, Mission Control / OpenClaw configuration. Listed so the migration plan asks.

## Conflicts this inventory found

1. **W2 and W3 duplicate the legal identity.** `legal.ts` itself says a contact number "belongs
   where the Impressum gets its number, so that the two cannot disagree" — but the Impressum and
   the privacy notice do not get it from there. Changing only `BUSINESS.phone` would leave the
   Impressum and privacy notice on the old number while the site's WhatsApp links, structured data
   and documents moved — the Impressum would disagree with everything else. The controlled
   migration should first make W2 and W3 read `BUSINESS.phone`, as a no-op change verified
   separately, and only then change the value once.
2. **WhatsApp links follow the legal number.** `WHATSAPP_NUMBER` is derived from `BUSINESS.phone` by
   design. Today every article's "Chat with us on WhatsApp" opens a chat with `+49 173 3645698`,
   not the business WhatsApp. If the legal number and the WhatsApp number are ever meant to differ,
   that is a deliberate split of D1 from W1 — a decision, not a find-and-replace.
3. **Documents carry the number.** Changing it changes every Angebot/Rechnung email and share
   text from that moment; already-issued documents keep the old number. Both are expected, but the
   old number should stay reachable (or forwarded) for as long as issued documents name it.
