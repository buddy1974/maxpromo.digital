/**
 * @maxpromo/research — SERVER ONLY (node:dns, node:net).
 *
 * The one implementation of known-lead research and qualification (ADR-0030). Maxpromo OS owns the
 * lead and stores the outcome; the Agent Bureau's Research Agent executes it as delegated work.
 * Neither keeps a copy of these rules.
 */
export {
  fetchSite, siteOrigin, isPrivateAddress, robotsDisallows, htmlText, readSignals, decodeBody, anchors, frameSources, kindOf, USER_AGENT, THIN_CHARS,
  type FetchedPage, type SiteSignals, type SiteResult, type SiteDeps, type Coverage, type PageKind,
} from './fetchSite.ts'
export {
  researchSite, verifyEvidence, verifyFacts, groundClaims, signalFacts, researchContent, researchRequest, RESEARCH_TASK, SOLUTIONS, TOPICS, INJECTION,
  type Evidence, type ResearchFindings, type ResearchOutcome, type ResearchDeps, type Solution, type FactTopic,
  type Inference, type Opportunity, type ModelAnswer, type SignalFact, type SignalCode, type Rejection, type RejectReason,
} from './research.ts'
export { qualify, QUALIFY_THRESHOLD, type Qualification, type Confidence, type Verdict, type Reason, type ReasonCode, type CaveatCode, type UnknownCode } from './qualify.ts'
export { MODEL_ROUTES, parseFindings, recommendNext, researchWorkResult, investigationPlan, type ResearchRecommendation, type ResearchWorkResult, type Check } from './work.ts'
