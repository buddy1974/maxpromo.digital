import { Icon } from "@maxpromo/ui";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/lib/i18n/locale";
import { TIME_ZONE } from "@/lib/i18n/format";


/**
 * What happened, most recent first.
 *
 * The line an agent wrote is the system's own voice, so it is translated. The
 * target is a record — a customer, a project — and is printed as it stands.
 *
 * The time was rendered by slicing the ISO string and appending "UTC", which
 * showed an operator in Essen a time two hours off their own clock and called
 * it stable. It is formatted in the business's time zone instead, which is the
 * same for both locales and therefore just as stable between server and
 * client.
 */
const ACTOR_ICON = { user: "user", agent: "agents", system: "system" } as const;
const ACTOR_COLOR = {
  user: "text-ink-secondary",
  agent: "text-ink-muted",
  system: "text-ink-muted",
} as const;

/**
 * Two kinds of item reach this feed, and they are treated differently on
 * purpose:
 *
 *   a row from the database — what actually happened in this workspace. Its
 *     `action` and `detail` were written by the running system into the
 *     customer's own record, and are printed exactly as they stand, the way
 *     any record is.
 *   a demo record — product content standing in for one. It carries an id
 *     instead of text, and its words come from the catalogue.
 */
export type FeedItem = {
  id: string
  timestamp: string
  actor: "user" | "agent" | "system"
  actorName: string
  target?: string
  /** Present on a real row; absent on a demo record. */
  action?: string
  detail?: string
  hasDetail?: boolean
}

export async function ActivityFeed({ items }: { items: FeedItem[] }) {
  const d = await getTranslations("demo.activity");
  const locale = await resolveLocale();
  const time = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });

  return (
    <ul className="divide-y divide-hairline">
      {items.map((a) => (
        <li key={a.id} className="flex gap-3 py-3">
          <span className={`mt-0.5 font-mono text-sm ${ACTOR_COLOR[a.actor]}`}>
            <Icon name={ACTOR_ICON[a.actor]} size="sm" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink">
              <span className="font-medium">{a.actorName}</span> — {a.action ?? d(a.id + "Action")}
              {a.target ? <span className="text-ink-muted"> · {a.target}</span> : null}
            </p>
            {(a.detail || a.hasDetail) && (
              <p className="text-xs text-ink-muted">{a.detail ?? d(a.id + "Detail")}</p>
            )}
          </div>
          <span className="shrink-0 font-mono text-label text-ink-muted">
            {time.format(new Date(a.timestamp))}
          </span>
        </li>
      ))}
    </ul>
  );
}
