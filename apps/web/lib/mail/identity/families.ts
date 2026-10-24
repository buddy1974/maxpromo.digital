/**
 * Communication families (ADR-0023). Data, not templates: each family says how a message looks
 * (relationship letter or transactional notice), how it greets and closes, its default subject,
 * a starter body Marcel edits, and how long Maxpromo waits before following up.
 *
 * Starter bodies state nothing factual. Every gap Marcel must fill is marked [[like this]], and a
 * draft that still contains a marker cannot be sent (see PLACEHOLDER).
 */
export type Language = 'de' | 'en'
export type Style = 'relationship' | 'transactional'
export const FAMILY_IDS = [
  'reply', 'enquiry_response', 'outreach', 'follow_up', 'meeting', 'onboarding', 'proposal', 'quote_follow_up',
  'project_update', 'request_info', 'completion', 'support', 'invoice', 'payment_reminder', 'system',
] as const
export type FamilyId = typeof FAMILY_IDS[number]

/** A gap Marcel has not filled yet. Sending refuses while one remains. */
export const PLACEHOLDER = /\[\[[^\]]*\]\]/

export interface FamilyContext { name?: string | null; company?: string | null; subject?: string | null; reference?: string | null }
interface Family {
  style: Style
  label: Record<Language, string>
  /** Days until Maxpromo follows up when nobody answers; null = no follow-up expected. */
  followUpDays: number | null
  subject: Record<Language, (c: FamilyContext) => string>
  starter: Record<Language, (c: FamilyContext) => string>
}

const re = (s?: string | null) => (s ? (/^(re|aw|wg|fwd?):/i.test(s) ? s : `Re: ${s}`) : '')

