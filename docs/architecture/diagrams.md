# Platform Diagrams

Ten diagrams for a senior engineer arriving at this repository. Each answers
one question and names the file that is the authority for it.

Nothing here is a second explanation. Where a diagram and its source file
disagree, the file is right — these are maps, and the territory is the code.

Start with §1 and §3. Between them they explain most of what is unusual about
this platform: one deployment serving ten public domains, and identity resolved
before anything else happens.

---

## 1. Repository layout

```mermaid
graph TD
  ROOT["maxpromo.digital<br/>npm workspaces"]

  ROOT --> APPS["apps/"]
  ROOT --> PKGS["packages/"]
  ROOT --> DOCS["docs/"]

  APPS --> WEB["web<br/>10 public domains + /os"]
  APPS --> BUR["bureau<br/>agents.maxpromo.digital"]

  PKGS --> CFG["config<br/>legal · domains · brands"]
  PKGS --> TOK["design-tokens<br/>brand.css + TS mirror"]
  PKGS --> UI["ui<br/>shared components"]
  PKGS --> TOOL["tooling<br/>audits · eslint · tsconfig"]

  WEB --> CFG
  WEB --> TOK
  WEB --> UI
  BUR --> CFG
  BUR --> TOK
  BUR --> UI

  DOCS --> CONST["PLATFORM-CONSTITUTION.md"]

  classDef pkg fill:#F7FEE7,stroke:#65A30D,color:#111111
  classDef app fill:#FFFFFF,stroke:#111111,color:#111111
  class CFG,TOK,UI,TOOL pkg
  class WEB,BUR app
```

Dependencies point **downward only**. No package imports from an application —
`audit:platform` fails the build on it, which is why the Domain and Brand
registries live in `packages/config` and read product copy through an adapter
rather than importing `products.ts`.

Authority: **ADR-0001**, `architecture/platform.md`.

---

## 2. Domain Registry

```mermaid
graph LR
  HOST["Host header"] --> NORM["normalise<br/>lowercase · strip port · strip www."]
  NORM --> REG{"DOMAIN_REGISTRY<br/>11 records"}

  REG -->|maxpromo.digital| HUB["hub<br/>de+en · prefixed · routes *"]
  REG -->|agents.maxpromo.digital| BUR["bureau<br/>de · apps/bureau"]
  REG -->|9 product hosts| SHOW["showcase<br/>own identity · 4 routes"]
  REG -->|unknown| HUB

  SHOW --> S1["restaurant-os.de · superhandwerk.de<br/>super-praxis.de · smartprintshop.de<br/>easy-immo24.de · pflege-care24.de<br/>taxkontrol.de — de+en"]
  SHOW --> S2["publishers24.org · drive24.live<br/>en only"]

  classDef k fill:#F7FEE7,stroke:#65A30D,color:#111111
  class REG k
```

An unknown host resolves to the hub rather than to nothing: local development,
Vercel previews and stray DNS all behave as the consultancy site.

The two English-only domains are English-only because that is the copy that
exists — see §7.

Authority: `packages/config/domains.ts`, **ADR-0008**.

---

## 3. Host resolution and the request lifecycle

```mermaid
flowchart TD
  REQ["Request"] --> M0["Resolve domain<br/>one lookup, before anything else"]
  M0 --> STAMP["Stamp x-mp-domain · mode · slug<br/>default-locale · locale"]

  STAMP --> OS{"/os or /api/os?"}
  OS -->|yes, not the hub| OSX["/os → 308 to hub<br/>/api/os → 404"]
  OS -->|yes, hub| AUTH{"session?"}
  AUTH -->|no| LOGIN["redirect /os/login"]
  AUTH -->|yes| RENDER

  OS -->|no| ISO{"domain serves this path?<br/>locale prefix removed first"}
  ISO -->|no| HUBRED["308 → same path on the hub"]

  ISO -->|yes| LANG{"domain speaks this locale?"}
  LANG -->|no| LOCRED["308 → the language it has"]

  LANG -->|yes| PREFIX{"locale prefix in the URL?"}
  PREFIX -->|"primary language's prefix"| STRIP["308 → strip it<br/>one page, one address"]
  PREFIX -->|"none, product domain"| RW["rewrite → /{primary}{path}"]
  PREFIX -->|"hub, or second language"| INTL["next-intl"]

  RW --> RENDER["Render"]
  INTL --> RENDER

  RENDER --> META["Metadata, chrome, footer, canonical<br/>all read the same record"]

  classDef bad fill:#FEF2F2,stroke:#B91C1C,color:#111111
  classDef k fill:#F7FEE7,stroke:#65A30D,color:#111111
  class OSX,HUBRED,LOCRED bad
  class M0,STAMP k
```

