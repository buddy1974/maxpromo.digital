/**
 * lib/registry/products.ts
 *
 * Single source of truth for all products in the Maxpromo ecosystem.
 * Registry version: 1.1  |  Locked: 2026-05-19
 *
 * Rules:
 *   — Add a product here before creating any route, component, or page for it.
 *   — Remove a product here before removing any route or page.
 *   — `satisfies ProductEntry` on every constant enforces the type contract at
 *     compile time. TypeScript will reject missing fields, wrong types, and
 *     bullet/workflow arrays with the wrong count.
 *   — Copy marked TODO must be replaced before a landing page goes live.
 *
 * Consumers (do not modify this file to serve them — import PRODUCTS instead):
 *   app/[locale]/page.tsx               — homepage featured grid
 *   app/[locale]/systems/page.tsx       — systems page full grid (SYSTEMS_PAGE_PRODUCTS)
 *   app/[locale]/systems/<slug>/page.tsx — canonical LandingEngine bridge route for
 *                                          every public product (LANDINGENGINE
 *                                          CONSOLIDATION, 2026-07-26 — all eight
 *                                          hand-authored duplicate pages retired;
 *                                          getLandingData(slug, locale) + <LandingEngine>
 *                                          is now the only renderer, one static route
 *                                          per system, no dynamic [slug] route)
 *   app/[locale]/products/page.tsx      — legacy products index, still registry-driven
 *   app/[locale]/products/care-os, .../real-estate-os — retired 2026-07-26, now permanent
 *                                          redirects to /systems/care-os and
 *                                          /systems/real-estate-os (see next.config.ts)
 *   app/os/systems/page.tsx             — admin registry view
 */

import type { ProductEntry } from './types'

// =============================================================================
// 0. MAX AGENT BUREAU
// =============================================================================
// Added 2026-07-25. Horizontal AI-agent operations layer — not a vertical
// business system, so it sits outside the priority_score ordering below and
// is placed first in PRODUCTS / SYSTEMS_PAGE_PRODUCTS by explicit position,
// not by score. No dedicated demo environment yet — demoUrl is the same as
// systemUrl. No card screenshot exists (no public/ assets in the source
// repo) — media.card points to a diagram-style card generated for this
// launch, not a product screenshot.

const AGENT_BUREAU = {
  // ── Identity
  slug:        'agent-bureau',
  name:        'Max Agent Bureau',
  domainBrand: 'MAX AGENT BUREAU',
  domain:      'agents.maxpromo.digital',
  category:    'business-system',
  owner:       'maxpromo',
  track:       'commercial',

  // ── Classification
  status:         'demo-ready',
  maturity:       'pilot',
  priority_score: 88,
  featured:       true,
  visibility:     'public',

  // ── Market
  market:         ['de', 'global'],
  marketPriority: 1,
  locales:        ['de', 'en'],
  industry:       'operations',

  // ── Content
  headline: {
    en: 'Intelligent AI agents. Secure processes.',
    de: 'Intelligente KI-Agenten. Sichere Prozesse.',
  },
  subline: {
    en: 'We automate the busywork. You approve the decisions.',
    de: 'Wir automatisieren die Routinearbeit. Sie geben die Entscheidungen frei.',
  },
  description: {
    en: 'A team of AI agents handles customer enquiries, follow-ups, approvals and reporting for your business — every important action still goes through you first.',
    de: 'Ein Team aus KI-Agenten übernimmt Kundenanfragen, Follow-ups, Freigaben und Berichte für Ihr Unternehmen — jede wichtige Aktion läuft vorher über Sie.',
  },
  bullets: {
    en: ['Still triaging every enquiry by hand?', 'Still chasing your own follow-ups?', 'Still writing the same report every week?'],
    de: ['Noch immer jede Anfrage von Hand sortieren?', 'Noch immer Ihre eigenen Follow-ups nachjagen?', 'Noch immer denselben Bericht jede Woche schreiben?'],
  },
  workflow: {
    en: [
      { label: 'Audit & Diagnose', description: 'Agents scan the business workflows currently running by email, WhatsApp, spreadsheets and manual steps, then rank the bottlenecks by time cost.' },
      { label: 'Agent Team',       description: 'Tasks are assigned to specialised agents — enquiry handling, follow-ups, document prep, reporting.' },
      { label: 'Review',           description: 'Every critical action is queued for human approval before it goes out. No autonomous execution.' },
      { label: 'Execute',          description: 'Approved actions run — replies sent, records updated, tasks dispatched.' },
      { label: 'Log',              description: 'Everything is logged: what ran, who approved it, and when.' },
    ],
    de: [
      { label: 'Audit & Diagnose', description: 'Agenten scannen die aktuell laufenden Abläufe, per E-Mail, WhatsApp, Tabellen und manuellen Schritten, und priorisieren die Engpässe nach Zeitaufwand.' },
      { label: 'Agent Team',       description: 'Aufgaben werden spezialisierten Agenten zugewiesen — Anfragenbearbeitung, Follow-ups, Dokumentenvorbereitung, Berichte.' },
      { label: 'Review',           description: 'Jede kritische Aktion wird zur Freigabe vorgelegt, bevor sie ausgeführt wird. Keine autonome Ausführung.' },
      { label: 'Execute',          description: 'Freigegebene Aktionen laufen, Antworten werden versendet, Datensätze aktualisiert, Aufgaben verteilt.' },
      { label: 'Log',              description: 'Alles wird protokolliert: was lief, wer freigegeben hat und wann.' },
    ],
  },

  // ── FAQ (pre-sales objections — these are the silently held doubts, not support questions)
  faq: {
    de: [
      { question: 'Handeln die Agenten selbstständig?', answer: 'Nein. Jede kritische Aktion, E-Mail-Versand, Angebot, Rechnung, Kundenantwort, bleibt freigabepflichtig. Agenten bereiten vor, ein Mensch entscheidet.' },
      { question: 'Ersetzt das mein Team?',              answer: 'Nein. Es übernimmt die repetitive Vorbereitung, damit Ihr Team sich auf Entscheidungen und Kundenbeziehungen konzentrieren kann.' },
      { question: 'Kann ich sehen, was die Agenten tun?', answer: 'Ja. Jede Aktion wird protokolliert, mit Zeitstempel, Freigeber und Ergebnis.' },
      { question: 'Für welche Aufgaben ist das gebaut?',  answer: 'Kundenanfragen, E-Mail-Triage, Follow-ups, Terminkoordination, Dokumentenvorbereitung, Berichte und interne Benachrichtigungen.' },
    ],
    en: [
      { question: 'Do the agents act on their own?', answer: 'No. Every critical action, sending an email, a quote, an invoice, a customer reply, requires human approval first. Agents prepare, a person decides.' },
      { question: 'Does this replace my team?',       answer: 'No. It takes over repetitive preparation work so your team can focus on decisions and customer relationships.' },
      { question: 'Can I see what the agents are doing?', answer: 'Yes. Every action is logged, with a timestamp, who approved it, and the outcome.' },
      { question: 'What tasks is this built for?',   answer: 'Customer enquiry handling, email triage, follow-ups, appointment coordination, document preparation, reporting and internal notifications.' },
    ],
  },

  // ── Media
  media: {
    card: {
      en: 'images/systems/agent-bureau/card/agent-bureau-en.png',
      de: 'images/systems/agent-bureau/card/agent-bureau-de.png',
    },
  },
  brandColor:     '#A3E635',
  layoutVariant:  'B',

  // ── Links
  demoUrl:     'https://agents.maxpromo.digital',
  landingUrl:  '/agent-bureau',
  systemUrl:   'https://agents.maxpromo.digital',
  bookDemoUrl: '/contact?system=agent-bureau',
  contactSlug: 'agent-bureau',
  hasDemoLogin: false,

  // ── CTA
  ctaType: 'standard',

  // ── Analytics
  eventSource:     'agent-bureau',
  trackingEnabled: true,

  // ── Future
  revenueModel: 'installation',
} satisfies ProductEntry

// =============================================================================
// 1. RESTAURANT OS
// =============================================================================

const RESTAURANT_OS = {
  // ── Identity
  slug:        'restaurant-os',
  name:        'RestaurantOS',
  domainBrand: 'RESTAURANT OS',
  domain:      'restaurant-os.de',
  category:    'business-system',
  owner:       'maxpromo',
  track:       'commercial',

  // ── Classification
  status:         'demo-ready',
  maturity:       'pilot',
  priority_score: 92,
  featured:       true,
  visibility:     'public',

  // ── Market
  market:         ['de'],
  marketPriority: 2,
  locales:        ['de', 'en'],
  industry:       'hospitality',

  // ── Content
  headline: {
    en: "Orders move. Staff doesn't.",
    de: 'Bestellungen laufen. Personal nicht.',
  },
  subline: {
    en: 'We automate your orders. You focus on service.',
    de: 'Wir automatisieren Ihre Bestellungen. Sie konzentrieren sich auf den Service.',
  },
  description: {
    en: 'QR ordering, kitchen routing, bill splitting and payments — all in one simple system. No app for guests. No tablet for staff.',
    de: 'QR-Bestellung, Küchenweiterleitung, Rechnungsteilung und Zahlung — alles in einem einfachen System. Keine App für Gäste. Kein Tablet für das Personal.',
  },
  bullets: {
    en: ['Still shouting for waiters?', 'Still printing menus?', 'Still entering menus manually?'],
    de: ['Noch immer nach Kellnern rufen?', 'Noch immer Speisekarten drucken?', 'Noch immer Menüs manuell eingeben?'],
  },
  // featureBenefits, added 2026-07-25 (correction pass, Marcel's item 1) —
  // `bullets` above are rhetorical questions, correct for the hero, but
  // FeatureArchitecture.tsx renders bullets under "Time / Quality /
  // Revenue" benefit-style headers, where a question reads oddly. This is
  // the fix for the content-fit contradiction flagged (not fixed) in the
  // prior RestaurantOS report. Each statement restates a workflow step
  // above (Scan QR/Order → digital ordering; Kitchen → kitchen routing;
  // Payment → flexible payment) — no new capability claimed.
  featureBenefits: {
    de: ['Digitale Bestellungen direkt vom Tisch', 'Klare Weiterleitung an die Küche', 'Flexible Bezahlung am Ende des Besuchs'],
    en: ['Digital ordering directly from the table', 'Clear routing to the kitchen', 'Flexible payment at the end of the visit'],
  },
  workflow: {
    en: [
      { label: 'Scan QR',  description: 'Guest scans the QR code on the table. Opens the full menu in the browser. No app install needed.' },
      { label: 'Order',    description: 'Browse the menu, customise items and place the order from any phone.' },
      { label: 'Kitchen',  description: 'Order appears in the kitchen instantly. No relay, no shouting, no missed items.' },
      { label: 'Prepare',  description: 'Your team prepares and serves on time. Staff focus on service, not coordination.' },
      { label: 'Payment',  description: 'Bill is ready. Guests pay easily — solo, shared equally, or split by seat.' },
    ],
    de: [
      { label: 'QR scannen',    description: 'Gast scannt den QR-Code am Tisch. Öffnet die vollständige Speisekarte im Browser. Keine App nötig.' },
      { label: 'Bestellen',     description: 'Speisekarte durchsehen, Artikel anpassen und Bestellung vom Handy aufgeben.' },
      { label: 'Küche erhält',  description: 'Bestellung erscheint sofort in der Küche. Kein Weitersagen, kein Schreien, keine verpassten Artikel.' },
      { label: 'Zubereiten',    description: 'Ihr Team bereitet zu und serviert pünktlich. Personal konzentriert sich auf Service, nicht auf Koordination.' },
      { label: 'Bezahlen',      description: 'Rechnung ist fertig. Gäste zahlen bequem — alleine, gleichmäßig geteilt oder nach Sitzplatz.' },
    ],
  },

  // ── FAQ (pre-sales objections — these are the silently held doubts, not
  // support questions). Redesigned 2026-07-25 (RestaurantOS V2 migration,
  // Marcel's item 11) — the prior "Kann ich die Lieferfunktion später
  // hinzufügen?" / "Can I add delivery later?" item claimed delivery,
  // reservations, and loyalty modules could be "activated after
  // installation" — none of these are evidenced anywhere else in this
  // entry (description/bullets/workflow describe only QR ordering,
  // kitchen routing, and payment). Removed as an unverified overclaim,
  // per Marcel's explicit ban on inventing delivery integrations, table
  // booking, or loyalty features. Replaced with items answering the real
  // buying questions per Marcel's item 11 checklist: who it's for,
  // whether it replaces the current website, mobile/app requirement, and
  // demo availability. Demo-availability answer CORRECTED again 2026-07-25
  // (Marcel's correction pass, item 2) — see the demoAccess note below the
  // final-CTA block: "Ja, direkt selbst ausprobieren" overclaimed verified
  // anonymous access; now says a guided demo is available on request,
  // matching demoAccess: 'guided'. Cash-payments, staff-training,
  // branding, and post-installation items are unchanged — already
  // truthful and directly evidenced elsewhere in this entry.
  faq: {
    de: [
      { question: 'Für wen ist RestaurantOS gedacht?',          answer: 'Für Restaurants und gastronomische Betriebe, die Bestellungen, Küche und Zahlung in einem System zusammenführen wollen — vom Einzelbetrieb bis zum Team mit mehreren Schichten.' },
      { question: 'Ersetzt das System meine Website?',          answer: 'Nicht zwangsläufig. RestaurantOS deckt Bestellung, Küchenweiterleitung und Zahlung ab — ob es Ihre bestehende Website ersetzt oder ergänzt, besprechen wir individuell.' },
      { question: 'Brauchen Gäste eine App?',                   answer: 'Nein. Gäste scannen den QR-Code am Tisch und bestellen über den Browser — kein App-Download nötig.' },
      { question: 'Kann ich das System vorher testen?',         answer: 'Ja. Wir zeigen Ihnen das System in einer geführten Demo — auf Anfrage, unverbindlich.' },
      { question: 'Kann ich meine eigene Domain nutzen?',       answer: 'Ja. Das System wird auf Ihrer Domain installiert. Kein Maxpromo-Branding ist sichtbar.' },
      { question: 'Kann ich Barzahlungen beibehalten?',         answer: 'Ja. QR-Bestellungen und Kartenzahlung laufen parallel zu Ihrem bestehenden Kassensystem. Nichts muss sofort umgestellt werden.' },
      { question: 'Müssen die Mitarbeiter geschult werden?',    answer: 'Kaum. Das System ist für Restaurantmitarbeiter entwickelt, nicht für IT-Fachkräfte. Die meisten Teams sind in einem 20-Minuten-Walk-through einsatzbereit.' },
      { question: 'Kann ich das Branding anpassen?',            answer: 'Ja. Farben, Logo und Domain sind Ihre eigenen. Gäste sehen Ihre Marke, nicht unsere.' },
      { question: 'Was passiert nach der Installation?',        answer: 'Sie gehen live. Wir übernehmen Hosting, Updates und Support. Sie konzentrieren sich auf den Service.' },
    ],
    en: [
      { question: 'Who is RestaurantOS built for?',   answer: 'For restaurants and hospitality businesses that want to bring ordering, kitchen routing, and payment together in one system — from a single location to a team running multiple shifts.' },
      { question: 'Does it replace my website?',      answer: 'Not necessarily. RestaurantOS covers ordering, kitchen routing, and payment — whether it replaces or complements your existing website is something we discuss case by case.' },
      { question: 'Do guests need an app?',           answer: 'No. Guests scan the QR code at the table and order through the browser — no app download required.' },
      { question: 'Can I try the system first?',      answer: 'Yes. We show you the system in a guided demo — on request, no obligation.' },
      { question: 'Can I use my own domain?',         answer: 'Yes. The system is installed on your domain. No Maxpromo branding is visible.' },
      { question: 'Can I keep cash payments?',        answer: 'Yes. QR ordering and card payments run alongside your existing till. Nothing needs to switch over on day one.' },
      { question: 'Do staff need training?',          answer: 'Minimal. The system is built for restaurant teams, not IT. Most teams are operational in a 20-minute walkthrough.' },
      { question: 'Can I customize branding?',        answer: 'Yes. Colours, logo, and domain are yours. Guests see your brand, not ours.' },
      { question: 'What happens after installation?', answer: 'You go live. We handle hosting, updates, and support. You focus on service.' },
    ],
  },

  // ── See In Action (Phase 5 — imageUrl null until screenshots captured
  // from live system). Trimmed from 5 tabs to 3, 2026-07-25 (RestaurantOS
  // V2 migration, Marcel's item 4) — "Analyse"/"Analytics" (revenue/peak-
  // time reporting) and "Personal"/"Staff" (shift notifications) both
  // described capabilities not evidenced anywhere else in this entry
  // (description/bullets/workflow only cover QR ordering, kitchen
  // routing, and payment) — removed as unverified capability claims.
  // "Gäste"/"Customer" and "Küche"/"Kitchen" are directly evidenced by the
  // workflow steps above; "Admin" is kept as a minimal, plausible
  // restatement of order/table/menu management implied by operating the
  // system at all, without claiming any specific reporting feature.
  seeInAction: {
    de: [
      { tab: 'Gäste',    headline: 'Gast scannt, bestellt, zahlt.',       description: 'Keine App. Kein Personal-Tablet. Der Gast öffnet die Speisekarte mit dem Handy und bestellt direkt vom Tisch.', imageUrl: null },
      { tab: 'Küche',    headline: 'Bestellungen erscheinen sofort.',      description: 'Keine Nachricht, kein Schreien. Bestellung erscheint sofort auf dem Küchenbildschirm — mit Tisch und Position.', imageUrl: null },
      { tab: 'Admin',    headline: 'Volle Übersicht. Null Papierkram.',    description: 'Tische, Bestellungen, Öffnungszeiten und Menüs — alles in einem Bildschirm verwaltet.', imageUrl: null },
    ],
    en: [
      { tab: 'Customer',  headline: 'Scan. Order. Pay.',                     description: 'No app. No staff tablet. Guest opens the menu on their phone and orders directly from the table.', imageUrl: null },
      { tab: 'Kitchen',   headline: 'Orders appear instantly.',              description: 'No relay, no shouting. Order appears immediately on the kitchen screen — with table and position.', imageUrl: null },
      { tab: 'Admin',     headline: 'Full overview. Zero paperwork.',        description: 'Tables, orders, opening hours, and menus — all managed in one screen.', imageUrl: null },
    ],
  },

  // ── V2 hero / trust copy, added 2026-07-25 (RestaurantOS V2 migration).
  // targetAudience restates industry/market above. trustCue restates FAQ
  // item "Kann ich das Branding anpassen?" ("Gäste sehen Ihre Marke, nicht
  // unsere") in a distinct wording from HandwerkOS's trustCue, per
  // Marcel's "do not copy HandwerkOS text" instruction. No
  // complianceNote — unlike HandwerkOS's XRechnung claim, nothing in this
  // entry evidences a specific compliance/regulatory capability for
  // RestaurantOS, so the field is left unset rather than invented.
  targetAudience: {
    de: 'Für Restaurants und Gastronomiebetriebe in Deutschland, die ihre Bestellabläufe vereinfachen wollen.',
    en: 'Built for restaurants and hospitality businesses in Germany that want to simplify their ordering workflow.',
  },
  trustCue: {
    de: 'Läuft unter Ihrem eigenen Namen — Gäste sehen Ihre Marke, nicht unsere.',
    en: 'Runs under your own name — guests see your brand, not ours.',
  },

  // ── V2 OutcomeStrip / ProblemSolution content, added 2026-07-25.
  // outcomeStats are structural facts drawn directly from the workflow
  // and payment step above (5 steps, no app download, 3 payment modes) —
  // not invented performance results (no percentages, revenue, or time
  // savings claimed). problemStatement restates the existing `bullets`
  // (phrased there as rhetorical questions — "Still shouting for
  // waiters?") as a direct statement of the market problem, paired with
  // `description` (the solution side) in ProblemSolution.tsx.
  outcomeStats: {
    de: ['5 Schritte von der Bestellung zur Zahlung', 'Kein App-Download für Gäste', '3 Wege zu bezahlen — einzeln, geteilt, pro Sitzplatz'],
    en: ['5 steps from order to payment', 'No app download for guests', '3 ways to pay — solo, split, per seat'],
  },
  problemStatement: {
    de: 'Kellner rufen, Speisekarten drucken, Bestellungen von Hand ins System tippen: Restaurants verlieren Zeit und Nerven an Abläufe, die eigentlich einfach sein sollten.',
    en: 'Shouting for waiters, printing menus, typing orders in by hand: restaurants lose time and patience on things that should be simple.',
  },

  // ── Demo access, added 2026-07-25 (correction pass, Marcel's item 2) —
  // CORRECTS the prior round's CTA strategy, which set finalPrimaryUrl to
  // the external demo (`https://demo.restaurant-os.de`) and labelled it
  // "System testen" purely because `hasDemoLogin: false` and no
  // `demoCredentials` block exists. That was exactly the indirect
  // inference Marcel flagged: `hasDemoLogin: false` proves no login is
  // *documented* here, not that anonymous access is *verified*. Nothing
  // else in this registry entry (or elsewhere in maxpromo.digital, the
  // only codebase in scope) confirms the demo is genuinely open to
  // anonymous visitors. Set to 'guided' — the conservative, evidenced
  // choice — until anonymous access is actually confirmed. Revisit if/when
  // that's verified; only then should this move to 'public' and
  // finalPrimaryUrl point directly at demoUrl again.
  demoAccess: 'guided',

  // ── V2 final CTA, added 2026-07-25, CORRECTED 2026-07-25 (see
  // demoAccess note above). Primary action is now "request a demo"
  // (resolveDemoAccessLabel('guided', locale) in cta.ts — kept in sync by
  // hand since registry entries are authored as literals), routed to the
  // contact form like HandwerkOS. finalSecondaryLabel/Url REMOVED — with
  // the primary now also pointing at the contact form, a second
  // "Beratung anfragen" button to the same `/contact?system=restaurant-os`
  // URL would recreate the exact same-URL CTA-duplication bug the
  // HandwerkOS correction fixed. Single CTA, same pattern as HandwerkOS,
  // until a real second destination exists.
  finalEyebrow: {
    de: '// Nächster Schritt',
    en: '// Next step',
  },
  finalHeading: {
    de: 'Bringen Sie Ihre Bestellungen von der Küche bis zur Kasse in einen Ablauf.',
    en: 'Bring your orders from kitchen to checkout into one flow.',
  },
  finalDescription: {
    de: 'Sehen Sie gemeinsam mit uns, wie RestaurantOS Bestellungen, Küche und Zahlung in Ihrem Restaurant verbinden kann.',
    en: 'See together with us how RestaurantOS can connect ordering, kitchen, and payment in your restaurant.',
  },
  finalPrimaryLabel: {
    de: 'Demo anfragen →',
    en: 'Request a demo →',
  },
  finalPrimaryUrl: '/contact?system=restaurant-os',

  // ── Media
  // NOTE: no German (`de`) card variant exists on disk — only
  // `restaurant-os-en.png`. Flagged 2026-07-25 as a content gap, not
  // fixed here (no asset to point to; inventing a path would 404).
  media: {
    card: {
      en: 'images/systems/restaurant-os/card/restaurant-os-en.png',
      de: 'images/systems/restaurant-os/card/restaurant-os-de.png',
    },
    pain: [
      'images/systems/restaurant-os/pain/p1.png',
      'images/systems/restaurant-os/pain/p2.png',
      'images/systems/restaurant-os/pain/p3.png',
    ],
  },
  brandColor:     '#A3E635',
  layoutVariant:  'A',

  // ── Links
  demoUrl:    'https://demo.restaurant-os.de',
  landingUrl: '',
  systemUrl:  'https://www.restaurant-os.de',
  bookDemoUrl: '/contact?system=restaurant-os',
  contactSlug: 'restaurant-os',
  hasDemoLogin: false,

  // ── CTA
  ctaType: 'standard',

  // ── Analytics
  eventSource:     'restaurant-os',
  trackingEnabled: true,

  // ── Future
  revenueModel: 'installation',
} satisfies ProductEntry

