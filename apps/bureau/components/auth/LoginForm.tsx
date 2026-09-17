"use client";

import { FormStatus } from "@maxpromo/ui";

/**
 * components/auth/LoginForm.tsx
 *
 * Client island: handles the login form submission.
 * Calls signIn("credentials") from next-auth/react.
 *
 * Design: platform design system. Colour comes from @maxpromo/design-tokens.
 * Language: whichever the visitor has chosen. The product is German-first by
 * governance and fully available in English; this form reads both from the
 * catalogue rather than assuming the reader.
 * No public signup — accounts are provisioned by Maxpromo.
 */
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function LoginForm() {
  const t = useTranslations("login");
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
        setError(t("errCredentials"));
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
        <span className="field-label">{t("emailLabel")}</span>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-input"
          placeholder={t("emailPlaceholder")}
          disabled={isPending}
          aria-busy={isPending}
        />
      </label>

      {/* Passwort */}
      <label className="flex flex-col gap-1.5">
        <span className="field-label">{t("passwordLabel")}</span>
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

      {/* Error message. The region is always present; only its contents change. */}
      <FormStatus tone="critical">{error}</FormStatus>

      {/* Submit */}
      <button type="submit" disabled={isPending} className="btn-primary mt-1">
        {isPending ? (
          <>
            <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {t("signingIn")}
          </>
        ) : (
          t("submit")
        )}
      </button>

      {/* No public signup notice */}
      <p className="text-center font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">
        {t("noAccount")}
      </p>
    </form>
  );
}
