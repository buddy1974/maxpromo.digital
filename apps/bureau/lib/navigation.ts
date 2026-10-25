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
 * Four sections, all real (ADR-0030): the runtime overview, the delegated work,
 * the agents that run, and the approvals the agents requested (owned by the OS).
 * The sample sections (operating model, audit console, waiting room, documents,
 * AI governance, playbooks, client implementation, memory, AI lab, settings) were
 * removed with their mock data. Leads, contacts, projects, tasks and the business
 * briefing belong to Maxpromo OS (ADR-0021) and their old routes link there.
 */
export type NavItem = {
  href: string;
  key: string;
  glyph: IconName;
  group?: string;
};

export const NAV: readonly NavItem[] = [
  { href: "/dashboard", key: "overview", glyph: "dashboard", group: "groupControl" },
  { href: "/dashboard/work", key: "work", glyph: "research" },
  { href: "/dashboard/agents", key: "agents", glyph: "agents" },
  { href: "/dashboard/approvals", key: "approvals", glyph: "approvals" },
];

/**
 * Whether a navigation entry is the section currently open.
 *
 * `/dashboard` is an exact match and everything else is a prefix, because
 * `startsWith("/dashboard")` is true of every route in the product and would
 * mark the overview as current on every page. Both navigations ask
 * this question, so both ask it here.
 */
export function isCurrent(href: string, pathname: string): boolean {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}