// =============================================================================
// 2. HANDWERKOS
// =============================================================================

const HANDWERK_OS = {
  // ── Identity
  slug:        'handwerk-os',
  name:        'HandwerkOS',
  domainBrand: 'HANDWERK OS',
  domain:      'superhandwerk.de',
  category:    'business-system',
  owner:       'maxpromo',
  track:       'commercial',

  // ── Classification
  status:         'demo-ready',
  maturity:       'pilot',
  priority_score: 85,
  featured:       true,
  visibility:     'public',

  // ── Market
  market:         ['de'],
  marketPriority: 1,
  locales:        ['de', 'en'],
  industry:       'trade',

  // ── Content
  headline: {
    en: 'From site work to paid invoice.',
    de: 'Vom Auftrag zur bezahlten Rechnung.',
  },
  subline: {
    en: 'We automate your job management. You focus on the work.',
    de: 'Wir automatisieren Ihre Auftragsverwaltung. Sie konzentrieren sich auf die Arbeit.',
  },
  description: {
    en: 'Quotes, jobs, time tracking, invoices and XRechnung — everything in one place. Photograph a job sheet and AI creates the record in 10 seconds.',
    de: 'Angebote, Aufträge, Zeiterfassung, Rechnungen und XRechnung — alles an einem Ort. Fotografieren Sie einen Auftragszettel und die KI erstellt den Datensatz in 10 Sekunden.',
  },
  bullets: {
    en: ['Less paperwork', 'Faster quotes & invoices', 'More time on the job'],
    de: ['Weniger Papierkram', 'Schnellere Angebote & Rechnungen', 'Mehr Zeit auf der Baustelle'],
  },
  workflow: {
    en: [
      { label: 'Photo',    description: 'Take a photo of the job sheet. AI creates the full job record in under 10 seconds.' },
      { label: 'Quote',    description: 'AI suggests market rates. Generate and send the PDF quote directly to the client.' },
      { label: 'Dispatch', description: 'Assign the job to the right team member. GPS time tracking starts at check-in.' },
      { label: 'Invoice',  description: 'Convert the accepted quote to an invoice with one click. XRechnung XML included.' },
      { label: 'Paid',     description: 'Send, follow up, and mark paid. The invoice stays documented and ready for your bookkeeping.' },
    ],
    de: [
      { label: 'Foto',       description: 'Auftragszettel fotografieren. KI erstellt den vollständigen Auftragsdatensatz in unter 10 Sekunden.' },
      { label: 'Angebot',    description: 'KI schlägt Marktpreise vor. PDF-Angebot direkt an den Kunden erstellen und senden.' },
      { label: 'Disponieren', description: 'Auftrag dem richtigen Teammitglied zuweisen. GPS-Zeiterfassung startet beim Check-in.' },
      { label: 'Rechnung',   description: 'Angenommenes Angebot mit einem Klick in eine Rechnung umwandeln. XRechnung-XML inklusive.' },
      { label: 'Bezahlt',    description: 'Senden, nachfassen und als bezahlt markieren. Die Rechnung bleibt dokumentiert und bereit für Ihre Buchhaltung.' },
    ],
  },

  // ── FAQ (pre-sales objections — authored 2026-07-25 for the external landing
  // page rebuild; HandwerkOS previously shipped with no FAQ content at all.
  // Every answer restates a fact already established elsewhere in this entry
  // (workflow steps, demoUrl, hasDemoLogin, revenueModel) — nothing new is
  // claimed here that isn't already true of the product per this registry.)
  faq: {
    de: [
      { question: 'Kann ich das System vor der Installation sehen?', answer: 'Ja. Wir zeigen Ihnen den kompletten Ablauf von Foto bis Rechnung in einer geführten Live-Demo — auf Anfrage, unverbindlich.' },
      { question: 'Muss ich meine Buchhaltung umstellen?',            answer: 'Nein. Ihre Rechnungen bekommen einfach XRechnung-XML dazu — Ihr Steuerberater macht genau so weiter wie bisher.' },
      { question: 'Wie schnell entsteht ein Auftragsdatensatz?',      answer: 'Ein Foto des Auftragszettels genügt — die KI erstellt den vollständigen Datensatz in unter 10 Sekunden.' },
      { question: 'Kann ich meine eigene Domain nutzen?',             answer: 'Ja. Das System wird auf Ihrer Domain installiert. Kein Maxpromo-Branding ist sichtbar.' },
      { question: 'Was passiert nach der Installation?',              answer: 'Sie gehen live. Wir übernehmen Hosting, Updates und Support. Sie konzentrieren sich auf die Baustelle.' },
    ],
    en: [
      { question: 'Can I see the system before installing it?', answer: 'Yes. We walk you through the full flow from photo to invoice in a guided live demo — on request, no obligation.' },
      { question: 'Do I need to change my accounting?',         answer: 'No. Your invoices just get XRechnung XML added — your accountant carries on exactly as before.' },
      { question: 'How fast is a job record created?',          answer: 'A photo of the job sheet is enough — AI creates the full record in under 10 seconds.' },
      { question: 'Can I use my own domain?',                    answer: 'Yes. The system is installed on your domain. No Maxpromo branding is visible.' },
      { question: 'What happens after installation?',            answer: 'You go live. We handle hosting, updates, and support. You focus on the job site.' },
    ],
  },

  // ── Hero / trust copy, added 2026-07-25 for the external landing page
  // rebuild. Each value is directly evidenced by fields already on this
  // entry (industry/market → targetAudience, the domain/systemUrl
  // ownership model → trustCue, the existing 'Rechnung' workflow step →
  // complianceNote) — no new, unreviewed product claims are introduced
  // here.
  //
  // trustCue corrected TWICE on 2026-07-25. First correction: the
  // original wording implied a self-serve live demo with "no sales call
  // required" — but hasDemoLogin is gated (see demoCredentials comment:
  // "guided review" only). Second correction (Marcel's V2 review): the
  // replacement, "Läuft auf Ihrer eigenen Domain — Ihre Daten, Ihre
  // Kontrolle" ("your data, your control"), still overclaimed — domain
  // ownership alone does not prove a specific data-processing or access
  // architecture, which has not been separately verified. Reworded to the
  // one claim domain ownership actually proves: branding.
  //
  // complianceNote corrected 2026-07-25 (Marcel's V2 review): "kein
  // Steuerberater für die Compliance erforderlich" / "no accountant
  // required for compliance" asserted a professional/regulatory
  // sufficiency this registry entry cannot verify. Reworded to the one
  // fact that IS directly evidenced by the 'Rechnung' workflow step:
  // XRechnung XML is generated together with the invoice. The same
  // over-claim was duplicated in the workflow's 'Bezahlt'/'Paid' step
  // description — fixed there too (see workflow.de/en[4] above), so the
  // corrected claim isn't left standing in a second place on the page.
  targetAudience: {
    de: 'Für Handwerksbetriebe in Deutschland — vom Ein-Mann-Betrieb bis zum Team mit mehreren Baustellen.',
    en: 'Built for trade businesses in Germany — from solo operators to teams running multiple job sites.',
  },
  trustCue: {
    de: 'Unter Ihrer eigenen Marke und Domain bereitgestellt.',
    en: 'Delivered under your own brand and domain.',
  },
  complianceNote: {
    de: 'XRechnung-XML wird direkt mit der Rechnung erzeugt.',
    en: 'XRechnung XML is generated together with the invoice.',
  },

  // ── V2 OutcomeStrip / ProblemSolution content, added 2026-07-25,
  // outcomeStats[2] corrected 2026-07-25 (Marcel's V2 review): "1 System
  // statt 5 Zettel" / "1 system instead of 5 slips of paper" was a vague
  // rhetorical comparison, not a factual result. Replaced with a concrete
  // statement of what the one system actually covers, restating the
  // workflow steps already documented above (quote → job → time →
  // invoice) rather than a new claim.
  outcomeStats: {
    de: ['5 Schritte vom Auftrag zur Zahlung', '10 Sek. bis zum Auftragsdatensatz', '1 System für Auftrag, Zeit und Rechnung'],
    en: ['5 steps from job to payment', '10 sec. to a job record', '1 system for jobs, time and invoices'],
  },
  // problemStatement: the "before" side, paired with `description` (the
  // "after"/solution side) in ProblemSolution.tsx. Directly restates the
  // inverse of the existing bullets ('Weniger Papierkram' etc.) — not a
  // new claim about the product, a framing of the market problem it says
  // it solves.
  problemStatement: {
    de: 'Auftragszettel, Excel-Listen, verspätete Rechnungen: Handwerksbetriebe verlieren Stunden pro Woche an Papierkram statt an der Baustelle.',
    en: 'Job sheets, spreadsheets, late invoices: trade businesses lose hours a week to paperwork instead of the job site.',
  },

  // ── V2 final CTA, added 2026-07-25 per Marcel's correction — replaces
  // the shared Conversion.tsx's generic hardcoded copy for this product.
  // Demo is real but guided (see trustCue note above), so the primary
  // action is "request a demo", not a self-serve "view live demo" claim.
  //
  // finalSecondaryLabel/finalSecondaryUrl REMOVED 2026-07-25 (Marcel's V2
  // review, item 3, CTA duplication): both previously pointed at the
  // identical URL as the primary ('/contact?system=handwerk-os'), so the
  // page presented "Demo anfragen" and "Beratung buchen" as two different
  // actions when they were the same form submission. The contact form/API
  // (app/[locale]/contact/page.tsx, app/api/contact/route.ts) only reads a
  // `system` query param — there is no `intent` field anywhere in
  // ContactBody or the form state, so a distinct
  // ?intent=demo / ?intent=consultation split (option B) would silently be
  // ignored by the backend. Approach A per Marcel's instruction: one real
  // action, one label. Conversion.tsx and ProductHero.tsx only render a
  // secondary showcase button when finalSecondaryLabel/Url are both
  // present and distinct from the primary, so omitting them here now
  // correctly yields a single CTA everywhere on the page, not just in the
  // final section.
  finalEyebrow: {
    de: '// Bereit?',
    en: '// Ready?',
  },
  finalHeading: {
    de: 'Bringen Sie Ihre Aufträge endlich in einen sauberen Ablauf.',
    en: 'Finally bring your jobs into one clean workflow.',
  },
  finalDescription: {
    de: 'Sehen Sie gemeinsam mit uns, wie HandwerkOS Angebote, Einsätze, Zeiten und Rechnungen in Ihrem Betrieb verbinden kann.',
    en: 'See together with us how HandwerkOS can connect quotes, jobs, time tracking, and invoices in your business.',
  },
  finalPrimaryLabel: {
    de: 'Demo anfragen →',
    en: 'Request a demo →',
  },
  finalPrimaryUrl: '/contact?system=handwerk-os',

  // ── Media
  media: {
    card: {
      en: 'images/systems/handwerk-os/card/handwerk-os-en.png',
      de: 'images/systems/handwerk-os/card/handwerk-os-de.png',
    },
  },
  brandColor:     'var(--semantic-success)',
  layoutVariant:  'B',

  // ── Links
  demoUrl:     'https://handwerkos.vercel.app',
  landingUrl:  '',
  systemUrl:   'https://superhandwerk.de',
  bookDemoUrl: '/contact?system=handwerk-os',
  contactSlug: 'handwerk-os',
  hasDemoLogin: true,
  demoCredentials: {
    url:      'https://handwerkos.vercel.app',
    email:    'admin@handwerkos.de',
    password: '', // Demo access available during guided review — do not commit credentials
  },
  // demoAccess added 2026-07-25 (correction pass, Marcel's item 2) — 'guided'
  // is directly evidenced by the demoCredentials.password comment above
  // ("Demo access available during guided review"), unlike RestaurantOS's
  // prior unverified 'public' inference. This didn't change HandwerkOS's
  // rendered CTA (finalPrimaryLabel is already "Demo anfragen"/"Request a
  // demo", matching resolveDemoAccessLabel('guided', locale) exactly) —
  // this only makes the existing, already-correct decision explicit.
  demoAccess: 'guided',

  // ── CTA
  ctaType: 'standard',

  // ── Analytics
  eventSource:     'handwerk-os',
  trackingEnabled: true,

  // ── Future
  revenueModel: 'installation',
} satisfies ProductEntry

