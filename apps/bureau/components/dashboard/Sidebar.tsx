"use client";

import { Icon, type IconName } from "@maxpromo/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import LocaleSwitch from "@/components/LocaleSwitch";

/**
 * Client component: needs the active path to highlight the current section.
 *
 * The labels used to be written here, and in the language each was first
 * written in — "Übersicht" beside "Operating Model" beside "Warteraum" beside
 * "Approval Desk". That single list was the clearest evidence that this
 * product had never been translated so much as accumulated. Every label is now
 * a key in `sections`, and the same key names the page's own heading, so a
 * section cannot be called one thing in the sidebar and another at the top of
 * the page it opens.
 *
 * Grouped: the backbone and operational-control items lead, then the
 * supporting workspace, then configuration.
 */
type NavItem = { href: string; key: string; glyph: IconName; group?: string };

const NAV: NavItem[] = [
  { href: "/dashboard", key: "overview", glyph: "dashboard", group: "groupControl" },
  { href: "/dashboard/operating-model", key: "operatingModel", glyph: "operatingModel" },
  { href: "/dashboard/audit", key: "audit", glyph: "audit" },
  { href: "/dashboard/waiting-room", key: "waitingRoom", glyph: "waiting" },
  { href: "/dashboard/documents", key: "documents", glyph: "documents" },
  { href: "/dashboard/approvals", key: "approvals", glyph: "approvals" },
  { href: "/dashboard/ai-governance", key: "aiGovernance", glyph: "governance" },
  { href: "/dashboard/playbooks", key: "playbooks", glyph: "playbooks" },
  { href: "/dashboard/client-implementation", key: "clientImplementation", glyph: "implementation" },

  { href: "/dashboard/briefing", key: "briefing", glyph: "briefing", group: "groupWorkspace" },
  { href: "/dashboard/tasks", key: "tasks", glyph: "tasks" },
  { href: "/dashboard/projects", key: "projects", glyph: "projects" },
  { href: "/dashboard/leads", key: "leads", glyph: "leads" },
  { href: "/dashboard/contacts", key: "contacts", glyph: "clients" },
  { href: "/dashboard/research", key: "research", glyph: "research" },
  { href: "/dashboard/agents", key: "agents", glyph: "agents" },
  { href: "/dashboard/memory", key: "memory", glyph: "memory" },
  { href: "/dashboard/ai-lab", key: "aiLab", glyph: "lab" },

  { href: "/dashboard/settings", key: "settings", glyph: "settings", group: "groupSystem" },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("sections");
  const s = useTranslations("shell");
  const c = useTranslations("common");

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-surface md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-hairline px-5">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        <span className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-ink">
          {c("brandWordmark")}
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label={s("sidebarLabel")}>
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <div key={item.href}>
              {item.group && (
                <p className="px-3 pb-1 pt-4 font-mono text-label-dense uppercase tracking-[0.16em] text-ink-muted">
                  {s(item.group)}
                </p>
              )}
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-accent-soft text-ink border-l-2 border-accent"
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
      <div className="border-t border-hairline p-4 flex flex-col gap-3">
        <span className="font-mono text-label-dense uppercase tracking-[0.16em] text-ink-muted">
          {s("supervisedMode")}
        </span>
        {/* The language control is here as well as on the public pages: a
            person should never have to sign out to read the product in their
            own language. */}
        <LocaleSwitch label={c("languageLabel")} />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink w-full"
        >
          <span className="flex w-4 justify-center"><Icon name="logout" size="md" /></span>
          {c("signOut")}
        </button>
      </div>
    </aside>
  );
}
