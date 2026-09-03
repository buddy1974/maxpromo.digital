import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Why enums: lead lifecycle and CTA type are a small, fixed set — enforcing them
// in the DB prevents typos and keeps reporting clean. Add values via migration.
export const ctaTypeEnum = pgEnum("cta_type", ["audit", "call", "contact"]);
export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
]);

/**
 * Public inbound leads from the offer page. No waitlist — these are real
 * audit-booking / contact submissions. PII: minimise and allow deletion (DSGVO).
 */
export const leadSubmissions = pgTable(
  "lead_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    company: text("company"),
    message: text("message"),
    ctaType: ctaTypeEnum("cta_type").notNull().default("audit"),
    status: leadStatusEnum("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    createdIdx: index("lead_created_idx").on(t.createdAt),
    statusIdx: index("lead_status_idx").on(t.status),
  }),
);

/**
 * Marketing attribution per submission — separated from the lead so we can
 * measure organic vs PAID-AD ROI from day one without bloating the lead row.
 */
export const attribution = pgTable("attribution", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leadSubmissions.id, { onDelete: "cascade" }),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  refCode: text("ref_code"),
  landingPath: text("landing_path"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Affiliate / partner promo — unique links Marcel can hand out and pay on conversion. */
export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  ownerEmail: text("owner_email"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").references(() => leadSubmissions.id, {
    onDelete: "set null",
  }),
  convertedAt: timestamp("converted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// `count` helper kept here so callers don't import drizzle's `sql` directly.
export const countAll = sql<number>`count(*)`;
export type LeadSubmission = typeof leadSubmissions.$inferSelect;
export type NewLeadSubmission = typeof leadSubmissions.$inferInsert;
export type NewAttribution = typeof attribution.$inferInsert;
