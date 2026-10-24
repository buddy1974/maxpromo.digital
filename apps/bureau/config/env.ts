// SERVER-ONLY. Do not import from client components. Reads secret AI config from
// process.env. Never throws at app boot — only AI routes check `configured`.
// Keys are never exposed to the client (no NEXT_PUBLIC_ prefix).
import { modelsFor, resolveRoute, type RouteName } from "@maxpromo/ai";

export type AIProviderName = RouteName;

export interface AIConfig {
  provider: AIProviderName;
  model: string;
  temperature: number;
  /** True only when the active provider's key is present. */
  configured: boolean;
}

// WHY Anthropic default: Agent Bureau runs on Claude. OpenAI and OpenRouter are
// opt-in via AI_PROVIDER. The call itself goes through the platform's one model
// gateway (@maxpromo/ai, ADR-0027); AI_PROVIDER is the Bureau's name for the
// gateway route, kept so existing deployments need no change.
const DEFAULT_PROVIDER: AIProviderName = "anthropic";
const DEFAULT_TEMPERATURE = 0.3;
const PROVIDERS: readonly AIProviderName[] = ["anthropic", "openai", "openrouter"];

function provider(): AIProviderName {
  const named = process.env.AI_PROVIDER?.trim().toLowerCase() as AIProviderName | undefined;
  return named && PROVIDERS.includes(named) ? named : DEFAULT_PROVIDER;
}

/** The environment the gateway sees: the Bureau's AI_PROVIDER names the route. */
export function gatewayEnv(): Record<string, string | undefined> {
  return { ...process.env, AI_GATEWAY: provider() };
}

/**
 * hasAIConfig — true when the active provider has its key set.
 * Route handlers call this instead of provider-specific checks so switching
 * providers via AI_PROVIDER env var requires no code changes.
 */
export function hasAIConfig(): boolean {
  return resolveRoute(gatewayEnv()) !== null;
}

/** An explicit AI_MODEL, or undefined to let the gateway's tier choose. */
export function explicitAIModel(): string | undefined {
  return process.env.AI_MODEL?.trim() || undefined;
}

function getTemperature(): number {
  const raw = process.env.AI_TEMPERATURE;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : DEFAULT_TEMPERATURE;
}

export function getAIConfig(): AIConfig {
  const active = provider();
  return {
    provider: active,
    model: modelsFor(active, "standard", explicitAIModel(), gatewayEnv())[0],
    temperature: getTemperature(),
    configured: hasAIConfig(),
  };
}
