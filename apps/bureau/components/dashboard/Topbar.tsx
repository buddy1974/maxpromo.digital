import { getTranslations } from "next-intl/server";

/**
 * The page's own heading and the two operating badges.
 *
 * `title` arrives already translated from the page, because a page knows what
 * it is called; the badges are the shell's own words and are read here.
 */
export async function Topbar({ title }: { title: string }) {
  const s = await getTranslations("shell");

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-hairline bg-surface px-6">
      <h1 className="truncate text-lg font-semibold tracking-tight text-ink">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <span className="whitespace-nowrap rounded-full border border-accent/30 bg-accent-soft px-3 py-1 font-mono text-label uppercase tracking-[0.14em] text-ink-secondary">
          {s("systemPreview")}
        </span>
        <span className="hidden whitespace-nowrap font-mono text-label uppercase tracking-[0.14em] text-ink-muted sm:inline">
          {s("supervisedMode")}
        </span>
      </div>
    </header>
  );
}
