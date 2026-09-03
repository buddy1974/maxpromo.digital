import type { Integration } from "@/types/integration";

export const MOCK_INTEGRATIONS: Integration[] = [
  { id: "i-8001", name: "Telegram", category: "messaging", status: "connected", description: "Benachrichtigungen über neue Leads und Freigaben." },
  { id: "i-8002", name: "Neon Postgres", category: "storage", status: "connected", description: "Persistente Geschäftsdaten (EU-Region)." },
  { id: "i-8003", name: "Gmail", category: "email", status: "available", description: "Posteingang lesen und Entwürfe vorbereiten (mit Freigabe)." },
  { id: "i-8004", name: "Google Kalender", category: "calendar", status: "available", description: "Termine vorschlagen und Erinnerungen." },
  { id: "i-8005", name: "WhatsApp Business", category: "messaging", status: "coming_soon", description: "Kundenkommunikation und Benachrichtigungen." },
  { id: "i-8006", name: "n8n", category: "automation", status: "available", description: "Automatisierungs- und Ausführungs-Bus für freigegebene Aktionen." },
  { id: "i-8007", name: "HubSpot", category: "crm", status: "coming_soon", description: "CRM-Synchronisation für Kontakte und Deals." },
  { id: "i-8008", name: "Stripe", category: "payments", status: "coming_soon", description: "Zahlungs- und Rechnungsdaten (nur Lesen, keine Auslösung)." },
];
