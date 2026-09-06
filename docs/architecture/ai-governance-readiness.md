# AI Governance Readiness

**Status:** Preparation only. Nothing here has been built.
**For:** Track B — the AI Governance Programme
**Written:** 2026-09-05 (v14.0)

---

## What this document is

v14.0 was told to prepare the repository for Track B and **not to begin it**. So
this is a map, not a plan: where each AI concern lives today, where it belongs,
and what would have to move. No prompt was edited, no assistant behaviour was
changed, and no AI code was touched during v14.0.

Read it before Track B starts, so the programme begins from measurement rather
than from discovery.

---

## The finding that shapes everything below

**There are two AI stacks, and neither knows about the other.**

| | `apps/web` | `apps/bureau` |
|---|---|---|
| Provider abstraction | `lib/ai.ts` | `lib/ai/provider.ts` + two provider files |
| Prompts | `lib/prompts.ts` (136 lines) | `lib/ai/prompts.ts` (49 lines) |
| Safety | none | `lib/ai/safety.ts` — input bounds, a sensitive-domain risk floor |
| Types | `lib/chat/types.ts` | `lib/ai/types.ts` |
| Memory | `lib/chat/memory.ts` — Neon, `chat` schema | `memory_entries` table |
| Model named in | 8 files | 2 files |

This is the platform's first rule broken in the one place it has not yet been
paid for: *never two implementations*. Two design systems cost this repository
a consolidation; two AI stacks would cost it a safety posture that applies on
one surface and not the other — which is already true today, because
`apps/bureau` validates input length and refuses a sensitive domain without
review, and `apps/web` does neither.

Track B's first decision is therefore not about prompts. It is whether there is
one AI layer or two.

---

## Where each concern belongs

### Prompts

**Today:** `apps/web/lib/prompts.ts` and `apps/bureau/lib/ai/prompts.ts`. Both
are TypeScript modules of template literals, versioned only by git.

**Belongs:** `packages/ai/prompts/`, one file per assistant task, with the same
treatment the Domain and Brand registries got — a declared record per prompt
carrying its id, the task it serves, its inputs, its output contract, and the
model it was written against.

**Why not in an application:** a prompt is a business rule wearing prose. The
audit prompt in `apps/web/lib/prompts.ts` already encodes a commercial
constraint in a comment — *"Time, not money — a monetary figure here becomes a
saving the company did not promise"* — which is a claims-discipline rule
(ADR-0007) living inside a string literal that nothing checks.

### Business rules

**Today:** distributed. Some in prompts as prose, some in route handlers, some
in `lib/registry/products.ts` as content.

**Belongs:** `packages/config/`, beside the other registries, expressed as data
a check can read. The test is simple: *if a rule matters, can something fail on
it?* "Never quote a monetary saving" currently cannot.

### Knowledge

**Today:** `docs/openclaw/core-memory.md` for the company; `products.ts` for
the products; the message catalogues for the site's own copy.

**Belongs:** where it already is. Knowledge is documentation and content, and it
already has one authoritative location each. Track B needs a **retrieval
boundary**, not a new copy of the knowledge — the failure mode here is a
knowledge base that drifts from the documentation it was built from.

Track B should treat `docs/` and the registries as the source and index them,
never as something to duplicate into a vector store that nobody re-syncs.

### Memory

**Today:** `apps/web/lib/chat/memory.ts` — Neon, `chat` schema, keyed on a
per-visitor cookie. `apps/bureau` has a separate `memory_entries` table in a
separate database in a separate region.

**Belongs:** one schema with an explicit retention policy, and a decision about
region. Two live constraints:

- The bureau's database is in `us-east-1` and holds `memory_entries` alongside
  `contacts` and `leads`, while the page above them claims EU hosting. Open in
  `governance/known-risks.md`; Track B cannot expand memory until it is settled.
- Conversation memory is personal data. Retention, deletion and subject-access
  are Track B deliverables, not later ones.

### Assistant policies

**Today:** `apps/bureau/lib/ai/safety.ts` only — input bounds and a
sensitive-domain risk floor covering tax, finance, invoicing, legal and
contracts. `apps/web`'s chat has no equivalent.

**Belongs:** `packages/ai/policy/`, applied by both applications, expressed as
data rather than as a list inside one file. What a policy must say: which tasks
may run unsupervised, which need approval, what is refused outright, and what
the assistant may claim about the company.

That last one is the join with **ADR-0007**: `audit:claims` checks the copy a
human wrote. An assistant generates copy at runtime, and nothing checks that.

### Evaluation

**Today:** nothing. There is no evaluation harness, no fixture set, no
regression suite for assistant output.

**Belongs:** `packages/ai/eval/` with fixtures in-repo, and a report-only entry
in `certify` beside `audit:claims` — never a merge gate that a model provider's
weather can turn red.

The shape is already established here: a check that examines nothing must say
so; a rule must be demonstrated failing before it is believed (**ADR-0004**);
and an evaluation that cannot fail is not an evaluation.

---

## Proposed layout

```
packages/ai/
  prompts/     one record per prompt: id, task, inputs, output contract, model
  policy/      what may run unsupervised, what needs approval, what is refused
  providers/   one provider abstraction, two implementations
  memory/      schema, retention, deletion
  eval/        fixtures and the harness
```

Nothing has been created. The directory does not exist, and creating it before
the first decision is made would be building.

---

## What Track B should measure first

1. **The chat assistant receives no product context.** `api/chat/session` and
   `api/chat/message` read `x-mp-slug` and `x-mp-default-locale`; the middleware
   matcher excludes `/api/*` except `/api/os`, so those headers never arrive.
   Every session is recorded with `productSlug: null` and locale `de` — a chat
   opened on `drive24.live` is stored as German, with no product. The Domain
   Registry already names the identity each domain reports under
   (`chatIdentity`); nothing reads it yet. Open in `governance/known-risks.md`.

2. **The model is named in ten files.** `claude-sonnet-4-6` appears in eight
   files in `apps/web` and two in `apps/bureau`. A model upgrade is currently a
   ten-file edit, and a partial one is silent.

3. **One stack has a safety layer and the other does not.** Establish which
   posture is correct before consolidating, rather than inheriting whichever
   file gets moved first.

4. **Nothing checks what an assistant says about the company.** The claims audit
   covers authored copy. Generated copy is unexamined.

---

## What v14.0 deliberately did not do

- Did not create `packages/ai/`
- Did not move, merge or edit a prompt
- Did not change assistant behaviour, model selection or safety rules
- Did not touch the chat routes, the memory module or either provider
- Did not implement retrieval

The one AI-adjacent change in v14.0 was to `lib/email.ts` and
`lib/documents/emailHtml.ts` — CSS custom properties in email markup, unrelated
to the assistants.

---

See `PLATFORM-CONSTITUTION.md` for the platform's rules and
`governance/known-risks.md` for what is open.
