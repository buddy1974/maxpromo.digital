import type { MemoryEntry } from "@/types/memory";

export const MOCK_MEMORY: MemoryEntry[] = [
  {
    id: "m-7001",
    type: "decision",
    title: "RestaurantOS zuerst ausrollen",
    summary:
      "Gastronomie als erster Branchen-Schwerpunkt — klarer Schmerzpunkt bei Anfragen nach Feierabend.",
    relatedTo: "p-2001",
    createdAt: "2026-05-20T10:00:00Z",
    source: "manual",
  },
  {
    id: "m-7002",
    type: "company",
    title: "Druck & Design Ruhr — Kontext",
    summary:
      "Inhabergeführt, manuelle Angebotsprozesse, Interesse an Workflow-Automatisierung.",
    relatedTo: "c-3002",
    createdAt: "2026-05-20T14:00:00Z",
    source: "agent",
  },
  {
    id: "m-7003",
    type: "conversation",
    title: "Erstgespräch Nordlicht Logistik",
    summary:
      "Rechnungszyklus dauert 3 Tage; Ziel: auf wenige Stunden verkürzen.",
    relatedTo: "c-3003",
    createdAt: "2026-05-26T09:00:00Z",
    source: "agent",
  },
  {
    id: "m-7004",
    type: "note",
    title: "Positionierung: kein Waitlist-Modell",
    summary:
      "Details offen zeigen, Konversion über direkten Geschäfts-Check statt E-Mail-Gate.",
    createdAt: "2026-05-29T08:00:00Z",
    source: "manual",
  },
];
