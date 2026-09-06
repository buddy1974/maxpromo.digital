# ADR-0009 — A product has one identity, and empty slots are declared

**Status:** Accepted
**Date:** 2026-09-05

---

## Context

ADR-0008 gave every domain one record. That closed the question "which property
is this request for" and left the next one open: **what does this product look
like.**

Four places each held part of the answer, and none held it.

| | |
|---|---|
| `products.ts` | the accent, as `brandColor`, between the headline copy and the FAQ |
| `domains.ts` | the OpenGraph image path and the favicon, restated per domain |
| `app/layout.tsx` | the company logo URL, written into JSON-LD in two files |
| `lib/documents/config.ts` | the wordmark, as two casings of a string |

Nothing was wrong with any one of them. Three things were wrong across them.

**Two products had a semantic token as their brand accent.** HandwerkOS was
`var(--semantic-success)` and PraxisOS was `var(--semantic-info)`. The design
system's third rule is that brand colours are never semantic colours, precisely
because identity and meaning must not share a namespace — a product whose
identity is "success" changes colour if the meaning of success ever does. The
token check could not see it: that check looks for hex literals, and these were
neither hex nor in a file it would have flagged.

**Four of the eleven accents cannot legally be text, and two components colour
text with them.** Measured against white:

```
Brand Lime  #A3E635   1.51:1     restaurant-os · agent-bureau · maxpromo-os
CareOS      #14B8A6   2.49:1
Drive24     #009A44   3.68:1
PrintShop   #EC008C   4.25:1     passes the 3:1 non-text edge, fails 4.5:1 text
```

`Faq.tsx` colours its open-state toggle with the accent, and `Onboarding.tsx`
sets a step label in the accent on a 12% tint of itself. On restaurant-os.de and
agent-bureau that label is lime on near-lime.

The platform has had exactly this rule for its own accent since v3 —
`--brand-primary` is a fill and `--brand-primary-text` is the 5.00:1 text form —
and `check:tokens` enforces it. Product accents were never held to it because
that check knows one token name and a product accent is a different value under
a different name. The rule existed; its scope did not.

**Nothing could say what was missing.** There was no logo, no monochrome logo,
no Apple touch icon and no product favicon anywhere in the platform. That is not
a defect — no product mark has been designed — but it was also not visible.
Absence leaves no artefact to audit.

## Decision

**One brand record per product, in `packages/config/brands.ts`.**

It carries name, short name, company, tagline and description; the accent, its
accessible text form, the theme colour and the dark theme colour; and every
asset that carries the identity — logo, monochrome logo, wordmark, favicon,
Apple touch icon, manifest icons, OpenGraph and Twitter images, PDF and email
marks; and the typography, which is `inherit` for every product and always will
be unless an ADR says otherwise.

Three parts of that are the decision rather than the schema.

**The accent is a fill and has a separate text form, per product.** Where the
accent already reaches 5:1 on white it is repeated unchanged, and the audit
rejects a needless second value. Where it does not, the text form is the accent
scaled toward black — same hue, same saturation, enough darker to read.
Measured, not chosen. Both are published as `--showcase-accent` and
`--showcase-accent-text`, and the two components that colour text now use the
second.

The two semantic-token accents became the literal colours those tokens resolve
to, so **nothing renders differently**. They are simply no longer in the wrong
namespace.

**Empty slots are declared, with a reason.** A registry that lists only what
exists cannot tell you what is missing. `audit-brand-assets.mjs` classifies
every slot KEEP / REPLACE / CREATE / REMOVE and prints the counts every run:
today 17 / 42 / 35 / 0. An asset slot that is not `own` and carries no note is a
finding, because an empty slot with no reason is indistinguishable from an
oversight.

That rule caught its own registry on its first run — thirty-five slots sharing
one silent constant.

**Copy stays out.** Headlines, sublines, FAQ answers and workflow descriptions
remain in `products.ts`, localised. The Brand Registry declares *where* a
product's metadata comes from, not what it says. The one English string here is
the tagline, used where no locale is known — a manifest, a report.

## Consequences

**The Domain Registry now reads from the Brand Registry.** A domain's social
card and favicon are derived, not restated, and `purposeBuilt` is computed from
the real aspect ratio rather than asserted. Two declarations of one image is how
the hyphenation of `real-estate-os` gets written correctly in one place and
incorrectly in the other.

**`packages/config` is loadable by Node.** Relative imports inside the package
carry the `.ts` extension and `allowImportingTsExtensions` is set, so the audits
import the registries as modules instead of re-parsing them. A check that reads
its own second reading of the source is checking its parser.

**A new gate and a new proof.** `check:brands` is gate 3; `prove:brands` breaks
the registry eleven ways and asserts the audit reports each one, as
`prove:domains` does for ADR-0008. Both are checked in, because a demonstration
nobody can re-run is a claim rather than evidence.

**Thirty-five asset slots are open.** Eleven product marks, twelve monochrome
marks, twelve Apple touch icons, and forty-two replacements — every product
domain shares the company favicon, and every social card is a 1536×1024 product
image where a 1200×630 card belongs. All design work, all counted on every run.

## Alternatives considered

**Leave the accent in `products.ts`.** It was working. But it sat among content
in a file the token check exempts wholesale as "data", which is exactly how a
semantic token became a brand identity without anything noticing. Identity
audited as identity is the point.

**Darken the four failing accents themselves rather than adding a text form.**
Simpler, and wrong: the accent is a *fill*, and on a fill the light values are
correct — black text on Brand Lime is 12.52:1. Darkening the fill to satisfy a
text rule would degrade the surface the fill is for, to fix two components.

**Generate the missing marks.** Refused. A plausible-looking product logo
invented here would be indistinguishable from one that had been designed, and
would be adopted by every surface the moment it existed. Declared absent with a
reason is honest; the audit counts it every run.
