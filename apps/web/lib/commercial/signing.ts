/**
 * lib/commercial/signing.ts
 *
 * The signed-request contract lives in `@maxpromo/config/agent-contract`
 * (ADR-0021) so the OS and every client sign the same bytes. This module
 * re-exports it for the commercial layer and its proofs.
 */

export {
  AGENT_HEADERS, SIGNATURE_WINDOW_SECONDS, MIN_SECRET_LENGTH,
  sha256Hex, canonicalRequest, signRequest, verifySignature, payloadHash, stableStringify,
  type SignatureVerdict,
} from '@maxpromo/config/agent-contract'
