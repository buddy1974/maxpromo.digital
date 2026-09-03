// SERVER-ONLY. Do not import from client components. Reads secret AI config from
// process.env. Never throws at app boot — only AI routes check `configured`.
// Keys are never exposed to the client (no NEXT_PUBLIC_ prefix).

export type AIProviderName = "openai" | "anthropic";

export interface AIConfig {
  provider: AIProviderName;
  model: string;
  temperature: number;
  /** True only when the active provider's key is present. */
  configured: boolean;
}

// WHY Anthropic default: Agent Bureau runs on claude-sonnet-4-6. OpenAI kept as
// opt-in fallback via AI_PROVIDER=openai env var.
const DEFAULT_PROVIDER: AIProviderName = "anthropic";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_TEMPERATURE = 0.3;

/** True when ANTHROPIC_API_KEY is set and non-empty. */
export function hasAnthropicConfig(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/** True when OPENAI_API_KEY is set and non-empty (optional fallback). */
export function hasOpenAIConfig(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

/**
 * hasAIConfig — true when the active provider has its key set.
 * Route handlers call this instead of provider-specific checks so switching
 * providers via AI_PROVIDER env var requires no code changes.
 */
export function hasAIConfig(): boolean {
  const provider = (process.env.AI_PROVIDER?.trim() as AIProviderName) || DEFAULT_PROVIDER;
  return provider === "anthropic" ? hasAnthropicConfig() : hasOpenAIConfig();
}

export function getAIModel(): string {
  return process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
}

function getTemperature(): number {
  const raw = process.env.AI_TEMPERATURE;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : DEFAULT_TEMPERATURE;
}

export function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER?.trim() as AIProviderName) || DEFAULT_PROVIDER;
  const configured = provider === "anthropic" ? hasAnthropicConfig() : hasOpenAIConfig();
  return {
    provider,
    model: getAIModel(),
    temperature: getTemperature(),
    configured,
  };
}
