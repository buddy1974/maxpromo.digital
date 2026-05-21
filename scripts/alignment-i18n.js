const fs = require('fs');
const en = JSON.parse(fs.readFileSync('messages/en.json','utf8'));
const de = JSON.parse(fs.readFileSync('messages/de.json','utf8'));

// ── PAIN CARDS ────────────────────────────────────────────────
en.home.painCards.eyebrow      = '// Sound familiar?';
en.home.painCards.title        = 'Six things that cost your business';
en.home.painCards.titleAccent  = 'time, customers and clarity.';
en.home.painCards.p4Desc       = 'Jobs tracked on WhatsApp threads. Time logged by hand. By the time the invoice goes out, three days have passed.';
en.home.painCards.p6Desc       = 'Five tools. None of them talk to each other. Your team bridges the gap manually — every single day.';

de.home.painCards.eyebrow      = '// Klingt bekannt?';
de.home.painCards.title        = 'Sechs Dinge, die Ihren Betrieb';
de.home.painCards.titleAccent  = 'Zeit, Kunden und Übersicht kosten.';
de.home.painCards.p4Desc       = 'Aufträge per WhatsApp-Thread. Zeiten per Hand. Bis die Rechnung raus ist, vergehen drei Tage.';
de.home.painCards.p6Desc       = 'Fünf Werkzeuge. Keines spricht mit dem anderen. Ihr Team überbrückt die Lücke täglich von Hand.';

// ── PROOF STRIP ───────────────────────────────────────────────
en.home.proof.eyebrow  = '// From live systems';
en.home.proof.title    = 'Installed and running.';
en.home.proof.subtitle = 'These numbers come from real systems operating in real businesses. No demos. No experiments.';

de.home.proof.eyebrow  = '// Aus laufenden Systemen';
de.home.proof.title    = 'Installiert und aktiv.';
de.home.proof.subtitle = 'Diese Zahlen kommen aus echten Systemen, die in echten Betrieben laufen. Keine Demos. Keine Experimente.';

// ── SYSTEMS TABS ─────────────────────────────────────────────
en.home.systemsTabs.eyebrow     = '// What we build';
en.home.systemsTabs.title       = 'Business systems';
en.home.systemsTabs.titleAccent = 'running today.';
en.home.systemsTabs.subtitle    = 'Click a system and see how it works.';

de.home.systemsTabs.eyebrow     = '// Was wir bauen';
de.home.systemsTabs.title       = 'Betriebssysteme,';
de.home.systemsTabs.titleAccent = 'die heute laufen.';
de.home.systemsTabs.subtitle    = 'Klicken Sie auf ein System und sehen Sie, wie es funktioniert.';

// ── WHY MAXPROMO ─────────────────────────────────────────────
en.home.whyUs.title        = 'What makes this';
en.home.whyUs.titleAccent  = 'different.';
en.home.whyUs.w3Desc       = 'Start with one system. Add more as the business grows. You never outgrow what we build.';
en.home.whyUs.w4Desc       = 'We build it. We go live with you. Then we stay — maintaining, adjusting, improving. Ongoing, not a one-off.';

de.home.whyUs.title        = 'Was diesen Ansatz';
de.home.whyUs.titleAccent  = 'anders macht.';
de.home.whyUs.w3Desc       = 'Mit einem System starten. Mehr hinzufügen, wenn der Betrieb wächst. Sie wachsen nie aus dem heraus, was wir bauen.';
de.home.whyUs.w4Desc       = 'Wir bauen es. Wir gehen mit Ihnen live. Dann bleiben wir — pflegen, anpassen, verbessern. Dauerhaft, kein Einmalprojekt.';

// ── TEAM TRUST (new) ─────────────────────────────────────────
en.home.teamTrust = {
  eyebrow:      '// The Maxpromo team',
  title:        'Built by operators.',
  titleAccent:  'Not just developers.',
  body:         'We build systems around real work.',
  pain1:        'Missed enquiries.',
  pain2:        'Manual admin.',
  pain3:        'Team chaos.',
  pain4:        'Disconnected tools.',
  closing:      'The problems are real. The systems should be too.',
  l1Label:      'Operators',
  l1Desc:       'We start from your daily operation — not from a concept.',
  l2Label:      'Developers',
  l2Desc:       'We build systems that go live and stay live.',
  l3Label:      'Automation specialists',
  l3Desc:       'Every workflow is designed for real use. Not a demo.',
  footer:       'Installed for businesses across industries and markets.',
};

