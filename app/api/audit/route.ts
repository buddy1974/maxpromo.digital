import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import { sendEmail, buildAuditLeadEmailHtml } from '@/lib/email'
import { AUDIT_SYSTEM_PROMPT } from '@/lib/prompts'
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

    // Validate required fields
    if (!lead?.name || !lead?.email || !lead?.company) {
      return NextResponse.json({ error: 'Lead details are required.' }, { status: 400 })
    }
    if (!questionnaire?.businessType) {
      return NextResponse.json({ error: 'Questionnaire data is required.' }, { status: 400 })
    }

    // Build the user prompt from questionnaire
    const userPrompt = `
Business type: ${questionnaire.businessType}
Company size: ${questionnaire.companySize}
Most time-consuming tasks: ${questionnaire.timeConsumingTasks}
Current tools used: ${questionnaire.currentTools}
Process they want to automate: ${questionnaire.processToAutomate}

Generate exactly 3 automation opportunities as a JSON array.
`.trim()

    // Call AI
    const aiResponse = await callAI(
      [{ role: 'user', content: userPrompt }],
      AUDIT_SYSTEM_PROMPT,
      { maxTokens: 1200 }
    )

    // Parse AI response
    let results: AuditResult[]
    try {
      // Strip potential markdown code fences
      const cleaned = aiResponse.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      results = JSON.parse(cleaned) as AuditResult[]
      if (!Array.isArray(results) || results.length === 0) {
        throw new Error('Invalid response format')
      }
    } catch {
      // Fallback to mock results if parsing fails
      results = getMockResults(questionnaire)
    }

    // Send lead notification email (fire-and-forget — don't block response)
    const contactEmail = process.env.CONTACT_EMAIL!
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'audit@maxpromo.digital'

    sendEmail({
      to: contactEmail,
      from: fromEmail,
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
      problem: `Your team spends significant time on: ${tasks}. This is highly repetitive and error-prone when done manually.`,
      solution: `Deploy an AI automation workflow that monitors your inboxes and data sources, processes incoming information automatically, and updates your records without manual intervention.`,
      tools: ['n8n', 'Claude AI', 'Google Workspace'],
    },
    {
      problem: `Data across your tools (${tools}) is siloed, requiring manual copying and synchronisation between platforms.`,
      solution: `Build an automated integration layer that syncs data across all your platforms in real time — eliminating duplicate entry and ensuring a single source of truth.`,
      tools: ['Make', 'Zapier', 'REST APIs'],
    },
    {
      problem: `Customer-facing processes like enquiry handling and follow-ups require manual effort and often experience delays.`,
      solution: `Implement an AI agent that handles initial customer communications, qualifies enquiries, sends personalised responses, and escalates to your team only when needed.`,
      tools: ['Claude AI', 'HubSpot', 'Slack'],
    },
  ]
}
