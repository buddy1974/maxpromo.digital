export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
}

export type ContactStatus =
  | "new"
  | "active"
  | "nurturing"
  | "dormant"
  | "customer";

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  companyId?: string;
  companyName?: string;
  status: ContactStatus;
  /** ISO timestamp of last contact, optional. */
  lastContactedAt?: string;
  /** ISO timestamp of the next scheduled follow-up, optional. */
  nextFollowUpAt?: string;
}
