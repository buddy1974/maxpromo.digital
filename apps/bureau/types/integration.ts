export type IntegrationStatus =
  | "connected"
  | "available"
  | "error"
  | "coming_soon";

export type IntegrationCategory =
  | "email"
  | "calendar"
  | "messaging"
  | "crm"
  | "payments"
  | "automation"
  | "storage";

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  description: string;
}
