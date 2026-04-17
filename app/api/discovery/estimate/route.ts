import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import type { AuditResult } from '@/components/AuditResults'

interface EstimateRequestBody {
  orgType: string
  teamSize: string
  timeDrains: string[]
  tools: string[]
  experience: string
  goal: string
  company: string
  auditResults: AuditResult[]
}

const ESTIMATE_SYSTEM_PROMPT = `You are a senior project estimator at Maxpromo Digital, an AI automation and web development agency based in Germany. You create professional itemised cost estimates (Kostenvoranschlag) following German market standards.

Currency: EUR only.
VAT notice: "Gemäß §19 UStG wird keine Umsatzsteuer berechnet."
Format: Professional, itemised, like a German Angebot.

PRICING GUIDELINES (German market rates):

INFRASTRUCTURE:
Domain registration: €10–20/year (.de, .com, .eu)
Web hosting (shared): €5–15/month
Web hosting (VPS): €20–80/month
SSL: included/free

MAINTENANCE:
Maintenance contract: €50–200/month

DESIGN & DEVELOPMENT:
Landing page (1–3 pages): €800–1,500
Small website (5–8 pages): €1,500–3,500
Medium website (10–20 pages): €3,500–7,000
Large website (20+ pages): €7,000–15,000
E-commerce/booking platform: €5,000–20,000
Custom web application: €8,000–30,000

FEATURES (add-on):
Online booking system: €500–1,500
Quote calculator: €300–800
AI chatbot integration: €800–2,000
Payment gateway integration: €400–900
Multilingual (per language): €300–600
CMS/content dashboard: €500–1,200
Customer portal/login: €800–2,000
API integrations (per): €300–800
Google Maps/coverage map: €150–300
Newsletter integration: €200–400

AI AUTOMATION (MaxPromo specialty):
AI lead qualification agent: €1,500–3,500
Document processing automation: €2,000–5,000
Social media automation setup: €800–2,000
WhatsApp automation: €1,000–2,500
Email automation workflows: €500–1,500
Reporting automation: €800–2,000
Full business OS: €5,000–25,000

CONTENT & DESIGN:
Logo design: €300–800
Brand identity package: €800–2,000
Professional copywriting (per page): €80–150
Stock photography package: €100–300

ONGOING:
Monthly hosting + maintenance: €80–200
Monthly content updates: €100–300
Monthly AI automation management: €200–500
SEO monthly retainer: €200–600
Priority support: €50–150/month

Calculate based on what the client selected in their discovery answers and the automation opportunities identified. Be specific and justify each line item. Include only what is relevant to their situation.

Scope levels:
- Starter: Basic website or single automation, small team, simple needs
- Growth: Website + 2-3 automations, growing business
- Professional: Full website + comprehensive automation suite
- Enterprise: Large-scale custom system, complex integrations

Return ONLY valid JSON matching this exact structure (no markdown fences, no preamble):
{
  "estimateTitle": "Kostenvoranschlag — {company}",
  "estimateDate": "{today YYYY-MM-DD}",
  "validUntil": "{today + 30 days YYYY-MM-DD}",
  "currency": "EUR",
  "lineItems": [
    {
      "category": "Einmalig / One-time",
      "items": [
        {
          "id": "item_1",
          "description": "German name / English name",
          "detail": "What this includes specifically",
          "unit": "pauschal",
          "priceMin": 1500,
          "priceMax": 2500,
          "recommended": true,
          "included": true,
          "note": "optional note"
        }
      ]
    },
    {
      "category": "Laufende Kosten / Recurring",
      "items": [...]
    },
    {
      "category": "Optional / Empfohlen",
      "items": [...]
    }
  ],
  "totals": {
    "oneTimeMin": 0,
    "oneTimeMax": 0,
    "monthlyMin": 0,
    "monthlyMax": 0,
    "yearOneMin": 0,
    "yearOneMax": 0
  },
  "vatNotice": "Gemäß §19 UStG wird keine Umsatzsteuer berechnet.",
  "paymentTerms": "50% Anzahlung bei Auftragserteilung, 50% bei Abnahme.",
  "validityNote": "Dieses Angebot ist 30 Tage gültig.",
  "scopeNote": "Two-sentence note about what affects the final price for this specific client.",
  "estimateScope": "Growth",
  "includedInAll": [
    "Responsive design (mobile/tablet/desktop)",
    "SSL certificate (HTTPS)",
    "Basic SEO setup",
    "DSGVO-konforme Datenschutzerklärung",
    "Impressum",
    "30 Tage Support nach Abschluss"
  ]
}`

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EstimateRequestBody
    const { orgType, teamSize, timeDrains, tools, experience, goal, company, auditResults } = body

    if (!orgType) {
      return NextResponse.json({ error: 'Profile data required.' }, { status: 400 })
    }

    const opportunitySummary = auditResults
      .map((r, i) => `${i + 1}. ${r.title ?? 'Opportunity'}: ${r.solution} (Tools: ${r.tools.join(', ')})`)
      .join('\n')

    const today = new Date()
    const validUntil = new Date(today)
    validUntil.setDate(validUntil.getDate() + 30)

    const userMessage = `Client profile:
Company: ${company || 'Client'}
Organisation type: ${orgType}
Team size: ${teamSize}
Time drains: ${timeDrains.join(', ')}
Current tools: ${tools.join(', ')}
Automation experience: ${experience || 'Not specified'}
Primary challenge: ${goal}

Automation opportunities already identified:
${opportunitySummary}

Today: ${today.toISOString().split('T')[0]}
Valid until: ${validUntil.toISOString().split('T')[0]}

Create a professional itemised cost estimate (Kostenvoranschlag) for Maxpromo Digital services that addresses their needs. Include the development/automation work, infrastructure, and ongoing costs. Return ONLY valid JSON.`

    const aiResponse = await callAI(
      [{ role: 'user', content: userMessage }],
      ESTIMATE_SYSTEM_PROMPT,
      { maxTokens: 3000, model: 'claude-sonnet-4-5' }
    )

    let estimate: unknown
    try {
      const cleaned = aiResponse.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      estimate = JSON.parse(cleaned)
    } catch {
      estimate = getFallbackEstimate(company, orgType, today, validUntil)
    }

    return NextResponse.json({ estimate })
  } catch (error) {
    console.error('[/api/discovery/estimate]', error)
    return NextResponse.json({ error: 'Failed to generate estimate.' }, { status: 500 })
  }
}

