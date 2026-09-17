# ADR-0014 — A supported language is complete across the product

**Status:** accepted · 2026-09-17
**Supersedes:** nothing. **Related:** ADR-0004 (a check must be able to fail),
ADR-0009 (a product has one identity), ADR-0010 (nothing fails silently).

---

## Context

`agents.maxpromo.digital` was declared a German product. Its landing page was
German, and inside it sat "Operating Model", "Audit Console", "Approval Desk",
"Supervised Mode", "System Preview", "Proposal Ready", "Approve Preview" —
English written by developers, in German navigation, read by German customers.
There was no way to use the product in English at all: not a partial English,
none.

Every gate passed the whole time. `check:domains` confirmed the host declared
`languages: ['de']` and served German. The token, icon, responsive and
typography audits have nothing to say about which language a string is in. The
one thing nobody had written was the check that would have said *this product
claims one language and speaks one and a half*.

The instruction to make Agent Bureau bilingual had been given more than once
and deferred each time, because "translate the product" reads as a large task
next to a release, and a landing page can be translated in an afternoon. That
is exactly how a product ends up with a bilingual front door and a monolingual
building.

## Decision

**A language listed for a host in the Domain Registry is a promise that every
user-visible surface of that host exists in it.** Not the marketing pages. Not
the pages that were easy. Every surface a person can reach, including behind
authentication, including empty states, error states, validation messages,
accessible names, diagram labels and the text of a generated draft.

Three things follow, and all three are mechanical:

1. **Text lives in the catalogue; files hold structure.** A data module that
   carried prose now carries ids, order and relationships, and the words are
   keyed by the record's own id. The supervision contract this product is built
   on — which actions an agent may not take without asking — is expressed as a
   count in structure and asserted against the catalogue, so a translation
   cannot quietly narrow it.

2. **No runtime fallback between languages.** A missing key throws in
   development and logs in production. Substituting the other language is how a
   page ends up half German, and it hides the defect from everyone who could
   fix it.

3. **The rule is a gate, and the gate is proven.** `check:i18n` runs in
   `verify`; `prove:i18n` stages each regression it claims to catch and
   requires it to be caught and named (ADR-0004).

## What this does not say

It does not say every string in the repository must be translated.

- **Records are not translated.** A customer's name, a customer's message, a
  client's file, the note a consultant wrote: these are data, and no product
  translates them. An English operator of a German business reads German
  customer records, as they would with real data. The demo fixtures that stand
  in for records behave the same way, and say so where they live.
- **Instructions to a model are not interface text.** The system prompt stays
  in one reviewed voice; what follows the reader is the language the model is
  told to answer in.
- **Legal text is not translated by a translator.** German disclosure and data
  protection text discharges obligations under German law. Translating it would
  produce a second legal text nobody has reviewed. The chrome is localised and
  the reader is told, in their own language, why the body is not.

Each of those is marked where it is, with `i18n-exempt` and a reason, so an
exemption is a decision somebody wrote rather than a silence.

## Consequences

- Adding a user-visible string means adding two, in both message files. The
  build says so.
- Adding a language is a deliberate act with a cost, which is the honest
  position: the registry's own rule already said a domain does not list a
  language it cannot serve completely.
- `agents.maxpromo.digital` now declares `languages: ['de', 'en']` and can be
  held to it.
- The next product that claims a language inherits the check for free.
