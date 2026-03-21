# MaxPromo Digital — Claude Code Project Brief

## Project Identity

Name: MaxPromo Digital
Type: AI Automation Platform (SaaS-level agency site)
Brand family: MaxPromo — Digital is the AI arm of MaxPromo

## Working Directory

C:\Users\loneb\Documents\ai-software-dev\projects\maxpromo.digital

## Tech Stack

- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS + inline styles
- Fonts: Syne (headings) · IBM Plex Mono (labels, mono, nav) · DM Sans (body)
- Database: Supabase
- Hosting: Vercel
- DNS/CDN: Cloudflare

## Design Style

Dark corporate AI aesthetic — black/white/orange only.

Background:  #0A0A0A
Text:        #FFFFFF primary · #888888 muted
Accent:      #F97316 (orange) — used sparingly on eyebrow labels,
             logo suffix, CTA buttons, hover states, key word highlights
Surface:     #111111
Borders:     rgba(255, 255, 255, 0.08)
No border radius above 2px
No blue. No purple. No gradients.

Feel: Anthropic meets Linear — serious, enterprise, 2026.

## Project Structure

app/                  Next.js App Router pages
components/           Shared UI components
lib/                  Utilities and shared logic
public/               Static assets

## Key Routes

/                     Homepage
/services             Services overview
/automation-lab       Automation examples
/ai-websites          AI website service
/automation-audit     Free audit tool
/contact              Contact page

## Rules

- TypeScript always — no plain JS
- No any type
- Handle loading + error states
- Secrets in .env.local only
- Reuse Supabase client from lib/
- Server components by default — client only when interactivity required
- No new dependencies without asking first
