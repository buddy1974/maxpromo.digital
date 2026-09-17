import type { ChatMessage } from '@/lib/chat/types'

interface MaxMessageProps {
  message: ChatMessage
  /** Announced before the text, so a screen reader knows who is speaking. */
  speakerLabel: string
}

/**
 * One turn of the conversation.
 *
 * WHAT WAS WRONG WITH IT
 * The docstring said "User = right/orange-text", naming a colour retired three
 * brand generations ago, and the component painted the user's bubble
 * `--brand-primary-dark` — Lime 600 — as a fill. Lime 600 is a text colour in
 * this system, not a surface; used as a fill under `--brand-on-primary` black
 * it is the darkest, loudest object on the page, and every second bubble was
 * it. The reader's own words shouted at them.
 *
 * It is now `--brand-surface-accent`, the one lime-tinted surface the token
 * package sanctions, with ordinary body text on it. That is the same treatment
 * the middle problem card on the homepage uses: tinted, not filled, so the two
 * speakers differ by side and by shade rather than by volume.
 *
 * SIZE
 * 14px hardcoded became `--text-small` (15px). The composer is 16px because a
 * smaller input makes iOS zoom the page on focus; a message is not an input,
 * and 15px is the platform's own size for dense reading.
 *
 * MOTION
 * Arrival is opacity plus a 6px settle over 220ms — inside the 180–280ms the
 * brief asks for, and deliberately the plainest possible version of it. No
 * scale, no bounce, no glow. `prefers-reduced-motion` removes it in the
 * stylesheet, so it is true before hydration rather than after.
 *
 * Presentational only — it takes a message and draws it, and knows nothing
 * about how the conversation is produced.
 */
export function MaxMessage({ message, speakerLabel }: MaxMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={isUser ? 'max-msg max-msg-user' : 'max-msg'}>
      <span className="sr-only">{speakerLabel}: </span>
      <div className="max-msg-bubble">{message.content}</div>
    </div>
  )
}
