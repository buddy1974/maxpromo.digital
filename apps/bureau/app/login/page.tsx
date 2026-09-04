/**
 * app/login/page.tsx
 *
 * Login page — server component wrapper.
 * German UI, v2.1 light system (docs/visual-facelift-v2.1.md).
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

export const metadata: Metadata = {
  title: "Anmelden — Max Agent",
  robots: "noindex, nofollow",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-secondary">
            {"maxpromo digital"}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Max Agent
          </h1>
          <p className="text-sm text-ink-muted">
            Melden Sie sich an, um fortzufahren.
          </p>
        </div>

        {/* Login card */}
        <div className="card p-6">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
          Maxpromo Digital · Essen · §19 UStG
        </p>
      </div>
    </main>
  );
}
