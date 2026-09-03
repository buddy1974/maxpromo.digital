export type ChatRole        = 'user' | 'assistant' | 'system' | 'human_agent'
export type ChatChannel     = 'web' | 'telegram'
export type HandoverState   = 'bot' | 'pending' | 'human'

export interface ChatSession {
  id:             string
  origin:         string
  originId:       string
  host:           string
  productSlug:    string | null
  locale:         string
  handoverState:  HandoverState
  firstSeenAt:    Date
  lastSeenAt:     Date
  visitorLabel:   string | null
  emotionalState: string | null
  metadata:       Record<string, unknown>
}

export interface ChatMessage {
  id:        number
  sessionId: string
  role:      ChatRole
  content:   string
  channel:   ChatChannel
  createdAt: Date
  metadata:  Record<string, unknown>
}
