import { NextResponse } from "next/server";
import { getDb, isDbConfigured } from "@/lib/db";
import { attribution, leadSubmissions } from "@/lib/db/schema";
import { leadSchema } from "@/lib/validation/lead";
import { notifyTelegram } from "@/lib/integrations/telegram/notify";
import { checkRateLimit, getClientIp, LEADS_LIMIT } from "@/lib/security/rate-limit";

// Neon HTTP driver runs on the Node runtime.
export const runtime = "nodejs";

/**
 * Public lead capture. Flow (anti-vibe-code): rate-limit -> validate -> persist
 * -> notify -> typed result. No fake success: if persistence fails, the client
 * is told.
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

    // Notify (flag-gated, never throws). Fire after persistence.
    if (row?.id) {
      await notifyTelegram(lead, row.id);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[leads] persistence failed:", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
