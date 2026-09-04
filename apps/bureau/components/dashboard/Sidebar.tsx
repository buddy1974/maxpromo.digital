"use client";

import { Icon, type IconName } from "@maxpromo/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

// Client component: needs the active path to highlight the current section.
// Grouped: the backbone/operational-control items lead, then the supporting
// workspace, then config. Order mirrors the operating model where it makes sense.
type NavItem = { href: string; label: string; glyph: IconName; group?: string };
const NAV: NavItem[] = [
  { href: "/dashboard", label: "Übersicht", glyph: "dashboard", group: "Steuerung" },
  { href: "/dashboard/operating-model", label: "Operating Model", glyph: "operatingModel" },
  { href: "/dashboard/audit", label: "Audit Console", glyph: "audit" },
  { href: "/dashboard/waiting-room", label: "Warteraum", glyph: "waiting" },
  { href: "/dashboard/documents", label: "Dokumente", glyph: "documents" },
  { href: "/dashboard/approvals", label: "Approval Desk", glyph: "approvals" },
  { href: "/dashboard/ai-governance", label: "AI Governance", glyph: "governance" },
  { href: "/dashboard/playbooks", label: "Playbooks", glyph: "playbooks" },
  { href: "/dashboard/client-implementation", label: "Client Implementation", glyph: "implementation" },

  { href: "/dashboard/briefing", label: "Briefing", glyph: "briefing", group: "Arbeitsbereich" },
  { href: "/dashboard/tasks", label: "Aufgaben", glyph: "tasks" },
  { href: "/dashboard/projects", label: "Projekte", glyph: "projects" },
  { href: "/dashboard/leads", label: "Leads", glyph: "leads" },
  { href: "/dashboard/contacts", label: "Kontakte", glyph: "clients" },
  { href: "/dashboard/research", label: "Research", glyph: "research" },
  { href: "/dashboard/agents", label: "Agenten", glyph: "agents" },
  { href: "/dashboard/memory", label: "Memory", glyph: "memory" },
  { href: "/dashboard/ai-lab", label: "AI Lab", glyph: "lab" },

  { href: "/dashboard/settings", label: "Einstellungen", glyph: "settings", group: "System" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-surface md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-hairline px-5">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        <span className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-ink">
          Max Agent
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <div key={item.href}>
              {item.group && (
                <p className="px-3 pb-1 pt-4 font-mono text-label-dense uppercase tracking-[0.16em] text-ink-muted">
                  {item.group}
                </p>
              )}
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-accent-soft text-ink border-l-2 border-accent"
                    : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
                }`}
              >
                <span className="flex w-4 justify-center"><Icon name={item.glyph} size="md" /></span>
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-hairline p-4 flex flex-col gap-3">
        <span className="font-mono text-label-dense uppercase tracking-[0.16em] text-ink-muted">
          Supervised Mode
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink w-full"
        >
          <span className="flex w-4 justify-center"><Icon name="logout" size="md" /></span>
          Abmelden
        </button>
      </div>
    </aside>
  );
}
