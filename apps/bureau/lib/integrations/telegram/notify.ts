import type { LeadInput } from "@/lib/validation/lead";

// Feature-flagged: if token/chat id are absent the notifier is a no-op.
// This lets the page ship and capture leads BEFORE the Telegram bot exists.
export function isTelegramEnabled(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Send a lead notification to Telegram. NEVER throws — notification failure
 * must not lose a lead that is already persisted. Returns whether it sent.
 */
export async function notifyTelegram(
  lead: LeadInput,
  leadId: string,
): Promise<boolean> {
  if (!isTelegramEnabled()) return false;

  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_CHAT_ID!;

  const a = lead.attribution;
  const source =
    a?.utmSource || a?.refCode
      ? `\nQuelle: ${escapeHtml(a?.utmSource ?? "")} ${a?.utmCampaign ? "/ " + escapeHtml(a.utmCampaign) : ""} ${a?.refCode ? "(ref:" + escapeHtml(a.refCode) + ")" : ""}`.trim()
      : "";

  const text =
    `<b>🟠 Neue Anfrage — Max Agent</b>\n` +
    `Typ: ${escapeHtml(lead.ctaType)}\n` +
    `Name: ${escapeHtml(lead.name)}\n` +
    `E-Mail: ${escapeHtml(lead.email)}\n` +
    (lead.phone ? `Telefon: ${escapeHtml(lead.phone)}\n` : "") +
    (lead.company ? `Firma: ${escapeHtml(lead.company)}\n` : "") +
    (lead.message ? `Nachricht: ${escapeHtml(lead.message)}\n` : "") +
    source +
    `\nID: ${leadId}`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );
    return res.ok;
  } catch (err) {
    // Log, but swallow — the lead is already saved.
    console.error("[telegram] notify failed:", err);
    return false;
  }
}
