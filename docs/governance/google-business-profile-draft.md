# Google Business Profile — ready to enter

**Status: prepared in the repository, not entered anywhere.** Created
2026-10-06, completed 2026-10-07 (Iteration 2A). Marcel creates, verifies and
edits the profile in Google's own interface; no code in this repository
touches a Business Profile, and none will. Everything below is decided except
what only the owner can know, which is marked **OWNER FACT**.

**The old Maxpromoprint profile is not touched** — not edited, merged, renamed
or closed from here (§8).

---

## 1. Business model — service-area business, address hidden

Maxpromo Digital works at its clients' premises: the founder travels to
observe how work actually runs, collect the existing forms and documents,
design the digital version, configure and implement it on site, train the
staff and support adoption. Clients are not received at a Maxpromo location.
Google's model for that is a **service-area business**:

- In setup, answer that you **deliver goods and services to customers** and
  that customers do **not** visit your location. The address is entered for
  verification only and is **hidden** from the public profile.
- No storefront, no opening hours for walk-ins, no map pin on a residence.
- The prospective office arrangement is **not** used: it is not an approved
  Maxpromo location. See §9 for how it is added later without rework.

**OWNER FACT:** the address Google verifies against. If it is residential, it
stays hidden — which a service-area profile guarantees.

## 2. Name, website, phone

| Field | Value |
|---|---|
| Business name | `Maxpromo Digital` — exactly as on the website and the Impressum. Nothing appended: a keyword or city in the name breaks Google's guidelines and is the most common cause of suspension |
| Website | `https://www.maxpromo.digital` — the canonical host; it redirects visitors to their language |
| Phone | the business number already published on the Impressum and in the site's structured data — the same number, so the profile and the site agree |
| Hours | leave unset. No hours are published anywhere; inventing them would be the first false fact on the profile |

## 3. Categories — candidates, to be confirmed in Google's picker

Google's category list is only available inside its interface and changes over
time; it could not be verified from this repository. These are **candidates**:
type each into the category field and choose the closest exact match Google
offers. If a candidate does not appear, skip it rather than pick something
merely similar.

| Role | Candidate to search for | Why |
|---|---|---|
| Primary | **Software company** (DE interface: "Softwareunternehmen") | custom applications, workflow automation and the operating systems are software built for a business — the core of what Maxpromo does |
| Additional | **Business management consultant** ("Unternehmensberater") | the work starts with mapping how a business operates, before anything is built |
| Additional | **Website designer** ("Webdesigner") | the web-development capability |

Do not add categories for tools (automation platforms, AI) or for things the
site does not offer.

## 4. Service area — OWNER FACT

No cities are proposed here: the website states no service area, and choosing
one is a business decision, not an SEO one. Google allows up to 20 areas
(cities, postcodes or regions). Whatever is chosen, tell engineering in one
line: it then goes into the About page and the Organization markup
(`areaServed`) together, so profile and site say the same thing.

## 5. Description (German, ≤ 750 characters)

> Maxpromo Digital baut und verbessert die Systeme, auf denen Betriebe laufen:
> Prozessautomatisierung, individuelle Anwendungen, Webentwicklung sowie
> Content- und Produktabläufe. Wir fangen bei dem an, was Ihren Betrieb
> ausbremst – doppelt erfasste Daten, Werkzeuge, die nicht miteinander
> sprechen, Aufgaben, die hinter einer Person warten – und nicht bei dem, was
> wir verkaufen. Wir arbeiten vor Ort bei unseren Kunden: Wir sehen uns an, wie
> die Arbeit heute läuft, richten das System ein und schulen das Team.
> Entscheidungen bleiben bei Menschen. Beratung auf Deutsch und Englisch, mit
> Sitz in Essen.

Every sentence restates what the website or the business model already says.
No figures, no client names, no experience the evidence registry does not
hold.

## 6. Services (no prices)

One service per capability, each linking to its page. Google shows a name and
a short description; prices are left empty because none are published.

| Service (DE) | Description | Page |
|---|---|---|
| Prozessautomatisierung | Dieselben Angaben nicht mehr von Hand weiterreichen. Einmal erfassen, richtig weiterleiten, Arbeit vorbereiten, Ergebnis festhalten. Entscheidungen bleiben bei Menschen. | `/de/solutions/workflow-automation` |
| Individuelle Anwendungen | Wenn Tabellen und Standardsoftware nicht mehr passen: interne Anwendungen, Portale und operative Systeme, gebaut um den Ablauf, den Ihr Betrieb wirklich hat. | `/de/solutions/custom-applications` |
| Webentwicklung | Eine Website, die einen Teil der Arbeit übernimmt: Anfragen, die ankommen, Weiterleitung nach Inhalt und Verbindung zu den Systemen, die Sie ohnehin nutzen. | `/de/solutions/web-development` |
| Inhalte und Social Media | Erfassen, vorbereiten, prüfen, veröffentlichen, festhalten. Die Maschine bereitet vor, ein Mensch entscheidet, wie der Betrieb nach außen klingt. | `/de/solutions/content-operations` |
| Produkt- und Handelsabläufe | Ein führender Ort für Produktangaben, und Kanäle, die ihm folgen. Preise und Zusagen bleiben eine menschliche Entscheidung. | `/de/solutions/product-operations` |

Names and descriptions are the pages' own titles and meta descriptions,
word for word, so profile, search result and page agree.

## 7. Brand assets and photos

| Slot | Asset | Note |
|---|---|---|
| Logo | the approved primary logo (`apps/web/public/logo.png`, derived from the brand master) | square crop needed by Google: use the approved icon master, not a new artwork |
| Cover | the approved corporate card (`apps/web/public/images/seo/maxpromo-digital-og.png`) | |
| Photos | the founder portrait (`apps/web/public/images/homepage/founder.jpg`); later, real on-site work photographed with the client's permission | no generated images, no stock, no screenshots carrying client data. The public OS proof images are redacted for the website; check each again before uploading anywhere else |
| Reviews | ask real clients after real work | never friends, never incentivised, never invented |
| Posts | none at setup | belongs to a later content-distribution package |

## 8. The old Maxpromoprint profile — OWNER FACT

Only the owner knows whether the print business continues. Options, in
Google's interface: keep it separate if it does; mark it permanently closed if
it does not; ask Google support about a name change if it should become this
business. Two active profiles for one business at one address can be flagged
as duplicates, so decide before verifying the new one.

## 9. Later: a legitimate hybrid location

If a staffed office opens and the owner decides to receive clients there:

1. In the profile, add the address and turn on "customers visit this
   location"; keep the service areas.
2. In the repository, add the office as the Organization's `location` (a
   `Place` with its address) in `siteGraph()` (`apps/web/lib/seo/schema.ts`),
   and the address to the About page. Nothing else changes: every page already
   points at `#organization`.
3. Opening hours then become publishable, on the profile and in the markup
   together.

Until then: no address, no hours, no coordinates — on the profile or the site.

## 10. After it is live

Send engineering the public profile URL: it goes into the Organization's
`sameAs` in `siteGraph()`, one line. Then check that name, phone and website
on the profile match the Impressum exactly.
