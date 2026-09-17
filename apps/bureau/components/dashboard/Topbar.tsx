import { getTranslations } from "next-intl/server";
import { MobileNav } from "./MobileNav";

/**
 * The page's own heading, the way into the navigation on a phone, and the two
 * operating badges.
 *
 * `title` arrives already translated from the page, because a page knows what
 * it is called; the badges are the shell's own words and are read here.
 *
 * THE MOBILE PASS ADDED THE FIRST THING IN THE ROW
 * Below 768px the sidebar is not rendered, and until now nothing replaced it.
 * The burger lives here rather than floating over the page because this bar is
 * already the fixed chrome at the top of every dashboard route: a second fixed
 * element would be one more thing to keep out of the way of the content, and a
 * navigation control belongs in the navigation bar.
 *
 * "SYSTEM PREVIEW" steps out below 640px. Both badges plus a page title plus
 * the burger do not fit 320px, and of the two badges this is the one the
 * product states again on the surfaces it qualifies. "Supervised mode" was
 * already `sm:inline` for the same reason and stays that way, which means on
 * the narrowest phones the row is: menu, where you are, and nothing competing
 * with either.
 */
export async function Topbar({ title }: { title: string }) {
  const s = await getTranslations("shell");

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-hairline bg-surface px-4 md:px-6">
      <MobileNav />

      <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-ink md:text-lg">
        {title}
      </h1>

      <div className="flex items-center gap-3">
        <span className="hidden whitespace-nowrap rounded-full border border-accent/30 bg-accent-soft px-3 py-1 font-mono text-label uppercase tracking-[0.14em] text-ink-secondary sm:inline">
          {s("systemPreview")}
        </span>
        <span className="hidden whitespace-nowrap font-mono text-label uppercase tracking-[0.14em] text-ink-muted lg:inline">
          {s("supervisedMode")}
        </span>
      </div>
    </header>
  );
}
