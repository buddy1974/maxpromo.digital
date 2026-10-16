# ADR-0019 — A public channel gets no tools: WhatsApp reaches Maxpromo OS through four fixed operations

**Status:** **proposed** · 2026-10-16 · awaiting Marcel. Built and proved locally; nothing is
connected to Meta or production. Acceptance is required before production migration 0012, the
Vercel environment, or webhook registration.
**Related:** ADR-0018 (the OS is the commercial system of record), ADR-0010 (nothing fails
silently), ADR-0004 (checks must fail loudly). Reference: `docs/architecture/whatsapp-gateway.md`.

---

## Context

Maxpromo's public WhatsApp Business number (+49 174 5910734) is to become a doorway a business
owner can write to in their own words, with the conversation landing in Maxpromo OS — and a live
demonstration of what Maxpromo builds.

The platform already has an agent path into the OS: Telegram → OpenClaw Mission Control → the
signed agent API (ADR-0018). It is built for **one** person. Its allow-list holds Marcel's numeric
id, and every capability in the registry — GREEN included — is written for the owner, who may read
the whole business (`commercial.search`, `owner.overview`, `lead.find`). A WhatsApp sender is a
stranger. Reusing that path, or the registry, for a public channel would hand every stranger the
business.

## Decision

1. **The gateway lives in the web deployment** (`/api/channels/whatsapp`, `lib/channels/`).
   Meta needs a public HTTPS endpoint; Mission Control is loopback-only on the workstation; the OS
   and its database are here. The Telegram lane is not involved and not changed.
2. **The model has no tools.** It writes one reply and reports validated fields (language, intent,
   facts, summary, wants a person, urgency, sensitive data). Code chooses every action from those
   fields.
3. **Four fixed operations into the OS** (`PUBLIC_CHANNEL_CAPABILITIES`): `lead.check` by verified
   phone, `lead.create`, `note.add` on the conversation's own lead, `incident.create` on a client's
   own record — each through the commercial engine (idempotent per message, audited under actor
   `whatsapp:<conversation>`). Nothing else in the registry is reachable from a public channel.
4. **Identity is the verified phone number, never a typed name.** A record is linked to a
   conversation only when it carries the WhatsApp-verified number; a name match becomes a
   separate lead flagged to Marcel.
5. **Replies only, inside the customer's window.** The gateway answers a message the customer sent,
   within the 24-hour service window, never initiates, and sends no templates. The 2026-10-07
   decision "WhatsApp is opened, never sent" stands for **outreach**: Marcel's messages to
   prospects are still opened as `wa.me` links and never sent by the system.
6. **Marcel can always take over, and Max yields.** A request for a person, a complaint, an
   emergency, a client's need, or a failed model hands over with a true acknowledgement; Marcel
   typing in the Business App (coexistence echo) silences Max; Max resumes only after the
   configured hours of Marcel's silence.
7. **Conversation state extends the existing `chat` schema** (migration 0012), not a second store.
8. **Outbound words pass a deterministic guard**: no prices, discounts, commitments, foreign links,
   emails, phone numbers, secret shapes or leaked instructions.
9. **Rollout dials**: `WHATSAPP_AUTOMATION` off (default) → shadow → on; a pilot allow-list.

## Consequences

**Good.** A stranger's words can, at most, create one lead, add one note and open one incident on
records tied to their own number; they cannot read anything. Prompt injection has nothing to
operate. Every external call is idempotent; a timed-out send is uncertain, never repeated.
Marcel is told through the notice path he already uses. Another channel is another adapter.

**Cost.** A fifth authentication mechanism on the web deployment (Meta's signature) with an app
secret and a verify token to hold. Message text is stored (90-day default) and passes to Meta and
the model provider — privacy obligations (§8 of the reference). A public endpoint answered by a
model costs money per message; bounded by a per-conversation daily allowance.

**Not decided here.** The coexistence onboarding route (Tech Provider vs. BSP), billing, the
privacy notice, which number the Impressum shows, and the native greeting/away policy — owner
actions, listed in the reference §14.

## Alternatives rejected

- **Through Mission Control / the agent API.** The wrong trust boundary (owner-only), and not
  reachable by Meta.
- **The model with a restricted tool list.** A tool the model can call is a tool a prompt
  injection can call; fixed code paths are smaller and provable.
- **A separate conversation table set.** `chat` already had the conversation, the handover state
  and the message list; a second store would be the platform's most expensive failure again.

## Verification

`npm run prove:whatsapp-gateway` (in `verify`): the real modules against fakes — signature,
configuration, normalisation, policy, guard, the 25 journeys of the brief and the adversarial
set, each safety property mutation-tested. `npm run prove:whatsapp-live`: the real route on a dev
server in evidence mode, the evidence database, the real model, a loopback Graph mock.
`prove:evidence-isolation` now classifies `graph.facebook.com` and proves the transport guard.
