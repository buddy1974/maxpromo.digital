import type { Integration } from "@/types/integration";

/**
 * Demo integrations. Names are proper nouns; the one description-shaped name
 * (the Google calendar) and every description are in demo.integrations,
 * because they are sentences the product says rather than records it holds.
 */
export const MOCK_INTEGRATIONS: { id: string; name: string; nameKey?: string; category: Integration["category"]; status: Integration["status"] }[] = [
  { id: "i-8001", name: "Telegram",         category: "messaging",  status: "connected" },
  { id: "i-8002", name: "Neon Postgres",    category: "storage",    status: "connected" },
  { id: "i-8003", name: "Gmail",            category: "email",      status: "available" },
  { id: "i-8004", name: "", nameKey: "calendarName", category: "calendar", status: "available" },
  { id: "i-8005", name: "WhatsApp Business",category: "messaging",  status: "coming_soon" },
  { id: "i-8006", name: "n8n",              category: "automation", status: "available" },
  { id: "i-8007", name: "HubSpot",          category: "crm",        status: "coming_soon" },
  { id: "i-8008", name: "Stripe",           category: "payments",   status: "coming_soon" },
];
