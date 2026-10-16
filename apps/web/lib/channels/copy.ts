/**
 * lib/channels/copy.ts
 *
 * Every sentence the gateway sends that is not written by the model.
 *
 * These are the sentences that must be true whatever the model would have
 * said: that this is an automated assistant, that Marcel has been told, when
 * he is next reachable, that something could not be handled. Each is sent only
 * after the thing it states has been durably recorded.
 *
 * No prices, no promised response times, no claim about a record being
 * created. German and English, complete in both (ADR-0014).
 */

import { nextOpening, type Lang, type TakeoverReason } from './policy.ts'

const DAY: Record<Lang, string[]> = {
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}

/**
 * EU AI Act Art. 50(1), applicable from 2026-08-02: a person interacting with
 * an AI system is told so, at the latest at the first interaction. Prefixed by
 * the orchestrator to the first automated message of every conversation.
 */
export function disclosure(lang: Lang): string {
  return lang === 'de'
    ? 'Hier schreibt Max, der KI-Assistent von Maxpromo Digital. Marcel liest mit und kann jederzeit übernehmen.'
    : 'This is Max, the AI assistant of Maxpromo Digital. Marcel can see this chat and can step in at any time.'
}

function whenReachable(lang: Lang, now: Date): string {
  const n = nextOpening(now)
  if (!n) return lang === 'de' ? 'Er meldet sich hier persönlich bei Ihnen.' : 'He will reply to you here personally.'
  const hour = `${String(n.hour).padStart(2, '0')}:00`
  if (lang === 'de') {
    const day = n.sameDay ? 'heute' : n.tomorrow ? 'morgen' : `am ${DAY.de[n.weekday]}`
    return `Er ist ${day} ab ${hour} Uhr wieder erreichbar und meldet sich hier persönlich bei Ihnen.`
  }
  const day = n.sameDay ? 'today' : n.tomorrow ? 'tomorrow' : `on ${DAY.en[n.weekday]}`
  return `He is back ${day} from ${hour} (Berlin time) and will reply to you here personally.`
}

/** Sent once, after the handover is recorded and the notice is queued. */
export function handoverAcknowledged(lang: Lang, reason: TakeoverReason | 'model' | 'existing_client', now: Date): string {
  const lead = lang === 'de'
    ? (reason === 'complaint'
        ? 'Das tut mir leid. Ich habe Ihr Anliegen direkt an Marcel weitergegeben.'
        : reason === 'urgent'
          ? 'Verstanden – ich habe das als dringend an Marcel weitergegeben.'
          : 'Gern – ich habe Marcel Bescheid gegeben.')
    : (reason === 'complaint'
        ? 'I am sorry to hear that. I have passed this straight to Marcel.'
        : reason === 'urgent'
          ? 'Understood — I have passed this to Marcel as urgent.'
          : 'Of course — I have let Marcel know.')
  return `${lead} ${whenReachable(lang, now)}`
}

/** The model could not be reached or answered nonsense. True, short, and hands over. */
export function unavailable(lang: Lang, now: Date): string {
  return lang === 'de'
    ? `Danke für Ihre Nachricht – sie ist angekommen. Ich kann gerade nicht selbst antworten und habe sie an Marcel weitergegeben. ${whenReachable(lang, now)}`
    : `Thank you — your message has arrived. I cannot answer it myself right now, so I have passed it to Marcel. ${whenReachable(lang, now)}`
}

/** A reply the guard refused. Never reveals why. */
export function guarded(lang: Lang): string {
  return lang === 'de'
    ? 'Das sollte Marcel Ihnen lieber selbst beantworten – ich habe ihm Bescheid gegeben. Erzählen Sie mir gern in der Zwischenzeit, worum es in Ihrem Betrieb geht.'
    : 'That is something Marcel should answer himself — I have let him know. In the meantime, feel free to tell me what is going on in your business.'
}

/** Only media arrived; nothing to read. */
export function mediaOnly(lang: Lang, kind: 'voice' | 'other'): string {
  if (kind === 'voice') {
    return lang === 'de'
      ? 'Sprachnachrichten kann ich leider nicht anhören. Schreiben Sie mir kurz in ein paar Worten, worum es geht? Marcel hört sie sich auch gern selbst an.'
      : 'I am not able to listen to voice messages, unfortunately. Could you write me a few words about what it is about? Marcel can listen to it himself too.'
  }
  return lang === 'de'
    ? 'Danke! Dateien und Bilder sehe ich mir hier nicht an. Beschreiben Sie mir kurz in Worten, worum es geht?'
    : 'Thank you! I do not open files or images here. Could you describe in a few words what it is about?'
}

/** The conversation used its daily allowance of automated turns. */
export function allowanceReached(lang: Lang, now: Date): string {
  return lang === 'de'
    ? `Vielen Dank für die vielen Details! Ich gebe das Gespräch jetzt an Marcel weiter. ${whenReachable(lang, now)}`
    : `Thank you for all the detail! I am handing this conversation to Marcel now. ${whenReachable(lang, now)}`
}
