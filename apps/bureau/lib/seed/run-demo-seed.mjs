// Demo workspace seed — Sprint 4.
// Run: npm run db:seed:demo   (node --env-file=.env.local lib/seed/run-demo-seed.mjs)
//
// SAFETY:
// - Idempotent: business is found-or-created by name; every child set is seeded
//   only when that table is empty for the demo business. Running twice does NOT
//   duplicate and does NOT delete anything.
// - Touches ONLY the demo business + its child rows. Never touches lead tables.
// - No db:push, no schema changes, no outbound communication.
// - Parameterized SQL only.
//
// NOTE: business name MUST match config/demo.ts -> DEMO_BUSINESS_NAME.

import { neon } from "@neondatabase/serverless";
import { DEMO_BUSINESS } from "./demo-business.mjs";
import { DEMO_AGENTS } from "./demo-agents.mjs";
import { DEMO_AUDIT_SESSION, DEMO_AUDIT_FINDINGS } from "./demo-audit.mjs";
import { DEMO_WAITING_ROOM } from "./demo-waiting-room.mjs";
import { DEMO_DOCUMENTS } from "./demo-documents.mjs";
import {
  DEMO_AI_TOOLS,
  DEMO_GOVERNANCE_RISKS,
  DEMO_POLICY_CHECKLIST,
} from "./demo-governance.mjs";
import { DEMO_PROPOSALS } from "./demo-approvals.mjs";
import { DEMO_PLAYBOOKS } from "./demo-playbooks.mjs";
import { DEMO_ACTIVITY } from "./demo-activity.mjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Aborting (no DB touched).");
  process.exit(1);
}
const sql = neon(url);

// neon() is a tagged-template function, not a pg Client — it has no .query().
// This helper bridges the seed's sql.query(text, params) calls to neon's API.
function query(text, params = []) {
  const parts = text.split(/\$\d+/g);
  const tpl = Object.assign(parts, { raw: parts });
  return sql(tpl, ...params);
}

async function countFor(table, businessId) {
  const rows = await query(
    `SELECT count(*)::int AS n FROM "${table}" WHERE business_id = $1`,
    [businessId],
  );
  return rows[0].n;
}