// =============================================================================
// 3. PRAXISOS
// =============================================================================

const PRAXIS_OS = {
  // ── Identity
  slug:        'praxis-os',
  name:        'PraxisOS',
  domainBrand: 'PRAXIS OS',
  domain:      'super-praxis.de',
  category:    'business-system',
  owner:       'maxpromo',
  track:       'commercial',

  // ── Classification
  status:         'demo-ready',
  maturity:       'pilot',
  priority_score: 78,
  featured:       true,
  visibility:     'public',

  // ── Market
  market:         ['de'],
  marketPriority: 4,
  locales:        ['de', 'en'],
  industry:       'healthcare',

  // ── Content
  headline: {
    en: 'More time for patients.',
    de: 'Mehr Zeit für Patienten.',
  },
  subline: {
    en: 'We automate your practice. You focus on care.',
    de: 'Wir automatisieren Ihre Praxis. Sie konzentrieren sich auf die Behandlung.',
  },
  // description CORRECTED 2026-07-25 (PraxisOS V2 migration, Marcel's
  // Healthcare Claim Safety section) — the pre-existing text claimed
  // "GDPR compliant" ("DSGVO-konform"), a regulatory/legal compliance
  // claim explicitly banned this pass unless directly evidenced. Nothing
  // in this entry (no compliance certification field, no data-processing
  // agreement reference, demoUrl is null) evidences a specific,
  // verifiable compliance capability — unlike HandwerkOS's XRechnung
  // claim, which points at one concrete, checkable technical fact. This
  // was a live overclaim sitting in production-bound content (also used
  // for SEO meta tags) before this pass touched it. Removed here and in
  // the matching workflow['Rechnung'/'Invoice'] step below.
  //
  // UNVERIFIED PRODUCT-SCOPE CONTENT — do not expand, do not cite as
  // evidence for any storage/integration/compliance/security claim
  // elsewhere in this entry: "Patient portal" / "Patientenportal" and
  // "lab results" / "Laborbefunde" below (and in workflow['Behandlung'/
  // 'Treatment']) are pre-existing claims, live before this pass and not
  // newly invented here, but this registry entry has no field confirming
  // whether patient-identifiable data is actually stored, which data,
  // where, or how it's protected — see the corrected `faq` "Speichert
  // PraxisOS Patientendaten?" / "Does PraxisOS store patient data?" item
  // below (Marcel's mandatory 2026-07-25 correction), which now states
  // only what's actually knowable: that data handling depends on the
  // agreed scope and is defined before setup. Flagged for a dedicated
  // compliance/data-handling review in the delivery report; not rewritten
  // unilaterally here, and not expanded — per instruction, this comment is
  // the only place this uncertainty is spelled out; the public-facing copy
  // stays exactly as corrected in the FAQ, nowhere else.
  description: {
    en: 'Digital operating system for specialist medical practices. Patient portal, appointment automation, and lab results in one system.',
    de: 'Digitales Betriebssystem für Facharztpraxen. Patientenportal, Terminautomatisierung und Laborbefunde in einem System.',
  },
  bullets: {
    en: ['Less admin work', 'Faster appointments & communication', 'More time for what matters'],
    de: ['Weniger Verwaltungsaufwand', 'Schnellere Termine & Kommunikation', 'Mehr Zeit für das Wesentliche'],
  },
  // featureBenefits, added 2026-07-25 — PraxisOS's `bullets` above already
  // read as benefit statements (unlike RestaurantOS's rhetorical
  // questions), so this isn't fixing a content-fit problem here. Added
  // anyway per Marcel's field list, using slightly more concrete phrasing
  // tied directly to individual workflow steps below, rather than
  // repeating `bullets` verbatim in a second section.
  featureBenefits: {
    de: ['Automatische Terminbestätigung und -erinnerung', 'Digitales Eincheck-Formular vor dem Besuch', 'Rechnung direkt aus dem Behandlungsdatensatz'],
    en: ['Automatic appointment confirmation and reminders', 'Digital check-in form before the visit', 'Invoice generated directly from the treatment record'],
  },
  workflow: {
    en: [
      { label: 'Appointment', description: 'Patients book online. System checks availability and sends automatic confirmation.' },
      { label: 'Reminder',    description: 'Automated reminders sent by SMS or email. Reduces no-shows significantly.' },
      { label: 'Check-in',    description: 'Digital check-in form collects patient data and symptoms before the visit.' },
      { label: 'Treatment',   description: 'All patient data, notes, and lab results in one place during the consultation.' },
      { label: 'Invoice',     description: 'Invoice automatically generated from the treatment record.' },
    ],
    de: [
      { label: 'Termin',      description: 'Patienten buchen online. System prüft Verfügbarkeit und sendet automatische Bestätigung.' },
      { label: 'Erinnerung',  description: 'Automatische Erinnerungen per SMS oder E-Mail. Reduziert No-Shows erheblich.' },
      { label: 'Eincheck',    description: 'Digitales Eincheck-Formular erfasst Patientendaten und Symptome vor dem Besuch.' },
      { label: 'Behandlung',  description: 'Alle Patientendaten, Notizen und Laborbefunde auf einen Blick während der Konsultation.' },
      { label: 'Rechnung',    description: 'Rechnung wird automatisch aus dem Behandlungsdatensatz erstellt.' },
    ],
  },

  // ── FAQ (pre-sales objections), added 2026-07-25 for the V2 migration —
  // PraxisOS previously shipped with no FAQ content at all. Every answer
  // restates a fact already established elsewhere in this entry (workflow
  // steps, domain, revenueModel) or is deliberately hedged where nothing
  // in this registry entry can confirm an answer (website replacement,
  // patient-data handling details) — per Marcel's Healthcare Claim Safety
  // section, nothing here claims GDPR/compliance certification, medical-
  // device compliance, or diagnostic capability. "Does the system make
  // medical decisions?" is included specifically to proactively rule out
  // the diagnostic-platform framing Marcel's item 4 (Positioning) warns
  // against, rather than leaving it ambiguous.
  //
  // Patient-data FAQ item CORRECTED 2026-07-25 (Marcel's mandatory
  // correction pass) — the prior answer ("Ja, im Rahmen der
  // Terminverwaltung und Behandlungsdokumentation...") stated as fact that
  // patient-identifiable data IS stored. Nothing in this registry entry
  // actually confirms that: not whether patient-identifiable data is
  // stored, which data, where, how it's protected, or whether the
  // patient-portal/lab-results workflow described below is even active in
  // the showcased product. Replaced with Marcel's exact wording — data
  // handling depends on the agreed scope, defined before setup — which
  // states nothing beyond what's actually knowable from this entry. No
  // DSGVO-konform / GDPR-compliant / encrypted / certified-hosting
  // language added anywhere in this answer.
  faq: {
    de: [
      { question: 'Für wen ist PraxisOS gedacht?',                answer: 'Für Facharztpraxen in Deutschland, die Terminorganisation, Erinnerungen und Behandlungsdokumentation digitalisieren wollen.' },
      { question: 'Ersetzt das System meine bestehende Praxissoftware?', answer: 'Nicht zwangsläufig. PraxisOS deckt Terminbuchung, Erinnerungen, Eincheck und Rechnungsstellung ab — ob es Ihre bestehende Software ersetzt oder ergänzt, besprechen wir individuell.' },
      { question: 'Speichert PraxisOS Patientendaten?', answer: 'Welche Daten verarbeitet oder gespeichert werden, hängt vom vereinbarten Einsatzbereich ab. Datenflüsse, Zugriffsrechte und Datenschutzanforderungen werden vor der Einrichtung gemeinsam festgelegt.' },
      { question: 'Trifft das System medizinische Entscheidungen?', answer: 'Nein. PraxisOS übernimmt Terminorganisation, Erinnerungen, Eincheck und Dokumentation — alle klinischen Entscheidungen bleiben bei Ihrem Praxisteam.' },
      { question: 'Kann das System an meine Praxis angepasst werden?', answer: 'Ja. Farben, Logo und Domain werden auf Ihre Praxis abgestimmt.' },
      { question: 'Wie läuft die Einrichtung ab?',                answer: 'Sie gehen live, sobald das System auf Ihre Praxis eingerichtet ist. Wir übernehmen Hosting, Updates und Support.' },
      { question: 'Gibt es eine Demo?',                           answer: 'Aktuell zeigen wir Ihnen das System im persönlichen Gespräch — eine öffentliche Demo ist derzeit nicht verfügbar.' },
      { question: 'Was ist im Support enthalten?',                answer: 'Hosting, Updates und laufender Support sind inklusive.' },
    ],
    en: [
      { question: 'Who is PraxisOS built for?',              answer: 'For specialist medical practices in Germany that want to digitalise appointment scheduling, reminders, and treatment documentation.' },
      { question: 'Does it replace my existing practice software?', answer: 'Not necessarily. PraxisOS covers appointment booking, reminders, check-in, and invoicing — whether it replaces or complements your existing software is something we discuss case by case.' },
      { question: 'Does PraxisOS store patient data?', answer: 'The data processed or stored depends on the agreed scope of the system. Data flows, access permissions and data-protection requirements are defined together before setup.' },
      { question: 'Does the system make medical decisions?', answer: 'No. PraxisOS handles appointment scheduling, reminders, check-in, and documentation — all clinical decisions remain with your practice team.' },
      { question: 'Can the system be adapted to my practice?', answer: 'Yes. Colours, logo, and domain are matched to your practice.' },
      { question: 'How does setup work?',                     answer: 'You go live once the system is set up for your practice. We handle hosting, updates, and support.' },
      { question: 'Is there a demo available?',               answer: 'Right now we show you the system in a personal conversation — a public demo isn\'t currently available.' },
      { question: 'What support is included?',                answer: 'Hosting, updates, and ongoing support are included.' },
    ],
  },

  // ── See In Action (Phase 5 — imageUrl null until screenshots captured
  // from live system), added 2026-07-25. 3 tabs, each restating one
  // existing workflow step above — deliberately not inventing an "Admin"
  // or reporting tab the way RestaurantOS's kept one, since nothing in
  // this entry's workflow evidences a comparable admin/overview screen.
  seeInAction: {
    de: [
      { tab: 'Termin',      headline: 'Online buchen, automatisch bestätigen.', description: 'Patienten buchen online. Das System prüft Verfügbarkeit und sendet die Bestätigung automatisch.', imageUrl: null },
      { tab: 'Eincheck',    headline: 'Digitales Formular vor dem Besuch.',      description: 'Patientendaten und Symptome werden vor dem Termin digital erfasst.', imageUrl: null },
      { tab: 'Behandlung',  headline: 'Alles an einem Ort während der Konsultation.', description: 'Patientendaten, Notizen und Laborbefunde auf einen Blick während der Behandlung.', imageUrl: null },
    ],
    en: [
      { tab: 'Appointment', headline: 'Book online, confirm automatically.',    description: 'Patients book online. The system checks availability and sends the confirmation automatically.', imageUrl: null },
      { tab: 'Check-in',    headline: 'Digital form before the visit.',         description: 'Patient data and symptoms are collected digitally before the appointment.', imageUrl: null },
      { tab: 'Treatment',   headline: 'Everything in one place during the consultation.', description: 'Patient data, notes, and lab results in one view during treatment.', imageUrl: null },
    ],
  },

  // ── V2 hero / trust copy, added 2026-07-25. targetAudience restates
  // industry/market above. trustCue restates the `domain`/`systemUrl`
  // fields (own branded practice domain) — the same structural fact used
  // for HandwerkOS/RestaurantOS's trustCue, worded distinctly here. No
  // complianceNote — per Healthcare Claim Safety, nothing in this entry
  // evidences a specific, verifiable compliance capability (see the
  // description correction above), so the field is left unset rather
  // than reintroducing the same overclaim in a different field.
  targetAudience: {
    de: 'Für Facharztpraxen in Deutschland, die Terminorganisation und Patientenkommunikation digitalisieren wollen.',
    en: 'Built for specialist medical practices in Germany that want to digitalise appointment scheduling and patient communication.',
  },
  trustCue: {
    de: 'Läuft auf Ihrer eigenen Praxis-Domain, nicht auf einer Maxpromo-Adresse.',
    en: 'Runs on your own practice domain, not a Maxpromo address.',
  },

  // ── V2 OutcomeStrip / ProblemSolution content, added 2026-07-25.
  // outcomeStats are structural facts from the workflow above (5 steps,
  // automatic reminders, one place for patient data during treatment) —
  // no percentages, saved hours, or compliance outcomes claimed.
  // problemStatement restates the existing `bullets` (already benefit-
  // phrased) as the inverse market problem, paired with `description` in
  // ProblemSolution.tsx.
  outcomeStats: {
    de: ['5 Schritte von der Terminbuchung bis zur Rechnung', 'Automatische Erinnerung per SMS oder E-Mail', '1 Ort für Patientendaten während der Behandlung'],
    en: ['5 steps from booking to invoice', 'Automatic reminder by SMS or email', '1 place for patient data during treatment'],
  },
  problemStatement: {
    de: 'Terminchaos, verpasste Erinnerungen, Papierunterlagen: Praxisteams verlieren Zeit an Verwaltung statt an Patienten.',
    en: 'Scheduling chaos, missed reminders, paper records: practice teams lose time to admin instead of patients.',
  },

  // ── Demo access, added 2026-07-25 (Marcel's item 2 / Part B item 7) —
  // demoUrl is null and hasDemoLogin is false with no demoCredentials
  // block: there is currently no usable demo at all for PraxisOS, not
  // even a gated one. 'none' is the only evidenced choice — CTA asks for
  // a consultation, not a demo, per the explicit demoAccess → CTA mapping
  // in cta.ts (resolveDemoAccessLabel).
  demoAccess: 'none',

  // ── V2 final CTA, added 2026-07-25. Single CTA (no finalSecondary) —
  // with demoAccess: 'none' there is no distinct second destination to
  // offer alongside the consultation request.
  finalEyebrow: {
    de: '// Kontakt aufnehmen',
    en: '// Get in touch',
  },
  finalHeading: {
    de: 'Bringen Sie Termine, Erinnerungen und Dokumentation in einen Ablauf.',
    en: 'Bring appointments, reminders, and documentation into one flow.',
  },
  finalDescription: {
    de: 'Sprechen Sie mit uns darüber, wie PraxisOS Terminorganisation und Patientenkommunikation in Ihrer Praxis verbinden kann.',
    en: 'Talk to us about how PraxisOS can connect appointment scheduling and patient communication in your practice.',
  },
  finalPrimaryLabel: {
    de: 'Beratung anfragen →',
    en: 'Request a consultation →',
  },
  finalPrimaryUrl: '/contact?system=praxis-os',

  // ── Media
  media: {
    card: {
      en: 'images/systems/praxis-os/card/praxis-os-en.png',
      de: 'images/systems/praxis-os/card/praxis-os-de.png',
    },
  },
  brandColor:     'var(--semantic-info)',
  layoutVariant:  'A',

  // ── Links
  demoUrl:     null, // TODO: confirm demo URL
  landingUrl:  '',
  systemUrl:   'https://super-praxis.de',
  bookDemoUrl: '/contact?system=praxis-os',
  contactSlug: 'praxis-os',
  hasDemoLogin: false,

  // ── CTA
  ctaType: 'standard',

  // ── Analytics
  eventSource:     'praxis-os',
  trackingEnabled: true,

  // ── Future
  revenueModel: 'installation',
} satisfies ProductEntry

