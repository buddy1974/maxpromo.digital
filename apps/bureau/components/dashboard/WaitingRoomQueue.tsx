import type { WaitingRoomItem } from "@/types/waiting-room";
import { WaitingCustomerCard } from "./WaitingCustomerCard";
import { EmptyState } from "./EmptyState";

// Orders the queue by urgency so the most at-risk customers surface first.
const URGENCY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 } as const;

export function WaitingRoomQueue({ items }: { items: WaitingRoomItem[] }) {
  if (!items.length) {
    return <EmptyState title="Niemand wartet" hint="Wartende Kunden erscheinen hier." glyph="○" />;
  }
  const ordered = [...items].sort(
    (a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency],
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {ordered.map((item) => (
        <WaitingCustomerCard key={item.id} item={item} />
      ))}
    </div>
  );
}
