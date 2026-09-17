"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";
import { RiskBadge } from "./RiskBadge";
import type { AIGeneratedProposal, AIGenerationTask } from "@/lib/ai/types";

const TASKS: { value: AIGenerationTask; key: string }[] = [
  { value: "follow_up_draft", key: "taskFollowUp" },
  { value: "audit_summary", key: "taskAudit" },
  { value: "document_summary", key: "taskDocument" },
  { value: "waiting_room_response", key: "taskWaiting" },
  { value: "governance_recommendation", key: "taskGovernance" },
  { value: "proposal_draft", key: "taskProposal" },
];

type State = "idle" | "loading" | "done" | "error" | "not_configured";

export function AILabClient() {
  const [task, setTask] = useState<AIGenerationTask>("follow_up_draft");
  const t = useTranslations("aiLab");
  const [input, setInput] = useState("");
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<AIGeneratedProposal | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function generate() {
    if (!input.trim()) {
      setState("error");
      setErrorMsg(t("errNoInput"));
      return;
    }
    setState("loading");
    setResult(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, context: { input } }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setResult(data.data as AIGeneratedProposal);
        setState("done");
      } else if (data?.error === "ai_not_configured") {
        setState("not_configured");
      } else {
        setState("error");
        setErrorMsg(t("errGenerate"));
      }
    } catch {
      setState("error");
      setErrorMsg(t("errNetwork"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-accent/30 bg-accent-soft p-5">
        <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
          {t("draftMode")}
        </p>
        <p className="mt-2 text-sm text-ink-secondary">
          {t("draftOnlyNote")}
        </p>
      </div>

      <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
        <label className="grid gap-1.5">
          <span className="text-sm text-ink-secondary">{t("task")}</span>
          <select
            value={task}
            onChange={(e) => setTask(e.target.value as AIGenerationTask)}
            className="rounded-lg border border-hairline bg-surface px-3 py-2.5 text-ink outline-none focus:border-accent"
          >
            {TASKS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 grid gap-1.5">
          <span className="text-sm text-ink-secondary">{t("input")}</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            maxLength={8000}
            className="rounded-lg border border-hairline bg-surface px-3 py-2.5 text-ink outline-none placeholder:text-ink-muted focus:border-accent"
            placeholder={t("inputPlaceholder")}
          />
        </label>

        <button
          type="button"
          onClick={generate}
          disabled={state === "loading"}
          className="mt-4 min-h-11 rounded-lg border border-accent-dark bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {state === "loading" ? t("generating") : t("generate")}
        </button>

        {state === "not_configured" && (
          <p className="mt-3 text-sm text-warning">
            {t("notConfiguredBefore")}<code>OPENAI_API_KEY</code>{t("notConfiguredAfter")}
          </p>
        )}
        {state === "error" && errorMsg && (
          <p className="mt-3 text-sm text-danger">{errorMsg}</p>
        )}
      </div>

      {state === "done" && result && (
        <div className="rounded-lg border border-hairline bg-surface p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink">{result.title}</h3>
            <RiskBadge level={result.riskLevel} />
          </div>
          <p className="mt-2 text-sm text-ink-secondary">{result.summary}</p>

          <div className="mt-4 rounded-lg border border-hairline bg-surface-subtle p-4">
            <p className="font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">
              {t("draftBadge")}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{result.draft}</p>
          </div>

          <div className="mt-4 border-t border-hairline pt-3">
            <p className="font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">
              {t("recommendedAction")}
            </p>
            <p className="mt-1 text-sm text-ink-secondary">{result.recommendedNextAction}</p>
          </div>

          <p className="mt-3 text-xs text-ink-muted">{result.safetyNote}</p>

          <button
            type="button"
            disabled
            title={t("nextUp")}
            className="mt-4 cursor-not-allowed rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-ink-muted opacity-60"
          >
            {t("createProposal")}
          </button>
        </div>
      )}
    </div>
  );
}
