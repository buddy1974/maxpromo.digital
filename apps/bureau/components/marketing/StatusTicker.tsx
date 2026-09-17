import { Icon } from "@maxpromo/ui";
import { getTranslations } from "next-intl/server";

/**
 * The supervised-operating-layer motif from maxpromo.digital: a feed of agent
 * events. Honestly labelled as a PRODUCT PREVIEW — these are illustrative
 * events, not live data, and the label says so in both languages.
 *
 * The actor used to be a Unicode mark glued to the front of each string, so
 * the feed's only classification lived inside its copy. The classification is
 * now a list here and the text is a translation, which is why the icons did
 * not have to be translated with them.
 */
const ACTORS = ["user", "agent", "agent", "system", "user", "agent", "agent", "system", "user"] as const;
const ACTOR_ICON = { user: "user", agent: "agents", system: "system" } as const;

export async function StatusTicker() {
  const t = await getTranslations("ticker");
  const events = t.raw("events") as string[];
  const loop = [...events, ...events];

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2">
        <span className="font-mono text-label uppercase tracking-[0.18em] text-ink-muted">
          {t("statusLabel")}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-label uppercase tracking-[0.18em] text-ink-secondary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          {t("preview")}
        </span>
      </div>
      <div className="relative whitespace-nowrap py-2.5">
        <div className="animate-ticker inline-flex gap-8 px-4 font-mono text-xs text-ink-secondary">
          {loop.map((text, i) => (
            <span key={i} className="flex shrink-0 items-center gap-2">
              <Icon name={ACTOR_ICON[ACTORS[i % ACTORS.length]]} size="xs" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
