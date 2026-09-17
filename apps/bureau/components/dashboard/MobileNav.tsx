"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Icon } from "@maxpromo/ui";
import LocaleSwitch from "@/components/LocaleSwitch";
import { NAV, isCurrent } from "@/lib/navigation";

/**
 * components/dashboard/MobileNav.tsx
 *
 * The navigation for Agent Bureau below 768px.
 *
 * WHAT WAS THERE BEFORE: NOTHING
 * `Sidebar` is `hidden w-60 … md:flex`. Below the medium breakpoint it was not
 * collapsed, not replaced and not reachable — it was removed, and nothing took
 * its place. An operator opening agents.maxpromo.digital on a phone landed on
 * the dashboard and could not get to approvals, the audit console, documents,
 * the waiting room, governance or settings. The only routes reachable were the
 * ones already linked from the body of whichever page they happened to be on,
 * and sign-out was not among them.
 *
 * Nothing caught it. The responsive audit looks for grids that do not collapse
 * and for fixed widths wider than a phone; a navigation that vanishes is
 * neither. The a11y audit reads markup that renders. `hidden md:flex` is two
 * words and it took the whole product's navigation away on the device most
 * likely to be used for an approval that cannot wait.
 *
 * WHY A DRAWER AND NOT A BOTTOM SHEET
 * Nineteen destinations in three groups. A bottom sheet is for a short focused
 * choice — the brief says so, and says not to make every surface one. This is
 * a long scrollable list with headings, which is a drawer.
 *
 * It shares its list with the sidebar (lib/navigation.ts) rather than keeping
 * a second copy, shares the locale control and the sign-out, and closes on
 * Escape, on backdrop tap, on selecting a destination, and whenever the route
 * changes underneath it.
 */
export function MobileNav() {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("sections");
  const s = useTranslations("shell");
  const c = useTranslations("common");

  /**
   * Open-ness is derived from the route, not synchronised to it.
   *
   * The drawer has to close when a navigation completes — otherwise the
   * browser's own back button leaves it sitting over the page it went back
   * to. Written as an effect that calls `setOpen(false)` on every pathname
   * change, that is a state update triggered by a render, which React now
   * flags: it costs a second render pass on every navigation in the product.
   *
   * So the state is the route the drawer was opened on. If the current route
   * is no longer that one, the drawer is closed — no effect, no second pass,
   * and no way for the two to disagree.
   */
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt !== null && openedAt === pathname;
  const setOpen = (next: boolean) => setOpenedAt(next ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock the page behind the drawer and give back the scroll position.
  // `position: fixed` rather than `overflow: hidden`, which iOS Safari
  // ignores often enough that the page scrolls under the open drawer.
  useEffect(() => {
    if (!open) return;
    const y = window.scrollY;
    const { body } = document;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, y);
    };
  }, [open]);

  useEffect(() => { if (open) panelRef.current?.focus(); }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={s("openMenu")}
        aria-expanded={open}
        className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-surface-subtle hover:text-ink md:hidden"
      >
        <Icon name="menu" size="md" />
      </button>

      {open && (
        <>
          {/* The backdrop keeps the page visible behind the drawer, which is
              what says the drawer is over the page rather than instead of it. */}
          <div
            className="fixed inset-0 z-40 bg-ink/45 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={s("menuLabel")}
            tabIndex={-1}
            className="fixed inset-y-0 left-0 z-50 flex w-[min(19rem,88vw)] flex-col border-r border-hairline bg-surface outline-none md:hidden"
            style={{
              // The drawer is as tall as the viewport actually is, not as tall
              // as the browser claims before its own toolbar appears.
              height: "100dvh",
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-hairline px-4">
              <span className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                <span className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-ink">
                  {c("brandWordmark")}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={s("closeMenu")}
                className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-surface-subtle hover:text-ink"
              >
                <Icon name="close" size="md" />
              </button>
            </div>

            <nav
              className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-3"
              aria-label={s("sidebarLabel")}
            >
              {NAV.map((item) => {
                const active = isCurrent(item.href, pathname);
                return (
                  <div key={item.href}>
                    {item.group && (
                      <p className="px-3 pb-1 pt-4 font-mono text-label-dense uppercase tracking-[0.16em] text-ink-muted">
                        {s(item.group)}
                      </p>
                    )}
                    {/* min-h-11 — a destination in a list of nineteen is a
                        thumb target, not a line of type. */}
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        active
                          ? "border-l-2 border-accent bg-accent-soft text-ink"
                          : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
                      }`}
                    >
                      <span className="flex w-4 justify-center"><Icon name={item.glyph} size="md" /></span>
                      {t(item.key)}
                    </Link>
                  </div>
                );
              })}
            </nav>

            <div className="flex shrink-0 flex-col gap-3 border-t border-hairline p-4">
              <span className="font-mono text-label-dense uppercase tracking-[0.16em] text-ink-muted">
                {s("supervisedMode")}
              </span>
              <LocaleSwitch label={c("languageLabel")} />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink"
              >
                <span className="flex w-4 justify-center"><Icon name="logout" size="md" /></span>
                {c("signOut")}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
