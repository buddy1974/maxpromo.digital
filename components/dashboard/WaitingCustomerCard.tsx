import type { WaitingRoomItem } from "@/types/waiting-room";

const URGENCY_STYLE = {
  low: "text-zinc-500",
  medium: "text-amber-600",
  high: "text-orange-600",
  urgent: "text-red-600",
} as const;

const CHANNEL_LABEL = {
  whatsapp: "WhatsApp",
  email: "E-Mail",
  phone: "Telefon",
  website_form: "Webformular",
  social: "Social",
} as const;

export function WaitingCustomerCard({ item }: { item: WaitingRoomItem }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-900">{item.customerName}</h3>
          <p className="text-xs text-zinc-500">
            {item.company ?? "—"} · {CHANNEL_LABEL[item.channel]}
          </p>
        </div>
        <span className={`font-mono text-[11px] uppercase tracking-[0.12em] ${URGENCY_STYLE[item.urgency]}`}>
          wartet {item.waitingFor}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600">{item.reason}</p>
      <div className="mt-3 rounded-lg border border-zinc-200 bg-surface-subtle p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
          Vorbereitete nächste Aktion (nicht gesendet)
        </p>
        <p className="mt-1 text-sm text-zinc-700">{item.suggestedAction}</p>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <span>{item.assignedAgent}</span>
        <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">
          {item.approvalStatus === "pending" ? "Approval Required" : item.approvalStatus}
        </span>
      </div>
    </div>
  );
}
