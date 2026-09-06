import type { Project } from "@/types/project";

export const MOCK_PROJECTS: Project[] = [
  {
    id: "p-2001",
    name: "RestaurantOS — Einführung",
    status: "active",
    health: "on_track",
    owner: "Marcel",
    dueDate: "2026-06-15",
    progress: 62,
    openTasks: 4,
  },
  {
    id: "p-2002",
    name: "Website-Migration (Joomla → Next.js)",
    status: "blocked",
    health: "at_risk",
    owner: "Marcel",
    dueDate: "2026-06-08",
    progress: 38,
    openTasks: 6,
  },
  {
    id: "p-2003",
    name: "Workflow-Automatisierung Logistikkunde",
    status: "active",
    health: "on_track",
    owner: "Marcel",
    dueDate: "2026-06-22",
    progress: 45,
    openTasks: 5,
  },
  {
    id: "p-2004",
    name: "Interner Newsletter-Aufbau",
    status: "planning",
    health: "on_track",
    owner: "Marcel",
    dueDate: "2026-07-01",
    progress: 12,
    openTasks: 3,
  },
];
