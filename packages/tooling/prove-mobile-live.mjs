#!/usr/bin/env node
/**
 * packages/tooling/prove-mobile-live.mjs  —  `npm run prove:mobile-live`
 *
 * The two systems together: OpenClaw Mission Control's real Mobile Command
 * service, in its own repository, talking over the signed agent API to this
 * repository's web app running as the EVIDENCE runtime.
 *
 *   OS_AGENT_SECRET=<s> OS_AGENT_ALLOWED_ACTORS=telegram:100000001 npm run dev:web   # terminal 1
 *   OS_AGENT_SECRET=<s> MISSION_CONTROL_DIR=<path to tools/mission-control-ui> \
 *     node --env-file=apps/web/.env.local packages/tooling/prove-mobile-live.mjs      # terminal 2
 *
 * Snapshots the evidence lab, runs Mission Control's live integration test
 * (tests/integration/maxpromo-os-live.test.ts), restores the lab. Evidence
 * mode suppresses all outbound mail inside the OS transport.
 */

import { spawnSync } from 'node:child_process'
import { labSql, restoreLab, snapshotLab } from './evidence-lab.mjs'

const base = process.env.AGENT_PROOF_BASE ?? 'http://localhost:3020'
const secret = process.env.OS_AGENT_SECRET
const mc = process.env.MISSION_CONTROL_DIR
if (!secret || secret.length < 32 || !mc) {
  console.error('prove-mobile-live: OS_AGENT_SECRET (≥32) and MISSION_CONTROL_DIR are required.')
  process.exit(1)
}

const sql = labSql()
const alive = await fetch(`${base}/api/health`).then((r) => r.ok).catch(() => false)
if (!alive) { console.error(`prove-mobile-live: no evidence runtime at ${base}.`); process.exit(1) }

const snap = await snapshotLab(sql)
console.log('='.repeat(74))
console.log('MOBILE LIVE — Mission Control × Maxpromo OS (evidence runtime)')
let status = 1
try {
  const result = spawnSync('npx', ['vitest', 'run', 'tests/integration/maxpromo-os-live.test.ts', '--reporter=verbose'], {
    cwd: mc,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, MAXPROMO_OS_LIVE_URL: base, MAXPROMO_OS_LIVE_SECRET: secret, OS_AGENT_SECRET: '' },
  })
  status = result.status ?? 1
} finally {
  console.log('\nRestoring the lab')
  const { sequencesRestored } = await restoreLab(sql, snap)
  if (!sequencesRestored) { console.error('  sequences NOT restored'); status = 1 }
  else console.log('  sequences restored to their recorded values')
}
console.log(status === 0 ? '\nMOBILE LIVE: passed' : '\nMOBILE LIVE: FAILED')
process.exitCode = status
