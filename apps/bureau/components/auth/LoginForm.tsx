"use client";

/**
 * components/auth/LoginForm.tsx
 *
 * Client island: handles the login form submission.
 * Calls signIn("credentials") from next-auth/react.
 *
 * Design: v2.1 light system, Maxpromo accent orange.
 * Language: German UI (target market is German SMEs).
 * No public signup — accounts are provisioned by Maxpromo.
 */
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false, // we handle redirect manually for error feedback
      });

      if (result?.error) {
        // NextAuth returns "CredentialsSignin" on wrong credentials.
        // We show a deliberate vague message to avoid user enumeration.
        setError("E-Mail-Adresse oder Passwort ungültig.");
        return;
      }

      // Successful login — redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* E-Mail */}
      <label className="flex flex-col gap-1.5">
        <span className="field-label">E-Mail-Adresse</span>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-input"
          placeholder="name@unternehmen.de"
          disabled={isPending}
        />
      </label>

      {/* Passwort */}
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Passwort</span>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input"
          placeholder="••••••••"
          disabled={isPending}
        />
      </label>

      {/* Error message */}
      {error && (
        <p className="rounded-md border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Submit */}
      <button type="submit" disabled={isPending} className="btn-primary mt-1">
        {isPending ? (
          <>
            <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Anmelden…
          </>
        ) : (
          "Anmelden"
        )}
      </button>

      {/* No public signup notice */}
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        Kein Konto? Zugang wird von Maxpromo bereitgestellt.
      </p>
    </form>
  );
}
