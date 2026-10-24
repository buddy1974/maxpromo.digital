/** Browser side of the owner mail API (/api/os/mail/actions). Every call is one named request;
 * a retried click with the same id gets the stored answer instead of acting twice. */
export interface EngineResult {
  status: 'done' | 'approval_required' | 'refused' | 'failed'
  result?: { summary?: string; lines?: string[]; data?: unknown }
  approval?: { id: string; payloadHash: string; summary: string; preview: Record<string, string>; expiresAt: string }
  message?: string
  code?: string
}

async function post(body: Record<string, unknown>): Promise<EngineResult> {
  const response = await fetch('/api/os/mail/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify(body) })
  if (!response.ok) return { status: 'failed', message: `HTTP ${response.status}` }
  return await response.json() as EngineResult
}

export function runMail(capability: string, input: Record<string, unknown>, requestId: string = crypto.randomUUID()): Promise<EngineResult> {
  return post({ action: 'run', requestId, capability, input })
}
export function executeApproval(approvalId: string, payloadHash: string): Promise<EngineResult> {
  return post({ action: 'execute', approvalId, payloadHash })
}
export function rejectApproval(approvalId: string): Promise<EngineResult> {
  return post({ action: 'reject', approvalId })
}
export const resultData = <T>(r: EngineResult): T | null => (r.status === 'done' ? (r.result?.data as T) ?? null : null)
export const failure = (r: EngineResult): string => r.message ?? r.result?.summary ?? 'Request failed'