async function main() {
  // 1. Business: find-or-create by name (idempotent).
  let rows = await query(
    `SELECT id FROM businesses WHERE name = $1 LIMIT 1`,
    [DEMO_BUSINESS.name],
  );
  let businessId;
  if (rows.length) {
    businessId = rows[0].id;
    console.log(`business: exists (${businessId})`);
  } else {
    rows = await query(
      `INSERT INTO businesses (name, owner_email) VALUES ($1, $2) RETURNING id`,
      [DEMO_BUSINESS.name, DEMO_BUSINESS.ownerEmail],
    );
    businessId = rows[0].id;
    console.log(`business: created (${businessId})`);
  }

  // 2. Agents.
  if ((await countFor("agents", businessId)) === 0) {
    for (const a of DEMO_AGENTS) {
      await query(
        `INSERT INTO agents (business_id, key, name, role, status, risk_level, requires_approval, enabled)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
        [businessId, a.key, a.name, a.role, a.status, a.riskLevel, a.requiresApproval],
      );
    }
    console.log(`agents: inserted ${DEMO_AGENTS.length}`);
  } else console.log("agents: skip (already seeded)");

  // 3. Operating model (single row).
  if ((await countFor("operating_models", businessId)) === 0) {
    await query(
      `INSERT INTO operating_models (business_id, current_stage, notes) VALUES ($1,$2,$3)`,
      [businessId, "manual_delivery", "Demo workspace — System Preview."],
    );
    console.log("operating_models: inserted 1");
  } else console.log("operating_models: skip");

  // 4. Audit session + findings.
  if ((await countFor("audit_sessions", businessId)) === 0) {
    const s = await query(
      `INSERT INTO audit_sessions (business_id, business_name, industry, status, priority_score)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [businessId, DEMO_AUDIT_SESSION.businessName, DEMO_AUDIT_SESSION.industry, DEMO_AUDIT_SESSION.status, DEMO_AUDIT_SESSION.priorityScore],
    );
    const sessionId = s[0].id;
    for (const f of DEMO_AUDIT_FINDINGS) {
      await query(
        `INSERT INTO audit_findings (business_id, session_id, category, title, pain, impact_area, priority, status, recommended_stage, recommended_agents)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'open',$8,$9::jsonb)`,
        [businessId, sessionId, f.category, f.title, f.pain, f.impactArea, f.priority, f.recommendedStage, JSON.stringify(f.recommendedAgents)],
      );
    }
    console.log(`audit: session + ${DEMO_AUDIT_FINDINGS.length} findings`);
  } else console.log("audit: skip");

  // 5. Waiting room.
  if ((await countFor("waiting_room_items", businessId)) === 0) {
    for (const w of DEMO_WAITING_ROOM) {
      await query(
        `INSERT INTO waiting_room_items (business_id, customer_name, company, channel, reason, waiting_for, urgency, status, suggested_action, assigned_agent)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [businessId, w.customerName, w.company, w.channel, w.reason, w.waitingFor, w.urgency, w.status, w.suggestedAction, w.assignedAgent],
      );
    }
    console.log(`waiting_room: inserted ${DEMO_WAITING_ROOM.length}`);
  } else console.log("waiting_room: skip");

  // 6. Documents + required actions.
  if ((await countFor("document_intake_items", businessId)) === 0) {
    for (const d of DEMO_DOCUMENTS) {
      const dr = await query(
        `INSERT INTO document_intake_items (business_id, title, type, source, summary, status, risk_level, assigned_agent, suggested_response)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [businessId, d.title, d.type, d.source, d.summary, d.status, d.riskLevel, d.assignedAgent, d.suggestedResponse ?? null],
      );
      const docId = dr[0].id;
      for (const a of d.requiredActions ?? []) {
        const deadline = new Date(Date.now() + (a.deadlineDays ?? 7) * 86400000).toISOString();
        await query(
          `INSERT INTO document_required_actions (document_id, label, deadline) VALUES ($1,$2,$3)`,
          [docId, a.label, deadline],
        );
      }
    }
    console.log(`documents: inserted ${DEMO_DOCUMENTS.length}`);
  } else console.log("documents: skip");

  // 7. Governance: tools, risks, policy.
  if ((await countFor("ai_tool_register", businessId)) === 0) {
    for (const t of DEMO_AI_TOOLS) {
      await query(
        `INSERT INTO ai_tool_register (business_id, name, category, status, usage_note) VALUES ($1,$2,$3,$4,$5)`,
        [businessId, t.name, t.category, t.status, t.usageNote],
      );
    }
    console.log(`ai_tool_register: inserted ${DEMO_AI_TOOLS.length}`);
  } else console.log("ai_tool_register: skip");

  if ((await countFor("ai_governance_risks", businessId)) === 0) {
    for (const r of DEMO_GOVERNANCE_RISKS) {
      await query(
        `INSERT INTO ai_governance_risks (business_id, area, description, level, recommended_action) VALUES ($1,$2,$3,$4,$5)`,
        [businessId, r.area, r.description, r.level, r.recommendedAction],
      );
    }
    console.log(`ai_governance_risks: inserted ${DEMO_GOVERNANCE_RISKS.length}`);
  } else console.log("ai_governance_risks: skip");

  if ((await countFor("ai_policy_checklists", businessId)) === 0) {
    for (const p of DEMO_POLICY_CHECKLIST) {
      await query(
        `INSERT INTO ai_policy_checklists (business_id, label, done) VALUES ($1,$2,$3)`,
        [businessId, p.label, p.done],
      );
    }
    console.log(`ai_policy_checklists: inserted ${DEMO_POLICY_CHECKLIST.length}`);
  } else console.log("ai_policy_checklists: skip");

  // 8. Proposals + one approval_event each (audit trail).
  if ((await countFor("agent_proposals", businessId)) === 0) {
    for (const p of DEMO_PROPOSALS) {
      const pr = await query(
        `INSERT INTO agent_proposals (business_id, agent_key, title, business_context, proposed_action, expected_outcome, risk_level, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING id`,
        [businessId, p.agentKey, p.title, p.businessContext, p.proposedAction, p.expectedOutcome, p.riskLevel],
      );
      const propId = pr[0].id;
      await query(
        `INSERT INTO approval_events (business_id, proposal_id, step, actor, note) VALUES ($1,$2,'proposed','agent',$3)`,
        [businessId, propId, "Vorschlag vorgelegt — wartet auf menschliche Freigabe."],
      );
    }
    console.log(`agent_proposals: inserted ${DEMO_PROPOSALS.length} (+approval_events)`);
  } else console.log("agent_proposals: skip");

  // 9. Playbooks + steps.
  if ((await countFor("playbooks", businessId)) === 0) {
    for (const b of DEMO_PLAYBOOKS) {
      const pb = await query(
        `INSERT INTO playbooks (business_id, key, title, business_pain, "trigger", operating_stage, approval_required, reusable_template)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true) RETURNING id`,
        [businessId, b.key, b.title, b.businessPain, b.trigger, b.operatingStage, b.approvalRequired],
      );
      const pbId = pb[0].id;
      for (const s of b.steps) {
        await query(
          `INSERT INTO playbook_steps (playbook_id, step_order, label, lifecycle) VALUES ($1,$2,$3,$4)`,
          [pbId, s.order, s.label, s.lifecycle],
        );
      }
    }
    console.log(`playbooks: inserted ${DEMO_PLAYBOOKS.length} (+steps)`);
  } else console.log("playbooks: skip");

  // 10. Activity log.
  if ((await countFor("activity_logs", businessId)) === 0) {
    for (const a of DEMO_ACTIVITY) {
      await query(
        `INSERT INTO activity_logs (business_id, actor, actor_name, action, target, detail) VALUES ($1,$2,$3,$4,$5,$6)`,
        [businessId, a.actor, a.actorName, a.action, a.target, a.detail],
      );
    }
    console.log(`activity_logs: inserted ${DEMO_ACTIVITY.length}`);
  } else console.log("activity_logs: skip");

  console.log(`\n✅ Demo seed complete. demo business_id = ${businessId}`);
  console.log("   No lead tables touched. No outbound action taken.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("SEED FAILED:", e?.message ?? e);
    process.exit(1);
  });
