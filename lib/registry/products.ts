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
 *   app/[locale]/page.tsx             — homepage featured grid
 *   app/[locale]/systems/page.tsx     — systems page full grid
 *   app/[locale]/products/page.tsx    — products index
 *   app/[locale]/products/[slug]/page.tsx — dynamic product page
 *   app/os/systems/page.tsx           — admin registry view
 */

import type { ProductEntry } from './types'

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
    en: ['Fewer mistakes', 'Happier guests', 'More time for service'],
    de: ['Weniger Fehler', 'Zufriedenere Gäste', 'Mehr Zeit für den Service'],
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

  // ── Media
  media: {
    card: {
      en: 'images/systems/restaurant-os/card/restaurant-os-en.png',
      de: 'images/systems/restaurant-os/card/restaurant-os-de.png',
    },
  },
  brandColor:     '#F97316',
  layoutVariant:  'A',
  backgroundDark: true,

  // ── Links
  demoUrl:    'https://restaurant-os-one.vercel.app',
  landingUrl: '/products/restaurant-os',
  systemUrl:  'https://restaurant-os.de',
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
      { label: 'Paid',     description: 'Send, follow up, and mark paid. No accountant required for compliance.' },
    ],
    de: [
      { label: 'Foto',       description: 'Auftragszettel fotografieren. KI erstellt den vollständigen Auftragsdatensatz in unter 10 Sekunden.' },
      { label: 'Angebot',    description: 'KI schlägt Marktpreise vor. PDF-Angebot direkt an den Kunden erstellen und senden.' },
      { label: 'Disponieren', description: 'Auftrag dem richtigen Teammitglied zuweisen. GPS-Zeiterfassung startet beim Check-in.' },
      { label: 'Rechnung',   description: 'Angenommenes Angebot mit einem Klick in eine Rechnung umwandeln. XRechnung-XML inklusive.' },
      { label: 'Bezahlt',    description: 'Senden, nachfassen und als bezahlt markieren. Kein Steuerberater für die Compliance erforderlich.' },
    ],
  },

  // ── Media
  media: {
    card: {
      en: 'images/systems/handwerk-os/card/handwerk-os-en.png',
      de: 'images/systems/handwerk-os/card/handwerk-os-de.png',
    },
  },
  brandColor:     '#22C55E',
  layoutVariant:  'B',
  backgroundDark: true,

  // ── Links
  demoUrl:     'https://handwerkos.vercel.app',
  landingUrl:  '/products/handwerk-os',
  systemUrl:   'https://superhandwerk.de',
  bookDemoUrl: '/contact?system=handwerk-os',
  contactSlug: 'handwerk-os',
  hasDemoLogin: true,
  demoCredentials: {
    url:      'https://handwerkos.vercel.app',
    email:    'admin@handwerkos.de',
    password: 'admin123456',
  },

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
  description: {
    en: 'Digital operating system for specialist medical practices. Patient portal, appointment automation, lab results, GDPR compliant, German healthcare standards.',
    de: 'Digitales Betriebssystem für Facharztpraxen. Patientenportal, Terminautomatisierung, Laborbefunde, DSGVO-konform, deutsche Gesundheitsstandards.',
  },
  bullets: {
    en: ['Less admin work', 'Faster appointments & communication', 'More time for what matters'],
    de: ['Weniger Verwaltungsaufwand', 'Schnellere Termine & Kommunikation', 'Mehr Zeit für das Wesentliche'],
  },
  workflow: {
    en: [
      { label: 'Appointment', description: 'Patients book online. System checks availability and sends automatic confirmation.' },
      { label: 'Reminder',    description: 'Automated reminders sent by SMS or email. Reduces no-shows significantly.' },
      { label: 'Check-in',    description: 'Digital check-in form collects patient data and symptoms before the visit.' },
      { label: 'Treatment',   description: 'All patient data, notes, and lab results in one place during the consultation.' },
      { label: 'Invoice',     description: 'Invoice automatically generated from the treatment record. DSGVO-compliant.' },
    ],
    de: [
      { label: 'Termin',      description: 'Patienten buchen online. System prüft Verfügbarkeit und sendet automatische Bestätigung.' },
      { label: 'Erinnerung',  description: 'Automatische Erinnerungen per SMS oder E-Mail. Reduziert No-Shows erheblich.' },
      { label: 'Eincheck',    description: 'Digitales Eincheck-Formular erfasst Patientendaten und Symptome vor dem Besuch.' },
      { label: 'Behandlung',  description: 'Alle Patientendaten, Notizen und Laborbefunde auf einen Blick während der Konsultation.' },
      { label: 'Rechnung',    description: 'Rechnung wird automatisch aus dem Behandlungsdatensatz erstellt. DSGVO-konform.' },
    ],
  },

  // ── Media
  media: {
    card: {
      en: 'images/systems/praxis-os/card/praxis-os-en.png',
      de: 'images/systems/praxis-os/card/praxis-os-de.png',
    },
  },
  brandColor:     '#3B82F6',
  layoutVariant:  'A',
  backgroundDark: false, // Clinical aesthetic — light background (VG-01 exception)

  // ── Links
  demoUrl:     null, // TODO: confirm demo URL
  landingUrl:  '/products/praxis-os',
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
  description: {
    en: 'Smart ordering, automatic file checks and production management in one system. AI validates files before they reach the press.',
    de: 'Intelligente Auftragsannahme, automatische Dateiprüfung und Produktionsverwaltung in einem System. KI prüft Dateien bevor sie auf die Druckmaschine kommen.',
  },
  bullets: {
    en: ['Fewer reprints', 'Faster turnaround', 'Happier customers'],
    de: ['Weniger Nachdrucke', 'Schnellere Lieferzeiten', 'Zufriedenere Kunden'],
  },
  workflow: {
    en: [
      { label: 'Upload',     description: 'Customer uploads the file and selects the product. No technical knowledge needed.' },
      { label: 'AI Check',   description: 'Automatic check of DPI, colors, fonts, and trim. System creates the optimal print sheet.' },
      { label: 'Production', description: 'File goes directly to production. No manual handover, no reprints from bad files.' },
      { label: 'Delivery',   description: 'Fast delivery. Customer gets live order status from upload to delivery.' },
      { label: 'Done',       description: 'Customer happy. Business grows. No expensive reprints from file errors.' },
    ],
    de: [
      { label: 'Upload',      description: 'Kunde lädt die Datei hoch und wählt das Produkt. Kein technisches Wissen erforderlich.' },
      { label: 'KI-Prüfung',  description: 'Automatische Prüfung von DPI, Farben, Schriften und Beschnitt. System erstellt den optimalen Druckbogen.' },
      { label: 'Produktion',  description: 'Datei geht direkt in die Produktion. Keine manuelle Übergabe, keine Nachdrucke durch schlechte Dateien.' },
      { label: 'Lieferung',   description: 'Schnelle Lieferung. Kunde erhält Live-Auftragsstatus vom Upload bis zur Zustellung.' },
      { label: 'Fertig',      description: 'Kunde zufrieden. Geschäft wächst. Keine teuren Nachdrucke durch Dateifehler.' },
    ],
  },

  // ── Media
  media: {
    card: {
      en: 'images/systems/printshop-os/card/printshop-os-en.png',
      de: 'images/systems/printshop-os/card/printshop-os-de.png',
    },
  },
  brandColor:     '#EC008C',
  layoutVariant:  'B',
  backgroundDark: true,

  // ── Links
  demoUrl:     'https://printshop.maxpromo.digital',
  landingUrl:  '/products/printshop-os',
  systemUrl:   'https://smartprintshop.de',
  bookDemoUrl: '/contact?system=printshop',
  contactSlug: 'printshop', // Locked: slug=printshop-os (route) ≠ contactSlug=printshop (form field)
  hasDemoLogin: true,
  demoCredentials: {
    url:      'https://printshop.maxpromo.digital',
    email:    'demo@smartprintshop.de',   // TODO: confirm demo credentials
    password: 'demo123',                   // TODO: confirm demo credentials
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
  market:         ['de'],
  marketPriority: 5,
  locales:        ['de', 'en'],
  industry:       'care',

  // ── Content
  headline: {
    en: 'More time. Better care.',
    de: 'Mehr Zeit. Bessere Pflege.',
  },
  subline: {
    en: 'We automate your care organisation. You focus on what matters.',
    de: 'Wir automatisieren Ihre Pflegeorganisation. Sie konzentrieren sich auf das Wesentliche.',
  },
  description: {
    en: 'Complete care management platform for supported living and care services. Digital care plans, EMAR, CQC compliance, AI assistant, family portal.',
    de: 'Vollständige Pflegemanagement-Plattform für Pflegedienste und betreutes Wohnen. Digitale Pflegepläne, EMAR, CQC-Compliance, KI-Assistent, Familienportal.',
  },
  bullets: {
    en: ['Less admin work', 'Faster communication', 'More time for people'],
    de: ['Weniger Verwaltungsaufwand', 'Schnellere Kommunikation', 'Mehr Zeit für Menschen'],
  },
  workflow: {
    en: [
      { label: 'Inquiry',      description: 'New client inquiry received via website or phone. AI collects information and creates profile.' },
      { label: 'Qualified',    description: 'AI qualifies the client. Suitable caregiver matched and visit scheduled automatically.' },
      { label: 'Visit Planned', description: 'Best caregiver matched to client needs and availability. Schedule confirmed instantly.' },
      { label: 'Communication', description: 'Family and team updated automatically. Care plan shared with all relevant staff.' },
      { label: 'Care Delivered', description: 'Visit documented. Care plan updated. Family notified. All DSGVO-compliant records.' },
    ],
    de: [
      { label: 'Anfrage',       description: 'Neue Klientenanfrage über Website oder Telefon. KI sammelt Informationen und erstellt Profil.' },
      { label: 'Qualifiziert',  description: 'KI qualifiziert den Klienten. Passende Pflegekraft wird automatisch zugeteilt und Besuch geplant.' },
      { label: 'Einsatz geplant', description: 'Beste Pflegekraft auf Klientenbedarf und Verfügbarkeit abgestimmt. Zeitplan sofort bestätigt.' },
      { label: 'Kommunikation', description: 'Familie und Team werden automatisch informiert. Pflegeplan mit allen Mitarbeitern geteilt.' },
      { label: 'Pflege erfolgt', description: 'Besuch dokumentiert. Pflegeplan aktualisiert. Familie benachrichtigt. DSGVO-konforme Aufzeichnungen.' },
    ],
  },

  // ── Media
  media: {
    card: {
      en: 'images/systems/care-os/card/care-os-en.png',
      de: 'images/systems/care-os/card/care-os-de.png',
    },
  },
  brandColor:     '#14B8A6',
  layoutVariant:  'A',
  backgroundDark: true,

  // ── Links
  demoUrl:     null, // TODO: confirm demo URL
  landingUrl:  '/products/care-os',
  systemUrl:   'https://pflege-care24.de',
  bookDemoUrl: '/contact?system=care-os',
  contactSlug: 'care-os',
  hasDemoLogin: false,

  // ── CTA
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
  headline: {
    en: "Leads move. Agents don't.",
    de: 'Leads laufen. Makler nicht.',
  },
  subline: {
    en: 'We automate your enquiries. You focus on closing deals.',
    de: 'Wir automatisieren Ihre Anfragen. Sie konzentrieren sich auf den Abschluss.',
  },
  description: {
    en: 'Private intelligence platform for property companies. AI deal analysis, investor CRM, Kanban pipeline, campaign studio and financial calculators.',
    de: 'Private Intelligenz-Plattform für Immobilienunternehmen. KI-Deal-Analyse, Investor-CRM, Kanban-Pipeline, Kampagnen-Studio und Finanzrechner.',
  },
  bullets: {
    en: ['Faster responses', 'More property viewings', 'No missed inquiries'],
    de: ['Schnellere Antworten', 'Mehr Besichtigungen', 'Keine verpassten Anfragen'],
  },
  workflow: {
    en: [
      { label: 'Lead Enters',     description: 'Lead arrives via website, Facebook, or direct inquiry. Captured automatically.' },
      { label: 'AI Qualifies',    description: 'AI captures requirements automatically and scores the lead quality.' },
      { label: 'Property Match',  description: 'Suitable properties suggested. Agent notified with full context.' },
      { label: 'Viewing Booked',  description: 'Calendar updates instantly. Client confirmation sent automatically.' },
      { label: 'Follow-Up Auto',  description: 'AI keeps lead warm. Follow-up sequences run without manual input.' },
    ],
    de: [
      { label: 'Lead eingeht',      description: 'Lead kommt über Website, Facebook oder direkte Anfrage. Wird automatisch erfasst.' },
      { label: 'KI qualifiziert',   description: 'KI erfasst Anforderungen automatisch und bewertet die Lead-Qualität.' },
      { label: 'Objekt passend',    description: 'Passende Objekte vorgeschlagen. Makler mit vollem Kontext benachrichtigt.' },
      { label: 'Besichtigung gebucht', description: 'Kalender aktualisiert sich sofort. Kundenbestätigung wird automatisch gesendet.' },
      { label: 'Follow-up auto',    description: 'KI hält den Lead warm. Follow-up-Sequenzen laufen ohne manuellen Aufwand.' },
    ],
  },

  // ── Media
  media: {
    card: {
      en: 'images/systems/real-estate-os/card/real-estate-os-en.png',
      de: 'images/systems/real-estate-os/card/real-estate-os-de.png',
    },
  },
  brandColor:     '#7C3AED',
  layoutVariant:  'A',
  backgroundDark: true,

  // ── Links
  demoUrl:     null, // TODO: confirm demo URL
  landingUrl:  '/products/real-estate-os',
  systemUrl:   'https://easy-immo24.de',
  bookDemoUrl: '/contact?system=real-estate-os',
  contactSlug: 'realestate-os',
  hasDemoLogin: false,

  // ── CTA
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
  headline: {
    en: 'More content. More traffic. More revenue.',
  },
  subline: {
    en: 'We automate your publishing. You focus on growing.',
  },
  description: {
    en: 'Operating system for publishing companies. Orders, invoices, stock, manuscripts, royalties, HR, finance, and 8 AI agents running 24/7.',
  },
  bullets: {
    en: ['More content, less work', 'Higher rankings, more traffic', 'More revenue, every month'],
  },
  workflow: {
    en: [
      { label: 'Topic Discovered',    description: 'AI finds trending topics with high potential for the audience.' },
      { label: 'Content Created',     description: 'AI writes and optimises SEO-ready content automatically.' },
      { label: 'Published',           description: 'Articles published on the website instantly.' },
      { label: 'Distributed',         description: 'Content shared to social media and newsletters automatically.' },
      { label: 'Traffic & Revenue',   description: 'Higher rankings, more traffic, more revenue — every month.' },
    ],
  },

  // ── Media
  media: {
    card: {
      en: 'images/systems/publishing-os/card/publishing-os-en.png',
      de: 'images/systems/publishing-os/card/publishing-os-de.png',
    },
  },
  // TODO: confirm exact brand hex — design card uses brown/maroon/beige palette
  brandColor:     '#8B5E3C',
  layoutVariant:  'B', // Books LEFT, dashboard RIGHT per spec
  backgroundDark: true,

  // ── Links
  demoUrl:     null, // TODO: confirm demo URL
  landingUrl:  '/products/publishing-os',
  systemUrl:   'https://publishers24.org',
  bookDemoUrl: '/contact?system=publishing-os',
  contactSlug: 'publishing-os',
  hasDemoLogin: false,

  // ── CTA
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
    // VG-06 exception: personal-finance product uses app description, not We/You pattern
    en: 'The smart app for self-employed and small businesses in Germany.',
    de: 'Die smarte App für Selbstständige und kleine Unternehmen in Deutschland.',
  },
  description: {
    en: 'Understand your taxes, track income and expenses, never miss a deadline. Built for self-employed, salons, studios, and small businesses in Germany. GDPR-compliant, hosted in Germany.',
    de: 'Steuern verstehen, Einnahmen und Ausgaben verfolgen, Fristen nie verpassen. Gebaut für Selbstständige, Salons, Studios und kleine Unternehmen in Deutschland. DSGVO-konform, in Deutschland gehostet.',
  },
  bullets: {
    en: ['Understand your taxes. No jargon.', 'Deadlines at a glance. No more stress.', 'Track income & expenses. Manage everything.'],
    de: ['Steuern verstehen. Ohne Fachbegriffe.', 'Fristen immer im Blick. Nie wieder Stress.', 'Einnahmen & Ausgaben verfolgen. Alles im Griff.'],
  },
  workflow: {
    en: [
      { label: 'Register',       description: 'Sign up in under 2 minutes. No accountant needed to get started.' },
      { label: 'Connect',        description: 'Connect your bank or add income and expenses manually. Simple and fast.' },
      { label: 'Track Expenses', description: 'Scan receipts, log expenses, and see your tax reserve in real time.' },
      { label: 'Review Report',  description: 'Clear overview of income, expenses, tax reserve and what is safe to spend.' },
      { label: 'File Tax',       description: 'Export your data for your tax return. ELSTER-ready. No surprise bills.' },
    ],
    de: [
      { label: 'Registrieren',     description: 'Anmeldung in unter 2 Minuten. Kein Steuerberater für den Einstieg nötig.' },
      { label: 'Verbinden',        description: 'Bank verbinden oder Einnahmen und Ausgaben manuell hinzufügen. Einfach und schnell.' },
      { label: 'Ausgaben erfassen', description: 'Belege scannen, Ausgaben erfassen und Steuerrücklage in Echtzeit sehen.' },
      { label: 'Bericht prüfen',   description: 'Klare Übersicht über Einnahmen, Ausgaben, Steuerrücklage und sicher verfügbares Geld.' },
      { label: 'Steuer einreichen', description: 'Daten für die Steuererklärung exportieren. ELSTER-fertig. Keine Überraschungsrechnungen.' },
    ],
  },

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
  backgroundDark: true,

  // ── Links
  demoUrl:     null, // TODO: confirm demo URL — app not yet in public app stores
  landingUrl:  '/products/taxkontrol',
  systemUrl:   'https://taxkontrol.de',
  bookDemoUrl: '/contact?system=taxkontrol',
  contactSlug: 'taxkontrol',
  hasDemoLogin: false,

  // ── CTA — governance lock: standard pattern, app-store flow deferred
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
  backgroundDark: true,

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
      en: 'images/systems/maxpromo-os/card/maxpromo-os-en.png', // TODO: create if needed
    },
  },
  brandColor:     '#F97316',
  layoutVariant:  'B',
  backgroundDark: true,

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
 * Count: 8
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
 * Count: 8
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
 * Count: 6
 */
export const FEATURED_PRODUCTS: ReadonlyArray<ProductEntry> =
  PRODUCTS.filter(p => p.featured && p.track === 'commercial')
