import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { attribution, leadSubmissions } from "@/lib/db/schema";
import { leadSchema } from "@/lib/validation/lead";
import { flushIntakeOutbox, forwardSubmission } from "@/lib/agents/intake";
import { checkRateLimit, getClientIp, LEADS_LIMIT } from "@/lib/security/rate-limit";

// Neon HTTP driver runs on the Node runtime.
export const runtime = "nodejs";

/**
 * Public lead capture. Flow: rate-limit -> validate -> outbox -> Intake agent
 * hands it to Maxpromo OS (ADR-0021) -> typed result.
 *
 * The lead belongs to Maxpromo OS. The Bureau keeps the submission only until
 * the OS confirms it, so an OS outage never loses an enquiry: the row waits in
 * the outbox and is retried. No fake success: if even the outbox write fails,
 * the client is told. Marcel is notified by the OS, once, when it records it.
 */
export async function POST(req: Request) {
  // Auth-4: rate-limit by IP before any processing. 5 req / 60s.
  // WHY before JSON parse: rejects bots cheaply without body allocation.
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`leads:${ip}`, LEADS_LIMIT);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // 1. Parse + validate (same schema the form uses).
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const lead = parsed.data;

  // 2. Honeypot — silently accept bots without persisting (don't tip them off).
  if (lead.website && lead.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  // 3. Persistence is required. If the DB isn't configured we say so honestly.
  if (!isDbConfigured()) {
    return NextResponse.json(
      { ok: false, error: "not_configured" },
      { status: 503 },
    );
  }

  try {
    const db = getDb();
    const [row] = await db
      .insert(leadSubmissions)
      .values({
        name: lead.name,
        email: lead.email,
        phone: lead.phone || null,
        company: lead.company || null,
        message: lead.message || null,
        ctaType: lead.ctaType,
      })
      .returning({ id: leadSubmissions.id });

    // Attribution is best-effort and must not block the lead.
    if (lead.attribution && row?.id) {
      try {
        await db.insert(attribution).values({
          leadId: row.id,
          utmSource: lead.attribution.utmSource ?? null,
          utmMedium: lead.attribution.utmMedium ?? null,
          utmCampaign: lead.attribution.utmCampaign ?? null,
          utmContent: lead.attribution.utmContent ?? null,
          utmTerm: lead.attribution.utmTerm ?? null,
          refCode: lead.attribution.refCode ?? null,
          landingPath: lead.attribution.landingPath ?? null,
          referrer: lead.attribution.referrer ?? null,
        });
      } catch (err) {
        console.error("[leads] attribution insert failed:", err);
      }
    }

    // Hand it to the OS now; whatever is still waiting from earlier goes too.
    if (row?.id) {
      const [stored] = await db.select().from(leadSubmissions).where(eq(leadSubmissions.id, row.id)).limit(1);
      if (stored) {
        const result = await forwardSubmission(stored);
        if (!result.forwarded) console.warn("[leads] kept in outbox for retry:", result.reason);
      }
      await flushIntakeOutbox(3).catch((err) => console.error("[leads] outbox flush failed:", err instanceof Error ? err.message : err));
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[leads] persistence failed:", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
