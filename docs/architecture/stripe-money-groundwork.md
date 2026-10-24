# Stripe ↔ Maxpromo Money — groundwork (design record)

Status: **superseded by the implementation, 2026-10-24 — see [ADR-0025](../adr/0025-money-domain-and-stripe-rail.md)**.
The proposed schema below became `apps/web/db/migrations/0019-money-domain.sql` with two changes the code
review forced: payment requests are OS-owned stable links (Checkout Sessions expire within 24 h, so a link in an
emailed invoice cannot be a session), and refunds are reversals against the one ledger. `pay.maxpromo.digital` is not needed.

Stripe is a **payment rail inside the Money domain of the Business Control Plane**. Maxpromo OS
remains the source of truth for clients, quotes, invoices, payments and attention. Stripe is not a
CRM, an invoice brain, a customer master, a workflow engine or a dashboard.

## 1. What exists today (forensic, 2026-10-24)

| Piece | Where | Relevance |
|---|---|---|
| Invoices with currency (EUR/GBP), deposit (`anzahlung`), `restbetrag`, kinds standard/deposit/final, payment method bank/momo/both | `os_invoices` (schema.sql, 0009, 0011) | The thing a payment request is for |
| Quotes (Angebote) → accepted → deposit/final invoices, one each per quote (unique index) | `os_angebote`, `uq_os_invoices_angebot_kind` | Quote → invoice chain already enforced |
| **One payment path**: `recordPaymentLocked` — row lock on the invoice, insert into `os_payments` only if it does not overpay, mark paid at zero, close invoice follow-ups, in one transaction | `lib/commercial/capabilities/documents.ts` | Stripe must enter here, nowhere else |
| One definition of money owed: `invoiceBalance` / `receivables` (open, overdue, drafts, reconcile) | `lib/commercial/money.ts` | Attention, briefing, Ask Max already read it |
| Approval engine (AMBER, payload hash, single execution, uncertain outcomes) | `lib/commercial/engine.ts` | Refunds and payment links go through it |
| Audit (`os_audit`), activities timeline (`os_activities`) | 0011 | Every Stripe effect is recorded |
| Webhook patterns: Bearer verification with constant-time compare and bounded reads (Hostinger), HMAC + nonce + replay window (agent door) | `lib/mail/provider.ts`, `lib/commercial/agent-gate.ts` | Same discipline for Stripe signatures |
| Idempotency: provider idempotency keys derived from record + content (`direct.ts`), request ledger (`os_agent_results`), intake receipts | various | Same for Stripe API calls and events |
| Money attention: overdue, drafts, accepted-not-invoiced, payments disagree; briefing money lines | `views.ts` | Gains Stripe states below |

## 2. Target flow

```
QUOTE ─accept─▶ INVOICE ─issue─▶ PAYMENT REQUEST ─(Checkout/Payment Link on pay.maxpromo.digital)─▶ STRIPE
                                                                                                     │
OS MONEY STATE ◀─ INVOICE RECONCILIATION ◀─ PAYMENT LEDGER ◀─ VERIFIED WEBHOOK ◀──────────────────────┘
      │                     (recordPaymentLocked)         (stripe_events, idempotent)
      ├─ STRIPE FEE ─▶ AVAILABLE BALANCE ─▶ PAYOUT ─▶ REVOLUT (EUR)
      └─ ATTENTION / BRIEFING / ASK MAX
```

## 3. Design

**Payment request.** `payment.request` (AMBER) creates one Stripe Checkout Session (or Payment Link)
for one issued invoice's open balance in its own currency, with `metadata.invoice_id`,
`metadata.invoice_number` and an idempotency key `invoice:<id>:<open balance>:<revision>`. The URL is
stored on the invoice's request row and can be put into the invoice email (transactional family
`invoice`, one action button — `safeActionUrl` already allows `pay.maxpromo.digital`). Stripe Tax
stays off (Kleinunternehmer, § 19 UStG: no VAT is ever calculated or shown).

