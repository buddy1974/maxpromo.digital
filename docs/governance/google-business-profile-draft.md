# Google Business Profile — DRAFT FOR OWNER REVIEW

**Status: DRAFT. Nothing here has been entered anywhere.** Created 2026-10-06
(Iteration 2A). The profile is created, verified and edited by Marcel in
Google's own interface. No code in this repository touches a Business Profile,
and none will.

**The old Maxpromoprint profile is not touched** — not edited, merged, renamed
or closed from here. What happens to it is Marcel's decision, made in Google's
interface (see §7).

Every line marked **OWNER REVIEW REQUIRED** is a proposal, not a fact.

---

## 1. Business type — service-area business, address hidden

Maxpromo Digital serves clients where they are and does not receive them at
premises. Google's model for that is a **service-area business**:

- An address is still entered for **verification**, but it is **hidden** from
  the public profile ("I deliver goods and services to my customers" → do not
  show the address). Google uses it only to verify and to place the service
  area.
- **No storefront** is claimed. No street address is shown. No pin on a
  residence.
- The future Esosa office address is **not** used. If a staffed office opens
  and the owner decides to receive clients there, the type can change then.

**OWNER REVIEW REQUIRED:** which address Google verifies against. If it is a
residential address, it must stay hidden; a business-address service is an
alternative (see `seo-owner-actions.md`, item 6).

## 2. Name

`Maxpromo Digital` — exactly the trading name on the website and the Impressum.
No keywords or city appended to the name (Google's guidelines forbid it, and it
is the most common reason profiles are suspended).

## 3. Categories — OWNER REVIEW REQUIRED

Google's category list changes and must be checked in the interface at the
time of setup. Candidates, in order of fit:

| Role | Candidate (DE interface / EN) | Fit |
|---|---|---|
| Primary | **Softwareunternehmen** / Software company | custom applications, workflow automation, the OS — closest to "builds the systems businesses run on" |
| Additional | **Website-Designer** / Website designer | `/solutions/web-development` |
| Additional | **Internetdienstleister** or **Unternehmensberater** — only if Marcel considers the description accurate | consulting part of the work; check the wording Google offers |

**OWNER REVIEW REQUIRED:** the primary category. It is the strongest single
relevance signal on the profile; pick the one a client would search for.

## 4. Service area — OWNER REVIEW REQUIRED

**No cities are proposed here.** The website states no service area, and
inventing one would be the same fabrication this repository forbids elsewhere.
Marcel decides, e.g. "Essen and the Ruhr area", "North Rhine-Westphalia", or
"Germany" — Google allows up to 20 areas. Whatever is chosen should then also
be stated on the website (About page) so the two agree, and may then be added
to the Organization markup as `areaServed`.

## 5. Description (German, ≤ 750 characters) — OWNER REVIEW REQUIRED

> Maxpromo Digital baut und verbessert die Systeme, auf denen Betriebe laufen:
> Prozessautomatisierung, individuelle Anwendungen, Webentwicklung sowie
> Content- und Produktabläufe. Wir fangen bei dem an, was Ihren Betrieb
> ausbremst – doppelt erfasste Daten, Werkzeuge, die nicht miteinander
> sprechen, Aufgaben, die hinter einer Person warten – und nicht bei dem, was wir
> verkaufen. Entscheidungen bleiben bei Menschen: Was ein System vorbereitet,
> prüft und gibt eine Person frei. Beratung auf Deutsch und Englisch, mit Sitz
> in Essen.

Every sentence is taken from, or restates, what the website already says. No
figures, no client names, no claims of experience the evidence registry does
not hold. Optional English version for the owner's reference only; Google shows
one description.

## 6. Other fields

| Field | Proposal | Note |
|---|---|---|
| Website | `https://www.maxpromo.digital/de` | the canonical German home page |
| Phone | the published business number (as on the Impressum) | OWNER REVIEW REQUIRED — the same number as the site, or a dedicated line |
| Opening hours | **leave unset**, or "by appointment" | no hours are published anywhere; do not invent them |
| Services | Prozessautomatisierung · Individuelle Anwendungen · Webentwicklung · Content-Abläufe · Produkt- und Commerce-Abläufe | one per capability page, each linking to its page; **no prices** |
| Photos | logo (brand master), the approved corporate card, the founder portrait | approved assets only; no generated images, no proof screenshots with client data |
| Products / offers | none | nothing priced is published |
| Reviews | none solicited from friends or invented | real clients may be asked after real work |
| Posts | none at setup | a later content-distribution package, not this one |

## 7. The old Maxpromoprint profile — OWNER DECISION, nothing done here

Options, for Marcel to weigh in Google's interface: keep it separate if the
print business continues; mark it permanently closed if it does not; or ask
Google support about moving it to the new name. Two active profiles for one
business at one address can be flagged as duplicates, so this should be decided
before the new profile is verified.

## 8. After it is live

- Add the profile URL to the Organization `sameAs` (one line in
  `apps/web/app/[locale]/layout.tsx`) once it is public and confirmed.
- Check that name, phone and website match the Impressum exactly.
