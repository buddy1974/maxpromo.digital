import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import { sendEmail, buildAuditLeadEmailHtml } from '@/lib/email'
import type { AuditResult } from '@/components/AuditResults'

interface AuditRequestBody {
  questionnaire: {
    businessType: string
    companySize: string
    timeConsumingTasks: string
    currentTools: string
    processToAutomate: string
  }
  lead: {
    name: string
    email: string
    company: string
  }
}

const AUDIT_PROMPT = `You are an expert automation consultant specialising in n8n, AI agents, and API integrations.
A business has submitted the following profile:
- Business type: {businessType}
- Team size: {size}
- Most time-consuming tasks: {tasks}
- Current tools: {tools}
- Process they want automated: {process}

Identify exactly 3 automation opportunities.
For each opportunity respond with:
- title: Short name for the automation
- problem: One sentence describing the pain
- solution: Two sentences describing the AI/automation solution
- tools: Array of 2-4 tool names (e.g. n8n, Claude API, Zapier, CRM name)

Respond ONLY with a valid JSON array. No preamble. No markdown fences.`

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AuditRequestBody
    const { questionnaire, lead } = body

    if (!questionnaire?.businessType) {
      return NextResponse.json({ error: 'Questionnaire data is required.' }, { status: 400 })
    }

    const systemPrompt = AUDIT_PROMPT
      .replace('{businessType}', questionnaire.businessType)
      .replace('{size}', questionnaire.companySize)
      .replace('{tasks}', questionnaire.timeConsumingTasks)
      .replace('{tools}', questionnaire.currentTools)
      .replace('{process}', questionnaire.processToAutomate)

    const aiResponse = await callAI(
      [{ role: 'user', content: 'Generate the automation opportunities JSON array now.' }],
      systemPrompt,
      { maxTokens: 1400 }
    )

    let results: AuditResult[]
    try {
      const cleaned = aiResponse.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      results = JSON.parse(cleaned) as AuditResult[]
      if (!Array.isArray(results) || results.length === 0) throw new Error('Invalid format')
    } catch {
      results = getMockResults(questionnaire)
    }

    // Fire-and-forget lead notification
    if (lead?.name && lead?.email) {
      sendEmail({
        to: process.env.CONTACT_EMAIL ?? '',
        from: process.env.RESEND_FROM_EMAIL ?? 'audit@maxpromo.digital',
        subject: `New Audit Lead: ${lead.name} — ${lead.company}`,
        html: buildAuditLeadEmailHtml({
          name: lead.name,
          email: lead.email,
          company: lead.company,
          questionnaire: {
            businessType: questionnaire.businessType,
            companySize: questionnaire.companySize,
            timeConsumingTasks: questionnaire.timeConsumingTasks,
            currentTools: questionnaire.currentTools,
            processToAutomate: questionnaire.processToAutomate,
          },
        }),
      }).catch(console.error)
    }

    return NextResponse.json({ results, model: aiResponse.model })
  } catch (error) {
    console.error('[/api/audit]', error)
    return NextResponse.json(
      { error: 'Failed to generate audit. Please try again.' },
      { status: 500 }
    )
  }
}

function getMockResults(q: AuditRequestBody['questionnaire']): AuditResult[] {
  const tasks = q.timeConsumingTasks || 'manual data entry and email management'
  const tools = q.currentTools || 'email and spreadsheets'

  return [
    {
      title: 'Automated Lead Qualification',
      problem: `Your team spends significant time manually qualifying leads from ${tasks}.`,
      solution: `Deploy an AI agent that scores incoming leads against your ideal customer profile, routes qualified leads to your CRM, and sends personalised follow-up sequences automatically.`,
      tools: ['n8n', 'Claude API', 'HubSpot'],
    },
    {
      title: 'Cross-Platform Data Sync',
      problem: `Data across your tools (${tools}) is siloed, requiring manual copying and reconciliation.`,
      solution: `Build an automated integration layer that syncs data across all platforms in real time. Eliminate duplicate entry and maintain a single source of truth across your stack.`,
      tools: ['n8n', 'Zapier', 'REST APIs'],
    },
    {
      title: 'AI Customer Communications Agent',
      problem: `Customer enquiries and follow-ups require manual effort and often experience delays outside business hours.`,
      solution: `Implement an AI agent that handles initial customer communications 24/7, qualifies enquiries, and escalates to your team only when human judgment is required.`,
      tools: ['Claude API', 'Slack', 'Resend'],
    },
  ]
}
