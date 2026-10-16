/**
 * lib/channels/config.ts
 *
 * The WhatsApp channel's configuration, validated once per request from the
 * environment, failing closed.
 *
 * Three layers, so a half-configured deployment can never act:
 *
 *   receive   WHATSAPP_APP_SECRET + WHATSAPP_VERIFY_TOKEN + WHATSAPP_PHONE_NUMBER_ID.
 *             Without all three the webhook answers 503 and nothing is read.
 *   automate  WHATSAPP_AUTOMATION = off | shadow | on. Unset is `off`: messages
 *             are recorded and Marcel answers from the Business App; no model
 *             runs and nothing is sent. `shadow` runs the whole conversation and
 *             stores the reply as a draft without sending it.
 *   send      `on` additionally needs WHATSAPP_ACCESS_TOKEN. `on` without it is
 *             a configuration error, not a silent downgrade.
 *
 * No value is ever returned in an error — only the variable's name.
 *
 * Pure: takes the environment as an argument.
 */

export type AutomationMode = 'off' | 'shadow' | 'on'

export interface WhatsAppConfig {
  appSecret: string
  verifyToken: string
  phoneNumberId: string
  /** When set, events whose WABA id differs are ignored. */
  businessAccountId: string | null
  accessToken: string | null
  graphVersion: string
  /** https://graph.facebook.com, or a loopback mock in evidence mode only. */
  graphBaseUrl: string
  automation: AutomationMode
  /** When non-empty, only these numbers (digits) receive automatic replies. Pilot control. */
  testAllowlist: ReadonlySet<string>
  /** A conversation Marcel took over returns to Max after this many hours without a word from him. */
  humanIdleHours: number
  /** Message text older than this is erased; derived state (qualification, links) is kept. */
  retentionDays: number
  /** Normalised openings of the Business App's own greeting/away texts, so their echoes are not read as Marcel typing. */
  nativeAutoReplyPrefixes: string[]
  /** The Business App greeting is on: Max does not greet a second time. */
  nativeGreetingActive: boolean
  /** Model calls one conversation may cause per Berlin day before it is handed to Marcel. */
  dailyModelTurns: number
  model: string | null
}

export type ConfigResult =
  | { ok: true; config: WhatsAppConfig }
  | { ok: false; problem: string }

type Env = Record<string, string | undefined>

const GRAPH = 'https://graph.facebook.com'
const LOOPBACK = /^http:\/\/(127\.0\.0\.1|localhost)(:\d{2,5})?$/

function str(env: Env, name: string): string {
  return (env[name] ?? '').trim()
}

function int(env: Env, name: string, def: number, min: number, max: number): number | string {
  const raw = str(env, name)
  if (!raw) return def
  const n = Number(raw)
  if (!Number.isInteger(n) || n < min || n > max) return `${name} must be a whole number from ${min} to ${max}`
  return n
}

