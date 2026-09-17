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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run("approve")}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {t("approve")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run("reject")}
          className="rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-hairline-strong disabled:opacity-60"
        >
          {t("reject")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run("mark_reviewed")}
          className="rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-hairline-strong disabled:opacity-60"
        >
          {t("markReviewed")}
        </button>
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
