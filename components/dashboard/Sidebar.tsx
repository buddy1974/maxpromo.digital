"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

// Client component: needs the active path to highlight the current section.
// Grouped: the backbone/operational-control items lead, then the supporting
// workspace, then config. Order mirrors the operating model where it makes sense.
type NavItem = { href: string; label: string; glyph: string; group?: string };
const NAV: NavItem[] = [
  { href: "/dashboard", label: "Übersicht", glyph: "◆", group: "Steuerung" },
  { href: "/dashboard/operating-model", label: "Operating Model", glyph: "❖" },
  { href: "/dashboard/audit", label: "Audit Console", glyph: "◉" },
  { href: "/dashboard/waiting-room", label: "Warteraum", glyph: "◷" },
  { href: "/dashboard/documents", label: "Dokumente", glyph: "▢" },
  { href: "/dashboard/approvals", label: "Approval Desk", glyph: "✓" },
  { href: "/dashboard/ai-governance", label: "AI Governance", glyph: "⚐" },
  { href: "/dashboard/playbooks", label: "Playbooks", glyph: "❑" },
  { href: "/dashboard/client-implementation", label: "Client Implementation", glyph: "⌂" },

  { href: "/dashboard/briefing", label: "Briefing", glyph: "▤", group: "Arbeitsbereich" },
  { href: "/dashboard/tasks", label: "Aufgaben", glyph: "▦" },
  { href: "/dashboard/projects", label: "Projekte", glyph: "◰" },
  { href: "/dashboard/leads", label: "Leads", glyph: "⊟" },
  { href: "/dashboard/contacts", label: "Kontakte", glyph: "→" },
  { href: "/dashboard/research", label: "Research", glyph: "▥" },
  { href: "/dashboard/agents", label: "Agenten", glyph: "◇" },
  { href: "/dashboard/memory", label: "Memory", glyph: "◎" },
  { href: "/dashboard/ai-lab", label: "AI Lab", glyph: "✦" },

  { href: "/dashboard/settings", label: "Einstellungen", glyph: "⚙", group: "System" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-zinc-200 px-5">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        <span className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-zinc-900">
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
                <p className="px-3 pb-1 pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                  {item.group}
                </p>
              )}
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <span className="w-4 text-center font-mono">{item.glyph}</span>
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-4 flex flex-col gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
          Supervised Mode
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 w-full"
        >
          <span className="w-4 text-center font-mono">⏻</span>
          Abmelden
        </button>
      </div>
    </aside>
  );
}
