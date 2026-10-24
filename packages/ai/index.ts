export {
  complete, completeJson, resolveRoute, modelsFor, buildBody, TIER_MODELS,
  type Tier, type RouteName, type Route, type Part, type Message, type ImageMediaType,
  type CompletionRequest, type JsonRequest, type TextResult, type JsonResult, type Failure, type GatewayDeps,
} from './gateway.ts'
export { classifyProviderError, logAiFailure, type AiFailure, type AiFailureClass } from './failure.ts'
