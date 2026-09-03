import { getAIConfig, hasOpenAIConfig } from "@/config/env";
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

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

// Extract the assistant text from a Responses API payload (no SDK dependency).
function extractText(json: unknown): string {
  const j = json as { output_text?: string; output?: unknown[] };
  if (typeof j.output_text === "string") return j.output_text;
  const out = Array.isArray(j.output) ? j.output : [];
  for (const item of out) {
    const it = item as { type?: string; content?: unknown[] };
    if (it.type === "message" && Array.isArray(it.content)) {
      for (const c of it.content) {
        const cc = c as { type?: string; text?: string };
        if (cc.type === "output_text" && typeof cc.text === "string") return cc.text;
      }
    }
  }
  return "";
}

function parseProposal(raw: string): Omit<AIGeneratedProposal, "requiresApproval" | "safetyNote" | "riskLevel"> & { riskLevel?: unknown } {
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
  // Fallback: wrap the raw text as the draft.
  return {
    title: "Entwurf",
    summary: raw.slice(0, 200),
    draft: raw,
    recommendedNextAction: "Zur Freigabe vorlegen.",
    riskLevel: undefined,
  };
}

export async function generateWithOpenAI(
  request: AIGenerationRequest,
): Promise<AIGenerationResult> {
  if (!hasOpenAIConfig()) return { ok: false, error: "ai_not_configured" };

  const { model, temperature } = getAIConfig();
  const key = process.env.OPENAI_API_KEY as string;

  let res: Response;
  try {
    res = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(request.task, request.context) },
        ],
      }),
    });
  } catch {
    return { ok: false, error: "ai_network_error" };
  }

  if (res.status === 429) return { ok: false, error: "ai_rate_limited" };
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
