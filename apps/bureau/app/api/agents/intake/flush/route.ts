import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { flushIntakeOutbox } from "@/lib/agents/intake";
import { osConfigured } from "@/lib/os/client";

// Scheduled retry of the intake outbox (vercel.json crons). Vercel Cron sends
// `Authorization: Bearer $CRON_SECRET`; nothing else may trigger it. Without a
// configured secret the route refuses — it never runs open.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorised(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16 || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export async function GET(req: Request) {
  if (!authorised(req.headers.get("authorization"))) return NextResponse.json({ ok: false }, { status: 401 });
  if (!isDbConfigured() || !osConfigured()) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  const result = await flushIntakeOutbox(10);
  return NextResponse.json({ ok: true, ...result });
}
