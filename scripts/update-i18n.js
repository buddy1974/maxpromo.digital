const fs = require('fs');
const en = JSON.parse(fs.readFileSync('messages/en.json','utf8'));
const de = JSON.parse(fs.readFileSync('messages/de.json','utf8'));

// ── HERO ──────────────────────────────────────────────────────
en.hero.eyebrow       = 'WE BUILD SYSTEMS';
en.hero.headline1     = 'We take the work';
en.hero.headlineAccent= 'out of your operation.';
en.hero.headline2     = '';
en.hero.sub           = 'Less manual work. Faster replies. Fewer missed enquiries. Systems that grow with your business.';
en.hero.statusAgents  = 'For every business';
en.hero.ctaSecondary  = 'See our services';
en.hero.urgency       = '// No commitment · 30-min check · 3 new clients per month';

de.hero.eyebrow       = 'WIR BAUEN SYSTEME';
de.hero.headline1     = 'Die Arbeit aus';
de.hero.headlineAccent= 'Ihrem Betrieb';
de.hero.headline2     = 'nehmen.';
de.hero.sub           = 'Weniger manuelle Arbeit. Schnellere Antworten. Mehr Kunden. Systeme, die mit Ihrem Betrieb mitwachsen.';
de.hero.statusOperational = 'LÄUFT FÜR ECHTE BETRIEBE';
de.hero.statusAgents  = 'Für jeden Betrieb';
de.hero.statusUptime  = 'Läuft auch nachts';
de.hero.ctaPrimary    = 'Kostenlosen Geschäfts-Check anfragen';
de.hero.ctaSecondary  = 'Leistungen ansehen';
de.hero.urgency       = '// Unverbindlich · 30-Min-Check · 3 neue Kunden pro Monat';

// ── PAIN CARDS ────────────────────────────────────────────────
en.home.painCards = {
  eyebrow:'// What we solve',
  title:'Six problems',titleAccent:'every growing business faces.',
  p1Tag:'Customer Enquiries',p1Title:'Enquiries falling through?',
  p1Desc:'Customers contact you via WhatsApp, website, phone — and never hear back. They book with someone else.',p1Cta:'Our solution',
  p2Tag:'Invoicing',p2Title:'Invoices eating your time?',
  p2Desc:'Chasing unpaid invoices, compiling reports, re-entering data. Hours every week that could be automated.',p2Cta:'Our solution',
  p3Tag:'Communications',p3Title:'Inbox impossible to manage?',
  p3Desc:'Same questions every day. Support, sales, complaints — all landing in one place, handled manually.',p3Cta:'Our solution',
  p4Tag:'Field Operations',p4Title:'Field team without visibility?',
  p4Desc:'Jobs tracked on WhatsApp. Time logged by hand. The office only knows what happened when the driver calls.',p4Cta:'Our solution',
  p5Tag:'Reputation',p5Title:'Reviews going uncollected?',
  p5Desc:'Happy customers leave without leaving a review. Your Google profile does not reflect what you deliver.',p5Cta:'Our solution',
  p6Tag:'Systems',p6Title:'Tools that do not connect?',
  p6Desc:'Data copied between systems manually. Nothing connects. Your team fills the gap with time and spreadsheets.',p6Cta:'Our solution'
};

de.home.painCards = {
  eyebrow:'// Was wir lösen',
  title:'Sechs Probleme,',titleAccent:'die jeder Betrieb kennt.',
  p1Tag:'Kundenanfragen',p1Title:'Anfragen gehen unter?',
  p1Desc:'Kunden melden sich per WhatsApp, Website, Telefon — und hören nichts mehr. Sie buchen woanders.',p1Cta:'Unsere Lösung',
  p2Tag:'Rechnungen',p2Title:'Rechnungen kosten zu viel Zeit?',
  p2Desc:'Mahnungen schreiben, Berichte zusammenstellen, Daten neu eingeben. Stunden jede Woche, die automatisch laufen könnten.',p2Cta:'Unsere Lösung',
  p3Tag:'Kommunikation',p3Title:'Posteingang nicht mehr beherrschbar?',
  p3Desc:'Täglich dieselben Fragen. Support, Anfragen, Beschwerden — alles manuell bearbeitet.',p3Cta:'Unsere Lösung',
  p4Tag:'Außendienst',p4Title:'Außendienst ohne Übersicht?',
  p4Desc:'Aufträge per WhatsApp. Zeiten per Hand. Das Büro weiß erst was passiert ist, wenn der Fahrer anruft.',p4Cta:'Unsere Lösung',
  p5Tag:'Bewertungen',p5Title:'Bewertungen werden vergessen?',
  p5Desc:'Kunden gehen zufrieden. Niemand fragt nach einer Bewertung. Ihr Google-Profil zeigt nicht, was Sie leisten.',p5Cta:'Unsere Lösung',
  p6Tag:'Systeme',p6Title:'Tools arbeiten nicht zusammen?',
  p6Desc:'Daten manuell zwischen Systemen kopiert. Nichts verbunden. Ihr Team füllt die Lücke mit Zeit und Tabellen.',p6Cta:'Unsere Lösung'
};

