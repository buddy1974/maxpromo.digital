"use client";

import { useState } from "react";
import { RiskBadge } from "./RiskBadge";
import type { AIGeneratedProposal, AIGenerationTask } from "@/lib/ai/types";

const TASKS: { value: AIGenerationTask; label: string }[] = [
  { value: "follow_up_draft", label: "Follow-up-Entwurf" },
  { value: "audit_summary", label: "Audit-Zusammenfassung" },
  { value: "document_summary", label: "Dokument-Zusammenfassung" },
  { value: "waiting_room_response", label: "Warteraum-Antwort" },
  { value: "governance_recommendation", label: "Governance-Empfehlung" },
  { value: "proposal_draft", label: "Vorschlags-Entwurf" },
];

type State = "idle" | "loading" | "done" | "error" | "not_configured";

export function AILabClient() {
  const [task, setTask] = useState<AIGenerationTask>("follow_up_draft");
  const [input, setInput] = useState("");
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<AIGeneratedProposal | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function generate() {
    if (!input.trim()) {
      setState("error");
      setErrorMsg("Bitte eine Eingabe machen.");
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
        setErrorMsg("Generierung fehlgeschlagen. Bitte erneut versuchen.");
      }
    } catch {
      setState("error");
      setErrorMsg("Netzwerkfehler. Bitte erneut versuchen.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-accent/30 bg-accent-soft p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-secondary">
          AI Lab — Draft Mode
        </p>
        <p className="mt-2 text-sm text-ink-secondary">
          Das AI Lab erstellt ausschließlich Entwürfe. Nichts wird gesendet,
          ausgeführt oder angewendet — ohne menschliche Freigabe.
        </p>
      </div>

      <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
        <label className="grid gap-1.5">
          <span className="text-sm text-ink-secondary">Aufgabe</span>
          <select
            value={task}
            onChange={(e) => setTask(e.target.value as AIGenerationTask)}
            className="rounded-lg border border-hairline bg-surface px-3 py-2.5 text-ink outline-none focus:border-accent"
          >
            {TASKS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 grid gap-1.5">
          <span className="text-sm text-ink-secondary">Eingabe</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            maxLength={8000}
            className="rounded-lg border border-hairline bg-surface px-3 py-2.5 text-ink outline-none placeholder:text-ink-muted focus:border-accent"
            placeholder="Kontext / Quelltext, aus dem ein Entwurf erstellt werden soll …"
          />
        </label>

        <button
          type="button"
          onClick={generate}
          disabled={state === "loading"}
          className="mt-4 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {state === "loading" ? "Generiere …" : "Entwurf generieren"}
        </button>

        {state === "not_configured" && (
          <p className="mt-3 text-sm text-warning">
            AI-Provider ist noch nicht konfiguriert. Fügen Sie <code>OPENAI_API_KEY</code> in
            Vercel hinzu, um die Generierung zu aktivieren.
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
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              Entwurf (nicht gesendet)
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{result.draft}</p>
          </div>

          <div className="mt-4 border-t border-hairline pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              Empfohlene nächste Aktion
            </p>
            <p className="mt-1 text-sm text-ink-secondary">{result.recommendedNextAction}</p>
          </div>

          <p className="mt-3 text-xs text-ink-muted">{result.safetyNote}</p>

          <button
            type="button"
            disabled
            title="Kommt als Nächstes — Vorschlag in die Approval-Queue schreiben"
            className="mt-4 cursor-not-allowed rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-ink-muted opacity-60"
          >
            Create proposal (Coming next)
          </button>
        </div>
      )}
    </div>
  );
}
