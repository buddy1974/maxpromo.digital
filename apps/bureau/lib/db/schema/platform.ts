import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * ADDITIVE platform schema (Sprint 2). Defines the future data model behind the
 * dashboard. Nothing here is wired to the app yet — the dashboard runs on the
 * mock layer. This is NOT pushed by default; review before `db:push`.
 *
 * Existing lead tables in ./leads.ts are untouched (no renames, no drops).
 * Every business table carries `business_id` so row-level org scoping can be
 * enforced in one data-access layer later (multi-tenancy from day one).
 */

// ── Enums (names are globally unique; distinct from leads.ts enums) ──────────
export const agentStatusEnum = pgEnum("agent_status", [
  "active",
  "idle",
  "paused",
  "proposing",
  "error",
  "offline",
]);
export const riskLevelEnum = pgEnum("risk_level", [
  "low",
  "medium",
  "high",
  "critical",
]);
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "executed",
  "expired",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
]);
export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "active",
  "blocked",
  "on_hold",
  "done",
]);
export const integrationStatusEnum = pgEnum("integration_status", [
  "connected",
  "available",
  "error",
  "coming_soon",
]);

// ── Tenancy root ─────────────────────────────────────────────────────────────
export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerEmail: text("owner_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appUsers = pgTable("app_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role").notNull().default("owner"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Auth-1A: provisioned credentials (argon2id hash stored here; null until account is provisioned)
  passwordHash: text("password_hash"),
  // Auth-1A: last successful login; null for unprovisioned accounts
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
}, (t) => ({
  // One user record per email within a business.
  emailPerBusiness: unique("app_users_business_email_uq").on(t.businessId, t.email),
}));

// ── Agent bureau ─────────────────────────────────────────────────────────────
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  // Stable key matching the code registry (e.g. "chief-of-staff").
  key: text("key").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  status: agentStatusEnum("status").notNull().default("idle"),
  riskLevel: riskLevelEnum("risk_level").notNull().default("low"),
  requiresApproval: boolean("requires_approval").notNull().default(true),
  enabled: boolean("enabled").notNull().default(true),
  config: jsonb("config"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // One agent definition per registry key within a business.
  keyPerBusiness: unique("agents_business_key_uq").on(t.businessId, t.key),
}));

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    agentKey: text("agent_key").notNull(),
    trigger: text("trigger").notNull(), // manual | heartbeat | webhook
    input: jsonb("input"),
    output: jsonb("output"),
    status: text("status").notNull().default("completed"),
    tokens: integer("tokens"),
    costCents: integer("cost_cents"), // amount in cents to avoid float drift
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => ({ bizIdx: index("agent_runs_biz_idx").on(t.businessId) }),
);

// Agent-prepared proposals — the supervision queue. Nothing executes until an
// approval row moves to "approved"/"executed" via the (future) guarded path.
export const agentProposals = pgTable("agent_proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  agentKey: text("agent_key").notNull(),
  title: text("title").notNull(),
  businessContext: text("business_context"),
  proposedAction: text("proposed_action").notNull(),
  expectedOutcome: text("expected_outcome"),
  riskLevel: riskLevelEnum("risk_level").notNull().default("medium"),
  status: approvalStatusEnum("status").notNull().default("pending"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id")
    .notNull()
    .references(() => agentProposals.id, { onDelete: "cascade" }),
  decidedBy: uuid("decided_by").references(() => appUsers.id, {
    onDelete: "set null",
  }),
  status: approvalStatusEnum("status").notNull().default("pending"),
  note: text("note"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Operational entities ─────────────────────────────────────────────────────
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  domain: text("domain"),
  industry: text("industry"),
  size: text("size"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role"),
  status: text("status").notNull().default("new"),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: projectStatusEnum("status").notNull().default("planning"),
  health: text("health").notNull().default("on_track"),
  ownerId: uuid("owner_id").references(() => appUsers.id, { onDelete: "set null" }),
  progress: integer("progress").notNull().default(0),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: text("priority").notNull().default("medium"),
    source: text("source").notNull().default("manual"), // manual | agent
    assigneeId: uuid("assignee_id").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ dueIdx: index("tasks_due_idx").on(t.dueDate) }),
);

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  body: text("body").notNull(),
  authorId: uuid("author_id").references(() => appUsers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Persistent business memory. Embedding column intentionally deferred until the
// pgvector extension is enabled (see PLAN.md memory layer).
export const memoryEntries = pgTable("memory_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  relatedTo: text("related_to"),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    actor: text("actor").notNull(), // user | agent | system
    actorName: text("actor_name").notNull(),
    action: text("action").notNull(),
    target: text("target"),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ bizIdx: index("activity_biz_idx").on(t.businessId) }),
);

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  category: text("category"),
  status: integrationStatusEnum("status").notNull().default("available"),
  // Reference to a secret, NEVER the raw token (secrets live in env/vault).
  credentialsRef: text("credentials_ref"),
  config: jsonb("config"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