// =============================================================================
// 4. PRINTSHOP OS
// =============================================================================
// FIX 2026-07-25: slug/landingUrl previously pointed to /products/printshop-os,
// a route that did not exist — the actual page lived at /products/printshop.
// Route moved to /systems/printshop-os to match this corrected slug so the
// route segment, registry slug and landingUrl are finally consistent.

const PRINTSHOP_OS = {
  // ── Identity
  slug:        'printshop-os',
  name:        'PrintShopOS',
  domainBrand: 'PRINTSHOP OS',
  domain:      'smartprintshop.de',
  category:    'business-system',
  owner:       'maxpromo',
  track:       'commercial',

  // ── Classification
  status:         'demo-ready',
  maturity:       'pilot',
  priority_score: 90,
  featured:       true,
  visibility:     'public',

  // ── Market
  market:         ['de', 'global'],
  marketPriority: 6,
  locales:        ['de', 'en'],
  industry:       'print',

  // ── Content
  headline: {
    en: "Print jobs flow. Mistakes don't.",
    de: 'Druckaufträge laufen. Fehler nicht.',
  },
  subline: {
    en: 'We automate your print shop. You focus on production.',
    de: 'Wir automatisieren Ihre Druckerei. Sie konzentrieren sich auf die Produktion.',
  },
  // description CORRECTED 2026-07-25 (PrintShopOS V2 migration, Marcel's
  // claim-safety review, item 5) — "AI validates files" is kept, directly
  // evidenced by the workflow's automatic DPI/color/font/trim check below.
  // Nothing else changed here; the overclaim was in `workflow` and
  // `bullets`, corrected below.
  description: {
    en: 'Smart ordering, automatic file checks and production management in one system. AI validates files before they reach the press.',
    de: 'Intelligente Auftragsannahme, automatische Dateiprüfung und Produktionsverwaltung in einem System. KI prüft Dateien bevor sie auf die Druckmaschine kommen.',
  },
  // bullets CORRECTED 2026-07-25 (Marcel's item 5/6), then CORRECTED AGAIN
  // 2026-07-25 (Marcel's final claim-correction pass, Part A item 1) —
  // "Fewer reprints from file errors" / "Weniger Nachdrucke durch
  // Dateifehler" was still a RESULT claim: it asserts an actual measured
  // reduction in reprints. The automatic file check may reduce that risk,
  // but nothing in this registry proves an actual reduction ever happened,
  // or that a bad file can never reach production. Replaced with process
  // language — what the system does, not a claimed outcome. "Faster
  // turnaround" / "Schnellere Lieferzeiten" and "Happier customers" /
  // "Zufriedenere Kunden" were already removed in the prior pass (same
  // reasoning: unevidenced comparative/sentiment claims).
  bullets: {
    en: ['Detect file issues before production', 'Files checked before production', 'Customers can track order status'],
    de: ['Dateifehler vor der Produktion erkennen', 'Dateiprüfung vor der Produktion', 'Kunden sehen den Auftragsstatus'],
  },
  // featureBenefits, added 2026-07-25, CORRECTED 2026-07-25 (Marcel's final
  // claim-correction pass, Part A item 2) — "Direct handover with no
  // manual step" / "Direkte Weitergabe ohne manuelle Übergabe" claimed the
  // entire transition to production is fully automatic with zero human
  // review, which nothing in this registry confirms. Replaced with factual
  // process wording that doesn't assert zero human involvement.
  featureBenefits: {
    de: ['Automatische Dateiprüfung vor der Produktion', 'Geprüfte Dateien stehen für die Produktion bereit', 'Auftragsstatus für Kunden einsehbar'],
    en: ['Automatic file check before production', 'Checked files are prepared for production', 'Order status visible to the customer'],
  },
  // workflow CORRECTED 2026-07-25 (Marcel's item 1/5/8), then CORRECTED
  // AGAIN 2026-07-25 (Marcel's final claim-correction pass, Part A items
  // 1–2) — two more issues found in the 'Production' step specifically:
  //  1. "no reprints from bad files" / "keine Nachdrucke durch schlechte
  //     Dateien" — same unevidenced-result issue as the `bullets`
  //     correction above. Removed.
  //  2. "No manual handover" / "Keine manuelle Übergabe" — an absolute
  //     zero-human-involvement claim nothing in this entry confirms.
  //     Removed; replaced with factual process wording ("file checking
  //     and production status in one workflow") instead of asserting the
  //     transition itself is fully automatic.
  // Earlier fixes from the prior pass (AI Check's prepress-automation
  // claim, Delivery's "fast"/"live" claims, Done's business-outcome
  // sentiment) are unchanged — already corrected, not touched again here.
  workflow: {
    en: [
      { label: 'Upload',     description: 'Customer uploads the file and selects the product. No technical knowledge needed.' },
      { label: 'AI Check',   description: 'Automatic check of DPI, colors, fonts, and trim before the file goes to production.' },
      { label: 'Production', description: 'Checked files are prepared for production. File checking and production status in one workflow.' },
      { label: 'Delivery',   description: 'Customer can check the order status at any time, from upload to delivery.' },
      { label: 'Done',       description: 'Order is marked complete once delivery is confirmed.' },
    ],
    de: [
      { label: 'Upload',      description: 'Kunde lädt die Datei hoch und wählt das Produkt. Kein technisches Wissen erforderlich.' },
      { label: 'KI-Prüfung',  description: 'Automatische Prüfung von DPI, Farben, Schriften und Beschnitt, bevor die Datei in die Produktion geht.' },
      { label: 'Produktion',  description: 'Geprüfte Dateien stehen für die Produktion bereit. Dateiprüfung und Produktionsstatus in einem Ablauf.' },
      { label: 'Lieferung',   description: 'Kunde kann den Auftragsstatus jederzeit einsehen — vom Upload bis zur Lieferung.' },
      { label: 'Fertig',      description: 'Auftrag wird nach bestätigter Lieferung als abgeschlossen markiert.' },
    ],
  },

  // ── FAQ (pre-sales objections), added 2026-07-25 for the V2 migration —
  // PrintShopOS previously shipped with no FAQ content at all. Per
  // Marcel's item 10 and claim-safety review: pricing/quotation question
  // answered honestly (no automated quote engine is evidenced anywhere in
  // this entry — quotes are stated as individually agreed, not invented
  // as automatic); production-equipment integration question answered by
  // saying machine connections are assessed separately, not implied to
  // exist, since nothing in this entry evidences any press/equipment
  // integration.
  faq: {
    de: [
      { question: 'Für wen ist PrintShopOS gedacht?',              answer: 'Für Druckereien und Print-Dienstleister, die Auftragsannahme und Dateiprüfung digitalisieren wollen.' },
      { question: 'Können Kunden Aufträge online einreichen?',     answer: 'Ja. Kunden laden ihre Datei hoch und wählen das Produkt — ohne technisches Wissen.' },
      { question: 'Ersetzt das System meine bestehende Website?',  answer: 'Nicht zwangsläufig. PrintShopOS deckt Auftragsannahme, Dateiprüfung und Produktionsstatus ab — ob es Ihre bestehende Website ersetzt oder ergänzt, besprechen wir individuell.' },
      { question: 'Wie werden Angebote und Preise gehandhabt?',    answer: 'Preise und Angebote werden individuell mit Ihnen abgestimmt — eine automatische Preisberechnung ist aktuell nicht Teil des Systems.' },
      { question: 'Wie wird der Auftragsstatus verwaltet?',        answer: 'Kunden können den Status ihres Auftrags jederzeit einsehen — vom Upload bis zur Lieferung.' },
      { question: 'Verbindet sich das System mit meiner Druckmaschine?', answer: 'Anbindungen an Produktionsmaschinen werden individuell geprüft und sind nicht automatisch Teil der Standardinstallation.' },
      { question: 'Gibt es eine Demo?',                            answer: 'Ja. Wir zeigen Ihnen das System in einer geführten Demo — auf Anfrage, unverbindlich.' },
      { question: 'Was passiert nach der Installation?',           answer: 'Sie gehen live. Wir übernehmen Hosting, Updates und Support.' },
    ],
    en: [
      { question: 'Who is PrintShopOS built for?',              answer: 'For print shops and print service providers that want to digitalise order intake and file checking.' },
      { question: 'Can customers submit orders online?',        answer: 'Yes. Customers upload their file and select the product — no technical knowledge required.' },
      { question: 'Does it replace my existing website?',       answer: 'Not necessarily. PrintShopOS covers order intake, file checking, and production status — whether it replaces or complements your existing website is something we discuss case by case.' },
      { question: 'How are quotes and pricing handled?',        answer: 'Prices and quotes are agreed with you individually — automatic price calculation is not currently part of the system.' },
      { question: 'How is order status managed?',               answer: 'Customers can check their order status at any time, from upload to delivery.' },
      { question: 'Does the system connect to my printing press?', answer: 'Connections to production equipment are assessed individually and are not automatically part of the standard installation.' },
      { question: 'Is there a demo available?',                 answer: 'Yes. We show you the system in a guided demo — on request, no obligation.' },
      { question: 'What happens after installation?',           answer: 'You go live. We handle hosting, updates, and support.' },
    ],
  },

  // ── See In Action (Phase 5 — imageUrl null until screenshots captured
  // from live system), added 2026-07-25. 3 tabs, each restating one
  // existing workflow step above. Production tab CORRECTED 2026-07-25
  // (Marcel's final claim-correction pass, Part A item 2) — "no manual
  // handover" removed, same reasoning as the `workflow`/`featureBenefits`
  // correction above.
  seeInAction: {
    de: [
      { tab: 'Upload',      headline: 'Datei hochladen, Produkt wählen.', description: 'Kunde lädt die Datei hoch und wählt das Produkt — kein technisches Wissen nötig.', imageUrl: null },
      { tab: 'Prüfung',     headline: 'Datei wird automatisch geprüft.', description: 'DPI, Farben, Schrift und Beschnitt werden automatisch geprüft, bevor die Datei in die Produktion geht.', imageUrl: null },
      { tab: 'Produktion',  headline: 'Geprüft und produktionsbereit.', description: 'Geprüfte Dateien stehen für die Produktion bereit — Dateiprüfung und Produktionsstatus in einem Ablauf.', imageUrl: null },
    ],
    en: [
      { tab: 'Upload',      headline: 'Upload the file, select the product.', description: 'Customer uploads the file and selects the product — no technical knowledge required.', imageUrl: null },
      { tab: 'File Check',  headline: 'File is checked automatically.', description: 'DPI, colors, fonts, and trim are checked automatically before the file goes to production.', imageUrl: null },
      { tab: 'Production',  headline: 'Checked and ready for production.', description: 'Checked files are prepared for production — file checking and production status in one workflow.', imageUrl: null },
    ],
  },

  // ── V2 hero / trust copy, added 2026-07-25. targetAudience restates
  // industry/market above. trustCue restates the `domain`/`systemUrl`
  // fields (own branded domain), same structural fact used for the other
  // three V2-migrated products, worded distinctly here. No complianceNote
  // — nothing in this entry evidences a specific, verifiable compliance
  // capability for a print business (no equivalent of HandwerkOS's
  // XRechnung fact), so the field is left unset rather than invented.
  targetAudience: {
    de: 'Für Druckereien und Print-Dienstleister, die Auftragsannahme und Dateiprüfung digitalisieren wollen.',
    en: 'Built for print shops and print service providers that want to digitalise order intake and file checking.',
  },
  trustCue: {
    de: 'Läuft unter dem Namen Ihrer Druckerei — mit eigener Domain und eigenem Branding.',
    en: "Runs under your print shop's name — your own domain, your own branding.",
  },

  // ── V2 OutcomeStrip / ProblemSolution content, added 2026-07-25.
  // outcomeStats are structural facts from the workflow above (5 steps,
  // 4 named file checks, 1 system covering order/check/status) — no
  // percentages, turnaround claims, or revenue figures. problemStatement
  // restates the corrected `bullets`/workflow as the inverse market
  // problem, paired with `description` in ProblemSolution.tsx.
  outcomeStats: {
    de: ['5 Schritte vom Upload bis zur Lieferung', '4 automatische Dateiprüfungen — DPI, Farbe, Schrift, Beschnitt', '1 System für Auftrag, Prüfung und Status'],
    en: ['5 steps from upload to delivery', '4 automatic file checks — DPI, color, fonts, trim', '1 system for order, check, and status'],
  },
  // problemStatement CORRECTED 2026-07-25 (Marcel's final claim-correction
  // pass, Part A item 1) — "die vor der Produktion vermeidbar wären" /
  // "avoidable before production" implied the product guarantees
  // avoidance. Reworded to name the problem (reprints from bad files cost
  // time and money) without promising the file check prevents them.
  problemStatement: {
    de: 'Fehlerhafte Dateien, manuelle Weitergabe, teure Nachdrucke: Druckereien verlieren Zeit und Geld an Probleme, die eine Dateiprüfung vor der Produktion früh erkennen kann.',
    en: 'Faulty files, manual handovers, expensive reprints: print shops lose time and money on problems a file check before production can help catch early.',
  },

  // ── Demo access, added 2026-07-25 (Marcel's item 2) — hasDemoLogin is
  // true and demoCredentials.password is blank with the same "Demo access
  // available during guided review" comment already used for HandwerkOS —
  // directly evidenced, same pattern, not inferred. Not 'public'.
  demoAccess: 'guided',

  // ── V2 final CTA, added 2026-07-25. Single CTA — no genuinely distinct
  // second destination exists (same reasoning as HandwerkOS/RestaurantOS
  // post-correction/PraxisOS).
  finalEyebrow: {
    de: '// Nächster Druckauftrag',
    en: '// Your next print job',
  },
  finalHeading: {
    de: 'Bringen Sie Upload, Dateiprüfung und Produktion in einen Ablauf.',
    en: 'Bring upload, file checking, and production into one flow.',
  },
  finalDescription: {
    de: 'Sprechen Sie mit uns darüber, wie PrintShopOS Auftragsannahme, Dateiprüfung und Produktionsstatus in Ihrer Druckerei verbinden kann.',
    en: 'Talk to us about how PrintShopOS can connect order intake, file checking, and production status in your print shop.',
  },
  finalPrimaryLabel: {
    de: 'Demo anfragen →',
    en: 'Request a demo →',
  },
  finalPrimaryUrl: '/contact?system=printshop-os',

  // ── Media
  // NOTE: only `card` exists (en + de). No pain/gallery/dashboard media —
  // flagged for the final asset batch, same gap as PraxisOS.
  media: {
    card: {
      en: 'images/systems/printshop-os/card/printshop-os-en.png',
      de: 'images/systems/printshop-os/card/printshop-os-de.png',
    },
  },
  brandColor:     '#EC008C',
  layoutVariant:  'B',

  // ── Links
  demoUrl:     'https://printshop.maxpromo.digital',
  landingUrl:  '',
  systemUrl:   'https://smartprintshop.de',
  bookDemoUrl: '/contact?system=printshop-os',
  contactSlug: 'printshop-os', // Aligned 2026-07-25 with slug/route — was 'printshop', now consistent everywhere
  hasDemoLogin: true,
  demoCredentials: {
    url:      'https://printshop.maxpromo.digital',
    email:    'demo@smartprintshop.de',
    password: '', // Demo access available during guided review — do not commit credentials
  },

  // ── CTA
  ctaType: 'standard',

  // ── Analytics
  eventSource:     'printshop-os',
  trackingEnabled: true,

  // ── Future
  revenueModel: 'installation',
} satisfies ProductEntry