// ── WHY MAXPROMO ───────────────────────────────────────────────
en.home.whyUs = {
  eyebrow:'// Why Maxpromo',title:'Why businesses',titleAccent:'work with Maxpromo.',
  w1Title:'Clear start, no tech chaos',w1Desc:'We begin with your daily operation — not with tools or concepts. You know what changes before we build it.',
  w2Title:'Existing tools stay in place',w2Desc:'We connect what you already have. No ripping out, no relearning. The system fits into your workflow.',
  w3Title:'Systems that grow with you',w3Desc:'Start small. Add layers as the business grows. You never outgrow what we build.',
  w4Title:'Responsibility after launch',w4Desc:'We do not just build and disappear. We stay on it — maintaining, adjusting, improving as the business evolves.'
};
de.home.whyUs = {
  eyebrow:'// Warum Maxpromo',title:'Warum Betriebe mit',titleAccent:'Maxpromo arbeiten.',
  w1Title:'Klarer Einstieg statt Technik-Chaos',w1Desc:'Wir starten bei Ihrem Alltag — nicht bei Tools. Sie wissen, was sich ändert, bevor wir anfangen.',
  w2Title:'Bestehende Werkzeuge bleiben nutzbar',w2Desc:'Wir verbinden, was bereits vorhanden ist. Kein Herausreißen, kein Umlernen.',
  w3Title:'Systeme, die mitwachsen',w3Desc:'Klein starten. Später erweitern. Sie wachsen nie aus dem heraus, was wir bauen.',
  w4Title:'Verantwortung nach dem Launch',w4Desc:'Wir bauen nicht nur — wir begleiten den Betrieb. Pflegen, anpassen, verbessern.'
};

// ── PROJECT TYPES ─────────────────────────────────────────────
en.home.projectTypes = {
  eyebrow:'// Who we work with',title:'From local business',titleAccent:'to full platform.',
  pt1Title:'Local businesses',pt1Desc:'Website, Google, reviews, and customer enquiries — handled consistently.',pt1Items:'Website · Google · Reviews · Customer Enquiries',
  pt2Title:'Growing SMEs',pt2Desc:'Workflows, automation, reporting, team coordination — all connected.',pt2Items:'Workflows · Automation · Reporting · Teams',
  pt3Title:'Custom systems',pt3Desc:'Portals, dashboards, industry-specific platforms, internal tools — built for your operation.',pt3Items:'Portals · Dashboards · Industry Systems · Internal Tools'
};
de.home.projectTypes = {
  eyebrow:'// Mit wem wir arbeiten',title:'Vom lokalen Betrieb',titleAccent:'bis zur eigenen Plattform.',
  pt1Title:'Lokale Betriebe',pt1Desc:'Website, Google, Bewertungen und Kundenanfragen — zuverlässig geregelt.',pt1Items:'Website · Google · Bewertungen · Kundenanfragen',
  pt2Title:'Wachsende KMU',pt2Desc:'Workflows, Automatisierung, Reporting, Teamkoordination — alles verbunden.',pt2Items:'Workflows · Automatisierung · Reporting · Teams',
  pt3Title:'Individuelle Systeme',pt3Desc:'Portale, Dashboards, Branchen-Systeme, interne Tools — gebaut für Ihren Betrieb.',pt3Items:'Portale · Dashboards · Branchen-Systeme · Interne Tools'
};

