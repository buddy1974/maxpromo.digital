/**
 * packages/config/proof.ts
 *
 * What Maxpromo has actually delivered, what proves it, and what that permits
 * the company to say in public.
 *
 * THE PRINCIPLE
 *
 *   Evidence is recorded once. Publication is a projection of what the
 *   evidence and the permissions allow.
 *
 * Every surface that describes a project today retells it from a different
 * place. The case-study narrative lives in the i18n catalogue as translatable
 * interface copy. `apps/web/lib/work-entries.ts` decides which of those message
 * keys the Work page may render. `claims.ts` decides which figures may
 * persuade. Three files, three angles, and none of them is the project.
 *
 * That is why the same figure could be published in two currencies for months:
 * there was no single place where "what do we actually know about this
 * project" was written down, so every surface answered it independently.
 *
 * A proof package is that place. It is not a CMS and it is not trying to
 * become one. It is a record of what happened and what backs it, from which a
 * Work entry, a case study, a diagram, a video script or a demo briefing can
 * later be derived without any of them inventing a fact.
 *
 * WHAT THIS FILE DOES NOT DO
 *
 * It does not replace `claims.ts`, which is enforcing publication rules on
 * live production today and keeps doing so. The relationship is recorded in
 * ADR-0017 and the short version is that a claim record is the *enforcement*
 * view of a fact whose *provenance* belongs here. Migration is by reference,
 * not by rewrite, and the blocking gate is never weakened to get there.
 *
 * It does not publish anything. Nothing in this file reaches a page until a
 * projection is built and reviewed, which is Phase B3 at the earliest.
 */

/* ────────────────────────────────────────────────────────────────────────────
   EVIDENCE CLASSES

   How a thing is known. Not how confident anyone feels about it: there is no
   score, no percentage and no traffic light, because a number attached to a
   belief is a way of avoiding writing down what is actually known.

   The order matters in one place only, `mayPublish` below, and even there it
   is a lookup rather than a ranking.
   ──────────────────────────────────────────────────────────────────────────── */

export type EvidenceBasis =
  /** Source, schema or configuration in this repository proves it. The
   *  strongest basis available for a statement about how software behaves,
   *  and worthless for a statement about what a business saved. */
  | 'repository'
  /** A document exists and has been read: an export, a report, a signed
   *  agreement, a scan. Named in the package so it can be found again. */
  | 'artefact'
  /** A record in a running system, observed. Proves a state was reached; it
   *  does not prove why, and it does not prove the state was caused by us. */
  | 'system-data'
  /** Marcel says so. Legitimate, frequently the only thing available, and
   *  never silently upgraded into a measurement. */
  | 'owner-attested'
  /** The client says so, in writing we hold. Carries its own permission
   *  question, which is why attestation and permission are separate fields. */
  | 'client-attested'
  /** Derived arithmetically from an artefact or from system data, with the
   *  method recorded. The only basis a public quantitative outcome may use. */
  | 'measured'
  /** Published at some point, provenance never established. Not false, not
   *  evidenced. Everything in `claims.ts` currently sits here. */
  | 'historical-claim'
  /** Nobody has established it. The default, and never an implicit yes. */
  | 'unknown'

/* ────────────────────────────────────────────────────────────────────────────
   CLAIM KINDS

   What sort of statement is being made. This exists because the same evidence
   is adequate for one kind of claim and useless for another, and treating them
   alike is how a code fact becomes a business result.

   "An extracted quotation is not saved until the operator saves it" is proved
   by reading the code. "The customer saved twelve hours a week" is not proved
   by anything in a repository, ever.
   ──────────────────────────────────────────────────────────────────────────── */

export type ClaimKind =
  /** What the software does. Provable from source. */
  | 'system-fact'
  /** How work moves through the business, including who decides. Provable
   *  from source where the software mediates the step; otherwise attested. */
  | 'process-fact'
  /** A described improvement carrying no number. "Nobody retypes the
   *  enquiry." Weaker than a measurement and much easier to stand behind. */
  | 'qualitative-outcome'
  /** Any quantity: time, percentage, money, volume, duration. The kind that
   *  needs a measurement, per the publication rule the company adopted on
   *  2026-09-20 and recorded in `claims.ts`. */
  | 'quantitative-outcome'
  /** Naming the client, or identifying them closely enough that naming them
   *  would be redundant. */
  | 'customer-attribution'
  /** Words attributed to a client. Needs both attestation and permission,
   *  which are different things. */
  | 'testimonial'
  /** A screenshot, recording or diagram of a real system. */
  | 'media'

