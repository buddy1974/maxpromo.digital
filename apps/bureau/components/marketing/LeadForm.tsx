"use client";

import { useEffect, useRef, useState } from "react";
import { leadSchema } from "@/lib/validation/lead";
import { FormStatus } from "@maxpromo/ui";
import { Icon } from "@maxpromo/ui";
import { useTranslations } from "next-intl";

type Status = "idle" | "submitting" | "success" | "error";

// Read UTM + ref + referrer once on mount. Best-effort; never blocks submit.
function readAttribution() {
  if (typeof window === "undefined") return undefined;
  const p = new URLSearchParams(window.location.search);
  const val = (k: string) => p.get(k) || undefined;
  return {
    utmSource: val("utm_source"),
    utmMedium: val("utm_medium"),
    utmCampaign: val("utm_campaign"),
    utmContent: val("utm_content"),
    utmTerm: val("utm_term"),
    refCode: val("ref"),
    landingPath: window.location.pathname,
    referrer: document.referrer || undefined,
  };
}

export function LeadForm() {
  const t = useTranslations("lead");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const attribution = useRef<ReturnType<typeof readAttribution>>(undefined);

  useEffect(() => {
    attribution.current = readAttribution();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      company: String(fd.get("company") ?? ""),
      message: String(fd.get("message") ?? ""),
      website: String(fd.get("website") ?? ""), // honeypot
      ctaType: "audit" as const,
      attribution: attribution.current,
    };

    // Client-side validation with the SAME schema the server uses.
    const parsed = leadSchema.safeParse(payload);
    if (!parsed.success) {
      // The schema returns keys; the message is chosen here, in the reader's
      // language. An unknown key falls back to the generic sentence rather
      // than rendering a key path at somebody.
      const code = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      const known = ["errNameRequired", "errEmailInvalid"];
      setStatus("error");
      setError(code && known.includes(code) ? t(code) : t("errCheckInput"));
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (res.ok) {
        setStatus("success");
        return;
      }
      const data = await res.json().catch(() => null);
      setStatus("error");
      setError(
        data?.error === "not_configured" ? t("errNotConfigured") : t("errGeneric"),
      );
    } catch {
      setStatus("error");
      setError(t("errNetwork"));
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-accent/40 bg-accent-soft p-8 text-center">
        <div className="flex justify-center text-ink-secondary"><Icon name="check" size="lg" /></div>
        <h3 className="mt-3 text-xl font-semibold text-ink">
          {t("successTitle")}
        </h3>
        <p className="mt-2 text-ink-secondary">
          {t("successBody")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label={t("name")} autoComplete="name" required />
        <Field
          name="email"
          label={t("email")}
          type="email"
          autoComplete="email"
          required
        />
        <Field name="phone" label={t("phone")} type="tel" autoComplete="tel" />
        <Field name="company" label={t("company")} autoComplete="organization" />
      </div>

      <label className="grid gap-1.5">
        <span className="field-label">{t("message")}</span>
        <textarea
          name="message"
          rows={3}
          className="field-input"
          placeholder={t("messagePlaceholder")}
        />
      </label>

      {/* Honeypot — visually hidden, ignored by humans, filled by bots. */}
      <div aria-hidden className="hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <FormStatus tone="critical">{status === "error" ? error : null}</FormStatus>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-primary mt-1"
      >
        {/* The label wraps inside the button rather than the button refusing
            to wrap. @maxpromo/ui sets white-space: nowrap on every button, and
            the German label is 340px on one line — which forced the form, the
            column and the whole page 72px wider than a 375px screen.
            white-space inherits, so a child can say otherwise; the shared
            component does not have to change for one long word. */}
        <span className="whitespace-normal">
          {status === "submitting" ? t("submitting") : t("submit")}
        </span>
      </button>

      <p className="text-xs text-ink-muted">
        {t("consent")}
        <a href="/datenschutz" className="underline underline-offset-2 hover:text-ink-secondary">
          {t("privacyLink")}
        </a>
        .
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="field-label">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="field-input"
      />
    </label>
  );
}
