/**
 * lib/channels/runtime.ts — SERVER ONLY.
 *
 * Production wiring of the conversation engine's ports: Neon store, the
 * commercial engine behind the public allow-list, the model through
 * `callAIJson`, the WhatsApp transport, the platform logger.
 *
 * Kept apart from the orchestrator so the orchestrator stays pure and the
 * offline proof can wire the same engine to fakes.
 */

import { randomBytes } from 'node:crypto'
import { isEvidenceMode } from '@maxpromo/config'
import { log } from '@maxpromo/observability'
import { callAIJson } from '@/lib/ai'
import { getDb } from '@/lib/db'
import type { WhatsAppConfig } from './config'
import { createOsBridge } from './os-bridge'
import type { Deps, ModelTurn } from './orchestrator'
import { createConversationStore } from './store'
import { RESPONSE_SCHEMA } from './understanding'
import { createWhatsAppProvider } from './whatsapp'

/** The model has this long to answer before the customer gets the fallback and Marcel the conversation. */
export const MODEL_TIMEOUT_MS = 25_000

export function channelLog(trace: string) {
  return (event: string, fields: Record<string, unknown>) => {
    const level = /failed|invalid|blocked|uncertain/.test(event) ? 'warn' : 'info'
    log[level](event, { surface: 'api', route: '/api/channels/whatsapp', trace, ...fields })
  }
}

export function productionDeps(config: WhatsAppConfig, trace: string): (conversationId?: string) => Deps {
  const sql = getDb()
  const store = createConversationStore(sql)
  const provider = createWhatsAppProvider({
    baseUrl: config.graphBaseUrl,
    graphVersion: config.graphVersion,
    phoneNumberId: config.phoneNumberId,
    accessToken: config.accessToken,
    evidenceMode: isEvidenceMode(),
  })
  const modelId = config.model ?? (process.env.ANTHROPIC_MODEL?.trim() || undefined)
  const model = async (system: string, turns: ModelTurn[]) => {
    const r = await callAIJson(turns, system, RESPONSE_SCHEMA as unknown as Record<string, unknown>, {
      maxTokens: 900,
      timeoutMs: MODEL_TIMEOUT_MS,
      ...(modelId ? { model: modelId } : {}),
    })
    return r.data
  }
  return (conversationId?: string) => ({
    store,
    /* The actor in the OS audit is the conversation, so every write is traceable to it. */
    os: createOsBridge(sql, conversationId ?? 'unknown'),
    model,
    provider,
    config,
    now: () => new Date(),
    log: channelLog(trace),
    canary: () => `MPC-${randomBytes(6).toString('hex')}`,
  })
}
