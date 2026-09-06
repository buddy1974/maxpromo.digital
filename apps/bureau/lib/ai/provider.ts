import { getAIConfig } from "@/config/env";
import { generateWithAnthropic } from "./anthropic-provider";
import { generateWithOpenAI } from "./openai-provider";
import type { AIGenerationRequest, AIGenerationResult } from "./types";

/**
 * Single entry point for AI generation. Selects the provider from AI_PROVIDER env.
 * Default provider: anthropic (claude-sonnet-4-6).
 * Fallback: openai (requires OPENAI_API_KEY + AI_PROVIDER=openai in env).
 *
 * Generation is DRAFT-ONLY — no provider executes external actions.
 */
export async function generate(
  request: AIGenerationRequest,
): Promise<AIGenerationResult> {
  const { provider } = getAIConfig();

  switch (provider) {
    case "anthropic":
      return generateWithAnthropic(request);
    case "openai":
      return generateWithOpenAI(request);
    default:
      return { ok: false, error: "ai_provider_unknown" };
  }
}
