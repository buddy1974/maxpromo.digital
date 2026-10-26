"use client";

/**
 * components/auth/SsoHandoff.tsx — one login from Maxpromo OS (ADR-0030).
 *
 * The OS sends the owner here with a one-time ticket in the URL fragment (never
 * sent to a server in a request line, a log or a referrer). The ticket is taken
 * out of the address bar at once, exchanged for this application's own session
 * through the "os-handoff" provider, and is useless afterwards. Anything wrong —
 * expired, used, not the owner — ends at the normal login.
 */
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function SsoHandoff() {
  const t = useTranslations("login");
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const ticket = new URLSearchParams(window.location.hash.slice(1)).get("t") ?? "";
    window.history.replaceState(null, "", "/sso");
    // No ticket goes the same way: the provider refuses it and the page offers the login.
    void signIn("os-handoff", { ticket, redirect: false }).then((r) => {
      if (r?.error || !r?.ok) { setFailed(true); return; }
      router.replace("/dashboard");
      router.refresh();
    });
  }, [router]);

  return failed ? (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-secondary">{t("ssoFailed")}</p>
      <a href="/login" className="btn-primary">{t("ssoLogin")}</a>
    </div>
  ) : (
    <p role="status" className="text-sm text-ink-secondary">{t("ssoWorking")}</p>
  );
}
