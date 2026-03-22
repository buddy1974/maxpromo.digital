import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import { AUDIT_SYSTEM_PROMPT } from '@/lib/prompts'
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AuditRequestBody
    const { questionnaire, lead } = body

    if (!questionnaire?.businessType) {
      return NextResponse.json({ error: 'Questionnaire data is required.' }, { status: 400 })
    }

    const userMessage = `Business type: ${questionnaire.businessType}
Company size: ${questionnaire.companySize}
Time-consuming tasks: ${questionnaire.timeConsumingTasks}
Current tools: ${questionnaire.currentTools}
Process to automate: ${questionnaire.processToAutomate}

Identify their top 3 automation opportunities. Return only a valid JSON array.`

    const aiResponse = await callAI(
      [{ role: 'user', content: userMessage }],
      AUDIT_SYSTEM_PROMPT,
      { maxTokens: 1500 }
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
        to: process.env.CONTACT_EMAIL ?? 'djstranger2000@gmail.com',
        from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
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
      problem: `Your team spends significant time manually qualifying leads from ${tasks}.`,
      solution: `Deploy an AI agent that scores incoming leads against your ideal customer profile and routes qualified leads to your CRM automatically. Personalised follow-up sequences are triggered without any manual action.`,
      tools: ['n8n', 'Claude AI', 'HubSpot'],
      roi: '8–12 hours/week',
      complexity: 'Medium',
      timeline: '2–3 weeks',
    },
    {
      problem: `Data across your tools (${tools}) is siloed, requiring manual copying and reconciliation.`,
      solution: `Build an automated integration layer that syncs data across all platforms in real time. Eliminate duplicate entry and maintain a single source of truth across your entire stack.`,
      tools: ['n8n', 'Zapier', 'REST APIs'],
      roi: '6–10 hours/week',
      complexity: 'Simple',
      timeline: '1 week',
    },
    {
      problem: `Customer enquiries require manual effort and often experience delays outside business hours.`,
      solution: `Implement an AI agent that handles initial customer communications 24/7, qualifies enquiries, and escalates to your team only when human judgment is required.`,
      tools: ['Claude AI', 'Slack', 'Resend'],
      roi: '5–8 hours/week',
      complexity: 'Medium',
      timeline: '2–3 weeks',
    },
  ]
}
