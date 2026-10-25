/**
 * @maxpromo/research — SERVER ONLY (node:dns, node:net).
 *
 * The one implementation of known-lead research and qualification (ADR-0030). Maxpromo OS owns the
 * lead and stores the outcome; the Agent Bureau's Research Agent executes it as delegated work.
 * Neither keeps a copy of these rules.
 */
export {
  fetchSite, siteOrigin, isPrivateAddress, robotsDisallows, htmlText, readSignals, USER_AGENT,
  type FetchedPage, type SiteSignals, type SiteResult, type SiteDeps,
} from './fetchSite.ts'
export {
  researchSite, verifyEvidence, researchContent, researchRequest, RESEARCH_TASK, SOLUTIONS, INJECTION,
  type Evidence, type ResearchFindings, type ResearchOutcome, type ResearchDeps, type Solution,
} from './research.ts'
export { qualify, QUALIFY_THRESHOLD, type Qualification, type Confidence, type Reason, type ReasonCode, type CaveatCode } from './qualify.ts'
export { parseFindings, recommendNext, researchWorkResult, type ResearchRecommendation, type ResearchWorkResult } from './work.ts'
