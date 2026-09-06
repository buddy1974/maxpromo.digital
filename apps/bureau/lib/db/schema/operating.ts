import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { businesses, agentProposals } from "./platform";

/**
 * ADDITIVE Sprint 3 schema — operating model + strategic modules. Mirrors the
 * mock layer so the dashboard can move from mock → real per table later.
 * Not pushed by default; review before `db:push`. All tables org-scoped via
 * business_id. Existing tables (leads, platform) are untouched.
 */

// ── New enums (unique names; reuse platform.ts enums where they already exist) ─
export const auditStatusEnum = pgEnum("audit_status", [
  "open",
  "in_review",
  "diagnosed",
  "addressed",
]);
export const auditPriorityEnum = pgEnum("audit_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);
export const waitingRoomStatusEnum = pgEnum("waiting_room_status", [
  "waiting",
  "draft_ready",
  "responded",
  "lost",
]);
export const documentStatusEnum = pgEnum("document_status", [
  "new",
  "reviewed",
  "action_required",
  "filed",
]);
export const documentRiskLevelEnum = pgEnum("document_risk_level", [
  "low",
  "medium",
  "high",
]);
export const aiToolStatusEnum = pgEnum("ai_tool_status", [
  "approved",
  "under_review",
  "blocked",
]);
export const governanceRiskLevelEnum = pgEnum("governance_risk_level", [
  "low",
  "medium",
  "high",
  "critical",
]);

const biz = () =>
  uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" });
const ts = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ── Operating model ──────────────────────────────────────────────────────────
export const operatingModels = pgTable("operating_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  currentStage: text("current_stage").notNull().default("audit"),
  notes: text("notes"),
  createdAt: ts(),
});

export const auditSessions = pgTable("audit_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  businessName: text("business_name").notNull(),
  industry: text("industry"),
  status: auditStatusEnum("status").notNull().default("open"),
  priorityScore: integer("priority_score").notNull().default(0),
  createdAt: ts(),
});

export const auditFindings = pgTable("audit_findings", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => auditSessions.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  title: text("title").notNull(),
  pain: text("pain").notNull(),
  impactArea: text("impact_area").notNull(),
  priority: auditPriorityEnum("priority").notNull().default("medium"),
  status: auditStatusEnum("status").notNull().default("open"),
  recommendedStage: text("recommended_stage"),
  recommendedAgents: jsonb("recommended_agents"),
  createdAt: ts(),
});

export const diagnosisFindings = pgTable("diagnosis_findings", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  category: text("category").notNull(),
  pain: text("pain").notNull(),
  impact: text("impact").notNull(),
  recommendedStage: text("recommended_stage"),
  createdAt: ts(),
});

export const agentRecommendations = pgTable("agent_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  tier: text("tier").notNull(),
  forSituation: text("for_situation").notNull(),
  agents: jsonb("agents"),
  createdAt: ts(),
});

export const implementationNotes = pgTable("implementation_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  clientName: text("client_name").notNull(),
  observation: text("observation").notNull(),
  proposedWorkflow: text("proposed_workflow"),
  status: text("status").notNull().default("captured"),
  createdAt: ts(),
});

export const playbooks = pgTable("playbooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  key: text("key").notNull(),
  title: text("title").notNull(),
  businessPain: text("business_pain"),
  trigger: text("trigger"),
  operatingStage: text("operating_stage"),
  approvalRequired: boolean("approval_required").notNull().default(true),
  reusableTemplate: boolean("reusable_template").notNull().default(true),
  createdAt: ts(),
}, (t) => ({
  // One playbook per key within a business.
  keyPerBusiness: unique("playbooks_business_key_uq").on(t.businessId, t.key),
}));

export const playbookSteps = pgTable("playbook_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  playbookId: uuid("playbook_id").notNull().references(() => playbooks.id, { onDelete: "cascade" }),
  stepOrder: integer("step_order").notNull(),
  label: text("label").notNull(),
  lifecycle: text("lifecycle").notNull(),
});

export const clientInstallations = pgTable("client_installations", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  clientName: text("client_name").notNull(),
  industry: text("industry"),
  implementationPriority: text("implementation_priority").notNull().default("medium"),
  handoverStatus: text("handover_status").notNull().default("not_started"),
  maintenanceReady: boolean("maintenance_ready").notNull().default(false),
  details: jsonb("details"),
  createdAt: ts(),
});

export const maintenanceChecks = pgTable("maintenance_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  label: text("label").notNull(),
  cadence: text("cadence"),
  description: text("description"),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  createdAt: ts(),
});

// ── Strategic modules ────────────────────────────────────────────────────────
export const waitingRoomItems = pgTable("waiting_room_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  customerName: text("customer_name").notNull(),
  company: text("company"),
  channel: text("channel").notNull(),
  reason: text("reason"),
  waitingFor: text("waiting_for"),
  urgency: text("urgency").notNull().default("medium"),
  status: waitingRoomStatusEnum("status").notNull().default("waiting"),
  suggestedAction: text("suggested_action"),
  assignedAgent: text("assigned_agent"),
  createdAt: ts(),
});

export const documentIntakeItems = pgTable("document_intake_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  source: text("source"),
  summary: text("summary"),
  status: documentStatusEnum("status").notNull().default("new"),
  riskLevel: documentRiskLevelEnum("risk_level").notNull().default("low"),
  assignedAgent: text("assigned_agent"),
  suggestedResponse: text("suggested_response"),
  createdAt: ts(),
});

export const documentRequiredActions = pgTable("document_required_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => documentIntakeItems.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  deadline: timestamp("deadline", { withTimezone: true }),
});

export const aiToolRegister = pgTable("ai_tool_register", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  name: text("name").notNull(),
  category: text("category"),
  status: aiToolStatusEnum("status").notNull().default("under_review"),
  usageNote: text("usage_note"),
  createdAt: ts(),
});

export const aiGovernanceRisks = pgTable("ai_governance_risks", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  area: text("area").notNull(),
  description: text("description"),
  level: governanceRiskLevelEnum("level").notNull().default("medium"),
  recommendedAction: text("recommended_action"),
  createdAt: ts(),
});

export const aiPolicyChecklists = pgTable("ai_policy_checklists", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  label: text("label").notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: ts(),
});

// Append-only audit trail of approval decisions — the spine of the trust layer.
export const approvalEvents = pgTable("approval_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: biz(),
  // Every approval event belongs to a real proposal (default decision from review).
  proposalId: uuid("proposal_id")
    .notNull()
    .references(() => agentProposals.id, { onDelete: "cascade" }),
  step: text("step").notNull(), // observed | prepared | proposed | reviewed | executed | logged
  actor: text("actor").notNull(), // user | agent | system
  note: text("note"),
  createdAt: ts(),
});
