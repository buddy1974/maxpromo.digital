import type { Company, Contact } from "@/types/contact";

export const MOCK_COMPANIES: Company[] = [
  { id: "c-3001", name: "Trattoria Bella Essen", industry: "Gastronomie", size: "10–20" },
  { id: "c-3002", name: "Druck & Design Ruhr GmbH", industry: "Druckerei", size: "20–50" },
  { id: "c-3003", name: "Nordlicht Logistik", industry: "Logistik", size: "50–100" },
  { id: "c-3004", name: "Praxis Dr. Vogel", industry: "Gesundheit", size: "5–10" },
];

export const MOCK_CONTACTS: Contact[] = [
  {
    id: "ct-4001",
    name: "Giulia Romano",
    email: "g.romano@trattoria-bella.example",
    phone: "+49 201 1234567",
    role: "Inhaberin",
    companyId: "c-3001",
    companyName: "Trattoria Bella Essen",
    status: "active",
    lastContactedAt: "2026-05-22T10:00:00Z",
    nextFollowUpAt: "2026-05-29T09:00:00Z",
  },
  {
    id: "ct-4002",
    name: "Thomas Berger",
    email: "berger@druck-design-ruhr.example",
    role: "Geschäftsführer",
    companyId: "c-3002",
    companyName: "Druck & Design Ruhr GmbH",
    status: "nurturing",
    lastContactedAt: "2026-05-20T13:30:00Z",
    nextFollowUpAt: "2026-05-27T09:00:00Z",
  },
  {
    id: "ct-4003",
    name: "Sabine Krüger",
    email: "s.krueger@nordlicht-logistik.example",
    role: "Operations Lead",
    companyId: "c-3003",
    companyName: "Nordlicht Logistik",
    status: "active",
    lastContactedAt: "2026-05-26T08:15:00Z",
    nextFollowUpAt: "2026-05-30T09:00:00Z",
  },
  {
    id: "ct-4004",
    name: "Dr. Markus Vogel",
    role: "Praxisinhaber",
    companyId: "c-3004",
    companyName: "Praxis Dr. Vogel",
    status: "new",
    nextFollowUpAt: "2026-05-29T11:00:00Z",
  },
];

// Follow-ups due on/before today (2026-05-29) — surfaced on the dashboard.
export const MOCK_URGENT_FOLLOWUPS = MOCK_CONTACTS.filter(
  (c) => c.nextFollowUpAt && c.nextFollowUpAt <= "2026-05-29T23:59:59Z",
);
