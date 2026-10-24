/** Browser side of the owner mail API (/api/os/mail/actions); the shared client is lib/commercial/ownerClient.ts. */
import { ownerApi } from '@/lib/commercial/ownerClient'

export type { EngineResult } from '@/lib/commercial/ownerClient'
export { resultData, failure } from '@/lib/commercial/ownerClient'

const mail = ownerApi('/api/os/mail/actions')
export const runMail = mail.run
export const executeApproval = mail.execute
export const rejectApproval = mail.reject
