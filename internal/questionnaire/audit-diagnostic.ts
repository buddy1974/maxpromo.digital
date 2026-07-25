/**
 * audit-diagnostic.ts
 *
 * Universal Business Diagnostic — Architecture Layer
 *
 * Extensibility contract:
 *  - Add new DiagnosticCategoryId values to the union type
 *  - Add the category metadata to DIAGNOSTIC_CATEGORIES
 *  - Map new option strings → categories in OPTION_SCORES
 *  - Add new AuditSection entries to AUDIT_SECTIONS
 *  No component changes required.
 */

// ── Category Identifiers ────────────────────────────────────────────────────

export type DiagnosticCategoryId =
  | 'workflow-automation'
  | 'document-automation'
  | 'reporting-improvements'
  | 'operational-visibility'
  | 'communication-improvements'
  | 'compliance-support'
  | 'knowledge-management'
  | 'ai-assisted-operations'
  | 'process-optimization'

export interface DiagnosticCategory {
  id: DiagnosticCategoryId
  label: string
  description: string
}

export const DIAGNOSTIC_CATEGORIES: Record<DiagnosticCategoryId, DiagnosticCategory> = {
  'workflow-automation': {
    id: 'workflow-automation',
    label: 'Workflow Automation',
    description: 'Repetitive processes that can be automated end-to-end, eliminating manual handoffs',
  },
  'document-automation': {
    id: 'document-automation',
    label: 'Document Automation',
    description: 'Document creation, retrieval, classification, and processing at scale',
  },
  'reporting-improvements': {
    id: 'reporting-improvements',
    label: 'Reporting Improvements',
    description: 'Real-time dashboards and automated report generation across your data sources',
  },
  'operational-visibility': {
    id: 'operational-visibility',
    label: 'Operational Visibility',
    description: 'Live status across operations, teams, projects, and workloads',
  },
  'communication-improvements': {
    id: 'communication-improvements',
    label: 'Communication Improvements',
    description: 'Faster response, automated follow-ups, and reduced communication overhead',
  },
  'compliance-support': {
    id: 'compliance-support',
    label: 'Compliance Support',
    description: 'Automated compliance tracking, documentation, and audit preparation',
  },
  'knowledge-management': {
    id: 'knowledge-management',
    label: 'Knowledge Management',
    description: 'Capturing, organizing, and surfacing institutional knowledge across your team',
  },
  'ai-assisted-operations': {
    id: 'ai-assisted-operations',
    label: 'AI-Assisted Operations',
    description: 'Intelligent automation for complex, judgment-based operational tasks',
  },
  'process-optimization': {
    id: 'process-optimization',
    label: 'Process Optimization',
    description: 'Eliminating waste, bottlenecks, and repeated manual steps from core processes',
  },
}

// ── Section Definitions ─────────────────────────────────────────────────────

export type SectionType = 'multi-select' | 'textarea'

export interface AuditSectionOption {
  label: string
}

export interface AuditSection {
  id: string
  step: number
  headline: string
  subheadline: string
  type: SectionType
  options?: string[]
  textareaPlaceholder?: string
  textareaMinLength?: number
}

