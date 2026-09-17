import { TONE_TEXT, type Tone } from "@maxpromo/ui";
import { getTranslations } from "next-intl/server";
import type { WaitingRoomItem } from "@/types/waiting-room";

const URGENCY_TONE_MAP = {
  low: "neutral",
  medium: "caution",
  high: "critical",
  urgent: "critical",
} as const satisfies Record<string, Tone>;

/**
 * The channel a customer arrived through, as a message key rather than a word.
 *
 * This map held five labels — "E-Mail", "Telefon", "Webformular" — and read as
 * configuration, which is why it survived a translation pass that went through
 * every page of the product. "WhatsApp" and "Social" are the same in both
 * languages and are named in the catalogue anyway: a word that happens to
 * match is still a word somebody has to be able to change.
 */
const CHANNEL_KEY = {
  whatsapp: "channelWhatsapp",
  email: "channelEmail",
  phone: "channelPhone",
  website_form: "channelWebsiteForm",
  social: "channelSocial",
} as const;

export async function WaitingCustomerCard({ item }: { item: WaitingRoomItem }) {
  const t = await getTranslations("waitingRoom");
  const s = await getTranslations("status");

  return (
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink">{item.customerName}</h3>
          <p className="text-xs text-ink-muted">
            {item.company ?? "—"} · {t(CHANNEL_KEY[item.channel])}
          </p>
        </div>
        {/* Wraps under the name rather than squeezing beside it: at 320px the
            German "wartet 3 Stunden" and the customer's own name were sharing
            a row and both were breaking mid-word. */}
        <span className={`shrink-0 font-mono text-label uppercase tracking-[0.12em] ${TONE_TEXT[URGENCY_TONE_MAP[item.urgency]]}`}>
          {t("waitingPrefix", { duration: item.waitingFor })}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-secondary">{item.reason}</p>
      <div className="mt-3 rounded-lg border border-hairline bg-surface-subtle p-3">
        <p className="font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">
          {t("preparedAction")}
        </p>
        <p className="mt-1 text-sm text-ink-secondary">{item.suggestedAction}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <span>{item.assignedAgent}</span>
        {/* Was `item.approvalStatus === "pending" ? "Approval Required" : item.approvalStatus`
            — one English literal, and for every other value the raw enum
            printed straight onto the card. Both states are named now. */}
        <span className="rounded-full border border-hairline bg-surface-sunken px-2.5 py-0.5 font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">
          {item.approvalStatus === "pending" ? t("approvalRequired") : s(item.approvalStatus)}
        </span>
      </div>
    </div>
  );
}