/* ────────────────────────────────────────────────────────────────────────────
   PERMISSION

   Granular on purpose. A client agreeing to be named has not agreed to a
   screenshot of their data, and a client agreeing to a screenshot has not
   agreed to a figure about their costs.

   `unknown` is not `granted`. It is the default for every field, and the
   publication function treats it exactly as it treats `denied`, because the
   difference between "they said no" and "nobody asked" does not matter to the
   person whose information it is.
   ──────────────────────────────────────────────────────────────────────────── */

export type Permission = 'granted' | 'denied' | 'unknown' | 'not-applicable'

export interface Permissions {
  /** May the company be named in public. */
  readonly nameCompany: Permission
  /** May the industry or sector be stated, without the name. */
  readonly describeIndustry: Permission
  /** May the operational problem be described, anonymised. */
  readonly describeProblem: Permission
  /** May a screenshot of their instance or their data be shown. */
  readonly showMedia: Permission
  /** May the workflow be drawn and published, anonymised. */
  readonly showWorkflow: Permission
  /** May figures about their operation be published. */
  readonly showMetrics: Permission
  /** May words be attributed to them. */
  readonly useTestimonial: Permission
  /** May the system be demonstrated privately to a third party. */
  readonly privateDemo: Permission
}

/** Deny by default. Every field must be set deliberately to move off this. */
export const NO_PERMISSIONS: Permissions = {
  nameCompany: 'unknown',
  describeIndustry: 'unknown',
  describeProblem: 'unknown',
  showMedia: 'unknown',
  showWorkflow: 'unknown',
  showMetrics: 'unknown',
  useTestimonial: 'unknown',
  privateDemo: 'unknown',
}

/**
 * A system Maxpromo owns and runs itself.
 *
 * There is no third party, so there is nobody to ask. That is a real and
 * different situation from "the client agreed", and flattening the two would
 * make the permission model lie in the direction that matters least but
 * misleads most: it would look like consent was obtained when none was needed.
 */
export const OWN_SYSTEM_PERMISSIONS: Permissions = {
  nameCompany: 'not-applicable',
  describeIndustry: 'not-applicable',
  describeProblem: 'not-applicable',
  showMedia: 'not-applicable',
  showWorkflow: 'not-applicable',
  showMetrics: 'not-applicable',
  useTestimonial: 'not-applicable',
  privateDemo: 'not-applicable',
}

/* ────────────────────────────────────────────────────────────────────────────
   THE STATEMENTS A PACKAGE HOLDS
   ──────────────────────────────────────────────────────────────────────────── */

export interface ProofStatement {
  /** Stable id within the package. Referenced by claim records and by any
   *  future derived surface, so a published sentence can be traced back. */
  readonly id: string
  readonly kind: ClaimKind
  /** The statement itself, in English, as a fact rather than as copy. A
   *  derived surface rewrites it for its audience and its language; it may
   *  not add to it. */
  readonly statement: string
  readonly basis: EvidenceBasis
  /** Where the evidence is. A path, a route, a document name, a person.
   *  Required whenever `basis` is anything other than `unknown`. */
  readonly source: string
  /** Set when a person last checked the evidence still says this. */
  readonly checked?: string
}

/** Something the package knows it does not know. Visible, not filled in. */
export interface MissingEvidence {
  readonly id: string
  readonly question: string
  /** Who can answer. Nothing here is answerable by reading the repository. */
  readonly answerableBy: 'owner' | 'client' | 'measurement' | 'capture'
  /** What it would unblock, so the cost of not answering is legible. */
  readonly blocks: string
}

/** A media artefact that should exist, and does not yet. */
export interface MediaRequirement {
  readonly id: string
  readonly capture: string
  /** Route, component or state it is captured from. */
  readonly source: string
  readonly proves: string
  /** Stated explicitly, because a screenshot always proves less than it
   *  appears to and this is where that gets written down. */
  readonly doesNotProve: string
  readonly suitability: 'public' | 'private-only' | 'undecided'
  readonly dataRisk: 'none' | 'synthetic-required' | 'customer-data'
  readonly aspect: string
  /** Commercial placeholders this could fill once captured. */
  readonly targets: readonly string[]
  readonly priority: 'high' | 'medium' | 'low'
}

export type DemoState =
  | 'none'
  | 'synthetic-possible'
  | 'private-controlled'
  | 'public'