// ── SYSTEMS TABS ─────────────────────────────────────────────
en.home.systemsTabs = {
  eyebrow:'// Production systems',title:'Real businesses.',titleAccent:'Real operations.',
  subtitle:'Every system below is built, installed and running. No prototypes. No demos.',
  viewAll:'See all systems',viewSystem:'See system'
};
de.home.systemsTabs = {
  eyebrow:'// Produktionssysteme',title:'Echte Betriebe.',titleAccent:'Echte Operationen.',
  subtitle:'Jedes System unten ist gebaut, installiert und läuft für echte Kunden. Keine Prototypen. Keine Demos.',
  viewAll:'Alle Systeme ansehen',viewSystem:'System ansehen'
};

// ── PROCESS (5 steps) ────────────────────────────────────────
en.home.process = {
  processEyebrow:'// How we work',processTitle:'From idea to operation.',
  p1Num:'01',p1Time:'30 min',p1Title:'Business Check',p1Desc:'We map where time, customers and clarity are being lost. Clear picture before any commitment.',
  p2Num:'02',p2Time:'1–2 days',p2Title:'Map the operation',p2Desc:'We document your workflows, tools and handovers. We find what is manual, broken or missing.',
  p3Num:'03',p3Time:'2–3 days',p3Title:'Plan the solution',p3Desc:'We design the system: scope, tools, integrations. You see exactly what gets built and how.',
  p4Num:'04',p4Time:'1–4 wks',p4Title:'Build and install',p4Desc:'We build, test and go live. Every step verified before the system runs in production.',
  p5Num:'05',p5Time:'Ongoing',p5Title:'Maintain and improve',p5Desc:'We monitor, adjust and extend the system as your business grows. Not a one-time project.'
};
de.home.process = {
  processEyebrow:'// So arbeiten wir',processTitle:'Von der Idee zum Betrieb.',
  p1Num:'01',p1Time:'30 Min',p1Title:'Geschäfts-Check',p1Desc:'Wir analysieren, wo Zeit, Kunden und Übersicht verloren gehen. Klares Bild vor jeder Verpflichtung.',
  p2Num:'02',p2Time:'1–2 Tage',p2Title:'Ablauf verstehen',p2Desc:'Wir dokumentieren Ihre Abläufe, Werkzeuge und Übergaben. Wir finden, was manuell, kaputt oder fehlend ist.',
  p3Num:'03',p3Time:'2–3 Tage',p3Title:'Lösung planen',p3Desc:'Wir gestalten das System: Umfang, Werkzeuge, Integrationen. Sie sehen genau, was gebaut wird.',
  p4Num:'04',p4Time:'1–4 Wo',p4Title:'Umsetzen und installieren',p4Desc:'Wir bauen, testen und gehen live. Jeder Schritt wird geprüft, bevor das System produktiv läuft.',
  p5Num:'05',p5Time:'Laufend',p5Title:'Betreuen und verbessern',p5Desc:'Wir monitoren, passen an und erweitern das System, wenn Ihr Betrieb wächst. Kein einmaliges Projekt.'
};

// ── FINAL CTA ────────────────────────────────────────────────
en.home.finalCtaEyebrow  ='// Ready to fix it?';
en.home.finalCtaTitle    ='Let us find where your business is losing time, customers or clarity.';
en.home.finalCtaDesc     ='A free 30-minute business check. We identify the highest-impact change before any commitment.';
en.home.finalCtaPrimary  ='Get your free business check';
en.home.finalCtaSecondary='Talk to Maxpromo';
en.home.finalCtaFootnote ='// No commitment · No pressure · 30 minutes';

de.home.finalCtaEyebrow  ='// Bereit loszulegen?';
de.home.finalCtaTitle    ='Lassen Sie uns prüfen, wo Ihr Betrieb Zeit, Kunden oder Übersicht verliert.';
de.home.finalCtaDesc     ='Kostenloser Geschäfts-Check. 30 Minuten. Wir zeigen den größten Hebel — vor jeder Verpflichtung.';
de.home.finalCtaPrimary  ='Kostenlosen Geschäfts-Check anfragen';
de.home.finalCtaSecondary='Mit Maxpromo sprechen';
de.home.finalCtaFootnote ='// Unverbindlich · Kein Druck · 30 Minuten';

fs.writeFileSync('messages/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('messages/de.json', JSON.stringify(de, null, 2));
console.log('i18n written');
