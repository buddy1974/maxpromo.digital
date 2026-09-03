import type { DiagnosisFinding } from "@/types/operating-model";
import { OPERATING_STAGES } from "./operating-model";
import type { OperatingStageKey } from "@/types/operating-model";

// Helpers + reference diagnosis catalogue tying audit pains to operating stages.

export function getStage(key: OperatingStageKey) {
  return OPERATING_STAGES.find((s) => s.key === key);
}

export function stagesInOrder() {
  return [...OPERATING_STAGES].sort((a, b) => a.order - b.order);
}

/** Canonical diagnosis findings — audit pains mapped to impact + next stage. */
export const DIAGNOSIS_CATALOGUE: DiagnosisFinding[] = [
  { id: "dx-1", category: "Follow-up", pain: "Verpasste Follow-ups", impact: "Verlorene Aufträge an Wettbewerber", recommendedStage: "design" },
  { id: "dx-2", category: "Reaktion", pain: "Langsame Kundenantworten", impact: "Sinkende Zufriedenheit, Absprünge", recommendedStage: "manual_delivery" },
  { id: "dx-3", category: "Leads", pain: "Schwaches Lead-Tracking", impact: "Pipeline ohne Übersicht", recommendedStage: "design" },
  { id: "dx-4", category: "Aufgaben", pain: "Verstreute Aufgaben", impact: "Wichtiges geht unter", recommendedStage: "systemize" },
  { id: "dx-5", category: "Sichtbarkeit", pain: "Fehlende Übersicht", impact: "Entscheidungen verzögern sich", recommendedStage: "audit" },
  { id: "dx-6", category: "Reporting", pain: "Manuelles Reporting", impact: "Stunden pro Woche verloren", recommendedStage: "systemize" },
  { id: "dx-7", category: "Tools", pain: "Getrennte Inbox/Kalender/CRM", impact: "Tägliche Lückenfüllerei von Hand", recommendedStage: "install" },
  { id: "dx-8", category: "Priorität", pain: "Kein Tagesprioritätssystem", impact: "Dringendes schlägt Wichtiges", recommendedStage: "manual_delivery" },
  { id: "dx-9", category: "Dokumente", pain: "Dokumenten-Chaos", impact: "Fristen und Risiken übersehen", recommendedStage: "systemize" },
  { id: "dx-10", category: "KI", pain: "Shadow-AI-Risiko", impact: "Unkontrollierte Datennutzung", recommendedStage: "diagnose" },
];
