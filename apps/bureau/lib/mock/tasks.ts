import type { Task } from "@/types/task";

// Central mock task data. Business-relevant, demo-ready. Never inline this in pages.
export const MOCK_TASKS: Task[] = [
  {
    id: "t-1001",
    title: "Audit-Anfrage aus Essen beantworten",
    status: "todo",
    priority: "urgent",
    dueDate: "2026-05-29",
    assignee: "Marcel",
    source: "agent",
    isOverdue: false,
  },
  {
    id: "t-1002",
    title: "Angebot für Restaurant-Betrieb finalisieren",
    status: "in_progress",
    priority: "high",
    dueDate: "2026-05-28",
    assignee: "Marcel",
    projectId: "p-2001",
    source: "manual",
    isOverdue: true,
  },
  {
    id: "t-1003",
    title: "Follow-up: Druckerei nach Erstgespräch",
    status: "todo",
    priority: "high",
    dueDate: "2026-05-27",
    assignee: "Marcel",
    source: "agent",
    isOverdue: true,
  },
  {
    id: "t-1004",
    title: "Website-Migration: Staging prüfen",
    status: "blocked",
    priority: "medium",
    dueDate: "2026-05-30",
    projectId: "p-2002",
    source: "manual",
  },
  {
    id: "t-1005",
    title: "Newsletter-Segment für Bestandskunden aufsetzen",
    status: "todo",
    priority: "low",
    dueDate: "2026-06-03",
    source: "agent",
  },
  {
    id: "t-1006",
    title: "Monatsabschluss Rechnungen sortieren",
    status: "done",
    priority: "medium",
    dueDate: "2026-05-25",
    assignee: "Marcel",
    source: "manual",
  },
];

export const MOCK_OVERDUE_TASKS = MOCK_TASKS.filter((t) => t.isOverdue);