export interface ProofPackage {
  readonly id: string
  /** What the team calls it. May differ from anything published. */
  readonly internalName: string
  /** What a public surface may call it, when publication is permitted. */
  readonly publicTitle: string
  readonly category: string
  /** Own system, or client work. Drives which permission default applies. */
  readonly ownership: 'maxpromo' | 'client'
  readonly permissions: Permissions
  readonly statements: readonly ProofStatement[]
  readonly missing: readonly MissingEvidence[]
  readonly media: readonly MediaRequirement[]
  readonly demo: DemoState
  /** Claim ids in `packages/config/claims.ts` that describe this project, so
   *  the two registries are linked by reference rather than by duplication. */
  readonly relatedClaims: readonly string[]
  /** When a person last reviewed the whole package. */
  readonly reviewed: string
}

/* ────────────────────────────────────────────────────────────────────────────
   THE PUBLICATION POLICY

   One function, so no surface decides for itself. Returns a verdict and the
   reason, because a refusal a developer cannot understand becomes a refusal a
   developer works around.
   ──────────────────────────────────────────────────────────────────────────── */

export type Visibility = 'public' | 'private-only' | 'withheld'

export interface Verdict {
  readonly visibility: Visibility
  readonly reason: string
}

/** Bases that can carry a statement about how software or a process behaves. */
const FACTUAL_BASES: readonly EvidenceBasis[] = [
  'repository', 'artefact', 'system-data', 'measured',
]

/** The permission each kind of claim depends on. */
const REQUIRED_PERMISSION: Partial<Record<ClaimKind, keyof Permissions>> = {
  'customer-attribution': 'nameCompany',
  testimonial: 'useTestimonial',
  media: 'showMedia',
  'quantitative-outcome': 'showMetrics',
  'qualitative-outcome': 'describeProblem',
  'process-fact': 'showWorkflow',
}

/**
 * Whether one statement may be published, and where.
 *
 * Reading order matters: permission is checked before evidence. A statement
 * nobody has agreed to is withheld whether or not it is well evidenced, which
 * is the deny-by-default rule. Evidence then decides between public and
 * private for what remains.
 */
export function mayPublish(s: ProofStatement, p: Permissions): Verdict {
  const needed = REQUIRED_PERMISSION[s.kind]
  if (needed) {
    const state = p[needed]
    if (state === 'denied') {
      return { visibility: 'withheld', reason: `${needed} is denied` }
    }
    if (state === 'unknown') {
      return {
        visibility: 'withheld',
        reason: `${needed} is unknown, and unknown is never treated as consent`,
      }
    }
  }

  switch (s.kind) {
    /* Software behaviour is provable by reading the software. Anything else
       is somebody's account of it, which can be shown privately with the
       account attached but should not be stated publicly as fact. */
    case 'system-fact':
      return s.basis === 'repository'
        ? { visibility: 'public', reason: 'proved by source in this repository' }
        : { visibility: 'private-only', reason: `a system fact resting on ${s.basis} is an account, not a proof` }

    case 'process-fact':
      return FACTUAL_BASES.includes(s.basis)
        ? { visibility: 'public', reason: `established by ${s.basis}` }
        : { visibility: 'private-only', reason: `a process fact resting on ${s.basis} is attested, not established` }

    /* The rule the company adopted on 2026-09-20: an unsupported quantity may
       not persuade. `measured` is the only basis that supports one. */
    case 'quantitative-outcome':
      return s.basis === 'measured'
        ? { visibility: 'public', reason: 'measured, with its method recorded' }
        : { visibility: 'withheld', reason: `a quantity resting on ${s.basis} may not be used to persuade` }

    /* A described improvement with no number. Attestation is enough, because
       the statement claims less. */
    case 'qualitative-outcome':
      return s.basis === 'unknown' || s.basis === 'historical-claim'
        ? { visibility: 'withheld', reason: `nothing establishes this outcome (${s.basis})` }
        : { visibility: 'public', reason: `established by ${s.basis}` }

    case 'customer-attribution':
    case 'testimonial':
      return s.basis === 'client-attested'
        ? { visibility: 'public', reason: 'attested by the client, and permitted' }
        : { visibility: 'withheld', reason: `${s.kind} resting on ${s.basis} rather than on the client` }

    case 'media':
      return s.basis === 'artefact' || s.basis === 'system-data'
        ? { visibility: 'public', reason: 'a real capture, and permitted' }
        : { visibility: 'withheld', reason: `media resting on ${s.basis} is not a capture of anything` }
  }
}