**Why isolation runs before locale routing.** "Does this domain serve `/about`"
is a question about the domain, not about the URL's spelling. Asked afterwards
it would have to be asked once per locale form, which is how a rule ends up
enforced on `/de/about` and not on `/about`.

**Why the locale is stamped.** A product domain shows no prefix for its own
language, so the middleware rewrites `/` to `/en` internally and next-intl
never sees that request — `getLocale()` then answers with the routing default.
Both English-led domains served every page as `<html lang="de">` until the
middleware started stating the answer.

Authority: `apps/web/middleware.ts`.

---

## 4. Routing: what each domain serves

```mermaid
graph TB
  subgraph HUB["maxpromo.digital — routes: *"]
    H1["/de · /en"]
    H2["/solutions/* · /industries/*<br/>/resources · /blog · /case-studies"]
    H3["/about · /contact · /agent-bureau · /automation-lab"]
    H4["/impressum · /privacy · /agb"]
    H5["/os/* — staff, this host only"]
  end

  subgraph PROD["a product domain — routes: 4"]
    P1["/ — the product"]
    P2["/contact — this product's consultation"]
    P3["/impressum · /privacy — the operator's"]
  end

  PROD -->|"any other path · 308"| HUB

  classDef hub fill:#FFFFFF,stroke:#111111,color:#111111
  classDef prod fill:#F7FEE7,stroke:#65A30D,color:#111111
  class H1,H2,H3,H4,H5 hub
  class P1,P2,P3 prod
```

Sixteen public routes answered on every product domain before v13.0, chrome-less,
including the contact form that collects personal data and carried no links at
all. Four answer now.

Authority: `PRODUCT_ROUTES` in `packages/config/domains.ts`.

---

## 5. Shared packages and what depends on what

```mermaid
graph BT
  TOK["design-tokens<br/>no dependencies by design"]
  CFG["config"]
  UI["ui"]
  WEB["apps/web"]
  BUR["apps/bureau"]

  CFG --> TOK
  UI --> TOK
  WEB --> UI
  WEB --> CFG
  WEB --> TOK
  BUR --> UI
  BUR --> CFG
  BUR --> TOK

  classDef pkg fill:#F7FEE7,stroke:#65A30D,color:#111111
  class TOK,CFG,UI pkg
```

The token package is dependency-free so it cannot load a webfont. It **names**
one — `--brand-font-sans: var(--font-inter), …` — and each application defines
it. Agent Bureau did not, for a year, and rendered in Segoe UI while the
website rendered in Inter. An undefined `var()` does not warn.

Authority: **ADR-0006**. Gate: `check:token-inputs`.

---

## 6. Design tokens: two layers, and the surfaces that cannot use them

```mermaid
graph LR
  PRIM["Layer 1 — primitives<br/>--mp-black · --mp-lime-400 · --mp-gray-*"]
  SEM["Layer 2 — what components use<br/>--brand-* · --semantic-*"]
  CSS["brand.css<br/>the web"]
  TS["index.ts<br/>token · space · type"]

  PRIM --> SEM
  SEM --> CSS
  PRIM --> TS

  CSS --> COMP["Components, pages, the OS"]
  TS --> EMAIL["Email HTML"]
  TS --> PDF["PDF and print"]
  TS --> MAN["Web app manifests"]
  TS --> BRANDS["Brand Registry theme colours"]

  classDef k fill:#F7FEE7,stroke:#65A30D,color:#111111
  classDef out fill:#FFFBEB,stroke:#B45309,color:#111111
  class PRIM,SEM k
  class EMAIL,PDF,MAN out
```

The amber surfaces have no CSS engine of ours. A custom property written into
an email resolves to nothing — the same silence as an undefined one, and
invisible to the check that looks for undefined ones, because these variables
*are* defined; they simply travel somewhere that cannot read them.

`lib/email.ts` wrote `var(--space-2)` seventy-one times into transactional email
markup and `emailHtml.ts` set the invoice letterhead's company name to
`var(--brand-surface)` on a near-black band. Gate: `check:token-inputs`.

Authority: `brand/design-system.md`, `packages/design-tokens/`.

---

## 7. Identity: the two registries

```mermaid
graph TD
  HOST["Host"] --> D["Domain Registry<br/>keyed by host"]
  D -->|productSlug| B["Brand Registry<br/>keyed by product slug"]
  D -->|productSlug| P["Product Registry<br/>keyed by product slug"]

  D --> R1["routes · languages · canonical<br/>robots · sitemap · chrome"]
  B --> R2["accent · accent-as-text · theme<br/>logo · favicon · social cards"]
  P --> R3["headline · subline · workflow<br/>FAQ — localised"]

  R2 --> D
  R3 --> META["Metadata"]
  R1 --> META
  R2 --> META

  classDef k fill:#F7FEE7,stroke:#65A30D,color:#111111
  class D,B k
```

