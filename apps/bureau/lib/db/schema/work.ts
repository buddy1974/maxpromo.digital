import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { businesses } from "./platform";

/**
 * Delegated work (ADR-0030) — the Agent Control Plane's unit of work.
 *
 * One row per piece of work Maxpromo OS delegated to an agent. The id is the
 * OS's work id and the idempotency key: a repeated request finds this row and
 * never starts the work twice. `business_id` comes from the authenticated
 * caller's credential, never from the request body.
 *
 * The Bureau keeps the reference to the OS record (subject) and the bounded
 * input snapshot it was given — never the lead itself. The result is the
 * agent's evidence until the OS has accepted it; the OS owns the business
 * record it is applied to.
 */
export const agentWork = pgTable(
  "agent_work",
  {
    id: uuid("id").primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    agentKey: text("agent_key").notNull(),
    capability: text("capability").notNull(),
    requestedBy: text("requested_by").notNull(),
    source: text("source").notNull(),
    subjectKind: text("subject_kind").notNull(),
    subjectId: uuid("subject_id").notNull(),
    subjectLabel: text("subject_label").notNull(),
    input: jsonb("input").notNull(),
    objective: text("objective").notNull(),
    // queued | running | completed | failed | cancelled
    state: text("state").notNull().default("queued"),
    attempt: integer("attempt").notNull().default(0),
    result: jsonb("result"),
    failure: jsonb("failure"),
    model: text("model"),
    latencyMs: integer("latency_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    // The result's hand-back to the OS: when it was accepted, or the last error.
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    deliveryError: text("delivery_error"),
  },
  (t) => ({
    bizIdx: index("agent_work_biz_idx").on(t.businessId, t.createdAt),
    stateIdx: index("agent_work_state_idx").on(t.state),
  }),
);

/** Nonces of signed OS requests at the work door: a replay is refused. */
export const workNonces = pgTable("work_nonces", {
  nonce: text("nonce").primaryKey(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});
