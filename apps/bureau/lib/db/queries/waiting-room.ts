import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { waitingRoomItems } from "@/lib/db/schema";
import { safeRead } from "./_shared";

// Read-only. Waiting-room items for the caller's business (Auth-5: session-scoped).
export async function getWaitingRoom(businessId: string) {
  return safeRead(async () => {
    const db = getDb();
    return db
      .select()
      .from(waitingRoomItems)
      .where(eq(waitingRoomItems.businessId, businessId));
  }, [] as (typeof waitingRoomItems.$inferSelect)[]);
}
