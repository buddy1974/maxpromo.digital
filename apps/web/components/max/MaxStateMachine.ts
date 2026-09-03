export type MaxMode = 'idle' | 'open' | 'composing' | 'awaiting' | 'handover'

type Transitions = Partial<Record<MaxMode, Partial<Record<string, MaxMode>>>>

const TRANSITIONS: Transitions = {
  idle:      { OPEN: 'open' },
  open:      { CLOSE: 'idle', START_COMPOSE: 'composing' },
  composing: { SEND: 'awaiting', CANCEL: 'open', CLOSE: 'idle' },
  awaiting:  { REPLY: 'open', CLOSE: 'idle', HANDOVER: 'handover' },
  handover:  { CLOSE: 'idle' },  // TODO(phase3b): Telegram takeover transition stub
}

export function transition(current: MaxMode, event: string): MaxMode {
  return TRANSITIONS[current]?.[event] ?? current
}
