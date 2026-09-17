import type { IconName } from "@maxpromo/ui";

/**
 * lib/navigation.ts — the sections of the product, in order, declared once.
 *
 * This list used to live inside `Sidebar.tsx`, which was fine for exactly as
 * long as there was one navigation. The mobile pass added a second — the
 * sidebar is `hidden md:flex`, so below 768px the product had no navigation at
 * all — and a drawer with its own copy of nineteen entries is the platform's
 * most expensive recurring mistake written one more time. The two differ in
 * how they present the list and in nothing else, so the list is here and
 * neither of them owns it.
 *
 * `key` names both the sidebar entry and the page's own heading, through the
 * `sections` namespace, so a section cannot be called one thing in the
 * navigation and another at the top of the page it opens.
 *
 * Grouped: the backbone and operational-control items lead, then the
 * supporting workspace, then configuration.
 */
export type NavItem = {
  href: string;
  key: string;
  glyph: IconName;
  group?: string;
};

export const NAV: readonly NavItem[] = [
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

/**
 * Whether a navigation entry is the section currently open.
 *
 * `/dashboard` is an exact match and everything else is a prefix, because
 * `startsWith("/dashboard")` is true of every route in the product and would
 * mark the overview as current on all nineteen pages. Both navigations ask
 * this question, so both ask it here.
 */
export function isCurrent(href: string, pathname: string): boolean {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}