export const AUDIT_SECTIONS: AuditSection[] = [
  {
    id: 'stress',
    step: 1,
    headline: 'What slows your business down every week?',
    subheadline: 'Select everything that causes friction. There are no wrong answers.',
    type: 'multi-select',
    options: [
      'Too many emails',
      'Too many WhatsApp messages',
      'Missed customer enquiries',
      'Missed calls',
      'Slow response times',
      'Paperwork overload',
      'Reporting takes too long',
      'Compliance requirements',
      'Too many spreadsheets',
      'Data entered multiple times',
      'Staff repeat the same work',
      'Information scattered everywhere',
      'Documents difficult to find',
      'Approvals take too long',
      'Customers ask the same questions repeatedly',
      'Follow-ups are forgotten',
      'Scheduling chaos',
      'Lack of visibility',
      'Other',
    ],
  },
  {
    id: 'timeLeaks',
    step: 2,
    headline: 'Where does your business lose the most time?',
    subheadline: 'Select all areas where hours disappear each week.',
    type: 'multi-select',
    options: [
      'Customer communication',
      'Document preparation',
      'Reporting',
      'Scheduling',
      'Internal coordination',
      'Compliance',
      'Data entry',
      'Approvals',
      'Customer onboarding',
      'Employee onboarding',
      'Order processing',
      'Financial administration',
      'Inventory management',
      'Quality control',
      'Project tracking',
      'Other',
    ],
  },
  {
    id: 'manualWork',
    step: 3,
    headline: 'Which tasks are still done manually?',
    subheadline: 'Select every task your team does by hand that could potentially run automatically.',
    type: 'multi-select',
    options: [
      'Creating reports',
      'Compiling customer documents',
      'Chasing invoices',
      'Entering customer data',
      'Preparing compliance paperwork',
      'Filing receipts',
      'Preparing quotations',
      'Updating spreadsheets',
      'Preparing certificates',
      'Customer onboarding',
      'Employee onboarding',
      'Status updates',
      'Approval processes',
      'Quality checks',
      'Data consolidation',
      'Other',
    ],
  },
  {
    id: 'documentChaos',
    step: 4,
    headline: 'How do documents affect your daily work?',
    subheadline: 'Select every statement that applies to your business today.',
    type: 'multi-select',
    options: [
      'Information lives in multiple systems',
      'Staff constantly search for files',
      'Reports take too long to prepare',
      'Compliance documentation is difficult',
      'Customer packages are built manually',
      'Documents are duplicated',
      'We manually compile evidence and records',
      'We manually create customer folders',
      'Important files are hard to find',
      'We repeatedly collect the same information',
      'Other',
    ],
  },
  {
    id: 'knowledgeBottleneck',
    step: 5,
    headline: 'Does important knowledge depend on specific people?',
    subheadline: 'Select every situation that reflects how knowledge works in your business.',
    type: 'multi-select',
    options: [
      'One employee knows everything',
      'New staff require extensive training',
      'Procedures are undocumented',
      'Staff repeatedly ask the same questions',
      'Information is difficult to locate',
      'Knowledge leaves when employees leave',
      "Processes exist only in people's heads",
      'Other',
    ],
  },
  {
    id: 'qualityVerification',
    step: 6,
    headline: 'What requires repetitive checking or verification?',
    subheadline: 'Select every area where your team spends time checking and re-checking.',
    type: 'multi-select',
    options: [
      'Calculations',
      'Specifications',
      'Quotes',
      'Customer requirements',
      'Compliance requirements',
      'Reports',
      'Technical documents',
      'Quality standards',
      'Contracts',
      'Financial records',
      'Production records',
      'Audit evidence',
      'Other',
    ],
  },
  {
    id: 'reportingVisibility',
    step: 7,
    headline: 'What information do you wish you could see instantly?',
    subheadline: 'Select every view that would improve how you run the business.',
    type: 'multi-select',
    options: [
      'Business performance',
      'Project status',
      'Customer status',
      'Outstanding invoices',
      'Team workload',
      'Compliance readiness',
      'Operational bottlenecks',
      'Financial overview',
      'Sales performance',
      'Service delivery status',
      'Production progress',
      'Other',
    ],
  },
  {
    id: 'aiOpportunity',
    step: 8,
    headline: 'What would you love an intelligent assistant to handle?',
    subheadline: 'This is not about chatbots. Select the operational tasks AI could take off your plate.',
    type: 'multi-select',
    options: [
      'Reading documents',
      'Preparing reports',
      'Summarizing meetings',
      'Organizing files',
      'Monitoring deadlines',
      'Reviewing calculations',
      'Reviewing specifications',
      'Checking compliance requirements',
      'Generating proposals',
      'Preparing customer packages',
      'Creating certificates',
      'Extracting information from PDFs',
      'Analyzing spreadsheets',
      'Reviewing contracts',
      'Creating customer updates',
      'Monitoring workflows',
      'Other',
    ],
  },
  {
    id: 'ceoQuestion',
    step: 9,
    headline: 'What is the single most frustrating problem in your business today?',
    subheadline: 'Describe it in your own words. No filters, no polish — just the real situation.',
    type: 'textarea',
    textareaPlaceholder:
      'e.g. Every month we spend two days manually compiling a compliance report from six different spreadsheets. By the time it\'s done, the data is already out of date. We know something is wrong but we don\'t know where to start...',
    textareaMinLength: 20,
  },
]

// ── Scoring Engine ──────────────────────────────────────────────────────────

/**
 * Option → category mapping.
 * Keys are option label strings. Values are categories that selection signals.
 * Extend freely — adding entries here immediately affects scoring without
 * touching any component code.
 */