**Verified webhook.** `POST /api/channels/stripe`: raw body read with a byte bound, `Stripe-Signature`
verified (HMAC-SHA256 over `t.payload`, constant-time, 5-minute tolerance) with the endpoint secret;
anything else 400/401 without detail. Each event is inserted once into `stripe_events(event_id PK)`;
a duplicate delivery answers 200 and does nothing. Processing happens after the insert, in the same
request where possible, retried by Stripe otherwise. Events handled:

| Event | Effect in the OS |
|---|---|
| `checkout.session.completed` / `payment_intent.succeeded` | `recordPaymentLocked(method='stripe', reference=pi_…)` for the invoice in metadata; amount and currency must match the invoice's open balance, else **reconcile** state, never a silent write |
| `payment_intent.payment_failed` | request state `failed`; attention item if the invoice is overdue |
| `charge.refunded` / `refund.updated` | `stripe_refunds` row; negative ledger entry; invoice back to open for the refunded amount (owner-visible) |
| `charge.dispute.created` / `.closed` | `stripe_disputes` row; **critical** attention and owner notice (ADR-0024); outcome recorded |
| `balance.available`, `payout.paid` / `payout.failed` | `stripe_payouts`; payout to Revolut shown in Money; failure is critical |

**Ledger and fees.** `stripe_charges` holds gross, fee and net per charge (from the balance
transaction), so Money shows *received from the client* (gross, what settles the invoice) separately
from *Stripe fees* and *paid out to Revolut*. Fees never reduce what the client owes.

**Payment states** (per request): `requested → pending → succeeded | failed | expired | cancelled`;
refunds `pending → succeeded | failed`; disputes `needs_response → under_review → won | lost`;
payouts `pending → in_transit → paid | failed`.

**Failure handling.** Stripe API call timeouts are `uncertain` (engine) and never retried blindly;
webhooks are the truth for outcomes. An event for an unknown invoice is stored and surfaced as
`reconcile`, never dropped. Amount/currency mismatches are reconcile items, never partial writes.

**Audit.** Every request, event application, refund and payout writes `os_audit` (actor
`stripe:webhook` or the approving owner) and an `os_activities` line on the client.

**Attention (Money).** New keys: payment received (info, briefing only), payment failed on an overdue
invoice, dispute opened (critical, pushed), refund issued, payout failed (critical, pushed), Stripe
event needs reconciliation. Briefing "Since yesterday" gains received payments by rail and payouts.

## 4. Proposed schema (not applied)

The draft migration (removed; the applied schema is `apps/web/db/migrations/0019-money-domain.sql`) was:
`stripe_payment_requests`, `stripe_events`, `stripe_charges`, `stripe_refunds`, `stripe_disputes`,
`stripe_payouts`, all keyed to `os_invoices`/`os_clients`, additive, with the uniqueness that makes
replays harmless. It moves to `apps/web/db/migrations/` only in Phase A, after review.

## 5. Test strategy

Offline proofs (no network): signature verification (valid, wrong secret, changed body, stale
timestamp, duplicate event), each event type against a recording SQL port, mismatch → reconcile,
concurrent duplicate deliveries → one payment, refund/dispute state machines. Evidence database:
end-to-end with Stripe's **test mode** keys and `stripe trigger`/fixtures through the real webhook
route. Production: one real low-value payment by the owner on his own card, refunded, observed in
OS Money, the Stripe dashboard and the payout schedule.

## 6. What Marcel provides for Phase A

See the product completion ledger, section "Stripe — owner items". In short: test-mode secret key,
live secret key (restricted key preferred), the webhook endpoint signing secret(s) after the
endpoint is created, the `pay.maxpromo.digital` DNS record Stripe asks for, and decisions on
Checkout vs Payment Links and on which invoices may be paid by card.