// =============================================================================
// 5. CAREOS
// =============================================================================

const CARE_OS = {
  // ── Identity
  slug:        'care-os',
  name:        'CareOS',
  domainBrand: 'PFLEGE-CARE24',
  domain:      'pflege-care24.de',
  category:    'business-system',
  owner:       'maxpromo',
  track:       'commercial',

  // ── Classification
  status:         'demo-ready',
  maturity:       'pilot',
  priority_score: 80,
  featured:       true,
  visibility:     'public',

  // ── Market
  // NOTE: registry `market` is ['de'] and `domain` is the German
  // pflege-care24.de, but other public copy on this site (messages/en.json
  // and de.json's homepage proof strip and Agent Bureau case-study card,
  // both out of this round's scope) describes CareOS as "CARE · UK" /
  // "built from a live UK care provider deployment". This is a real
  // inconsistency in the existing content, flagged here rather than
  // silently resolved either way — not something this round's registry
  // pass invented or can safely guess at.
  market:         ['de'],
  marketPriority: 5,
  locales:        ['de', 'en'],
  industry:       'care',

  // ── Content
  // headline/subline/description/bullets/workflow CORRECTED 2026-07-25
  // (CareOS V2 migration, Marcel's mandatory evidence rule) — the prior
  // copy asserted EMAR (electronic medication administration records),
  // CQC compliance, an AI assistant, a family portal, automatic caregiver
  // matching/scheduling/notifications, and DSGVO-compliant records. None
  // of this has implementation, configuration, or documentation evidence
  // anywhere in the inspectable scope (maxpromo.digital — this entry has
  // no dedicated component or route in the registry-driven showcase
  // system; CareOS's own application, if one exists, lives outside this
  // repository). A hand-authored marketing page also exists at
  // app/[locale]/products/care-os/page.tsx containing the same class of
  // claims in far more elaborate detail (EMAR "updated in real time",
  // continuous CQC tracking, an AI assistant that "collects information
  // and creates profile", automatic carer matching) — that page is NOT
  // treated as evidence here, since it is itself unverified marketing
  // copy of exactly the kind this rule exists to catch, not implementation
  // or documentation. See the Routing Review section of this report for
  // the full finding on that page. Rewritten to the only thing actually
  // evidenced: a commercial, installation-model business-system product
  // for the care industry, with no confirmed feature set or regulatory
  // claim beyond that. No CQC or DSGVO/GDPR compliance wording retained
  // anywhere in this entry.
  headline: {
    en: 'One system for your care organisation.',
    de: 'Ein System für Ihre Pflegeorganisation.',
  },
  // subline deliberately does NOT use the standard "We automate X. You
  // focus on Y." pattern (VG-05) — "automate" is unevidenced here. Uses
  // the same system-description exception already used for TaxKontrol/
  // PublishingOS (VG-06) instead.
  subline: {
    en: 'Business operating system for care organisations.',
    de: 'Betriebssystem für Pflegeorganisationen.',
  },
  description: {
    en: 'CareOS is a business operating system for care organisations. The scope of what is implemented, care plans, scheduling, communication, or documentation, is defined individually with each provider before installation.',
    de: 'CareOS ist ein Betriebssystem für Pflegeorganisationen. Der Funktionsumfang, etwa Pflegepläne, Terminplanung, Kommunikation oder Dokumentation, wird individuell mit jedem Anbieter vor der Installation festgelegt.',
  },
  bullets: {
    en: ['One system for your organisation', 'Configured to your care operation', 'Set up individually, not templated'],
    de: ['Ein System für Ihre Organisation', 'Auf Ihren Pflegebetrieb abgestimmt', 'Individuell eingerichtet, nicht vorgefertigt'],
  },
  featureBenefits: {
    en: ['Care operations in one system', 'Configuration matched to your operation', 'Set up individually for your team'],
    de: ['Pflegebetrieb in einem System', 'Konfiguration auf Ihren Betrieb abgestimmt', 'Individuell für Ihr Team eingerichtet'],
  },
  // workflow CORRECTED — the prior 5 steps (AI collects info → AI
  // qualifies/auto-matches caregiver → instant scheduling → automatic
  // family/team notification → DSGVO-compliant documentation) described
  // an autonomous care-coordination pipeline with no code, route, or
  // component evidence anywhere in this repository. Replaced with the
  // generic discovery-to-installation engagement pattern already public
  // on every other installation-model product's FAQ. No AI, automation,
  // or care-specific mechanism claimed.
  workflow: {
    en: [
      { label: 'Discovery',     description: 'Share your care workflow and current tools with us.' },
      { label: 'Configuration', description: 'System scope is defined individually based on your organisation.' },
      { label: 'Setup',         description: 'Your system is configured according to what was agreed.' },
      { label: 'Go Live',       description: 'You start using CareOS in your operation.' },
      { label: 'Support',       description: 'We handle hosting, updates, and support after installation.' },
    ],
    de: [
      { label: 'Erstgespräch', description: 'Teilen Sie uns Ihren Pflegeablauf und Ihre aktuellen Werkzeuge mit.' },
      { label: 'Konfiguration', description: 'Der Funktionsumfang wird individuell auf Ihre Organisation abgestimmt.' },
      { label: 'Einrichtung',   description: 'Ihr System wird gemäß der Vereinbarung eingerichtet.' },
      { label: 'Livegang',      description: 'Sie beginnen, CareOS in Ihrem Betrieb zu nutzen.' },
      { label: 'Support',       description: 'Wir übernehmen Hosting, Updates und Support nach der Installation.' },
    ],
  },

  // faq, added 2026-07-25 (CareOS V2 migration). Directly and honestly
  // addresses the CQC/DSGVO compliance question rather than staying
  // silent on it — Marcel explicitly flagged "any healthcare compliance
  // wording" as suspect, so the FAQ states plainly that no such
  // certification is confirmed, instead of implying one through silence.
  faq: {
    en: [
      { question: 'Who is CareOS for?',                              answer: 'CareOS is built for care organisations that want their operations run from a single, individually configured system.' },
      { question: 'Does CareOS replace my existing systems?',        answer: 'Not necessarily. What replaces, connects to, or runs alongside your existing tools is discussed and agreed individually.' },
      { question: 'Is CareOS CQC compliant?',                        answer: 'CareOS does not certify or guarantee regulatory compliance. What supports your own compliance processes is discussed and configured individually — compliance responsibility remains with your organisation.' },
      { question: 'Is CareOS GDPR/DSGVO compliant?',                 answer: 'No specific data-protection certification is confirmed as part of the base system. Data handling is discussed and agreed individually as part of setup.' },
      { question: 'Is there an AI assistant?',                       answer: 'No AI capability is confirmed as part of the base system. Any AI involvement is discussed and defined individually based on what is actually implemented for your installation.' },
      { question: 'Is there a family portal?',                       answer: 'Whether a family-facing portal is included depends on what is agreed and configured for your installation — it is not a fixed, built-in feature of every system.' },
      { question: 'Is a demo available?',                            answer: 'No public demo is currently available. Contact us to discuss whether CareOS fits your organisation.' },
      { question: 'What support is included?',                       answer: 'The scope of support is agreed together with you as part of onboarding.' },
    ],
    de: [
      { question: 'Für wen ist CareOS geeignet?',                    answer: 'CareOS richtet sich an Pflegeorganisationen, die ihren Betrieb über ein einzelnes, individuell konfiguriertes System steuern möchten.' },
      { question: 'Ersetzt CareOS meine bestehenden Systeme?',       answer: 'Nicht zwangsläufig. Was ersetzt, angebunden oder parallel zu Ihren bestehenden Werkzeugen betrieben wird, besprechen und vereinbaren wir individuell.' },
      { question: 'Ist CareOS CQC-konform?',                         answer: 'CareOS zertifiziert oder garantiert keine regulatorische Konformität. Was Ihre eigenen Compliance-Prozesse unterstützt, wird individuell besprochen und konfiguriert — die Verantwortung für Compliance bleibt bei Ihrer Organisation.' },
      { question: 'Ist CareOS DSGVO-konform?',                       answer: 'Es ist keine spezifische Datenschutzzertifizierung als Teil des Basissystems bestätigt. Der Umgang mit Daten wird individuell im Rahmen der Einrichtung besprochen und vereinbart.' },
      { question: 'Gibt es einen KI-Assistenten?',                   answer: 'Es ist keine KI-Funktion als Teil des Basissystems bestätigt. Ein möglicher KI-Einsatz wird individuell besprochen und festgelegt, basierend darauf, was für Ihre Installation tatsächlich umgesetzt wird.' },
      { question: 'Gibt es ein Familienportal?',                     answer: 'Ob ein Familienportal enthalten ist, hängt davon ab, was für Ihre Installation vereinbart und konfiguriert wird — es ist kein fest eingebautes Merkmal jedes Systems.' },
      { question: 'Gibt es eine Demo?',                              answer: 'Aktuell steht keine öffentliche Demo zur Verfügung. Kontaktieren Sie uns, um zu besprechen, ob CareOS zu Ihrer Organisation passt.' },
      { question: 'Welcher Support ist enthalten?',                  answer: 'Der Support-Umfang wird gemeinsam mit Ihnen im Rahmen des Onboardings festgelegt.' },
    ],
  },

  // No seeInAction — nothing in this entry evidences specific in-product
  // moments (no dashboard, care-plan screen, or scheduling view confirmed
  // anywhere in scope). Adding tabs here would mean inventing screens that
  // may not exist. ProductGallery already renders nothing when seeInAction
  // is absent.

  // ── V2 hero / trust copy, added 2026-07-25. targetAudience restates
  // industry/market above with fresh wording. trustCue uses the domain/
  // systemUrl fields (own branded domain, not a Maxpromo address) — the
  // same structural-fact pattern used for HandwerkOS/PraxisOS/PrintShopOS/
  // PublishingOS (domain ownership is not barred here the way it is for
  // TaxKontrol's financial-data context).
  targetAudience: {
    en: 'Built for care organisations that want their operations run from a single, individually configured system.',
    de: 'Für Pflegeorganisationen, die ihren Betrieb über ein einzelnes, individuell konfiguriertes System steuern möchten.',
  },
  trustCue: {
    en: 'Delivered on your own care domain and brand, not a Maxpromo address.',
    de: 'Bereitgestellt auf Ihrer eigenen Domain und Marke, nicht auf einer Maxpromo-Adresse.',
  },

  // ── V2 OutcomeStrip / ProblemSolution content, added 2026-07-25.
  // outcomeStats are structural facts only (step count, that scope is
  // individually defined, that it is one system) — no time saved, no
  // compliance outcome, no percentages. problemStatement describes the
  // general fragmentation problem without invoking CQC inspections,
  // safeguarding incidents, or other fear-based healthcare framing.
  outcomeStats: {
    en: ['5 steps from discovery to go-live', 'Configuration scope defined individually per provider', '1 system for your care organisation'],
    de: ['5 Schritte vom Erstgespräch bis zum Livegang', 'Funktionsumfang individuell pro Anbieter festgelegt', '1 System für Ihre Pflegeorganisation'],
  },
  problemStatement: {
    en: "Different tools for different parts of the organisation, and no single system that reflects how a care provider actually runs: that gap is what CareOS is built to close, configured to each provider's own setup.",
    de: 'Unterschiedliche Werkzeuge für unterschiedliche Bereiche der Organisation, und kein einzelnes System, das widerspiegelt, wie ein Pflegeanbieter tatsächlich arbeitet: genau diese Lücke soll CareOS schließen, abgestimmt auf den jeweiligen Anbieter.',
  },

  // ── Demo access, added 2026-07-25 (CareOS V2 migration) — directly
  // evidenced, not inferred: demoUrl is null, hasDemoLogin is false, and
  // no demoCredentials block exists anywhere in this entry.
  demoAccess: 'none',

  // ── V2 final CTA, added 2026-07-25. Single CTA — demoAccess: 'none'
  // means there is no distinct second destination to offer alongside the
  // consultation request (same reasoning as PraxisOS/TaxKontrol/
  // PublishingOS).
  finalEyebrow: {
    en: '// Start the conversation',
    de: '// Ins Gespräch kommen',
  },
  finalHeading: {
    en: 'Bring your care operations into one system.',
    de: 'Bringen Sie Ihren Pflegebetrieb in ein System.',
  },
  finalDescription: {
    en: 'Talk to us about what CareOS would cover for your care organisation — scope and features are defined individually.',
    de: 'Sprechen Sie mit uns darüber, was CareOS für Ihre Pflegeorganisation abdecken würde — Umfang und Funktionen werden individuell festgelegt.',
  },
  finalPrimaryLabel: {
    en: 'Request a consultation →',
    de: 'Beratung anfragen →',
  },
  finalPrimaryUrl: '/contact?system=care-os',

  // ── Media
  // NOTE: only `card` exists (en + de). No pain/gallery/dashboard media —
  // flagged for the final asset batch, same gap as every other product
  // migrated this session.
  media: {
    card: {
      en: 'images/systems/care-os/card/care-os-en.png',
      de: 'images/systems/care-os/card/care-os-de.png',
    },
  },
  brandColor:     '#14B8A6',
  layoutVariant:  'A',

  // ── Links
  demoUrl:     null, // TODO: confirm demo URL
  // landingUrl moved 2026-07-26 (LANDINGENGINE CONSOLIDATION): the old
  // /products/care-os hand-authored page is retired; /products/care-os
  // now permanently redirects here (next.config.ts).
  landingUrl:  '',
  systemUrl:   'https://pflege-care24.de',
  bookDemoUrl: '/contact?system=care-os',
  contactSlug: 'care-os',
  hasDemoLogin: false,

  // ── CTA — 'standard' default would render "Request a demo →", which is
  // wrong for demoAccess: 'none'. Structurally moot for the showcase page
  // once finalPrimaryLabel/Url above are set — LandingEngine.tsx resolves
  // `data.finalCta?.primaryLabel ?? data.ctaPrimary`, so the finalCta
  // block above always wins over this ctaType's resolvePrimaryLabel()
  // default (same mechanic verified for TaxKontrol/PublishingOS).
  ctaType: 'standard',

  // ── Analytics
  eventSource:     'care-os',
  trackingEnabled: true,

  // ── Future
  revenueModel: 'installation',
} satisfies ProductEntry

// =============================================================================
// 6. REALESTATEOS
// =============================================================================

