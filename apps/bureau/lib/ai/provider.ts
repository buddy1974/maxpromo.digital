import { complete, type AiFailureClass } from "@maxpromo/ai";
import { explicitAIModel, gatewayEnv, getAIConfig, hasAIConfig } from "@/config/env";
import { systemPrompt, buildUserPrompt } from "./prompts";
import {
  clampRisk,
  coerceRisk,
  defaultSafetyNote,
  riskFloor,
} from "./safety";
import type {
  AIGeneratedProposal,
  AIGenerationRequest,
  AIGenerationResult,
} from "./types";

// Generous cap for structured JSON drafts. Model rarely approaches this.
const MAX_TOKENS = 2048;

/** The Bureau's error codes, unchanged for its callers. Never a provider's own text. */
const ERROR_FOR: Record<AiFailureClass, string> = {
  CONFIGURATION: "ai_not_configured",
  AUTHENTICATION: "ai_auth_error",
  BILLING: "ai_provider_error",
  MODEL: "ai_provider_error",
  RATE_LIMIT: "ai_rate_limited",
  REQUEST: "ai_provider_error",
  PROVIDER: "ai_network_error",
  RESPONSE: "ai_empty_response",
};

function parseProposal(
  raw: string,
  locale: "de" | "en" = "de",
): Omit<AIGeneratedProposal, "requiresApproval" | "safetyNote" | "riskLevel"> & {
  riskLevel?: unknown;
} {
  /**
   * What is shown when the model returns something unusable. It is the only
   * text this file puts in front of an operator, so it follows their language
   * rather than the language the prompt happens to be written in.
   */
  /* i18n-exempt — both languages are right here, chosen by the locale. */
  const fallback = locale === "en"
    ? { title: "Draft", next: "Put it up for approval." }
    : { title: "Entwurf", next: "Zur Freigabe vorlegen." };

  // Tolerate stray code fences or prose around the JSON.
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const obj = JSON.parse(raw.slice(start, end + 1));
      return {
        title: String(obj.title ?? fallback.title),
        summary: String(obj.summary ?? ""),
        draft: String(obj.draft ?? raw),
        recommendedNextAction: String(obj.recommendedNextAction ?? fallback.next),
        riskLevel: obj.riskLevel,
      };
    } catch {
      /* fall through to raw fallback */
    }
  }
  return {
    title: fallback.title,
    summary: raw.slice(0, 200),
    draft: raw,
    recommendedNextAction: fallback.next,
    riskLevel: undefined,
  };
}

/**
 * Single entry point for AI generation. The route comes from AI_PROVIDER
 * (anthropic by default · openai · openrouter) and the call goes through the
 * platform's model gateway (@maxpromo/ai, ADR-0027) — one implementation for
 * the Bureau and the web application.
 *
 * Generation is DRAFT-ONLY — no provider executes external actions.
 */
export async function generate(
  request: AIGenerationRequest,
): Promise<AIGenerationResult> {
  if (!hasAIConfig()) return { ok: false, error: "ai_not_configured" };
  const { temperature } = getAIConfig();

  const result = await complete(
    {
      system: systemPrompt(request.locale),
      messages: [{ role: "user", content: buildUserPrompt(request.task, request.context) }],
      tier: "standard",
      model: explicitAIModel(),
      maxTokens: MAX_TOKENS,
      temperature,
    },
    { env: gatewayEnv() },
  );
  // Do not echo provider error bodies (may contain prompt fragments).
  if (!result.ok) return { ok: false, error: ERROR_FOR[result.failure.klass] };

  const parsed = parseProposal(result.text, request.locale);
  const floor = riskFloor(request.task, request.context);
  const data: AIGeneratedProposal = {
    title: parsed.title,
    summary: parsed.summary,
    draft: parsed.draft,
    riskLevel: clampRisk(coerceRisk(parsed.riskLevel), floor),
    recommendedNextAction: parsed.recommendedNextAction,
    requiresApproval: true,
    safetyNote: defaultSafetyNote(request.locale),
  };
  return { ok: true, data };
}
