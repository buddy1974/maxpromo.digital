/**
 * app/login/page.tsx
 *
 * Login page — server component wrapper.
 * Bilingual, v2.1 light system (docs/visual-facelift-v2.1.md).
 * No public signup. Accounts are provisioned by Maxpromo.
 *
 * If already authenticated, redirect to dashboard.
 * (Middleware will enforce this once Auth-2 is implemented;
 * this getServerSession check is a courtesy redirect only.)
 */
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import LoginForm from "@/components/auth/LoginForm";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login");
  return { title: t("metaTitle"), robots: "noindex, nofollow" };
}

export default async function LoginPage() {
  const t = await getTranslations("login");
  const c = await getTranslations("common");
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    // `min-h-dvh`, not `min-h-screen`.
    //
    // `min-h-screen` is 100vh, which on mobile Safari is the viewport as it
    // would be with the browser's toolbar hidden — taller than what is on
    // screen. Combined with `justify-center` that pushed the card down by
    // roughly the height of the toolbar, and the sign-in button sat below the
    // fold on a page whose entire content is one short form.
    //
    // `justify-center` itself only applies once there is room to spare
    // (`sm:justify-center`). With the on-screen keyboard open on a small
    // phone the form is taller than the visible viewport, and a centred
    // column that overflows is clipped at BOTH ends — the submit button
    // becomes unreachable rather than merely below the fold. Top-aligned with
    // padding, it simply scrolls.
    <main className="flex min-h-dvh flex-col items-center justify-start bg-surface-subtle px-4 py-10 sm:justify-center">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="font-mono text-label-dense uppercase tracking-[0.22em] text-ink-secondary">
            {"maxpromo digital"}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {c("brandWordmark")}
          </h1>
          <p className="text-sm text-ink-muted">
            {t("prompt")}
          </p>
        </div>

        {/* Login card */}
        <div className="card p-6">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center font-mono text-label-dense uppercase tracking-[0.16em] text-ink-muted">
          Maxpromo Digital · Essen · §19 UStG
        </p>
      </div>
    </main>
  );
}
