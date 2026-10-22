/** No network: execute the real release script only through its pre-spawn refusal paths. */
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {resolve} from 'node:path'
const script=resolve('apps/web/scripts/email/prove-release-model.ts')
const base={...process.env,MAXPROMO_EVIDENCE_MODE:'',NEON_DATABASE_URL:'postgresql://fixture@production.invalid/db',DATABASE_URL:'',
  EMAIL_RELEASE_EVIDENCE_DB:'postgresql://fixture@evidence.invalid/db',EMAIL_RELEASE_MODEL_PROOF:'1',VERCEL_ENV:'production'}
for(const [env,success] of [
  [{...base,EMAIL_RELEASE_MODEL_PROOF:''},true],
  [{...base,VERCEL_ENV:'preview'},false],
  [{...base,EMAIL_RELEASE_EVIDENCE_DB:''},false],
  [{...base,EMAIL_RELEASE_EVIDENCE_DB:base.NEON_DATABASE_URL},false],
] as const){
  const result=spawnSync(process.execPath,[script],{env,encoding:'utf8',timeout:5000})
  assert.equal(result.status===0,success,'Release proof must stay opt-in and refuse unavailable/production evidence targets')
}
console.log('4 release-build isolation guards passed; no server, database or model called.')