function getFallbackEstimate(
  company: string,
  orgType: string,
  today: Date,
  validUntil: Date
) {
  const isAutomation = orgType?.toLowerCase().includes('agency') || orgType?.toLowerCase().includes('service')
  return {
    estimateTitle: `Kostenvoranschlag — ${company || 'Ihr Unternehmen'}`,
    estimateDate: today.toISOString().split('T')[0],
    validUntil: validUntil.toISOString().split('T')[0],
    currency: 'EUR',
    lineItems: [
      {
        category: 'Einmalig / One-time',
        items: [
          {
            id: 'website',
            description: 'Business Website / Unternehmenswebsite',
            detail: 'Responsive 5–8 page website with contact form, CMS, and DSGVO compliance',
            unit: 'pauschal',
            priceMin: 1500,
            priceMax: 3500,
            recommended: true,
            included: true,
          },
          ...(isAutomation ? [{
            id: 'automation1',
            description: 'AI Automation Workflow / KI-Automatisierung',
            detail: 'Custom n8n workflow for lead qualification and follow-up automation',
            unit: 'pauschal',
            priceMin: 1500,
            priceMax: 3500,
            recommended: true,
            included: true,
          }] : []),
        ],
      },
      {
        category: 'Laufende Kosten / Recurring',
        items: [
          {
            id: 'hosting',
            description: 'Hosting & Maintenance / Hosting & Wartung',
            detail: 'Vercel hosting, domain renewal, monthly maintenance and security updates',
            unit: 'pro Monat / per month',
            priceMin: 80,
            priceMax: 150,
            recommended: true,
            included: true,
          },
        ],
      },
      {
        category: 'Optional / Empfohlen',
        items: [
          {
            id: 'seo',
            description: 'SEO Monatlich / Monthly SEO',
            detail: 'Keyword tracking, content optimisation, monthly reporting',
            unit: 'pro Monat / per month',
            priceMin: 200,
            priceMax: 400,
            recommended: false,
            included: false,
          },
          {
            id: 'chatbot',
            description: 'AI Chatbot Integration',
            detail: 'Claude-powered chat assistant trained on your services',
            unit: 'pauschal',
            priceMin: 800,
            priceMax: 1500,
            recommended: true,
            included: false,
          },
        ],
      },
    ],
    totals: {
      oneTimeMin: 3000,
      oneTimeMax: 7000,
      monthlyMin: 80,
      monthlyMax: 150,
      yearOneMin: 3960,
      yearOneMax: 8800,
    },
    vatNotice: 'Gemäß §19 UStG wird keine Umsatzsteuer berechnet.',
    paymentTerms: '50% Anzahlung bei Auftragserteilung, 50% bei Abnahme.',
    validityNote: 'Dieses Angebot ist 30 Tage gültig.',
    scopeNote: 'The final price depends on the exact scope confirmed at kickoff. Additional features or integrations are scoped separately.',
    estimateScope: 'Growth',
    includedInAll: [
      'Responsive design (mobile/tablet/desktop)',
      'SSL certificate (HTTPS)',
      'Basic SEO setup',
      'DSGVO-konforme Datenschutzerklärung',
      'Impressum',
      '30 Tage Support nach Abschluss',
    ],
  }
}