Three registries, three questions: **which property is this request for**,
**what does this product look like**, **what does it say**. Keyed differently on
purpose — a domain by host, a brand and a product by slug — because one product
reaches a visitor through more than one surface.

The Domain Registry reads its social card and favicon *from* the Brand Registry
rather than restating them. Two declarations of one image is how the
hyphenation of `real-estate-os` gets right in one place and wrong in the other.

Authority: `packages/config/domains.ts`, `packages/config/brands.ts`.

---

## 8. Deployment flow

```mermaid
flowchart LR
  BR["branch"] --> V["npm run verify<br/>12 gates"]
  V --> C["npm run certify<br/>+ a11y · consistency · platform · claims · docs"]
  C --> REV["review — the 7 questions"]
  REV --> APP{"Marcel approves"}
  APP --> MERGE["merge to main"]

  MERGE --> VW["Vercel: web<br/>10 domains · eu-central-1"]
  MERGE --> VB["Vercel: bureau<br/>1 domain · us-east-1"]

  VW --> DOC["update adr / known-risks / change-log"]
  VB --> DOC

  classDef gate fill:#F7FEE7,stroke:#65A30D,color:#111111
  classDef human fill:#FFFBEB,stroke:#B45309,color:#111111
  class V,C gate
  class REV,APP human
```

Two Vercel projects, two databases, two regions, independent rollback. A bad
deploy on `web` is a ten-domain outage, which is why nothing else can cause one.

The bureau's `us-east-1` region is a live compliance question, not a design —
see `governance/known-risks.md`.

Authority: **ADR-0001**, `deployment/vercel.md`.

---

## 9. Certification pipeline

```mermaid
flowchart TD
  V["npm run verify"] --> G1["1 governance<br/>the gate has one definition"]
  G1 --> G2["2 domains"]
  G2 --> G3["3 brands"]
  G3 --> G4["4 tokens"]
  G4 --> G5["5 token-inputs"]
  G5 --> G6["6 icons"]
  G6 --> G7["7 responsive"]
  G7 --> G8["8 typography"]
  G8 --> G9["9 typecheck"]
  G9 --> G10["10 lint"]
  G10 --> G11["11 build"]
  G11 --> G12["12 budgets<br/>runs after build"]

  C["npm run certify"] --> V
  C --> R1["a11y"]
  C --> R2["consistency"]
  C --> R3["platform"]
  C --> R4["claims"]
  C --> R5["docs"]
  C --> R6["dependencies"]

  P["prove:domains · prove:brands"] -.->|"break it, watch it fail"| G2
  P -.-> G3

  classDef gate fill:#F7FEE7,stroke:#65A30D,color:#111111
  classDef report fill:#EFF6FF,stroke:#1D4ED8,color:#111111
  class G1,G2,G3,G4,G5,G6,G7,G8,G9,G10,G11,G12 gate
  class R1,R2,R3,R4,R5,R6 report
```

Budgets run **last** because there is nothing to measure until the build has
produced it, and the check errors rather than passing when no application has
been built.

Governance runs **first** because it checks that the rest of the table is true.
Three things once claimed to be the merge gate, and the one CI ran was a stale
subset of it — reporting green while three gates had never run.

The dotted edges are the ADR-0004 discipline made re-runnable: those two
harnesses break their registries one way at a time and assert the audit reports
each one.

Authority: `governance/standards.md`, **ADR-0004**.

---

## 10. Governance flow

```mermaid
flowchart TD
  CH["A change"] --> Q{"Does it need a decision<br/>nobody has made?"}

  Q -->|"legal · compliance · a public claim"| ESC["STOP — escalate to Marcel"]
  Q -->|"production data · region move"| ESC
  Q -->|"architecture not in an ADR"| ADR["Write the ADR first"]
  Q -->|"bypass a security control"| ESC
  Q -->|"docs contradict the code"| ESC

  Q -->|no| BUILD["Build"]
  ADR --> BUILD
  BUILD --> DOD["Definition of Done — 8 points"]
  DOD --> WRITE["adr/ · known-risks.md · change-log.md"]
  WRITE --> REV["Review"]
  REV --> MARCEL{"Marcel approves"}
  MARCEL --> SHIP["Ship"]

  classDef stop fill:#FEF2F2,stroke:#B91C1C,color:#111111
  classDef human fill:#FFFBEB,stroke:#B45309,color:#111111
  class ESC stop
  class MARCEL human
```

No agent approves its own work, releases, security exceptions, architecture
changes or production deploys.

Authority: `openclaw/governance.md`, `PLATFORM-CONSTITUTION.md` §19.

---

_See `PLATFORM-CONSTITUTION.md` for the platform's rules, and `adr/` for why
each one exists._