export const FAMILIES: Record<FamilyId, Family> = {
  reply: {
    style: 'relationship', followUpDays: 3, label: { de: 'Antwort', en: 'Reply' },
    subject: { de: c => re(c.subject), en: c => re(c.subject) },
    starter: { de: () => '', en: () => '' },
  },
  enquiry_response: {
    style: 'relationship', followUpDays: 3, label: { de: 'Antwort auf Anfrage', en: 'Enquiry response' },
    subject: { de: c => re(c.subject) || 'Ihre Anfrage bei Maxpromo Digital', en: c => re(c.subject) || 'Your enquiry with Maxpromo Digital' },
    starter: {
      de: () => 'vielen Dank für Ihre Anfrage.\n\n[[Was Sie verstanden haben und was Sie anbieten]]\n\nPasst Ihnen ein kurzes Gespräch von 20 Minuten? [[Zwei Terminvorschläge]]',
      en: () => 'thank you for your enquiry.\n\n[[What you understood and what you can offer]]\n\nWould a short 20-minute call suit you? [[Two time options]]',
    },
  },
  outreach: {
    style: 'relationship', followUpDays: 5, label: { de: 'Erstkontakt', en: 'Outreach' },
    subject: { de: () => '[[Betreff]]', en: () => '[[Subject]]' },
    starter: {
      de: () => '[[Warum Sie schreiben — ein konkreter Anlass]]\n\n[[Was Maxpromo für dieses Unternehmen ändern könnte]]\n\nWäre ein kurzes Gespräch dazu für Sie interessant?',
      en: () => '[[Why you are writing — one concrete reason]]\n\n[[What Maxpromo could change for this business]]\n\nWould a short conversation about it be useful?',
    },
  },
  follow_up: {
    style: 'relationship', followUpDays: 5, label: { de: 'Nachfassen', en: 'Follow-up' },
    subject: { de: c => re(c.subject), en: c => re(c.subject) },
    starter: {
      de: () => 'ich wollte kurz nachfragen, ob Sie meine letzte Nachricht erhalten haben.\n\n[[Worum es ging, in einem Satz]]\n\nGibt es von Ihrer Seite Fragen?',
      en: () => 'I wanted to check whether my last message reached you.\n\n[[What it was about, in one sentence]]\n\nIs there anything I can answer for you?',
    },
  },
  meeting: {
    style: 'relationship', followUpDays: null, label: { de: 'Terminbestätigung', en: 'Meeting confirmation' },
    subject: { de: () => 'Terminbestätigung: [[Datum, Uhrzeit]]', en: () => 'Meeting confirmed: [[date, time]]' },
    starter: {
      de: () => 'hiermit bestätige ich unseren Termin:\n\n[[Datum, Uhrzeit, Ort oder Link]]\n\n[[Worüber wir sprechen]]\n\nIch freue mich auf das Gespräch.',
      en: () => 'this confirms our meeting:\n\n[[Date, time, place or link]]\n\n[[What we will cover]]\n\nI look forward to speaking with you.',
    },
  },
  onboarding: {
    style: 'relationship', followUpDays: 2, label: { de: 'Projektstart', en: 'Onboarding' },
    subject: { de: c => `Willkommen bei Maxpromo Digital${c.company ? ` — ${c.company}` : ''}`, en: c => `Welcome to Maxpromo Digital${c.company ? ` — ${c.company}` : ''}` },
    starter: {
      de: () => 'schön, dass wir zusammenarbeiten.\n\nSo geht es weiter:\n1. [[Erster Schritt]]\n2. [[Zweiter Schritt]]\n3. [[Dritter Schritt]]\n\nVon Ihnen brauche ich: [[Zugänge, Unterlagen, Ansprechpartner]]',
      en: () => 'great to be working together.\n\nWhat happens next:\n1. [[First step]]\n2. [[Second step]]\n3. [[Third step]]\n\nWhat I need from you: [[access, documents, contact person]]',
    },
  },
  proposal: {
    style: 'relationship', followUpDays: 4, label: { de: 'Angebot', en: 'Proposal' },
    subject: { de: c => `Angebot${c.reference ? ` ${c.reference}` : ''} — Maxpromo Digital`, en: c => `Proposal${c.reference ? ` ${c.reference}` : ''} — Maxpromo Digital` },
    starter: {
      de: () => 'wie besprochen sende ich Ihnen mein Angebot.\n\n[[Die zwei, drei Punkte, die für den Kunden zählen]]\n\nIch gehe es gern mit Ihnen gemeinsam durch.',
      en: () => 'as discussed, here is my proposal.\n\n[[The two or three points that matter to the client]]\n\nI am happy to walk you through it.',
    },
  },
  quote_follow_up: {
    style: 'relationship', followUpDays: 5, label: { de: 'Nachfassen Angebot', en: 'Proposal follow-up' },
    subject: { de: c => re(c.subject) || `Ihr Angebot${c.reference ? ` ${c.reference}` : ''}`, en: c => re(c.subject) || `Your proposal${c.reference ? ` ${c.reference}` : ''}` },
    starter: {
      de: c => `ich wollte mich zu meinem Angebot${c.reference ? ` ${c.reference}` : ''} melden. Konnten Sie es schon prüfen?\n\n[[Offene Frage oder nächster Schritt]]`,
      en: c => `I wanted to follow up on my proposal${c.reference ? ` ${c.reference}` : ''}. Have you had a chance to review it?\n\n[[Open question or next step]]`,
    },
  },
  project_update: {
    style: 'relationship', followUpDays: null, label: { de: 'Projektstand', en: 'Project update' },
    subject: { de: () => 'Projektstand: [[Projekt]]', en: () => 'Project update: [[project]]' },
    starter: {
      de: () => 'hier der aktuelle Stand:\n\nErledigt: [[…]]\nAls Nächstes: [[…]]\nVon Ihnen benötigt: [[… oder „nichts“]]',
      en: () => 'here is where things stand:\n\nDone: [[…]]\nNext: [[…]]\nNeeded from you: [[… or “nothing”]]',
    },
  },
  request_info: {
    style: 'relationship', followUpDays: 3, label: { de: 'Rückfrage', en: 'Request for information' },
    subject: { de: c => re(c.subject) || 'Kurze Rückfrage', en: c => re(c.subject) || 'A quick question' },
    starter: {
      de: () => 'damit ich weitermachen kann, brauche ich noch:\n\n[[Was genau, und bis wann]]\n\nVielen Dank!',
      en: () => 'to keep things moving I still need:\n\n[[What exactly, and by when]]\n\nThank you!',
    },
  },
  completion: {
    style: 'relationship', followUpDays: 7, label: { de: 'Abschluss & Übergabe', en: 'Completion & handover' },
    subject: { de: () => 'Abschluss: [[Projekt]]', en: () => 'Completed: [[project]]' },
    starter: {
      de: () => '[[Projekt]] ist abgeschlossen.\n\nÜbergeben: [[Zugänge, Dokumentation, Schulung]]\n\nWenn etwas nicht wie erwartet funktioniert, melden Sie sich jederzeit.',
      en: () => '[[project]] is complete.\n\nHanded over: [[access, documentation, training]]\n\nIf anything does not work as expected, just let me know.',
    },
  },
  support: {
    style: 'relationship', followUpDays: 2, label: { de: 'Support', en: 'Support' },
    subject: { de: c => re(c.subject), en: c => re(c.subject) },
    starter: {
      de: () => 'danke für Ihre Meldung.\n\n[[Was Sie geprüft haben und was als Nächstes passiert]]',
      en: () => 'thanks for letting me know.\n\n[[What you checked and what happens next]]',
    },
  },
  invoice: {
    style: 'transactional', followUpDays: null, label: { de: 'Rechnung', en: 'Invoice' },
    subject: { de: c => `Rechnung${c.reference ? ` ${c.reference}` : ''} — Maxpromo Digital`, en: c => `Invoice${c.reference ? ` ${c.reference}` : ''} — Maxpromo Digital` },
    starter: {
      de: c => `anbei erhalten Sie die Rechnung${c.reference ? ` ${c.reference}` : ''}.\n\n[[Betrag und Fälligkeit]]\n\nVielen Dank für die Zusammenarbeit.`,
      en: c => `please find invoice${c.reference ? ` ${c.reference}` : ''} attached.\n\n[[Amount and due date]]\n\nThank you for working with us.`,
    },
  },
  payment_reminder: {
    style: 'transactional', followUpDays: 7, label: { de: 'Zahlungserinnerung', en: 'Payment reminder' },
    subject: { de: c => `Zahlungserinnerung${c.reference ? ` ${c.reference}` : ''}`, en: c => `Payment reminder${c.reference ? ` ${c.reference}` : ''}` },
    starter: {
      de: c => `zur Rechnung${c.reference ? ` ${c.reference}` : ''} konnte ich noch keinen Zahlungseingang feststellen.\n\n[[Betrag, ursprüngliches Fälligkeitsdatum]]\n\nFalls die Zahlung bereits unterwegs ist, betrachten Sie diese Nachricht bitte als gegenstandslos.`,
      en: c => `I have not yet received payment for invoice${c.reference ? ` ${c.reference}` : ''}.\n\n[[Amount, original due date]]\n\nIf payment is already on its way, please disregard this message.`,
    },
  },
  system: {
    style: 'transactional', followUpDays: null, label: { de: 'Systemnachricht', en: 'System message' },
    subject: { de: () => '[[Betreff]]', en: () => '[[Subject]]' },
    starter: { de: () => '[[Nachricht]]', en: () => '[[Message]]' },
  },
}

export function isFamily(value: unknown): value is FamilyId {
  return typeof value === 'string' && (FAMILY_IDS as readonly string[]).includes(value)
}

/** Families whose content concerns money owed: the §19 UStG clause belongs in their footer. */
export const COMMERCIAL_FAMILIES: readonly FamilyId[] = ['invoice', 'payment_reminder', 'proposal', 'quote_follow_up']