/** Everything in a package that may appear on a page that persuades. */
export function publicStatements(pkg: ProofPackage): readonly ProofStatement[] {
  return pkg.statements.filter((s) => mayPublish(s, pkg.permissions).visibility === 'public')
}

/* ────────────────────────────────────────────────────────────────────────────
   THE PACKAGES
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Maxpromo OS — the capture-to-document flow.
 *
 * The first package, and the only one that can be written today without
 * asking anybody anything. It is the only product the registry marks `live`
 * and Maxpromo runs its own business on it, so there is no third party and no
 * consent question (docs/research/evidence-inventory-2026.md).
 *
 * Every statement below was verified against the code on 2026-09-20 rather
 * than copied from the earlier inventory. There are no outcomes, qualitative
 * or quantitative, because nothing measures this system and nothing needed to:
 * the package is worth having because it proves a real application, a real
 * automation and two real human decisions, which is what the commercial pages
 * claim and could not previously show.
 */
const MAXPROMO_OS: ProofPackage = {
  id: 'maxpromo-os-capture-to-document',
  internalName: 'Maxpromo OS — quotation and invoice capture',
  publicTitle: 'The system we run our own paperwork on',
  category: 'internal-operations',
  ownership: 'maxpromo',
  permissions: OWN_SYSTEM_PERMISSIONS,
  reviewed: '2026-09-20',

  statements: [
    {
      id: 'os-exists',
      kind: 'system-fact',
      statement:
        'Maxpromo runs its own quotations, invoices, clients, jobs, leads and ' +
        'newsletter through an application it built, behind authentication.',
      basis: 'repository',
      source: 'apps/web/app/os, 16 routes; six tables prefixed os_',
      checked: '2026-09-20',
    },
    {
      id: 'os-is-live',
      kind: 'system-fact',
      statement:
        'It is the only product the company registry marks as live rather ' +
        'than demo-ready.',
      basis: 'repository',
      source: "apps/web/lib/registry/products.ts — status: 'live'",
      checked: '2026-09-20',
    },
    {
      id: 'capture-accepts-real-input',
      kind: 'system-fact',
      statement:
        'The extraction endpoint accepts a photograph, a screenshot, a pasted ' +
        'email or typed notes, and returns structured order data. Greetings, ' +
        'signatures, disclaimers and timestamps are discarded.',
      basis: 'repository',
      source: 'apps/web/app/api/os/ai/scan-invoice/route.ts, its system prompt',
      checked: '2026-09-20',
    },
    {
      id: 'structure-by-schema',
      kind: 'system-fact',
      statement:
        'The structure of the extraction is guaranteed by a tool schema rather ' +
        'than by parsing text out of a reply.',
      basis: 'repository',
      source: 'apps/web/app/api/os/ai/enhance/route.ts',
      checked: '2026-09-20',
    },
    {
      id: 'extraction-creates-nothing',
      kind: 'system-fact',
      statement:
        'The extraction creates no record. Its result is written into the form ' +
        'the operator is looking at, and nothing is stored until a person saves.',
      basis: 'repository',
      source:
        'applyExtracted() in apps/web/app/os/(protected)/angebote/new/page.tsx ' +
        'calls only React state setters; the enhance route contains no INSERT',
      checked: '2026-09-20',
    },
    {
      id: 'human-saves',
      kind: 'process-fact',
      statement:
        'A person reviews and corrects the prepared document, then saves it. ' +
        'The record is created as a draft.',
      basis: 'repository',
      source:
        'handleSave() in angebote/new/page.tsx, bound to an explicit button; ' +
        "POST /api/os/angebote inserts with status 'draft'",
      checked: '2026-09-20',
    },
    {
      id: 'human-sends',
      kind: 'process-fact',
      statement:
        'Sending is a separate decision a person takes afterwards. It is not ' +
        'part of saving and cannot happen without it.',
      basis: 'repository',
      source: 'POST /api/os/send-angebot and /api/os/send-invoice, called from the detail views',
      checked: '2026-09-20',
    },
    {
      id: 'record-changes-state',
      kind: 'process-fact',
      statement:
        'Once sent, the record moves to sent with a timestamp, and continues ' +
        'through paid, overdue or accepted.',
      basis: 'repository',
      source: "send-invoice/route.ts: UPDATE os_invoices SET status = 'sent', sent_at = NOW()",
      checked: '2026-09-20',
    },
    {
      id: 'documents-are-german-compliant',
      kind: 'system-fact',
      statement:
        'The documents it produces carry the company’s legal identity and the ' +
        '§19 UStG clause from one governed source.',
      basis: 'repository',
      source: 'packages/config/legal.ts, consumed by lib/documents',
      checked: '2026-09-20',
    },
  ],

  missing: [
    {
      id: 'before-state',
      question:
        'How were quotations and invoices produced before this system existed?',
      answerableBy: 'owner',
      blocks:
        'Any before-and-after presentation. The package can describe how the ' +
        'work runs now without it, and nothing has been guessed.',
    },
    {
      id: 'operational-outcome',
      question:
        'Has any effect of this system on Maxpromo’s own work been measured?',
      answerableBy: 'measurement',
      blocks:
        'Every outcome statement, qualitative and quantitative. None is ' +
        'recorded, and the package is deliberately complete without one.',
    },
    {
      id: 'capture-environment',
      question:
        'May the evidence harness be pointed at a throwaway database so the ' +
        'screens can be photographed with synthetic records?',
      answerableBy: 'capture',
      blocks: 'Every media requirement below.',
    },
  ],

  media: [
    {
      id: 'os-source-note',
      capture: 'The enquiry as it arrives: a note with a greeting, an order and a signature',
      source: 'The extraction modal on angebote/new, before submission',
      proves: 'The system accepts real, messy input rather than a clean form',
      doesNotProve: 'That extraction is accurate, or that any customer sent this',
      suitability: 'public',
      dataRisk: 'synthetic-required',
      aspect: '16:10',
      targets: ['workflow-automation proof slot'],
      priority: 'high',
    },
    {
      id: 'os-extraction-result',
      capture: 'The structured result returned by the extraction',
      source: 'apps/web/app/os/(protected)/angebote/new/page.tsx, after applyExtracted',
      proves: 'Unstructured input becomes structured fields',
      doesNotProve: 'That the figures are correct, or that a record was created',
      suitability: 'public',
      dataRisk: 'synthetic-required',
      aspect: '16:10',
      targets: ['workflow-automation proof slot'],
      priority: 'high',
    },
    {
      id: 'os-form-before-save',
      capture: 'The populated quotation form with nothing yet saved',
      source: 'angebote/new, after extraction, before handleSave',
      proves: 'The single most important fact: the system prepares, and a person still decides',
      doesNotProve: 'That the operator changed anything',
      suitability: 'public',
      dataRisk: 'synthetic-required',
      aspect: '16:10',
      targets: ['workflow-automation proof slot', 'work entry'],
      priority: 'high',
    },
    {
      id: 'os-draft-record',
      capture: 'The saved quotation in draft',
      source: 'angebote/[id] detail view',
      proves: 'A record exists and has not been sent',
      doesNotProve: 'That it was ever sent or accepted',
      suitability: 'public',
      dataRisk: 'synthetic-required',
      aspect: '16:10',
      targets: ['custom-applications proof slot'],
      priority: 'medium',
    },
    {
      id: 'os-lifecycle-list',
      capture: 'The invoice list showing draft, sent and paid together',
      source: 'apps/web/app/os/(protected)/invoices/page.tsx',
      proves: 'The system carries a document through a lifecycle',
      doesNotProve: 'Any volume, value or timing',
      suitability: 'public',
      dataRisk: 'synthetic-required',
      aspect: '16:9',
      targets: ['custom-applications proof slot', 'work entry'],
      priority: 'medium',
    },
    {
      id: 'os-workflow-diagram',
      capture: 'The flow drawn from the code, marking which steps a person takes',
      source: 'docs/research/evidence-inventory-2026.md §L, the ten-step table',
      proves: 'The shape of the process, including both human decisions',
      doesNotProve: 'Anything about how long it takes or what it costs',
      suitability: 'public',
      dataRisk: 'none',
      aspect: '16:9',
      targets: ['workflow-automation', 'work entry', 'future system breakdown'],
      priority: 'high',
    },
  ],

  /* The harness exists and is dormant. Nothing is configured, nothing is
     seeded, and no grant exists. `synthetic-possible` records that the path
     is built, not that it is open. */
  demo: 'synthetic-possible',

  /* None. Maxpromo OS makes no claim that `claims.ts` governs, which is worth
     stating: this package is entirely free of the historical figures. */
  relatedClaims: [],
}

export const PROOF_PACKAGES: readonly ProofPackage[] = [MAXPROMO_OS]

export function getProofPackage(id: string): ProofPackage | undefined {
  return PROOF_PACKAGES.find((p) => p.id === id)
}
