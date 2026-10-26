import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { OWNER_HEADERS, ownerReply } from '@/lib/owner-request'
import { calibrationRuns, PATTERN_MINIMUM, summarize } from '@/lib/agents/calibration'

/**
 * GET /api/os/leads/calibration — the Research Agent field calibration (lib/agents/calibration.ts):
 * every finished research run with Marcel's judgement, and the summary over real reviewed prospects.
 * Owner session, never cached. Reads only.
 */
export const dynamic = 'force-dynamic'

export const GET = withAuth(async () => {
  try {
    return NextResponse.json({ ...summarize(await calibrationRuns(getDb())), minimum: PATTERN_MINIMUM }, { headers: OWNER_HEADERS })
  } catch (err) {
    console.error('[os/leads/calibration]', err instanceof Error ? err.message : err)
    return ownerReply('Calibration unavailable', 503)
  }
})
