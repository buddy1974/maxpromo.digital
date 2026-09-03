import { getAIConfig, hasAnthropicConfig } from "@/config/env";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
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

// Direct fetch — no SDK dependency. Matches the OpenAI provider pattern.
const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
// Generous cap for structured JSON drafts. Model rarely approaches this.
const MAX_TOKENS = 2048;

function extractText(json: unknown): string {
  const j = json as { content?: unknown[] };
  if (!Array.isArray(j.content)) return "";
  for (const block of j.content) {
    const b = block as { type?: string; text?: string };
    if (b.type === "text" && typeof b.text === "string") return b.text;
  }
  return "";
}

function parseProposal(
  raw: string,
): Omit<AIGeneratedProposal, "requiresApproval" | "safetyNote" | "riskLevel"> & {
  riskLevel?: unknown;
} {
  // Tolerate stray code fences or prose around the JSON.
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const obj = JSON.parse(raw.slice(start, end + 1));
      return {
        title: String(obj.title ?? "Entwurf"),
        summary: String(obj.summary ?? ""),
        draft: String(obj.draft ?? raw),
        recommendedNextAction: String(obj.recommendedNextAction ?? "Zur Freigabe vorlegen."),
        riskLevel: obj.riskLevel,
      };
    } catch {
      /* fall through to raw fallback */
    }
  }
  return {
    title: "Entwurf",
    summary: raw.slice(0, 200),
    draft: raw,
    recommendedNextAction: "Zur Freigabe vorlegen.",
    riskLevel: undefined,
  };
}

export async function generateWithAnthropic(
  request: AIGenerationRequest,
): Promise<AIGenerationResult> {
  if (!hasAnthropicConfig()) return { ok: false, error: "ai_not_configured" };

  const { model, temperature } = getAIConfig();
  const key = process.env.ANTHROPIC_API_KEY as string;

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        temperature,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: buildUserPrompt(request.task, request.context),
          },
        ],
      }),
    });
  } catch {
    return { ok: false, error: "ai_network_error" };
  }

  if (res.status === 429) return { ok: false, error: "ai_rate_limited" };
  if (res.status === 401) return { ok: false, error: "ai_auth_error" };
  if (!res.ok) {
    // Do not echo provider error bodies (may contain prompt fragments).
    return { ok: false, error: "ai_provider_error" };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, error: "ai_bad_response" };
  }

  const text = extractText(json);
  if (!text) return { ok: false, error: "ai_empty_response" };

  const parsed = parseProposal(text);
  const floor = riskFloor(request.task, request.context);
  const data: AIGeneratedProposal = {
    title: parsed.title,
    summary: parsed.summary,
    draft: parsed.draft,
    riskLevel: clampRisk(coerceRisk(parsed.riskLevel), floor),
    recommendedNextAction: parsed.recommendedNextAction,
    requiresApproval: true,
    safetyNote: defaultSafetyNote(),
  };
  return { ok: true, data };
}