de.home.teamTrust = {
  eyebrow:      '// Das Maxpromo-Team',
  title:        'Gebaut von Betreibern.',
  titleAccent:  'Nicht nur Entwicklern.',
  body:         'Wir bauen Systeme für echte Arbeit.',
  pain1:        'Verpasste Anfragen.',
  pain2:        'Manuelle Verwaltung.',
  pain3:        'Team-Chaos.',
  pain4:        'Getrennte Werkzeuge.',
  closing:      'Die Probleme sind real. Die Systeme sollten es auch sein.',
  l1Label:      'Betreiber',
  l1Desc:       'Wir beginnen bei Ihrem Betriebsalltag — nicht bei einem Konzept.',
  l2Label:      'Entwickler',
  l2Desc:       'Wir bauen Systeme, die live gehen und live bleiben.',
  l3Label:      'Automatisierungsspezialisten',
  l3Desc:       'Jeder Workflow ist für den echten Einsatz gestaltet. Kein Demo.',
  footer:       'Installiert für Betriebe in verschiedenen Branchen und Märkten.',
};

// ── PROCESS ─────────────────────────────────────────────────
en.home.process.processEyebrow = '// From first call to live system';
en.home.process.processTitle   = 'Five steps. Then it runs.';
en.home.process.p2Title        = 'Understand your workflow';
en.home.process.p3Title        = 'Design the system';
en.home.process.p4Title        = 'Build and go live';

de.home.process.processEyebrow = '// Vom ersten Gespräch zum laufenden System';
de.home.process.processTitle   = 'Fünf Schritte. Dann läuft es.';
de.home.process.p2Title        = 'Abläufe verstehen';
de.home.process.p3Title        = 'System gestalten';
de.home.process.p4Title        = 'Bauen und live gehen';

// ── FAQ (new) ────────────────────────────────────────────────
en.home.faq = {
  eyebrow: '// Common questions',
  items: [
    { q: 'How long does installation take?',          a: 'Between 2 and 6 weeks. Depends on the system. We tell you in the business check.' },
    { q: 'Do I need to replace my existing tools?',   a: 'No. We connect what you already use. Nothing gets removed.' },
    { q: 'What happens after launch?',                a: 'We stay on. Maintenance, adjustments and improvements are included — not billed as extras.' },
    { q: 'Is this only for larger companies?',        a: 'No. Most of our clients are teams between 3 and 50 people.' },
    { q: 'What does it cost?',                        a: 'We send a fixed quote after the business check. No estimates. No surprises.' },
  ],
};

de.home.faq = {
  eyebrow: '// Häufige Fragen',
  items: [
    { q: 'Wie lange dauert die Installation?',             a: 'Zwischen 2 und 6 Wochen. Je nach System. Wir sagen es Ihnen im Geschäfts-Check.' },
    { q: 'Muss ich meine bestehenden Werkzeuge ersetzen?', a: 'Nein. Wir verbinden, was Sie bereits nutzen. Nichts wird entfernt.' },
    { q: 'Was passiert nach dem Launch?',                  a: 'Wir bleiben dabei. Wartung, Anpassungen und Verbesserungen sind enthalten — nicht extra berechnet.' },
    { q: 'Ist das nur für größere Unternehmen?',           a: 'Nein. Die meisten unserer Kunden sind Teams mit 3 bis 50 Personen.' },
    { q: 'Was kostet es?',                                 a: 'Wir senden nach dem Geschäfts-Check ein Festpreisangebot. Keine Schätzungen. Keine Überraschungen.' },
  ],
};

// ── FINAL CTA ────────────────────────────────────────────────
en.home.finalCtaEyebrow   = '// Ready?';
en.home.finalCtaTitle     = 'See what your business could stop doing manually.';
en.home.finalCtaDesc      = '30 minutes. No pressure.';
en.home.finalCtaPrimary   = 'Get your free business check';
en.home.finalCtaSecondary = 'Talk to Maxpromo';
en.home.finalCtaFootnote  = '// No commitment · No pressure · 30 minutes';

de.home.finalCtaEyebrow   = '// Bereit?';
de.home.finalCtaTitle     = 'Sehen Sie, was Ihr Betrieb aufhören könnte, manuell zu tun.';
de.home.finalCtaDesc      = '30 Minuten. Unverbindlich.';
de.home.finalCtaPrimary   = 'Kostenlosen Geschäfts-Check anfragen';
de.home.finalCtaSecondary = 'Mit Maxpromo sprechen';
de.home.finalCtaFootnote  = '// Unverbindlich · Kein Druck · 30 Minuten';

fs.writeFileSync('messages/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('messages/de.json', JSON.stringify(de, null, 2));
console.log('i18n updated');