const REAL_ESTATE_OS = {
  // ── Identity
  slug:        'realestate-os',
  name:        'RealEstateOS',
  domainBrand: 'EASY-IMMO24',
  domain:      'easy-immo24.de',
  category:    'business-system',
  owner:       'maxpromo',
  track:       'commercial',

  // ── Classification
  status:         'demo-ready',
  maturity:       'pilot',
  priority_score: 55,
  featured:       false,
  visibility:     'public',

  // ── Market
  market:         ['uk', 'de'],
  marketPriority: 7,
  locales:        ['en', 'de'],
  industry:       'real-estate',

  // ── Content
  // headline/subline/description/bullets/workflow CORRECTED 2026-07-25
  // (RealEstateOS V2 migration, Marcel's mandatory evidence rule) — the
  // prior copy asserted a "private intelligence platform", AI deal
  // analysis, an investor CRM, a campaign studio, financial calculators,
  // automatic lead qualification/property matching/follow-up, and a "no
  // missed inquiries" guarantee. None of this has implementation,
  // configuration, or documentation evidence anywhere in the inspectable
  // scope (maxpromo.digital — this entry has no dedicated component or
  // route in the registry-driven showcase system; RealEstateOS's own
  // application, if one exists, lives outside this repository). A
  // hand-authored marketing page also exists at
  // app/[locale]/products/real-estate-os/page.tsx containing the same
  // class of claims in far more elaborate detail (AI analysis "delivered
  // in minutes", investors "matched automatically", AI-generated campaign
  // subject lines, "no investor missed") — that page is NOT treated as
  // evidence here, since it is itself unverified marketing copy of
  // exactly the kind this rule exists to catch, not implementation or
  // documentation. See the Routing Review section of this report for the
  // full finding on that page. Rewritten to the only thing actually
  // evidenced: a commercial, installation-model business-system product
  // for the real-estate industry, with no confirmed feature set beyond
  // that. No AI, CRM, analytics, or automation claim retained.
  headline: {
    en: 'One system for your property business.',
    de: 'Ein System für Ihr Immobiliengeschäft.',
  },
  // subline deliberately does NOT use the standard "We automate X. You
  // focus on Y." pattern (VG-05) — "automate" is unevidenced here. Uses
  // the same system-description exception already used for TaxKontrol/
  // PublishingOS/CareOS (VG-06) instead.
  subline: {
    en: 'Business operating system for property companies.',
    de: 'Betriebssystem für Immobilienunternehmen.',
  },
  description: {
    en: 'RealEstateOS is a business operating system for property companies. The scope of what is implemented, deal tracking, investor relationships, or campaigns, is defined individually with each company before installation.',
    de: 'RealEstateOS ist ein Betriebssystem für Immobilienunternehmen. Der Funktionsumfang, etwa Deal-Tracking, Investorenbeziehungen oder Kampagnen, wird individuell mit jedem Unternehmen vor der Installation festgelegt.',
  },
  bullets: {
    en: ['One system for your business', 'Configured to your property operation', 'Set up individually, not templated'],
    de: ['Ein System für Ihr Geschäft', 'Auf Ihren Immobilienbetrieb abgestimmt', 'Individuell eingerichtet, nicht vorgefertigt'],
  },
  featureBenefits: {
    en: ['Property operations in one system', 'Configuration matched to your operation', 'Set up individually for your team'],
    de: ['Immobilienbetrieb in einem System', 'Konfiguration auf Ihren Betrieb abgestimmt', 'Individuell für Ihr Team eingerichtet'],
  },
  // workflow CORRECTED — the prior 5 steps (automatic lead capture → AI
  // qualification/scoring → property matching → instant scheduling →
  // AI-driven automatic follow-up) described an autonomous lead-to-close
  // pipeline with no code, route, or component evidence anywhere in this
  // repository. Replaced with the generic discovery-to-installation
  // engagement pattern already public on every other installation-model
  // product's FAQ. No AI, CRM, or automation mechanism claimed.
  workflow: {
    en: [
      { label: 'Discovery',     description: 'Share your property workflow and current tools with us.' },
      { label: 'Configuration', description: 'System scope is defined individually based on your business.' },
      { label: 'Setup',         description: 'Your system is configured according to what was agreed.' },
      { label: 'Go Live',       description: 'You start using RealEstateOS in your operation.' },
      { label: 'Support',       description: 'We handle hosting, updates, and support after installation.' },
    ],
    de: [
      { label: 'Erstgespräch',  description: 'Teilen Sie uns Ihren Immobilienablauf und Ihre aktuellen Werkzeuge mit.' },
      { label: 'Konfiguration', description: 'Der Funktionsumfang wird individuell auf Ihr Geschäft abgestimmt.' },
      { label: 'Einrichtung',   description: 'Ihr System wird gemäß der Vereinbarung eingerichtet.' },
      { label: 'Livegang',      description: 'Sie beginnen, RealEstateOS in Ihrem Betrieb zu nutzen.' },
      { label: 'Support',       description: 'Wir übernehmen Hosting, Updates und Support nach der Installation.' },
    ],
  },

  // faq, added 2026-07-25 (RealEstateOS V2 migration). Directly addresses
  // AI, CRM, and campaign-automation questions rather than staying silent
  // on them — Marcel explicitly flagged "any AI workflow", "any CRM
  // capability", and "any analytics capability" as suspect.
  faq: {
    en: [
      { question: 'Who is RealEstateOS for?',                      answer: 'RealEstateOS is built for property companies that want their operations run from a single, individually configured system.' },
      { question: 'Does it replace my existing CRM or tools?',     answer: 'Not necessarily. What replaces, connects to, or runs alongside your existing tools is discussed and agreed individually.' },
      { question: 'Does it analyse deals automatically?',            answer: 'No AI analysis capability is confirmed as part of the base system. Any AI involvement is discussed and defined individually based on what is actually implemented for your installation.' },
      { question: 'Is there a built-in investor CRM?',              answer: 'Whether CRM functionality is included depends on what is agreed and configured for your installation — it is not a fixed, built-in feature of every system.' },
      { question: 'Does the system handle campaigns automatically?', answer: 'Campaign functionality, if included, is configured individually — no specific automation is assumed until it is discussed with you.' },
      { question: 'Can you migrate our existing property and investor data?', answer: 'Migration needs are assessed individually for each company as part of the initial conversation, not assumed in advance.' },
      { question: 'Is a demo available?',                           answer: 'No public demo is currently available. Contact us to discuss whether RealEstateOS fits your business.' },
      { question: 'What support is included?',                      answer: 'The scope of support is agreed together with you as part of onboarding.' },
    ],
    de: [
      { question: 'Für wen ist RealEstateOS geeignet?',             answer: 'RealEstateOS richtet sich an Immobilienunternehmen, die ihren Betrieb über ein einzelnes, individuell konfiguriertes System steuern möchten.' },
      { question: 'Ersetzt es mein bestehendes CRM oder meine Werkzeuge?', answer: 'Nicht zwangsläufig. Was ersetzt, angebunden oder parallel zu Ihren bestehenden Werkzeugen betrieben wird, besprechen und vereinbaren wir individuell.' },
      { question: 'Gibt es eine KI-gestützte Deal-Analyse?',        answer: 'Es ist keine KI-Analysefunktion als Teil des Basissystems bestätigt. Ein möglicher KI-Einsatz wird individuell besprochen und festgelegt, basierend darauf, was für Ihre Installation tatsächlich umgesetzt wird.' },
      { question: 'Gibt es ein integriertes Investor-CRM?',         answer: 'Ob CRM-Funktionalität enthalten ist, hängt davon ab, was für Ihre Installation vereinbart und konfiguriert wird — es ist kein fest eingebautes Merkmal jedes Systems.' },
      { question: 'Werden Kampagnen automatisch abgewickelt?',      answer: 'Kampagnenfunktionen, sofern enthalten, werden individuell konfiguriert — es wird keine bestimmte Automatisierung angenommen, bevor sie mit Ihnen besprochen wurde.' },
      { question: 'Können Sie unsere bestehenden Immobilien- und Investorendaten migrieren?', answer: 'Der Migrationsbedarf wird für jedes Unternehmen individuell im Rahmen des Erstgesprächs bewertet, nicht im Voraus angenommen.' },
      { question: 'Gibt es eine Demo?',                             answer: 'Aktuell steht keine öffentliche Demo zur Verfügung. Kontaktieren Sie uns, um zu besprechen, ob RealEstateOS zu Ihrem Geschäft passt.' },
      { question: 'Welcher Support ist enthalten?',                 answer: 'Der Support-Umfang wird gemeinsam mit Ihnen im Rahmen des Onboardings festgelegt.' },
    ],
  },

  // No seeInAction — nothing in this entry evidences specific in-product
  // moments (no dashboard, CRM screen, or campaign view confirmed
  // anywhere in scope). Adding tabs here would mean inventing screens
  // that may not exist. ProductGallery already renders nothing when
  // seeInAction is absent.

  // ── V2 hero / trust copy, added 2026-07-25. targetAudience restates
  // industry/market above with fresh wording. trustCue uses the domain/
  // systemUrl fields (own branded domain, not a Maxpromo address) — same
  // structural-fact pattern used for HandwerkOS/PraxisOS/PrintShopOS/
  // PublishingOS/CareOS (domain ownership is not barred here the way it
  // is for TaxKontrol's financial-data context).
  targetAudience: {
    en: 'Built for property companies that want their operations run from a single, individually configured system.',
    de: 'Für Immobilienunternehmen, die ihren Betrieb über ein einzelnes, individuell konfiguriertes System steuern möchten.',
  },
  trustCue: {
    en: 'Delivered on your own property domain and brand, not a Maxpromo address.',
    de: 'Bereitgestellt auf Ihrer eigenen Domain und Marke, nicht auf einer Maxpromo-Adresse.',
  },

  // ── V2 OutcomeStrip / ProblemSolution content, added 2026-07-25.
  // outcomeStats are structural facts only (step count, that scope is
  // individually defined, that it is one system) — no faster responses,
  // no viewing counts, no missed-inquiry guarantee, no percentages.
  // problemStatement describes the general fragmentation problem (deals
  // tracked across email threads and spreadsheets) without claiming
  // RealEstateOS already solves it with AI or automation.
  outcomeStats: {
    en: ['5 steps from discovery to go-live', 'Configuration scope defined individually per company', '1 system for your property business'],
    de: ['5 Schritte vom Erstgespräch bis zum Livegang', 'Funktionsumfang individuell pro Unternehmen festgelegt', '1 System für Ihr Immobiliengeschäft'],
  },
  problemStatement: {
    en: "Different tools for different parts of the business, and no single system that reflects how a property company actually runs: that gap is what RealEstateOS is built to close, configured to each company's own setup.",
    de: 'Unterschiedliche Werkzeuge für unterschiedliche Bereiche des Geschäfts, und kein einzelnes System, das widerspiegelt, wie ein Immobilienunternehmen tatsächlich arbeitet: genau diese Lücke soll RealEstateOS schließen, abgestimmt auf das jeweilige Unternehmen.',
  },

  // ── Demo access, added 2026-07-25 (RealEstateOS V2 migration) —
  // directly evidenced, not inferred: demoUrl is null, hasDemoLogin is
  // false, and no demoCredentials block exists anywhere in this entry.
  demoAccess: 'none',

  // ── V2 final CTA, added 2026-07-25. Single CTA — demoAccess: 'none'
  // means there is no distinct second destination to offer alongside the
  // consultation request (same reasoning as PraxisOS/TaxKontrol/
  // PublishingOS/CareOS).
  finalEyebrow: {
    en: '// Talk about your business',
    de: '// Sprechen wir über Ihr Geschäft',
  },
  finalHeading: {
    en: 'Bring your property operations into one system.',
    de: 'Bringen Sie Ihren Immobilienbetrieb in ein System.',
  },
  finalDescription: {
    en: 'Talk to us about what RealEstateOS would cover for your property business — scope and features are defined individually.',
    de: 'Sprechen Sie mit uns darüber, was RealEstateOS für Ihr Immobiliengeschäft abdecken würde — Umfang und Funktionen werden individuell festgelegt.',
  },
  finalPrimaryLabel: {
    en: 'Request a consultation →',
    de: 'Beratung anfragen →',
  },
  finalPrimaryUrl: '/contact?system=real-estate-os',

  // ── Media
  // NOTE: only `card` exists (en + de). No pain/gallery/dashboard media —
  // flagged for the final asset batch, same gap as every other product
  // migrated this session.
  media: {
    card: {
      en: 'images/systems/real-estate-os/card/real-estate-os-en.png',
      de: 'images/systems/real-estate-os/card/real-estate-os-de.png',
    },
  },
  brandColor:     '#7C3AED',
  layoutVariant:  'A',

  // ── Links
  // RESOLVED 2026-07-26 (LANDINGENGINE CONSOLIDATION): contactSlug was
  // 'realestate-os' (no hyphen), which did not match the hyphenated
  // '/contact?system=real-estate-os' used in bookDemoUrl/finalPrimaryUrl,
  // KNOWN_CONTACT_SYSTEMS (app/[locale]/contact/page.tsx), and the
  // messages.contact.systems.'real-estate-os' translation key — all four
  // of those already agreed on the hyphenated form, so contactSlug below
  // is corrected to match rather than the other way round. The registry
  // primary key `slug` ('realestate-os', top of this block) and
  // `eventSource` below are intentionally left unchanged — both are
  // internal identifiers (HOST_MAP lookup key / stable analytics key tied
  // to `slug` per types.ts), not the public-facing contact-routing value,
  // and changing either would be a routing/analytics change Marcel did
  // not ask for.
  demoUrl:     null, // TODO: confirm demo URL
  // landingUrl moved 2026-07-26: the old /products/real-estate-os
  // hand-authored page is retired; /products/real-estate-os now
  // permanently redirects here (next.config.ts).
  landingUrl:  '',
  systemUrl:   'https://easy-immo24.de',
  bookDemoUrl: '/contact?system=real-estate-os',
  contactSlug: 'real-estate-os',
  hasDemoLogin: false,

  // ── CTA — 'standard' default would render "Request a demo →", which is
  // wrong for demoAccess: 'none'. Structurally moot for the showcase page
  // once finalPrimaryLabel/Url above are set — LandingEngine.tsx resolves
  // `data.finalCta?.primaryLabel ?? data.ctaPrimary`, so the finalCta
  // block above always wins over this ctaType's resolvePrimaryLabel()
  // default (same mechanic verified for TaxKontrol/PublishingOS/CareOS).
  ctaType: 'standard',

  // ── Analytics
  eventSource:     'realestate-os',
  trackingEnabled: true,

  // ── Future
  revenueModel: 'installation',
} satisfies ProductEntry

// =============================================================================
// 7. PUBLISHINGOS
// =============================================================================

