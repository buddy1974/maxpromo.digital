import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { playbooks, playbookSteps } from "@/lib/db/schema";
import { safeRead } from "./_shared";

export type PlaybookWithSteps = typeof playbooks.$inferSelect & {
  steps: (typeof playbookSteps.$inferSelect)[];
};

// Read-only. Playbooks + steps for the caller's business (Auth-5: session-scoped).
export async function getPlaybooks(businessId: string): Promise<PlaybookWithSteps[]> {
  return safeRead(async () => {
    const db = getDb();
    const books = await db
      .select()
      .from(playbooks)
      .where(eq(playbooks.businessId, businessId));
    if (!books.length) return [];
    const steps = await db
      .select()
      .from(playbookSteps)
      .where(
        inArray(
          playbookSteps.playbookId,
          books.map((b) => b.id),
        ),
      );
    return books.map((b) => ({
      ...b,
      steps: steps
        .filter((s) => s.playbookId === b.id)
        .sort((a, c) => a.stepOrder - c.stepOrder),
    }));
  }, [] as PlaybookWithSteps[]);
}
