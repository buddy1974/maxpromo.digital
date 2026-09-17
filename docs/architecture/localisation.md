# Localisation

How this platform speaks two languages, and what has to be true for a language
to count as supported.

---

## The rule

**A supported language is complete across the product, not just the landing
page.** A language listed in the Domain Registry is a promise that every
user-visible surface of that host exists in it — the public pages, the login,
and everything behind the login. `npm run check:i18n` is gate 9 of the merge
gate and enforces it; `npm run prove:i18n` demonstrates that the gate can fail.

Agent Bureau spent months as the counter-example: a German product with
"Operating Model", "Audit Console" and "Approval Desk" sitting inside German
navigation, and no way to read it in English at all. Nothing caught it because
nothing was looking.

---

## Two applications, one library, two ways of resolving the locale

Both applications use **next-intl** and the same message-file shape. They
differ only in where the locale comes from, and the Domain Registry says which
is which through `useLocalePrefix`.

| | `apps/web` (maxpromo.digital) | `apps/bureau` (agents.maxpromo.digital) |
|---|---|---|
| Locale from | the URL: `/de/...`, `/en/...` | a cookie, `bureau_locale` |
| `useLocalePrefix` | `true` | `false` |
| Supported | `de`, `en` | `de`, `en` |
| Default | `de` | `de` (`primaryLanguage` in the registry) |
| Messages | `apps/web/messages/{de,en}.json` | `apps/bureau/messages/{de,en}.json` |
| Request config | `apps/web/i18n/request.ts` | `apps/bureau/i18n/request.ts` |

**Why the product does not put the locale in the URL.** Agent Bureau is one
authenticated product behind NextAuth. A locale segment would prefix every
callback URL, every `callbackUrl` round trip, every deep link a customer has
been sent, and the middleware's one protected prefix. A public site with two
complete copies of itself benefits from two addresses; a product does not need
two addresses to speak two languages. See `apps/bureau/lib/i18n/locale.ts`.

---

## Choosing the language

`apps/bureau/lib/i18n/locale.ts` resolves, in order:

1. the `bureau_locale` cookie — a choice somebody made, kept for a year;
2. `Accept-Language`, so a first visit lands in the visitor's own language;
3. `primaryLanguage` from the Domain Registry — German.

Switching is a navigation, not client state: `GET /language?to=<locale>&next=<path>`
sets the cookie and redirects back to `next`. It therefore works before
hydration, works with JavaScript off, and never touches the session — you stay
on the approvals desk and the approvals desk changes language. `next` is
accepted only as a same-origin absolute path; anything else falls back to `/`,
because an open redirect on a signed-in product is a phishing primitive.

The control itself is `components/LocaleSwitch.tsx`, and it appears in both the
public navigation and the dashboard sidebar. Nobody has to sign out to read the
product in their own language.

---

## Where a string lives

**Text a person reads is in the message catalogue. Everything else is
structure.**

- `messages/{de,en}.json` — every label, heading, status, empty state, error,
  placeholder and accessible name, under a namespace per surface.
- `lib/core/*`, `lib/registry/*` — ids, order, relationships, counts. These
  files used to carry German prose; they now carry the model, and the words are
  keyed by the record's own id (`model.stages.<key>`, `agentRegistry.<id>`,
  `playbooks.<id>`).
- `lib/mock/*` — demo fixtures. Split deliberately: content in the **product's
  voice** (a tool register, a policy checklist, an activity line the system
  wrote) is in the catalogue under `demo.*`; content that stands for a
  **record** (a customer's name, a client's file, a consultant's note) is not
  translated, because a record is not translated in any product. A German
  customer's enquiry stays German in an English interface, and the fixtures
  behave the way the real data will.

### Adding a key

1. Add it to **both** `de.json` and `en.json`, in the same namespace.
2. Read it with `getTranslations('<namespace>')` on the server or
   `useTranslations('<namespace>')` in a client component.
3. Run `npm run check:i18n`. A key in one file and not the other fails.

### Adding a language

1. Add the locale to `languages` on the host's Domain Registry entry — but only
   once the copy exists, which is the registry's own rule.
2. Add `messages/<locale>.json`, complete.
3. Add it to `LOCALES` in `lib/i18n/locale.ts` and to `LOCALES` in
   `packages/tooling/check-i18n.mjs`.

---

## Dates, times and numbers

`apps/bureau/lib/i18n/format.ts`. `Intl`, never a string in the catalogue, and
always in **Europe/Berlin** — the business operates from Essen and an operator
there should see their own clock whatever region the server runs in. A
dashboard that says "Good evening" at four in the afternoon because it was
deployed elsewhere is the usual way this goes wrong.

The greeting is built the same way: the part of the day comes from Essen's
clock, the name from the session, and the catalogue holds
`"Guten Morgen, {name}."` — never a person.

---

## Fallback

**There is none, on purpose.** `i18n/request.ts` throws on a missing key in
development and logs in production. Silently substituting the other language is
exactly how a page ends up half German, and the gate exists so it never gets
that far.

---

## Exemptions

Two, and both have to be written down where the code is:

- **`i18n-exempt`** in a comment exempts from that line to the end of the
  declaration it introduces. It is for text that instructs a model rather than
  a person (`lib/ai/prompts.ts`), and for product vocabulary no surface renders
  yet. The marker sits next to the thing it excuses so the reason is read by
  whoever next reads the code.
- **`SAME_IN_BOTH`** in `check-i18n.mjs` lists, by full key path, the values
  that are legitimately identical in both languages — proper nouns, and the
  terms this company uses in both. Full paths, never leaf names: exempting
  `name` would exempt every key ending in it.

---

## What the gate checks

`npm run check:i18n`, per application with a catalogue:

- both locale files exist and parse;
- the key sets are identical in both directions;
- no value is empty, and no value is its own key;
- a list has the same number of items in both languages;
- the two languages are actually different, except where exempted;
- **the agent registry's declared counts match the catalogue** — an agent's
  `blocked` list is a statement about what it may not do without asking, and a
  translation that quietly drops one would make the English product claim a
  narrower supervision contract than the German one;
- no German prose is hardcoded in `apps/bureau` source.

`npm run prove:i18n` stages each of those regressions, requires the gate to
catch and name it, and puts every file back byte-identical.

---

## Legal pages

`/impressum` and `/datenschutz` stay in German. They discharge obligations
under German law to German authorities and German data subjects; a translation
would be a second legal text that no lawyer has reviewed. The chrome around
them is localised and an English reader is told, in English, why the body is
not. If an English legal text is ever wanted, it is a lawyer's deliverable, not
a translator's.