const PUBLISHING_OS = {
  // ── Identity
  slug:        'publishing-os',
  name:        'PublishingOS',
  domainBrand: 'PUBLISHERS24',
  domain:      'publishers24.org',
  category:    'business-system',
  owner:       'maxpromo',
  track:       'commercial',

  // ── Classification
  status:         'demo-ready',
  maturity:       'pilot',
  priority_score: 40,
  featured:       false,
  visibility:     'public',

  // ── Market
  market:         ['cm', 'global'],
  marketPriority: 8,
  locales:        ['en'],
  industry:       'publishing',

  // ── Content
  // headline/subline/description CORRECTED 2026-07-25 (PublishingOS V2
  // migration, Marcel's global evidence rule) — the prior copy ("8 AI
  // agents running 24/7", "AI finds trending topics", "AI writes and
  // optimises SEO-ready content", "Higher rankings, more traffic, more
  // revenue — every month") had zero supporting evidence anywhere in this
  // repository. No AI agent code, no topic-discovery logic, no content-
  // generation pipeline, no publishing/distribution automation, no SEO
  // tooling, no analytics, and no manuscript/royalty/HR/finance/stock
  // module exists in the inspectable scope (maxpromo.digital — this entry
  // has no dedicated route or component directory at all; the showcase
  // page is rendered entirely by the shared LandingEngine off this
  // registry data). Rewritten to the only things actually evidenced: a
  // commercial, installation-model business-system product for the
  // publishing industry, with no confirmed feature set beyond that. Not
  // positioned as autonomous publishing, an autonomous newsroom, a
  // guaranteed SEO system, or a revenue generator.
  headline: {
    en: 'One system for your publishing business.',
  },
  // subline deliberately does NOT use the standard "We automate X. You
  // focus on Y." pattern (VG-05) — "automate" is unevidenced here. Uses
  // the same system-description exception already used for TaxKontrol
  // (VG-06) instead.
  subline: {
    en: 'Business operating system for publishing companies.',
  },
  description: {
    en: 'PublishingOS is a business operating system for publishing companies. The scope of what is implemented, orders, stock, editorial workflow, royalties, or finance, is defined individually with each publisher before installation.',
  },
  // bullets CORRECTED — "More content, less work" / "Higher rankings, more
  // traffic" / "More revenue, every month" were outcome guarantees with no
  // implementation behind them. Replaced with the only factual statement
  // this entry supports: one system, configured per business, delivered
  // as an installation rather than a fixed template.
  bullets: {
    en: ['One system for your business', 'Configured to your publishing operation', 'Set up individually, not templated'],
  },
  // featureBenefits, added 2026-07-25. Restates the corrected bullets as
  // benefit statements for FeatureArchitecture's Time/Quality/Revenue
  // cards — no capability beyond what `bullets`/`description` already say.
  featureBenefits: {
    en: ['Business operations in one system', 'Configuration matched to your operation', 'Set up individually for your team'],
  },
  // workflow CORRECTED 2026-07-25 — the prior 5 steps (Topic Discovered →
  // Content Created → Published → Distributed → Traffic & Revenue)
  // described an autonomous AI publishing pipeline with no code, route,
  // or component evidence anywhere in this repository. Replaced with the
  // only workflow actually evidenced anywhere in this registry: the
  // generic discovery-to-installation engagement pattern already public
  // on every other installation-model product's FAQ ("You go live. We
  // handle hosting, updates and support."). No AI, no automation, no
  // publishing-specific step claimed.
  workflow: {
    en: [
      { label: 'Discovery',     description: 'Share your publishing workflow and current tools with us.' },
      { label: 'Configuration', description: 'System scope is defined individually based on your business.' },
      { label: 'Setup',         description: 'Your system is configured according to what was agreed.' },
      { label: 'Go Live',       description: 'You start using PublishingOS in your operation.' },
      { label: 'Support',       description: 'We handle hosting, updates, and support after installation.' },
    ],
  },

  // faq, added 2026-07-25 (PublishingOS V2 migration, Marcel's item 11).
  // Every answer defers unverified specifics (CMS replacement, migration,
  // AI involvement, editing workflow, publishing pipeline) to individual
  // discussion rather than asserting a capability this repository doesn't
  // evidence. This is the honest answer given the evidence gap, not a
  // placeholder — corrected if/when real implementation evidence exists.
  faq: {
    en: [
      { question: 'Who is PublishingOS for?',                       answer: 'PublishingOS is built for publishing companies that want their operations run from a single, individually configured system.' },
      { question: 'Do I need to replace my existing CMS or website?', answer: 'Not necessarily. What replaces, connects to, or runs alongside your existing tools is discussed and agreed individually.' },
      { question: 'Can you migrate our existing content and data?',  answer: 'Migration needs are assessed individually for each publisher as part of the initial conversation, not assumed in advance.' },
      { question: 'Is AI involved in PublishingOS?',                 answer: 'No AI capability is confirmed as part of the base system. Any AI involvement is discussed and defined individually based on what is actually implemented for your installation.' },
      { question: 'How does editing work?',                         answer: "Editing workflows are set up individually based on your team's process — nothing is assumed about how your editors currently work." },
      { question: 'How does content get published?',                answer: 'How content moves from draft to published is configured individually per publisher. No specific publishing pipeline is assumed until it is discussed with you.' },
      { question: 'Is a demo available?',                           answer: 'No public demo is currently available. Contact us to discuss whether PublishingOS fits your business.' },
      { question: 'What support is included?',                      answer: 'The scope of support is agreed together with you as part of onboarding.' },
    ],
  },

  // No seeInAction — unlike the other V2-migrated products, nothing in
  // this entry evidences specific in-product moments (no dashboard,
  // editorial queue, or report screen confirmed anywhere in scope).
  // Adding tabs here would mean inventing screens that may not exist.
  // ProductGallery already renders nothing when seeInAction is absent.

  // ── V2 hero / trust copy, added 2026-07-25. targetAudience restates
  // industry/market above with fresh wording (not reused from any other
  // product). trustCue uses the domain/systemUrl fields (own branded
  // domain, not a Maxpromo address) — the same structural-fact pattern
  // used for HandwerkOS/PraxisOS/PrintShopOS (domain ownership is not
  // barred here the way it is for TaxKontrol's financial-data context).
  targetAudience: {
    en: 'Built for publishing companies that want their operations run from a single, individually configured system.',
  },
  trustCue: {
    en: 'Delivered on your own publishing domain and brand, not a Maxpromo address.',
  },

  // ── V2 OutcomeStrip / ProblemSolution content, added 2026-07-25.
  // outcomeStats are structural facts only (step count, that scope is
  // individually defined, that it is one system) — no traffic, no
  // revenue, no ranking, no percentages. problemStatement describes the
  // general fragmentation problem a publishing business can face without
  // naming specific unverified modules (manuscripts, royalties, etc.) as
  // if PublishingOS already covers them.
  outcomeStats: {
    en: ['5 steps from discovery to go-live', 'Configuration scope defined individually per publisher', '1 system for your publishing business'],
  },
  problemStatement: {
    en: "Different tools for different parts of the business, and no single system that reflects how a publishing company actually runs: that gap is what PublishingOS is built to close, configured to each publisher's own setup.",
  },

  // ── Demo access, added 2026-07-25 (PublishingOS V2 migration, Marcel's
  // item 12) — directly evidenced, not inferred: demoUrl is null,
  // hasDemoLogin is false, and no demoCredentials block exists anywhere in
  // this entry.
  demoAccess: 'none',

  // ── V2 final CTA, added 2026-07-25. Single CTA — demoAccess: 'none'
  // means there is no distinct second destination to offer alongside the
  // consultation request (same reasoning as PraxisOS/TaxKontrol).
  finalEyebrow: {
    en: '// Let\'s talk',
  },
  finalHeading: {
    en: 'Bring your publishing operations into one system.',
  },
  finalDescription: {
    en: 'Talk to us about what PublishingOS would cover for your publishing business — scope and features are defined individually.',
  },
  finalPrimaryLabel: {
    en: 'Request a consultation →',
  },
  finalPrimaryUrl: '/contact?system=publishing-os',

  // ── Media
  // NOTE: media.card lists both en and de paths despite locales: ['en']
  // only — pre-existing inconsistency, left as-is (not a claim, out of
  // this round's scope). No pain/gallery/dashboard media exists — flagged
  // for the final asset batch, same gap as PraxisOS/PrintShopOS/TaxKontrol.
  media: {
    card: {
      en: 'images/systems/publishing-os/card/publishing-os-en.png',
      de: 'images/systems/publishing-os/card/publishing-os-de.png',
    },
  },
  // TODO: confirm exact brand hex — design card uses brown/maroon/beige palette
  brandColor:     '#8B5E3C',
  layoutVariant:  'B', // Books LEFT, dashboard RIGHT per spec

  // ── Links
  demoUrl:     null, // TODO: confirm demo URL
  landingUrl:  '',
  systemUrl:   'https://publishers24.org',
  bookDemoUrl: '/contact?system=publishing-os',
  contactSlug: 'publishing-os',
  hasDemoLogin: false,

  // ── CTA — 'standard' default would render "Request a demo →", which is
  // wrong for demoAccess: 'none'. Structurally moot for the showcase page
  // once finalPrimaryLabel/Url above are set — LandingEngine.tsx resolves
  // `data.finalCta?.primaryLabel ?? data.ctaPrimary`, so the finalCta
  // block above always wins over this ctaType's resolvePrimaryLabel()
  // default (same mechanic verified for TaxKontrol this round).
  ctaType: 'standard',

  // ── Analytics
  eventSource:     'publishing-os',
  trackingEnabled: true,

  // ── Future
  revenueModel: 'installation',
} satisfies ProductEntry

// =============================================================================
// 8. TAXKONTROL
// =============================================================================

const TAXKONTROL = {
  // ── Identity
  slug:        'taxkontrol',
  name:        'TaxKontrol',
  domainBrand: 'TaxKontrol',
  domain:      'taxkontrol.de',
  category:    'personal-finance',
  owner:       'maxpromo',
  track:       'commercial',

  // ── Classification
  status:         'demo-ready',
  maturity:       'pilot',
  priority_score: 95,
  featured:       true,
  visibility:     'public',

  // ── Market
  market:         ['de'],
  marketPriority: 3,
  locales:        ['de', 'en'],
  industry:       'finance',

  // ── Content
  headline: {
    en: 'Your taxes. Simple. In control.',
    de: 'Ihre Steuern. Einfach. Im Griff.',
  },
  subline: {
    // VG-06 exception: personal-finance product uses system description, not We/You pattern
    en: 'Financial visibility system for self-employed and small businesses in Germany.',
    de: 'Finanzkontrollsystem für Selbstständige und kleine Unternehmen in Deutschland.',
  },
  // description CORRECTED 2026-07-25 (TaxKontrol V2 migration, Marcel's
  // items 3/4) — the prior wording ("never miss a deadline... GDPR-
  // compliant, hosted in Germany") stated regulatory and hosting facts
  // nothing in this repository evidences. No hosting configuration, no
  // data-processing agreement, and no infrastructure documentation exists
  // anywhere in the inspectable scope (maxpromo.digital — TaxKontrol's own
  // application lives in a separate repository not touched this round per
  // the standing session scope restriction). A .de domain and a German
  // target market prove neither hosting location nor legal compliance.
  // Rewritten to describe only what the product does: organise records,
  // not certify compliance.
  description: {
    en: 'TaxKontrol helps self-employed people and small businesses organise income, expenses, receipts and planned tax reserves in one clear workspace.',
    de: 'TaxKontrol hilft Selbstständigen und kleinen Unternehmen, Einnahmen, Ausgaben, Belege und geplante Steuerrücklagen übersichtlich zu verwalten.',
  },
  // bullets CORRECTED 2026-07-25 — "No more stress", "Manage everything",
  // and the deadline-guarantee framing were absolute, unverifiable
  // promises. Replaced with bounded, factual statements of what the
  // product actually shows.
  bullets: {
    en: ['See income and expenses clearly', 'Track a planned tax reserve', 'Prepare records for tax time'],
    de: ['Einnahmen und Ausgaben im Blick', 'Geplante Steuerrücklage im Blick', 'Unterlagen für die Steuerzeit vorbereiten'],
  },
  // featureBenefits, added 2026-07-25 (TaxKontrol V2 migration). Restates
  // the corrected bullets as benefit statements for FeatureArchitecture's
  // Time/Quality/Revenue cards — no new capability claimed beyond what
  // `bullets`/`workflow` already state. Wording follows Marcel's own
  // supplied safe direction.
  featureBenefits: {
    de: ['Einnahmen und Ausgaben übersichtlich erfassen', 'Geplante Steuerrücklage im Blick behalten', 'Unterlagen für die weitere Bearbeitung vorbereiten'],
    en: ['Keep income and expenses organised', 'Monitor a planned tax reserve', 'Prepare records for further processing'],
  },
  // workflow CORRECTED 2026-07-25 (TaxKontrol V2 migration, Marcel's item
  // 5) — every step audited against direct evidence in this repository.
  // No bank-integration code, no receipt-OCR pipeline, no tax-calculation
  // engine, and no ELSTER export format exist anywhere in the inspectable
  // scope (maxpromo.digital). Each step below states only what is
  // evidenced: manual entry, an estimate (not a final tax calculation),
  // and an export of recorded data (not a filed return). 'File Tax' is
  // relabelled 'Export'/'Export' — the product exports information, it
  // does not file anything.
  workflow: {
    en: [
      { label: 'Register',       description: 'Create an account and enter the basic setup information.' },
      { label: 'Connect',        description: 'Add income and expenses manually to keep your records organised.' },
      { label: 'Track Expenses', description: "Log receipts and expenses, and see an estimated tax reserve based on what you've entered." },
      { label: 'Review Report',  description: 'Clear overview of income, expenses, and the estimated amount remaining after your configured tax reserve.' },
      { label: 'Export',         description: 'Export income, expense and receipt data for further processing.' },
    ],
    de: [
      { label: 'Registrieren',      description: 'Konto anlegen und Grundeinstellungen erfassen.' },
      { label: 'Verbinden',         description: 'Einnahmen und Ausgaben manuell erfassen, um Ihre Unterlagen zu organisieren.' },
      { label: 'Ausgaben erfassen', description: 'Belege und Ausgaben erfassen und eine geschätzte Steuerrücklage basierend auf den erfassten Daten sehen.' },
      { label: 'Bericht prüfen',    description: 'Klare Übersicht über Einnahmen, Ausgaben und den geschätzten verfügbaren Betrag nach der eingestellten Steuerrücklage.' },
      { label: 'Export',            description: 'Einnahmen, Ausgaben und Belegdaten für die weitere Bearbeitung exportieren.' },
    ],
  },

  // faq, added 2026-07-25 (TaxKontrol V2 migration, Marcel's item 12).
  // Covers the required buying questions plus the mandatory Steuerberater
  // disclosure in Marcel's exact required wording. Every answer reflects
  // only what is evidenced in this repository — no bank integration, no
  // OCR, no ELSTER-specific export format, no legally binding calculation.
  faq: {
    de: [
      { question: 'Für wen ist TaxKontrol geeignet?',            answer: 'TaxKontrol richtet sich an Selbstständige und kleine Unternehmen in Deutschland, die ihre Einnahmen, Ausgaben und geplante Steuerrücklage an einem Ort organisieren möchten.' },
      { question: 'Ersetzt TaxKontrol einen Steuerberater?',     answer: 'Nein. TaxKontrol hilft Ihnen, Ihre Finanzdaten zu ordnen und einen besseren Überblick zu behalten. Steuerliche Prüfung und Beratung bleiben bei Ihnen oder Ihrem Steuerberater.' },
      { question: 'Reicht TaxKontrol meine Steuererklärung ein?', answer: 'Nein. TaxKontrol bereitet Einnahmen, Ausgaben und Belegdaten für den Export vor. Die Einreichung der Steuererklärung erfolgt weiterhin über Sie selbst oder Ihren Steuerberater.' },
      { question: 'Kann ich mein Bankkonto verbinden?',          answer: 'Aktuell werden Einnahmen und Ausgaben manuell erfasst. Eine Bankanbindung ist nicht Teil des aktuellen Funktionsumfangs.' },
      { question: 'Wie wird die Steuerrücklage berechnet?',      answer: 'Die Steuerrücklage ist eine Schätzung auf Basis der von Ihnen erfassten Einnahmen und Ausgaben. Sie ersetzt keine verbindliche steuerliche Berechnung.' },
      { question: 'Kann ich Belege hochladen?',                  answer: 'Belege können erfasst und Ausgaben zugeordnet werden. Eine automatische Texterkennung ist aktuell nicht Teil des Funktionsumfangs.' },
      { question: 'Was kann ich exportieren?',                   answer: 'Sie können Ihre erfassten Einnahmen-, Ausgaben- und Belegdaten für die weitere Bearbeitung exportieren, zum Beispiel für Ihren Steuerberater.' },
      { question: 'Ist das Ergebnis rechtlich verbindlich?',     answer: 'Nein. Die in TaxKontrol angezeigten Werte, einschließlich der geschätzten Steuerrücklage, sind eine Orientierung und keine rechtsverbindliche steuerliche Berechnung.' },
      { question: 'Gibt es eine Demo?',                          answer: 'Aktuell steht keine öffentliche Demo zur Verfügung. Kontaktieren Sie uns für eine Beratung und eine Einordnung, ob TaxKontrol zu Ihrem Unternehmen passt.' },
      { question: 'Welcher Support ist enthalten?',              answer: 'Der Support-Umfang wird gemeinsam mit Ihnen im Rahmen der Beratung festgelegt.' },
    ],
    en: [
      { question: 'Who is TaxKontrol for?',                answer: 'TaxKontrol is designed for self-employed people and small businesses in Germany who want to organise their income, expenses and planned tax reserve in one place.' },
      { question: 'Does TaxKontrol replace a tax adviser?', answer: 'No. TaxKontrol helps organise your financial records and improve visibility. Tax review and professional advice remain with you or your tax adviser.' },
      { question: 'Does TaxKontrol file my tax return?',    answer: 'No. TaxKontrol prepares income, expense and receipt data for export. Filing the tax return itself remains with you or your tax adviser.' },
      { question: 'Can I connect a bank account?',          answer: 'Income and expenses are currently entered manually. A bank connection is not part of the current feature set.' },
      { question: 'How is the tax reserve calculated?',     answer: 'The tax reserve is an estimate based on the income and expenses you enter. It does not replace a binding tax calculation.' },
      { question: 'Can I upload receipts?',                 answer: 'Receipts can be logged and assigned to expenses. Automatic text recognition is not currently part of the feature set.' },
      { question: 'What can I export?',                     answer: 'You can export your recorded income, expense and receipt data for further processing — for example, to hand to your tax adviser.' },
      { question: 'Is the result legally binding?',         answer: 'No. The figures shown in TaxKontrol, including the estimated tax reserve, are for orientation only and are not a legally binding tax calculation.' },
      { question: 'Is a demo available?',                   answer: 'No public demo is currently available. Contact us for a consultation to discuss whether TaxKontrol fits your business.' },
      { question: 'What support is included?',              answer: 'The scope of support is agreed together with you as part of the consultation.' },
    ],
  },

  // seeInAction, added 2026-07-25. 3 tabs restating the corrected workflow
  // steps above (Track Expenses, Review Report, Export) — imageUrl null
  // until real screenshots exist. No dashboard, receipt-scanner, or chart
  // imagery invented.
  seeInAction: {
    de: [
      { tab: 'Ausgaben erfassen', headline: 'Belege und Ausgaben an einem Ort.',       description: 'Ausgaben erfassen und eine geschätzte Steuerrücklage auf Basis der erfassten Daten sehen.', imageUrl: null },
      { tab: 'Bericht',           headline: 'Klare Übersicht statt verstreuter Zahlen.', description: 'Einnahmen, Ausgaben und den geschätzten verfügbaren Betrag nach der eingestellten Rücklage einsehen.', imageUrl: null },
      { tab: 'Export',            headline: 'Bereit für die weitere Bearbeitung.',       description: 'Einnahmen-, Ausgaben- und Belegdaten für Ihren Steuerberater oder die Steuererklärung exportieren.', imageUrl: null },
    ],
    en: [
      { tab: 'Track Expenses', headline: 'Receipts and expenses in one place.',            description: "Log expenses and see an estimated tax reserve based on what you've entered.", imageUrl: null },
      { tab: 'Report',         headline: 'A clear overview instead of scattered numbers.',  description: 'See income, expenses and the estimated amount remaining after your configured reserve.', imageUrl: null },
      { tab: 'Export',         headline: 'Ready for further processing.',                   description: 'Export income, expense and receipt data for your tax adviser or tax return.', imageUrl: null },
    ],
  },

  // ── V2 hero / trust copy, added 2026-07-25. targetAudience restates
  // industry/market above. trustCue deliberately does NOT use domain
  // ownership as evidence — unlike the other four V2-migrated products,
  // Marcel explicitly barred that pattern here (a domain proves nothing
  // about control of financial data). Uses his own supplied safe wording
  // instead, which restates only the target market already stated in
  // `market`/`industry` above, not an unverified capability.
  targetAudience: {
    de: 'Für Selbstständige und kleine Unternehmen in Deutschland, die ihre Finanzunterlagen übersichtlich organisieren wollen.',
    en: 'Built for self-employed people and small businesses in Germany who want to keep their financial records organised.',
  },
  trustCue: {
    de: 'Für Selbstständige und kleine Unternehmen in Deutschland entwickelt.',
    en: 'Built for self-employed people and small businesses in Germany.',
  },

  // ── V2 OutcomeStrip / ProblemSolution content, added 2026-07-25.
  // outcomeStats are structural facts only (step count, what the one
  // workspace covers, export count) — no money saved, no tax savings, no
  // accuracy percentage, no guaranteed deadline compliance. problemStatement
  // describes the real administrative problem (scattered records,
  // uncertainty about the reserve, late preparation) without invoking
  // fines, audits, or tax debt.
  outcomeStats: {
    de: ['5 Schritte von der Erfassung bis zum Export', 'Ein Arbeitsbereich für Einnahmen, Ausgaben, Belege und Rücklagenplanung', '1 Exportfunktion für die weitere Bearbeitung'],
    en: ['5 steps from entry to export', 'One workspace for income, expenses, receipts and reserve planning', '1 export option for further processing'],
  },
  problemStatement: {
    de: 'Einnahmen und Ausgaben verteilt auf Konten, Belege und Tabellen: Selbstständige und kleine Unternehmen verlieren den Überblick darüber, was erfasst ist, wie die geplante Rücklage steht und was rechtzeitig vorbereitet werden muss.',
    en: "Income and expenses scattered across accounts, receipts and spreadsheets: self-employed people and small businesses lose track of what's recorded, how the planned reserve stands, and what needs preparing in time.",
  },

  // ── Demo access, corrected 2026-07-25 (TaxKontrol V2 migration,
  // Marcel's item 7) — directly evidenced, not inferred: demoUrl is null
  // with an explicit "app not yet in public app stores" comment,
  // hasDemoLogin is false, and no demoCredentials block exists anywhere in
  // this entry. No app-store CTA — ctaType's own governance-lock comment
  // below already documents that flow as deferred.
  demoAccess: 'none',

  // ── V2 final CTA, added 2026-07-25. Single CTA — demoAccess: 'none'
  // means there is no distinct second destination to offer alongside the
  // consultation request (same reasoning as PraxisOS).
  finalEyebrow: {
    de: '// Überblick behalten',
    en: '// Stay in control',
  },
  finalHeading: {
    de: 'Bringen Sie Einnahmen, Ausgaben, Belege und Rücklagenplanung in einen Ablauf.',
    en: 'Bring income, expenses, receipts and reserve planning into one flow.',
  },
  finalDescription: {
    de: 'Sprechen Sie mit uns darüber, wie TaxKontrol Einnahmen, Ausgaben und die Rücklagenplanung in Ihrem Unternehmen verbinden kann.',
    en: 'Talk to us about how TaxKontrol can connect income, expenses and reserve planning in your business.',
  },
  finalPrimaryLabel: {
    de: 'Beratung anfragen →',
    en: 'Request a consultation →',
  },
  finalPrimaryUrl: '/contact?system=taxkontrol',

  // ── Media
  media: {
    card: {
      en: 'images/systems/taxkontrol/card/taxkontrol-en.png',
      de: 'images/systems/taxkontrol/card/taxkontrol-de.png',
    },
  },
  // Dashboard navy — matches the TaxKontrol UI color scheme
  brandColor:     '#1E3A5F',
  layoutVariant:  'B', // Salon owner LEFT, dashboard RIGHT

  // ── Links
  demoUrl:     null, // TODO: confirm demo URL — app not yet in public app stores
  landingUrl:  '',
  systemUrl:   'https://taxkontrol.de',
  bookDemoUrl: '/contact?system=taxkontrol',
  contactSlug: 'taxkontrol',
  hasDemoLogin: false,

  // ── CTA — governance lock: standard pattern, app-store flow deferred.
  // Structurally moot for the showcase page once finalPrimaryLabel/Url
  // above are set — LandingEngine.tsx resolves
  // `data.finalCta?.primaryLabel ?? data.ctaPrimary`, so the finalCta
  // block above always wins over this ctaType's resolvePrimaryLabel()
  // default (verified 2026-07-25 by direct inspection of LandingEngine.tsx
  // and landing.adapter.ts's toLandingData()).
  ctaType: 'personal-finance',

  // ── Analytics
  eventSource:     'taxkontrol',
  trackingEnabled: true,

  // ── Future
  revenueModel: 'hybrid', // installation + subscription
} satisfies ProductEntry

