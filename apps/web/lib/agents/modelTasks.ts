/**
 * lib/agents/modelTasks.ts — the OS gateway for Bureau agents (ADR-0030). SERVER ONLY.
 *
 * The Agent Bureau holds no model key. A Bureau agent that needs a model step asks the OS to run a
 * REGISTERED task by name through the one gateway (@maxpromo/ai): the system prompt, schema, tier and
 * limits are the task's, defined in the shared package; the agent sends only the user content. So the
 * door cannot be used as a general model proxy, the key has one custodian, and every call is logged
 * where the other model calls are.
 *
 * Each task names the one agent allowed to run it.
 */
import { completeJson, type GatewayDeps } from '@maxpromo/ai'
import { RESEARCH_TASK, researchRequest } from '@maxpromo/research'

const TASKS = {
  [RESEARCH_TASK.name]: { agent: 'bureau:research', build: researchRequest, maxContent: 80_000 },
} as const

export type ModelTaskResponse =
  | { status: 'done'; task: string; data: unknown; model: string; route: string; latencyMs: number }
  | { status: 'refused'; code: 'unknown_task' | 'not_permitted' | 'invalid_content'; message: string }
  | { status: 'failed'; task: string; klass: string; latencyMs: number }

export async function runModelTask(actor: string, body: Record<string, unknown>, deps: GatewayDeps = {}): Promise<ModelTaskResponse> {
  const name = typeof body.task === 'string' ? body.task : ''
  const task = (TASKS as Record<string, typeof TASKS[keyof typeof TASKS]>)[name]
  if (!task) return { status: 'refused', code: 'unknown_task', message: 'The OS has no such model task.' }
  if (task.agent !== actor) return { status: 'refused', code: 'not_permitted', message: 'This agent may not run that task.' }
  const content = typeof body.content === 'string' ? body.content : ''
  if (!content.trim() || content.length > task.maxContent) return { status: 'refused', code: 'invalid_content', message: `Content must be 1–${task.maxContent} characters.` }
  const started = Date.now()
  const r = await completeJson(task.build(content), deps)
  const latencyMs = Date.now() - started
  if (!r.ok) {
    console.warn('[agent-model]', name, actor, r.failure.klass)
    return { status: 'failed', task: name, klass: r.failure.klass, latencyMs }
  }
  console.log('[agent-model]', name, actor, r.route, r.model, `${latencyMs}ms`)
  /* The route that answered goes back with the answer, so the agent's evidence names it (ADR-0033 A4). */
  return { status: 'done', task: name, data: r.data, model: r.model, route: r.route, latencyMs }
}