/** Lower-case, collapsed whitespace, no punctuation — how an echo is compared with a known auto-reply. */
export function normaliseForMatch(text: string): string {
  return text.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

export function loadWhatsAppConfig(env: Env, opts: { evidenceMode?: boolean } = {}): ConfigResult {
  const appSecret = str(env, 'WHATSAPP_APP_SECRET')
  const verifyToken = str(env, 'WHATSAPP_VERIFY_TOKEN')
  const phoneNumberId = str(env, 'WHATSAPP_PHONE_NUMBER_ID')
  if (!appSecret || !verifyToken || !phoneNumberId) {
    return { ok: false, problem: 'WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required' }
  }
  /* A Meta app secret is 32 hex characters. Anything much shorter is a typo
     or a placeholder, and a short HMAC key is a weak one. */
  if (appSecret.length < 32) return { ok: false, problem: 'WHATSAPP_APP_SECRET must be at least 32 characters' }
  if (verifyToken.length < 32) return { ok: false, problem: 'WHATSAPP_VERIFY_TOKEN must be at least 32 characters' }
  if (/^(x+|placeholder|changeme|todo)$/i.test(appSecret) || /placeholder|changeme/i.test(verifyToken)) {
    return { ok: false, problem: 'WHATSAPP_APP_SECRET or WHATSAPP_VERIFY_TOKEN is still a placeholder' }
  }
  if (!/^\d{5,20}$/.test(phoneNumberId)) return { ok: false, problem: 'WHATSAPP_PHONE_NUMBER_ID must be the numeric phone number id' }

  const businessAccountId = str(env, 'WHATSAPP_BUSINESS_ACCOUNT_ID') || null
  if (businessAccountId && !/^\d{5,20}$/.test(businessAccountId)) return { ok: false, problem: 'WHATSAPP_BUSINESS_ACCOUNT_ID must be numeric' }

  const graphVersion = str(env, 'WHATSAPP_GRAPH_VERSION') || 'v25.0'
  if (!/^v\d{2}\.\d$/.test(graphVersion)) return { ok: false, problem: 'WHATSAPP_GRAPH_VERSION must look like v25.0' }

  /* The send host is fixed. An override exists for the local simulator and is
     honoured only in evidence mode and only for loopback — so no
     configuration can point production sends somewhere else. */
  const override = str(env, 'WHATSAPP_GRAPH_BASE_URL')
  let graphBaseUrl = GRAPH
  if (override) {
    if (!opts.evidenceMode || !LOOPBACK.test(override)) {
      return { ok: false, problem: 'WHATSAPP_GRAPH_BASE_URL is only accepted in evidence mode, and only for a loopback address' }
    }
    graphBaseUrl = override
  }

  const automationRaw = (str(env, 'WHATSAPP_AUTOMATION') || 'off').toLowerCase()
  if (!['off', 'shadow', 'on'].includes(automationRaw)) return { ok: false, problem: 'WHATSAPP_AUTOMATION must be off, shadow or on' }
  const automation = automationRaw as AutomationMode

  const accessToken = str(env, 'WHATSAPP_ACCESS_TOKEN') || null
  if (automation === 'on' && !accessToken) return { ok: false, problem: 'WHATSAPP_AUTOMATION=on needs WHATSAPP_ACCESS_TOKEN' }

  const allow = str(env, 'WHATSAPP_TEST_ALLOWLIST').split(',').map((s) => s.replace(/\D/g, '')).filter(Boolean)
  if (allow.some((n) => n.length < 8 || n.length > 15)) return { ok: false, problem: 'WHATSAPP_TEST_ALLOWLIST must be phone numbers with country code' }

  const humanIdleHours = int(env, 'WHATSAPP_HUMAN_IDLE_HOURS', 48, 1, 24 * 30)
  const retentionDays = int(env, 'WHATSAPP_MESSAGE_RETENTION_DAYS', 90, 1, 3650)
  const dailyModelTurns = int(env, 'WHATSAPP_DAILY_MODEL_TURNS', 40, 1, 500)
  for (const x of [humanIdleHours, retentionDays, dailyModelTurns]) if (typeof x === 'string') return { ok: false, problem: x }

  const nativeAutoReplyPrefixes = str(env, 'WHATSAPP_NATIVE_AUTOREPLY_PREFIXES')
    .split('||').map(normaliseForMatch).filter((s) => s.length >= 8)
  const greeting = str(env, 'WHATSAPP_NATIVE_GREETING_ACTIVE').toLowerCase()

  return {
    ok: true,
    config: {
      appSecret, verifyToken, phoneNumberId, businessAccountId, accessToken, graphVersion, graphBaseUrl, automation,
      testAllowlist: new Set(allow),
      humanIdleHours: humanIdleHours as number,
      retentionDays: retentionDays as number,
      dailyModelTurns: dailyModelTurns as number,
      nativeAutoReplyPrefixes,
      /* The Business App greeting is configured today (2026-10); assume it is on unless told otherwise. */
      nativeGreetingActive: greeting !== 'false' && greeting !== '0',
      model: str(env, 'WHATSAPP_MODEL') || null,
    },
  }
}
