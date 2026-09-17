"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApprovalAction } from "@/types/approval";
import { useTranslations } from "next-intl";

type UiStatus = "pending" | "approved" | "rejected" | "reviewed";

// Interactive approval controls. Calls PATCH /api/approvals/[id]; records the
// decision + audit trail server-side. NEVER executes the real-world action.
export function ApprovalActions({
  proposalId,
  initialStatus,
}: {
  proposalId: string;
  initialStatus: "pending" | "approved" | "rejected";
}) {
  const t = useTranslations("approvalActions");
  const router = useRouter();
  const [status, setStatus] = useState<UiStatus>(initialStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  if (status !== "pending") {
    const label =
      status === "approved"
        ? t("doneApproved")
        : status === "rejected"
          ? t("doneRejected")
          : t("doneReviewed");
    return (
      <p className="mt-4 rounded-lg border border-hairline bg-surface-subtle px-3 py-2 text-xs text-ink-secondary">
        {label}
      </p>
    );
  }

  async function run(action: ApprovalAction) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/approvals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        const next: UiStatus =
          action === "approve" ? "approved" : action === "reject" ? "rejected" : "reviewed";
        setStatus(next);
        setMessage({
          kind: "ok",
          text:
            action === "approve"
              ? t("okApproved")
              : action === "reject"
                ? t("okRejected")
                : t("okReviewed"),
        });
        // Refresh server data so dashboard counts + activity feed update.
        router.refresh();
      } else {
        setMessage({ kind: "err", text: t("errAction") });
      }
    } catch {
      setMessage({ kind: "err", text: t("errNetwork") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5">
      {/*
        THE APPROVE CONTROL WAS WHITE TEXT ON BRAND LIME.
        That measures 1.51:1. The platform rule is one sentence long and this
        is the control it was written for: the accent is a fill, and text on it
        is black. It is `text-on-accent` now — the token that exists precisely
        so this is not a judgement call — and the border is the accent edge,
        because a lime fill on white has no perceivable boundary (WCAG 1.4.11).
        This was the highest-value button in the product and the least legible.

        LAYOUT: APPROVE IS NOT BESIDE REJECT ON A PHONE.
        Three 37px-tall controls in a wrapping row with 8px between them put
        "approve" and "reject" a thumb's width apart on the one screen in this
        product where the wrong tap is a decision recorded against a customer.
        Below `sm` the affirmative action takes its own full-width row and the
        other two share the next one, so the two opposite answers are never
        adjacent. Every control clears 44px.

        The three actions, their endpoint and their semantics are untouched.
      */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={busy}
          onClick={() => run("approve")}
          className="min-h-11 rounded-lg border border-accent-dark bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {t("approve")}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => run("reject")}
            className="min-h-11 flex-1 rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-hairline-strong disabled:opacity-60 sm:flex-none"
          >
            {t("reject")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("mark_reviewed")}
            className="min-h-11 flex-1 rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-hairline-strong disabled:opacity-60 sm:flex-none"
          >
            {t("markReviewed")}
          </button>
        </div>
      </div>
      {message && (
        <p
          className={`mt-3 text-xs ${message.kind === "ok" ? "text-success" : "text-danger"}`}
          role="status"
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
