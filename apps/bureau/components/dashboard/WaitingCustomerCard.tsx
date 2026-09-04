import { TONE_TEXT, type Tone } from "@maxpromo/ui";
import type { WaitingRoomItem } from "@/types/waiting-room";

const URGENCY_TONE_MAP = {
  low: "neutral",
  medium: "caution",
  high: "critical",
  urgent: "critical",
} as const satisfies Record<string, Tone>;

const CHANNEL_LABEL = {
  whatsapp: "WhatsApp",
  email: "E-Mail",
  phone: "Telefon",
  website_form: "Webformular",
  social: "Social",
} as const;

export function WaitingCustomerCard({ item }: { item: WaitingRoomItem }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">{item.customerName}</h3>
          <p className="text-xs text-ink-muted">
            {item.company ?? "—"} · {CHANNEL_LABEL[item.channel]}
          </p>
        </div>
        <span className={`font-mono text-label uppercase tracking-[0.12em] ${TONE_TEXT[URGENCY_TONE_MAP[item.urgency]]}`}>
          wartet {item.waitingFor}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-secondary">{item.reason}</p>
      <div className="mt-3 rounded-lg border border-hairline bg-surface-subtle p-3">
        <p className="font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">
          Vorbereitete nächste Aktion (nicht gesendet)
        </p>
        <p className="mt-1 text-sm text-ink-secondary">{item.suggestedAction}</p>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
        <span>{item.assignedAgent}</span>
        <span className="rounded-full border border-hairline bg-surface-sunken px-2.5 py-0.5 font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">
          {item.approvalStatus === "pending" ? "Approval Required" : item.approvalStatus}
        </span>
      </div>
    </div>
  );
}
