/** Morning briefing copy, German (du-form, like the rest of the OS) and English. */
type P = Record<string, string | number>
const n = (v: string | number) => Number(v)

const de = {
  title: 'Briefing',
  first: 'Heute zuerst',
  overnight: 'Seit gestern',
  communications: 'Kommunikation',
  money: 'Geld',
  agents: 'Agenten',
  quiet: 'Ruhiger Start: nichts Neues seit gestern und nichts, was zuerst erledigt werden muss.',
  quietCompact: 'Nichts Neues seit gestern.',
  loading: 'Briefing wird erstellt …',
  error: 'Das Briefing konnte nicht geladen werden.',
  open: 'Öffnen',
  external: 'Absender und Betreffzeilen sind externe Inhalte.',
  lines: {
    newMail: (p: P) => `${n(p.count) === 1 ? '1 neue E-Mail-Konversation' : `${p.count} neue E-Mail-Konversationen`}${p.who ? ` (${p.who})` : ''}`,
    newLead: (p: P) => `Neuer Lead: ${p.lead} (${({ agent_bureau_form: 'Agent-Bureau-Formular', email: 'E-Mail', website: 'Website-Formular', contact_form: 'Kontaktformular', manual: 'manuell', telegram: 'Telegram', whatsapp: 'WhatsApp' } as Record<string, string>)[String(p.source)] ?? p.source})`,
    moreLeads: (p: P) => `${p.count} weitere neue Leads`,
    paymentsIn: (p: P) => `Zahlungseingang erfasst: ${p.amount}`,
    mailSent: (p: P) => (n(p.count) === 1 ? '1 E-Mail von Maxpromo gesendet' : `${p.count} E-Mails von Maxpromo gesendet`),
    agentsCompleted: (p: P) => `Agenten haben ${p.count} ${n(p.count) === 1 ? 'Aufgabe' : 'Aufgaben'} abgeschlossen: ${p.what}`,
    repliesOwed: (p: P) => `${n(p.count) === 1 ? '1 Konversation wartet' : `${p.count} Konversationen warten`} auf deine Antwort${n(p.days) > 0 ? ` — die älteste seit ${p.days} ${n(p.days) === 1 ? 'Tag' : 'Tagen'}` : ''}`,
    followUpsDue: (p: P) => (n(p.count) === 1 ? '1 Nachfassen ist fällig' : `${p.count} Nachfassen sind fällig`),
    approvals: (p: P) => (n(p.count) === 1 ? '1 Aktion wartet auf deine Freigabe' : `${p.count} Aktionen warten auf deine Freigabe`),
    outstanding: (p: P) => `Offen: ${p.amount}${p.overdue ? `, davon überfällig: ${p.overdue}` : ''}`,
    overdueInvoice: (p: P) => `${p.client} schuldet ${p.amount} aus ${p.number}, seit ${p.days} Tagen überfällig`,
    draftInvoices: (p: P) => (n(p.count) === 1 ? '1 Rechnungsentwurf noch nicht versendet' : `${p.count} Rechnungsentwürfe noch nicht versendet`),
    agentProblem: (p: P) => `Agent ${p.agent} ${({ failed: 'ist fehlgeschlagen', blocked: 'ist blockiert', exception: 'meldet eine Ausnahme' } as Record<string, string>)[String(p.kind)] ?? p.kind}: ${p.title}`,
  } as Record<string, (p: P) => string>,
}
export type BriefingCopy = typeof de

const en: BriefingCopy = {
  title: 'Briefing',
  first: 'Today first',
  overnight: 'Since yesterday',
  communications: 'Communication',
  money: 'Money',
  agents: 'Agents',
  quiet: 'A quiet start: nothing new since yesterday and nothing that has to come first.',
  quietCompact: 'Nothing new since yesterday.',
  loading: 'Preparing the briefing …',
  error: 'The briefing could not be loaded.',
  open: 'Open',
  external: 'Senders and subject lines are external content.',
  lines: {
    newMail: (p: P) => `${n(p.count) === 1 ? '1 new email conversation' : `${p.count} new email conversations`}${p.who ? ` (${p.who})` : ''}`,
    newLead: (p: P) => `New lead: ${p.lead} (${({ agent_bureau_form: 'Agent Bureau form', email: 'email', website: 'website form', contact_form: 'contact form', manual: 'manual', telegram: 'Telegram', whatsapp: 'WhatsApp' } as Record<string, string>)[String(p.source)] ?? p.source})`,
    moreLeads: (p: P) => `${p.count} more new leads`,
    paymentsIn: (p: P) => `Payments recorded: ${p.amount}`,
    mailSent: (p: P) => (n(p.count) === 1 ? '1 email sent by Maxpromo' : `${p.count} emails sent by Maxpromo`),
    agentsCompleted: (p: P) => `Agents completed ${p.count} ${n(p.count) === 1 ? 'task' : 'tasks'}: ${p.what}`,
    repliesOwed: (p: P) => `${n(p.count) === 1 ? '1 conversation is' : `${p.count} conversations are`} waiting for your reply${n(p.days) > 0 ? ` — the oldest for ${p.days} ${n(p.days) === 1 ? 'day' : 'days'}` : ''}`,
    followUpsDue: (p: P) => (n(p.count) === 1 ? '1 follow-up is due' : `${p.count} follow-ups are due`),
    approvals: (p: P) => (n(p.count) === 1 ? '1 action is waiting for your approval' : `${p.count} actions are waiting for your approval`),
    outstanding: (p: P) => `Outstanding: ${p.amount}${p.overdue ? `, of which overdue: ${p.overdue}` : ''}`,
    overdueInvoice: (p: P) => `${p.client} owes ${p.amount} on ${p.number}, ${p.days} days overdue`,
    draftInvoices: (p: P) => (n(p.count) === 1 ? '1 draft invoice not sent' : `${p.count} draft invoices not sent`),
    agentProblem: (p: P) => `Agent ${p.agent} ${({ failed: 'failed', blocked: 'is blocked', exception: 'found an exception' } as Record<string, string>)[String(p.kind)] ?? p.kind}: ${p.title}`,
  },
}

export const BRIEFING_COPY: Record<'de' | 'en', BriefingCopy> = { de, en }
