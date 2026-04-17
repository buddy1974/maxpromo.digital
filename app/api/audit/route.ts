import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import { AUDIT_SYSTEM_PROMPT } from '@/lib/prompts'
import { sendEmail, buildAuditLeadEmailHtml } from '@/lib/email'
import type { AuditResult } from '@/components/AuditResults'

interface AuditRequestBody {
  orgType: string
  teamSize: string
  timeDrains: string[]
  tools: string[]
  experience: string
  goal: string
  name: string
  email: string
  company: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AuditRequestBody
    const { orgType, teamSize, timeDrains, tools, experience, goal, name, email, company } = body

    if (!orgType) {
      return NextResponse.json({ error: 'Questionnaire data is required.' }, { status: 400 })
    }

    const userMessage = `Organisation type: ${orgType}
Team size: ${teamSize}
Time-consuming tasks: ${timeDrains.join(', ')}
Current tools: ${tools.join(', ')}
Automation experience: ${experience || 'Not specified'}
Primary challenge / goal: ${goal}

Identify their top 3 automation opportunities. Return only a valid JSON array.`

    const aiResponse = await callAI(
      [{ role: 'user', content: userMessage }],
      AUDIT_SYSTEM_PROMPT,
      { maxTokens: 1800 }
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
      results = getMockResults({ orgType, timeDrains, tools, goal })
    }

    // Send lead notification email immediately
    if (name && email) {
      await sendEmail({
        to: process.env.CONTACT_EMAIL ?? 'info@maxpromo.digital',
        from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
        subject: `New Audit Lead: ${name} — ${company}`,
        html: buildAuditLeadEmailHtml({
          name,
          email,
          company,
          questionnaire: {
            orgType,
            teamSize,
            timeDrains: timeDrains.join(', '),
            tools: tools.join(', '),
            experience: experience || 'Not specified',
            goal,
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

function getMockResults(q: {
  orgType: string
  timeDrains: string[]
  tools: string[]
  goal: string
}): AuditResult[] {
  const tasks = q.timeDrains.join(', ') || 'manual data entry and reporting'
  const toolList = q.tools.join(', ') || 'email and spreadsheets'

  return [
    {
      title: 'Automated Lead Qualification & Routing',
      problem: `Your team spends significant time manually qualifying leads from ${tasks}.`,
      solution: `Deploy an AI agent that scores incoming leads against your ideal customer profile and routes qualified leads to your CRM automatically. Personalised follow-up sequences trigger without any manual action.`,
      tools: ['n8n', 'Claude AI', 'HubSpot'],
      roi: '8–12 hrs/week',
      complexity: 'Medium',
      timeline: '2–3 weeks',
    },
    {
      title: 'Data Sync & Integration Pipeline',
      problem: `Data across your tools (${toolList}) is siloed, requiring manual copying and reconciliation.`,
      solution: `Build an automated integration layer that syncs data across all platforms in real time. Eliminate duplicate entry and maintain a single source of truth across your entire stack.`,
      tools: ['n8n', 'Zapier', 'REST APIs'],
      roi: '6–10 hrs/week',
      complexity: 'Simple',
      timeline: '1–2 weeks',
    },
    {
      title: 'AI-Powered Document & Report Processing',
      problem: `Your ${q.orgType} team handles manual document processing and report compilation that consumes disproportionate staff time.`,
      solution: `Implement a document AI pipeline that automatically extracts, validates, and routes incoming documents. Scheduled reports are generated and distributed without manual intervention.`,
      tools: ['Claude AI', 'Airtable', 'Resend'],
      roi: '5–8 hrs/week',
      complexity: 'Medium',
      timeline: '2–3 weeks',
    },
  ]
}
