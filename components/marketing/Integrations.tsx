// "Connects to what you already use." Monochrome inline-SVG icons (currentColor,
// so they inherit the pill colour and turn orange on hover). No new dependency,
// no brand-colour noise, no image assets.

type IconKey =
  | "mail"
  | "calendar"
  | "chat"
  | "send"
  | "hash"
  | "workflow"
  | "hub"
  | "card"
  | "doc"
  | "grid"
  | "form";

const TOOLS: { name: string; icon: IconKey }[] = [
  { name: "Gmail", icon: "mail" },
  { name: "Google Kalender", icon: "calendar" },
  { name: "Outlook", icon: "mail" },
  { name: "WhatsApp", icon: "chat" },
  { name: "Telegram", icon: "send" },
  { name: "Slack", icon: "hash" },
  { name: "n8n", icon: "workflow" },
  { name: "HubSpot", icon: "hub" },
  { name: "Stripe", icon: "card" },
  { name: "Notion", icon: "doc" },
  { name: "Google Sheets", icon: "grid" },
  { name: "Webformulare", icon: "form" },
];

function Icon({ name }: { name: IconKey }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "mail":
      return (
        <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
      );
    case "calendar":
      return (
        <svg {...common}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
      );
    case "chat":
      return (
        <svg {...common}><path d="M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 21l2-5.8A8.4 8.4 0 1 1 21 11.5z" /></svg>
      );
    case "send":
      return (
        <svg {...common}><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></svg>
      );
    case "hash":
      return (
        <svg {...common}><path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16" /></svg>
      );
    case "workflow":
      return (
        <svg {...common}><circle cx="5" cy="12" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 12h5m0 0 5-5m-5 5 5 5" /></svg>
      );
    case "hub":
      return (
        <svg {...common}><circle cx="12" cy="12" r="2.5" /><circle cx="12" cy="4" r="1.5" /><circle cx="19" cy="16" r="1.5" /><circle cx="5" cy="16" r="1.5" /><path d="M12 6.5v3M13.8 13.4 17.3 15M10.2 13.4 6.7 15" /></svg>
      );
    case "card":
      return (
        <svg {...common}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></svg>
      );
    case "doc":
      return (
        <svg {...common}><path d="M6 2h8l6 6v14H6z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></svg>
      );
    case "grid":
      return (
        <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>
      );
    case "form":
      return (
        <svg {...common}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h4" /></svg>
      );
  }
}

export function Integrations() {
  const loop = [...TOOLS, ...TOOLS];
  return (
    <section className="border-b border-zinc-200">
      <div className="mx-auto max-w-content px-6 py-20 md:py-28">
        <p className="eyebrow">{"// Verbindet, was Sie schon nutzen"}</p>
        <h2 className="mt-4 max-w-2xl text-section-title text-zinc-900">
          Kein Herausreißen. Wir verbinden Ihre vorhandenen Werkzeuge.
        </h2>
      </div>
      <div className="relative overflow-hidden border-y border-zinc-200 bg-surface-subtle py-5">
        <div className="animate-ticker flex w-max gap-3 px-3">
          {loop.map((t, i) => (
            <span
              key={i}
              className="flex shrink-0 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-600 transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Icon name={t.icon} />
              <span className="font-mono">{t.name}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
