/**
 * lib/ai-failure.ts — the failure classes live with the model gateway now (@maxpromo/ai, ADR-0027),
 * so the Bureau and this application classify a provider's answer the same way. Re-exported here
 * because the OS routes import it by this name.
 */
export { classifyProviderError, logAiFailure, type AiFailure, type AiFailureClass } from '@maxpromo/ai'
