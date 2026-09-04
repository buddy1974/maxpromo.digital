# Delivery commitments

Date: 2026-09-04 · v9.5 · **Proposed single source of truth. Two values need
Marcel's confirmation before this can be applied.**

A duration stated publicly is a commitment. The site currently states several
of them more than once, with different values, and a buyer plans around them.
This document is the framework Part 4 asks for: one value per commitment, and
the list of every page that has to inherit it.

`npm run audit:claims` reports any page that disagrees with this table once the
open values are set.

---

## The framework

| Commitment | Value | Status |
|---|---|---|
| **The first conversation** | 30 or 45 minutes | 🔴 **conflicted** — stated both ways |
| Free, no commitment | yes | ✅ consistent everywhere |
| **Business assessment** — workflows documented | 1–2 days | ✅ stated once |
| **Design** — scope, tools, integrations | 2–3 days | ✅ stated once |
| **Build and go live** | 1–4 or 2–6 weeks | 🔴 **conflicted** — stated both ways |
| Time from business check to start | within one week | ⚠️ stated once, on `/pricing` only |
| **Reply to an enquiry** | one business day | ✅ consistent everywhere |
| **Cancellation notice** | 30 days | ✅ stated once, on `/pricing` |
| Build work floor | €999 | ✅ stated once |
| **Maintenance after launch** | — | 🔴 **contradicted** — see below |

---

## The two conflicts

### The first conversation — 30 minutes or 45?

They are the same meeting. The two sentences describing it end identically,
word for word:

> Homepage — *"Thirty minutes on your workflow. **Afterwards you will know
> where the time is going, whether or not we work together.**"*
>
> /about — *"Around 45 minutes walking through how your business actually
> works. **Afterwards you will know where the time is going, whether or not we
> work together.**"*

| Value | Where |
|---|---|
| **30 minutes** | `home.process.p1Time`, `home.finalCtaDesc`, `home.finalCtaFootnote` — both locales |
| **45 minutes** | `about.ctaDesc`, and all six industry pages — both locales |

Forty-five is stated in more places and by the pages that describe the meeting
in most detail. Thirty is what the homepage promises a visitor who is about to
book one. **Marcel decides**; the losing value is then changed everywhere in
one edit.

> Note: the homepage sentence was rewritten in v8.0 to reuse the industry
> pages' promise, which is what brought the two into near-identical form and
> made the discrepancy legible. The discrepancy predates that edit.

### Build and go live — 1–4 weeks or 2–6?

| Value | Where |
|---|---|
| **1–4 weeks** | `home.process.p4Time` — the process section |
| **2–6 weeks** | `home.faq.items[0].a` — the FAQ, four sections below it on the same page |

Both are on the homepage. A visitor who reads the page top to bottom sees both.

For context, and **not** as an argument for either value: the three case
studies were delivered in 4, 6 and 8 weeks. Those are evidence about three
specific projects rather than a commitment, and `audit-claims` deliberately
excludes them from this comparison — but a buyer comparing the promise with
the proof on the same site will notice that every published project took
longer than the process section promises.

---

## The contradiction that is not a duration

**Is maintenance included or is it a subscription?**

> Homepage FAQ — *"What happens after launch? We stay on. Maintenance,
> adjustments and improvements are **included, not billed as extras**."*
>
> /pricing — three monthly plans at €149 / €249 / €399 whose contents are
> maintenance.

"Included" plausibly means *included in your plan rather than billed on top*.
A prospect reads it as *free*. That gap is the kind that becomes a dispute
after signature, and it is a commercial question rather than a wording one —
see `pricing-alignment-review.md`.

---

## What every page must inherit

Once the two open values are set, these are the surfaces that state them:

**The first conversation** — homepage process step 1, homepage closing block
and its footnote, `/about` closing block, all six industry pages, all six
solution pages (*"a conversation, not a pitch"*), `/pricing` closing block.

**Build and go live** — homepage process step 4, homepage FAQ item 1,
`/pricing` FAQ item 2 (which states time-to-start rather than build duration,
and should say so).

**Reply to an enquiry** — `/contact` subtitle, `/contact` response card,
`/contact` success state, `/case-studies` closing block. All four already say
one business day.

---

## How this is kept

`packages/tooling/audit-claims.mjs`, in `npm run certify`. It groups durations
by what they commit to and reports any commitment carrying more than one value,
in either language. It found both conflicts above, in both locales, after three
attempts at the grouping and two at German morphology — the failures are
documented in the file, because a rule that reports the English half of a
translated pair looks correct in every English review it will ever get.

**Known limit.** `pricing.faq.a2` — *"we typically start within one week"* — is
reported under *building and going live*. It is a time-to-start commitment, not
a build duration, and the two share a key group. It is listed rather than
silenced, because a rule that quietly drops what it cannot classify is the
failure mode ADR-0004 exists to prevent.
