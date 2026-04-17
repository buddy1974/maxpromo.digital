import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import type { EstimateData } from '@/components/CostEstimate'

interface WebsiteEstimateBody {
  businessType: string
  pageCount: string
  features: string[]
  company: string
}

const SYSTEM_PROMPT = `You are a senior project estimator at Maxpromo Digital, a web development agency in Germany. You create clear, professional website cost estimates (Kostenvoranschlag) for small businesses.

Currency: EUR only.
VAT notice: "Gemäß §19 UStG wird keine Umsatzsteuer berechnet."
Target clients: Small businesses — Handwerker, cleaning companies, restaurants, salons, retail, freelancers.

PRICING (German market):

DEVELOPMENT:
Landing page (1–3 pages): €800–1,400
Small website (5–8 pages): €1,500–3,200
Full website (10–15 pages): €3,500–6,500

FEATURES (add-on):
Contact form: always included
Photo gallery: €150–300
Online booking system: €500–1,200
Google Maps: €100–200
WhatsApp button: €50–100
Online shop (basic): €1,200–2,800
Blog / News: €250–500
Multilingual (per language): €300–500
CMS dashboard: €400–900
Newsletter signup: €150–300
Logo design: €300–700

INFRASTRUCTURE:
Domain (.de or .com): €12–18/year (one-time setup)
Hosting (Vercel): €10–15/month
SSL: included

MAINTENANCE:
Monthly maintenance & updates: €60–120/month

Rules:
- No automation line items unless explicitly requested
- Keep it simple and focused on the website
- Contact form is always included (zero cost, built-in)
- Recommend monthly maintenance as optional
- estimateScope should be "Starter" for landing pages, "Growth" for small/medium sites

Return ONLY valid JSON with this exact structure (no markdown fences, no extra text):
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
          "id": "website",
          "description": "German name / English name",
          "detail": "What is included specifically",
          "unit": "pauschal",
          "priceMin": 1500,
          "priceMax": 3200,
          "recommended": true,
          "included": true
        }
      ]
    },
    {
      "category": "Laufende Kosten / Recurring",
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
  "scopeNote": "Two sentences about what is included and what affects the final price for this specific client.",
  "estimateScope": "Starter",
  "includedInAll": [
    "Responsive design (mobile/tablet/desktop)",
    "SSL certificate (HTTPS)",
    "Basic SEO setup",
    "DSGVO-konforme Datenschutzerklärung",
    "Impressum",
    "Kontaktformular / Contact form",
    "30 Tage Support nach Abschluss"
  ]
}`

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WebsiteEstimateBody
    const { businessType, pageCount, features, company } = body

    if (!businessType) {
      return NextResponse.json({ error: 'Business type required.' }, { status: 400 })
    }

    const today = new Date()
    const validUntil = new Date(today)
    validUntil.setDate(validUntil.getDate() + 30)

    const userMessage = `Client:
Business type: ${businessType}
Company: ${company || 'Client'}
Website size requested: ${pageCount}
Additional features: ${features.length > 0 ? features.join(', ') : 'None beyond standard'}

Today: ${today.toISOString().split('T')[0]}
Valid until: ${validUntil.toISOString().split('T')[0]}

Create a professional website cost estimate for this small business. Keep it simple and clear. Return ONLY valid JSON.`

    const aiResponse = await callAI(
      [{ role: 'user', content: userMessage }],
      SYSTEM_PROMPT,
      { maxTokens: 2000, model: 'claude-haiku-4-5-20251001' }
    )

    let estimate: EstimateData
    try {
      const cleaned = aiResponse.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      estimate = JSON.parse(cleaned) as EstimateData
    } catch {
      estimate = getFallback(company, pageCount, today, validUntil)
    }

    return NextResponse.json({ estimate })
  } catch (error) {
    console.error('[/api/estimate]', error)
    return NextResponse.json({ error: 'Failed to generate estimate.' }, { status: 500 })
  }
}

function getFallback(
  company: string,
  pageCount: string,
  today: Date,
  validUntil: Date
): EstimateData {
  const isLanding = pageCount.toLowerCase().includes('landing')
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
            description: isLanding ? 'Landing Page / Einseiter' : 'Business Website / Unternehmenswebsite',
            detail: isLanding
              ? 'Single page with hero, services, contact form — mobile-ready'
              : 'Responsive 5–8 page website with contact form, CMS, and DSGVO compliance',
            unit: 'pauschal',
            priceMin: isLanding ? 800 : 1500,
            priceMax: isLanding ? 1400 : 3200,
            recommended: true,
            included: true,
          },
          {
            id: 'domain',
            description: 'Domain-Registrierung / Domain Registration',
            detail: '.de or .com domain for one year',
            unit: 'pro Jahr / per year',
            priceMin: 12,
            priceMax: 18,
            recommended: true,
            included: true,
          },
        ],
      },
      {
        category: 'Laufende Kosten / Recurring',
        items: [
          {
            id: 'hosting',
            description: 'Hosting & Wartung / Hosting & Maintenance',
            detail: 'Vercel hosting + monthly maintenance and security updates',
            unit: 'pro Monat / per month',
            priceMin: 70,
            priceMax: 120,
            recommended: true,
            included: true,
          },
        ],
      },
    ],
    totals: {
      oneTimeMin: isLanding ? 812 : 1512,
      oneTimeMax: isLanding ? 1418 : 3218,
      monthlyMin: 70,
      monthlyMax: 120,
      yearOneMin: isLanding ? 1652 : 2352,
      yearOneMax: isLanding ? 2858 : 4658,
    },
    vatNotice: 'Gemäß §19 UStG wird keine Umsatzsteuer berechnet.',
    paymentTerms: '50% Anzahlung bei Auftragserteilung, 50% bei Abnahme.',
    validityNote: 'Dieses Angebot ist 30 Tage gültig.',
    scopeNote: 'The final price depends on the exact content and pages confirmed at kickoff. Additional features or design revisions are scoped separately.',
    estimateScope: isLanding ? 'Starter' : 'Growth',
    includedInAll: [
      'Responsive design (mobile/tablet/desktop)',
      'SSL certificate (HTTPS)',
      'Basic SEO setup',
      'DSGVO-konforme Datenschutzerklärung',
      'Impressum',
      'Kontaktformular / Contact form',
      '30 Tage Support nach Abschluss',
    ],
  }
}
