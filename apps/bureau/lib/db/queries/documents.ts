import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { documentIntakeItems, documentRequiredActions } from "@/lib/db/schema";
import { safeRead } from "./_shared";

export type DocumentWithActions = typeof documentIntakeItems.$inferSelect & {
  requiredActions: (typeof documentRequiredActions.$inferSelect)[];
};

// Read-only. Documents + required actions for the caller's business (Auth-5: session-scoped).
export async function getDocuments(businessId: string): Promise<DocumentWithActions[]> {
  return safeRead(async () => {
    const db = getDb();
    const docs = await db
      .select()
      .from(documentIntakeItems)
      .where(eq(documentIntakeItems.businessId, businessId));
    if (!docs.length) return [];
    const actions = await db
      .select()
      .from(documentRequiredActions)
      .where(
        inArray(
          documentRequiredActions.documentId,
          docs.map((d) => d.id),
        ),
      );
    return docs.map((d) => ({
      ...d,
      requiredActions: actions.filter((a) => a.documentId === d.id),
    }));
  }, [] as DocumentWithActions[]);
}