// =============================================================================
// 9. DRIVE24
// =============================================================================

const DRIVE24 = {
  // ── Identity
  slug:        'drive24',
  name:        'Drive24',
  domainBrand: 'DRIVE24.LIVE',
  domain:      'drive24.live',
  category:    'platform',
  owner:       'maxpromo',
  track:       'founder', // Personal founder project — not commercial pipeline

  // ── Classification
  status:         'demo-ready',
  maturity:       'pilot',
  priority_score: 35,
  featured:       false,          // No homepage exposure — founder track
  visibility:     'protected',    // Drive24 visibility: gated, not public-first

  // ── Market
  market:         ['cm'],         // Cameroon primary market
  marketPriority: 1,              // Primary product in the Cameroon market
  locales:        ['en', 'fr'],   // English and French (Cameroon bilingual)
  industry:       'mobility',

  // ── Content
  headline: {
    en: 'Move people. Not problems.',
    // No DE variant — Drive24 serves Cameroon, not German market
  },
  subline: {
    // VG-06 exception: platform product uses component description, not We/You pattern
    en: 'Ride booking. Drivers. Agents. Payments. One platform.',
  },
  description: {
    en: 'Ride-booking platform for Yaoundé and Douala. Passengers book instantly. Drivers earn more. Agents grow their network. MTN MoMo and Orange Money payments built in.',
  },
  bullets: {
    en: ['Book rides instantly', 'Drivers earn more', 'Local agent network'],
    // No DE bullets — German audience never sees Drive24 in main grids
  },
  workflow: {
    en: [
      { label: 'Book Ride',      description: 'Choose your destination. Find a nearby driver in seconds.' },
      { label: 'Driver Accepts', description: 'Nearby driver accepts your ride. You see their ETA in real time.' },
      { label: 'Live Tracking',  description: 'Track your driver on the map. Know exactly when they arrive.' },
      { label: 'Arrive Safely',  description: 'Get to your destination comfortably. Driver rated after the trip.' },
      { label: 'Payment',        description: 'Pay securely via MTN MoMo or Orange Money. No cash needed.' },
    ],
  },

  // ── Media
  media: {
    card: {
      en: 'images/systems/drive24/card/drive24-en.png',
      // No DE card — single locale product
    },
  },
  brandColor:     '#009A44', // Cameroon flag green
  layoutVariant:  'C',       // Full-scene centered — consumer platform

  // ── Links
  demoUrl:     null, // TODO: confirm public demo or platform link
  landingUrl:  '/products/drive24',
  systemUrl:   'https://drive24.live',
  bookDemoUrl: '/contact?system=drive24',
  contactSlug: 'drive24',
  hasDemoLogin: false,

  // ── CTA — platform type; requires explicit label overrides
  ctaType: 'platform',
  ctaPrimary:   { en: 'Explore platform →' },
  ctaSecondary: { en: 'Become a driver →' },

  // ── Analytics
  eventSource:     'drive24',
  trackingEnabled: true,

  // ── Future
  revenueModel: 'commission',
} satisfies ProductEntry

// =============================================================================
// 10. MAXPROMO OS  (internal registry entry — never shown publicly)
// =============================================================================

const MAXPROMO_OS = {
  // ── Identity
  slug:        'maxpromo-os',
  name:        'Maxpromo OS',
  domainBrand: 'Maxpromo OS',
  domain:      'maxpromo.digital',
  category:    'ecosystem',  // Never shown on public systems page
  owner:       'internal',
  track:       'internal',

  // ── Classification
  status:         'live',
  maturity:       'growth',
  priority_score: null,  // Internal tool — no commercial scoring
  featured:       false,
  visibility:     'internal',

  // ── Market
  market:         ['internal'],
  marketPriority: 10,
  locales:        ['en'],
  industry:       'infrastructure',

  // ── Content (placeholders — internal tool, no public copy needed)
  headline:    { en: 'Maxpromo OS — Master Control Center' },
  subline:     { en: 'Internal operational platform. Not for public use.' },
  description: { en: 'Internal only. The Maxpromo ecosystem control center.' },
  bullets: {
    en: ['Internal platform', 'Ecosystem control', 'Admin only'],
  },
  workflow: {
    en: [
      { label: 'Systems',     description: 'Manage all 10 ecosystem products from one registry view.' },
      { label: 'Leads',       description: 'All product and business leads in one filtered inbox.' },
      { label: 'Analytics',   description: 'Cross-product event data and conversion funnel.' },
      { label: 'Health',      description: 'Domain and demo URL status for all 9 products.' },
      { label: 'Deployments', description: 'Vercel deployment status per product.' },
    ],
  },

  // ── Media
  media: {
    card: {
      // Internal tool: visibility is 'internal', so no card is ever rendered
      // and this path is intentionally unbacked. Create the asset before making
      // this product public.
      en: 'images/systems/maxpromo-os/card/maxpromo-os-en.png',
    },
  },
  brandColor:     '#A3E635',
  layoutVariant:  'B',

  // ── Links
  demoUrl:     null,
  landingUrl:  '/os',
  systemUrl:   'https://maxpromo.digital/os',
  bookDemoUrl: '/os',
  contactSlug: 'maxpromo-os',
  hasDemoLogin: true,
  demoCredentials: {
    url:      'https://maxpromo.digital/os',
    email:    'info@maxpromo.digital',
    password: '', // TODO: update if OS login is not Marcel's personal credentials
  },

  // ── CTA
  ctaType: 'standard',

  // ── Analytics
  eventSource:     'maxpromo-os',
  trackingEnabled: false, // Internal tool — no public tracking

  // ── Future
  revenueModel: 'internal',
} satisfies ProductEntry

// =============================================================================
// REGISTRY EXPORT
// =============================================================================

/**
 * The complete Maxpromo product registry.
 * All 10 entries. Order is intentional: commercial-track products first
 * (sorted by priority_score descending), then founder-track, then internal.
 *
 * Consumers filter this array — they do not rely on position.
 * Filters used in practice:
 *   featured:    p.featured
 *   homepage:    p.featured && p.track === 'commercial'
 *   systems:     p.visibility !== 'internal' && p.status !== 'internal'
 *   products:    p.visibility !== 'internal' && p.track !== 'internal'
 *   OS admin:    all entries (no filter)
 */
export const PRODUCTS: ReadonlyArray<ProductEntry> = [
  TAXKONTROL,      // priority_score: 95
  RESTAURANT_OS,   // priority_score: 92
  PRINTSHOP_OS,    // priority_score: 90
  AGENT_BUREAU,    // priority_score: 88
  HANDWERK_OS,     // priority_score: 85
  CARE_OS,         // priority_score: 80
  PRAXIS_OS,       // priority_score: 78
  REAL_ESTATE_OS,  // priority_score: 55
  PUBLISHING_OS,   // priority_score: 40
  DRIVE24,         // priority_score: 35 — founder track
  MAXPROMO_OS,     // priority_score: null — internal
]

// =============================================================================
// REGISTRY EXPORT GROUPS
// Pre-filtered slices — consumers import these instead of filtering PRODUCTS.
// =============================================================================

/**
 * Homepage grid — hard-coded order. INTENTIONAL. DO NOT derive from filters.
 *
 * This order is permanent. It must not change due to priority_score, maturity,
 * future sorting, or any automated logic. Homepage curation is a deliberate
 * editorial decision, not a computed result.
 *
 * Consumer: app/[locale]/page.tsx (SystemCardCompact grid)
 * Count: 6
 */
export const HOMEPAGE_PRODUCTS: ReadonlyArray<ProductEntry> = [
  TAXKONTROL,
  RESTAURANT_OS,
  PRINTSHOP_OS,
  HANDWERK_OS,
  CARE_OS,
  PRAXIS_OS,
]

/**
 * Fully public products — systems page and products index.
 * Only products with visibility: 'public'. Excludes:
 *   — Drive24 (visibility: 'protected') — surfaces only via PROTECTED_PRODUCTS
 *   — Maxpromo OS (visibility: 'internal') — surfaces only via INTERNAL_PRODUCTS
 *
 * Consumer: app/[locale]/systems/page.tsx, app/[locale]/products/page.tsx
 * Count: 9
 */
export const PUBLIC_PRODUCTS: ReadonlyArray<ProductEntry> =
  PRODUCTS.filter(p => p.visibility === 'public')

/**
 * Gated products — password-protected, investor previews, or founder projects.
 * NOT shown in standard public grids. Accessible by direct URL or explicit invite.
 * Currently: Drive24 only (founder track, Cameroon market).
 *
 * Future use: beta systems, investor demo pages, client staging environments.
 * Consumer: /os/systems admin view, future password-gated landing pages
 * Count: 1
 */
export const PROTECTED_PRODUCTS: ReadonlyArray<ProductEntry> =
  PRODUCTS.filter(p => p.visibility === 'protected')

/**
 * All commercial-track products.
 * Excludes Drive24 (founder) and Maxpromo OS (internal).
 * Consumer: /os/analytics lead pipeline, priority-weighted dashboards
 * Count: 9
 */
export const COMMERCIAL_PRODUCTS: ReadonlyArray<ProductEntry> =
  PRODUCTS.filter(p => p.track === 'commercial')

/**
 * Founder-track products. Currently: Drive24 only.
 * Consumer: /os/systems admin registry view
 * Count: 1
 */
export const FOUNDER_PRODUCTS: ReadonlyArray<ProductEntry> =
  PRODUCTS.filter(p => p.track === 'founder')

/**
 * Internal-track products — /os admin view only. Never rendered publicly.
 * Currently: Maxpromo OS only.
 * Consumer: /os/systems admin registry view
 * Count: 1
 */
export const INTERNAL_PRODUCTS: ReadonlyArray<ProductEntry> =
  PRODUCTS.filter(p => p.track === 'internal')

/**
 * Products with featured: true — for editorial/dashboard use.
 * DO NOT use for the homepage grid. Homepage uses HOMEPAGE_PRODUCTS (hard-coded order).
 * Use this for: CMS preview, featured badge logic, OS analytics highlighting.
 * Count: 7
 */
export const FEATURED_PRODUCTS: ReadonlyArray<ProductEntry> =
  PRODUCTS.filter(p => p.featured && p.track === 'commercial')

/**
 * Systems page app cards grid — hard-coded order. INTENTIONAL. DO NOT derive from filters.
 *
 * This order is permanent. It must not change due to priority_score, maturity,
 * future sorting, or any automated logic. Systems page curation is a deliberate
 * editorial decision, not a computed result.
 *
 * Drive24 is EXCLUDED (founder track — surfaces only via PROTECTED_PRODUCTS).
 * Maxpromo OS is EXCLUDED (internal track).
 *
 * Consumer: app/[locale]/systems/page.tsx (SystemsPageGrid bridge → SystemGrid)
 * Count: 9
 */
export const SYSTEMS_PAGE_PRODUCTS: ReadonlyArray<ProductEntry> = [
  AGENT_BUREAU,
  TAXKONTROL,
  RESTAURANT_OS,
  PRINTSHOP_OS,
  HANDWERK_OS,
  CARE_OS,
  PRAXIS_OS,
  REAL_ESTATE_OS,
  PUBLISHING_OS,
]
