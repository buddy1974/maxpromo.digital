import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { WaitingRoomQueue } from "@/components/dashboard/WaitingRoomQueue";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getWaitingRoom } from "@/lib/db/queries/waiting-room";
import { getCurrentUser } from "@/lib/auth/session";
import type { WaitingRoomItem } from "@/types/waiting-room";

// Module 2 — Customer Waiting Room. DB-backed. Prepared responses only; nothing sent.
export const dynamic = "force-dynamic";

export default async function WaitingRoomPage() {
  // Auth-5: source businessId from session — no global demo lookup.
  const user = await getCurrentUser();
  if (!user?.businessId) redirect("/login");

  const rows = await getWaitingRoom(user.businessId);

  // Map DB rows -> WaitingRoomItem (table has no approvalStatus/businessImpact cols).
  const items: WaitingRoomItem[] = rows.map((w) => ({
    id: w.id,
    customerName: w.customerName,
    company: w.company ?? undefined,
    channel: w.channel as WaitingRoomItem["channel"],
    reason: w.reason ?? "",
    waitingFor: w.waitingFor ?? "",
    urgency: w.urgency as WaitingRoomItem["urgency"],
    status: w.status as WaitingRoomItem["status"],
    suggestedAction: w.suggestedAction ?? "",
    assignedAgent: w.assignedAgent ?? "",
    approvalStatus: "pending",
    businessImpact: "",
  }));

  return (
    <DashboardShell title="Kunden-Warteraum">
      <div className="space-y-6">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-secondary">
            Wer wartet auf eine Antwort?
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            Antworten werden vorbereitet — gesendet wird erst nach Ihrer Freigabe.
            Keine ausgehende Nachricht wurde ausgeführt.
          </p>
        </div>

        {items.length ? (
          <WaitingRoomQueue items={items} />
        ) : (
          <EmptyState
            title="Niemand im Warteraum"
            hint="Führen Sie den Demo-Seed aus: npm run db:seed:demo"
            glyph="◷"
          />
        )}
      </div>
    </DashboardShell>
  );
}
