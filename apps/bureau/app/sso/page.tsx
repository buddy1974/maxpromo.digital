/**
 * app/sso/page.tsx — one login from Maxpromo OS (ADR-0030).
 *
 * The landing point of the OS owner handoff: the client island exchanges the
 * one-time ticket for a Bureau session. Not indexed; nothing here works
 * without a valid ticket from the OS.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SsoHandoff from "@/components/auth/SsoHandoff";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login");
  return { title: t("metaTitle"), robots: "noindex, nofollow" };
}

export default async function SsoPage() {
  const c = await getTranslations("common");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-start bg-surface-subtle px-4 py-10 sm:justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="font-mono text-label-dense uppercase tracking-[0.22em] text-ink-secondary">{"maxpromo digital"}</span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{c("brandWordmark")}</h1>
        </div>
        <div className="card p-6">
          <SsoHandoff />
        </div>
      </div>
    </main>
  );
}