const OPTION_SCORES: Record<string, DiagnosticCategoryId[]> = {
  // ── Section 1: Stress ────────────────────────────────────────────────────
  'Too many emails': ['communication-improvements'],
  'Too many WhatsApp messages': ['communication-improvements'],
  'Missed customer enquiries': ['communication-improvements', 'workflow-automation'],
  'Missed calls': ['communication-improvements'],
  'Slow response times': ['communication-improvements', 'workflow-automation'],
  'Paperwork overload': ['document-automation', 'workflow-automation'],
  'Reporting takes too long': ['reporting-improvements'],
  'Compliance requirements': ['compliance-support'],
  'Too many spreadsheets': ['document-automation', 'reporting-improvements'],
  'Data entered multiple times': ['workflow-automation', 'process-optimization'],
  'Staff repeat the same work': ['workflow-automation', 'process-optimization'],
  'Information scattered everywhere': ['document-automation', 'knowledge-management'],
  'Documents difficult to find': ['document-automation', 'knowledge-management'],
  'Approvals take too long': ['workflow-automation', 'process-optimization'],
  'Customers ask the same questions repeatedly': ['communication-improvements', 'ai-assisted-operations'],
  'Follow-ups are forgotten': ['workflow-automation', 'communication-improvements'],
  'Scheduling chaos': ['workflow-automation'],
  'Lack of visibility': ['operational-visibility'],

  // ── Section 2: Time Leaks ────────────────────────────────────────────────
  'Customer communication': ['communication-improvements', 'workflow-automation'],
  'Document preparation': ['document-automation'],
  'Reporting': ['reporting-improvements'],
  'Scheduling': ['workflow-automation'],
  'Internal coordination': ['workflow-automation', 'knowledge-management'],
  'Compliance': ['compliance-support'],
  'Data entry': ['workflow-automation', 'process-optimization'],
  'Approvals': ['workflow-automation', 'process-optimization'],
  'Customer onboarding': ['workflow-automation', 'document-automation'],
  'Employee onboarding': ['knowledge-management'],
  'Order processing': ['workflow-automation', 'process-optimization'],
  'Financial administration': ['document-automation', 'reporting-improvements'],
  'Inventory management': ['operational-visibility'],
  'Quality control': ['process-optimization'],
  'Project tracking': ['operational-visibility'],

  // ── Section 3: Manual Work ───────────────────────────────────────────────
  'Creating reports': ['reporting-improvements', 'ai-assisted-operations'],
  'Compiling customer documents': ['document-automation', 'ai-assisted-operations'],
  'Chasing invoices': ['workflow-automation'],
  'Entering customer data': ['workflow-automation', 'process-optimization'],
  'Preparing compliance paperwork': ['compliance-support', 'document-automation'],
  'Filing receipts': ['document-automation'],
  'Preparing quotations': ['workflow-automation', 'ai-assisted-operations'],
  'Updating spreadsheets': ['reporting-improvements', 'process-optimization'],
  'Preparing certificates': ['document-automation', 'compliance-support'],
  'Status updates': ['communication-improvements', 'operational-visibility'],
  'Approval processes': ['workflow-automation', 'process-optimization'],
  'Quality checks': ['process-optimization', 'ai-assisted-operations'],
  'Data consolidation': ['reporting-improvements', 'workflow-automation'],

  // ── Section 4: Document Chaos ────────────────────────────────────────────
  'Information lives in multiple systems': ['document-automation', 'knowledge-management'],
  'Staff constantly search for files': ['document-automation', 'knowledge-management'],
  'Reports take too long to prepare': ['document-automation', 'reporting-improvements'],
  'Compliance documentation is difficult': ['document-automation', 'compliance-support'],
  'Customer packages are built manually': ['document-automation', 'ai-assisted-operations'],
  'Documents are duplicated': ['document-automation', 'process-optimization'],
  'We manually compile evidence and records': ['document-automation', 'ai-assisted-operations'],
  'We manually create customer folders': ['document-automation', 'workflow-automation'],
  'Important files are hard to find': ['document-automation', 'knowledge-management'],
  'We repeatedly collect the same information': ['workflow-automation', 'document-automation'],

  // ── Section 5: Knowledge Bottleneck ─────────────────────────────────────
  'One employee knows everything': ['knowledge-management'],
  'New staff require extensive training': ['knowledge-management', 'process-optimization'],
  'Procedures are undocumented': ['knowledge-management', 'process-optimization'],
  'Staff repeatedly ask the same questions': ['knowledge-management', 'ai-assisted-operations'],
  'Information is difficult to locate': ['knowledge-management', 'document-automation'],
  'Knowledge leaves when employees leave': ['knowledge-management'],
  "Processes exist only in people's heads": ['knowledge-management', 'process-optimization'],

  // ── Section 6: Quality & Verification ───────────────────────────────────
  'Calculations': ['process-optimization', 'ai-assisted-operations'],
  'Specifications': ['process-optimization', 'ai-assisted-operations'],
  'Quotes': ['workflow-automation', 'ai-assisted-operations'],
  'Customer requirements': ['ai-assisted-operations', 'process-optimization'],
  'Reports': ['reporting-improvements', 'ai-assisted-operations'],
  'Technical documents': ['document-automation', 'ai-assisted-operations'],
  'Quality standards': ['process-optimization', 'compliance-support'],
  'Contracts': ['document-automation', 'ai-assisted-operations'],
  'Financial records': ['reporting-improvements', 'ai-assisted-operations'],
  'Production records': ['operational-visibility', 'process-optimization'],
  'Audit evidence': ['compliance-support', 'document-automation'],

  // ── Section 7: Reporting & Visibility ───────────────────────────────────
  'Business performance': ['operational-visibility', 'reporting-improvements'],
  'Project status': ['operational-visibility'],
  'Customer status': ['operational-visibility', 'communication-improvements'],
  'Outstanding invoices': ['reporting-improvements', 'workflow-automation'],
  'Team workload': ['operational-visibility'],
  'Compliance readiness': ['compliance-support', 'reporting-improvements'],
  'Operational bottlenecks': ['operational-visibility', 'process-optimization'],
  'Financial overview': ['reporting-improvements', 'operational-visibility'],
  'Sales performance': ['reporting-improvements', 'operational-visibility'],
  'Service delivery status': ['operational-visibility'],
  'Production progress': ['operational-visibility', 'process-optimization'],

  // ── Section 8: AI Opportunity ────────────────────────────────────────────
  'Reading documents': ['ai-assisted-operations', 'document-automation'],
  'Preparing reports': ['ai-assisted-operations', 'reporting-improvements'],
  'Summarizing meetings': ['ai-assisted-operations', 'knowledge-management'],
  'Organizing files': ['ai-assisted-operations', 'document-automation'],
  'Monitoring deadlines': ['ai-assisted-operations', 'workflow-automation'],
  'Reviewing calculations': ['ai-assisted-operations', 'process-optimization'],
  'Reviewing specifications': ['ai-assisted-operations', 'process-optimization'],
  'Checking compliance requirements': ['ai-assisted-operations', 'compliance-support'],
  'Generating proposals': ['ai-assisted-operations', 'workflow-automation'],
  'Preparing customer packages': ['ai-assisted-operations', 'document-automation'],
  'Creating certificates': ['ai-assisted-operations', 'document-automation'],
  'Extracting information from PDFs': ['ai-assisted-operations', 'document-automation'],
  'Analyzing spreadsheets': ['ai-assisted-operations', 'reporting-improvements'],
  'Reviewing contracts': ['ai-assisted-operations', 'document-automation'],
  'Creating customer updates': ['ai-assisted-operations', 'communication-improvements'],
  'Monitoring workflows': ['ai-assisted-operations', 'operational-visibility'],
}

/**
 * computeDiagnosticCategories
 *
 * Accepts a flat array of all selected option labels from all sections.
 * Returns detected category IDs sorted by signal strength (hit count desc).
 * Only categories with at least 1 hit are returned.
 *
 * Add new options to OPTION_SCORES above — this function requires no changes.
 */
export function computeDiagnosticCategories(
  allSelections: string[],
): DiagnosticCategoryId[] {
  const counts: Partial<Record<DiagnosticCategoryId, number>> = {}

  for (const selection of allSelections) {
    const cats = OPTION_SCORES[selection] ?? []
    for (const cat of cats) {
      counts[cat] = (counts[cat] ?? 0) + 1
    }
  }

  return (Object.entries(counts) as [DiagnosticCategoryId, number][])
    .filter(([, count]) => count >= 1)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id)
}

// ── Payload Types ───────────────────────────────────────────────────────────

export interface DiagnosticContactData {
  name: string
  company: string
  email: string
  phone: string
}

export interface DiagnosticPayload {
  selections: Record<string, string[]> // sectionId → selected options
  ceoQuestion: string
  contact: DiagnosticContactData
  detectedCategories: DiagnosticCategoryId[]
}
