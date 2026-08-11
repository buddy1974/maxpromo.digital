# Maxpromo Digital — Visual Facelift v2.1

Status: **Spec, not yet implemented.** Captured from Marcel's brief on 2026-08-11. This governs the visual/design-system layer of maxpromo.digital, agents.maxpromo.digital, OpenClaw OS, dashboards, audit pages, docs, and client portals — one consistent system across all of them.

## Why this exists — the imagery problem

The biggest giveaway of an AI-built website today isn't the code, it's the imagery. When every section has a smiling stock person, a futuristic AI illustration, or a glossy 3D render, experienced developers and technical buyers immediately think "template" or "AI-generated." This spec treats imagery reduction as a core part of the design philosophy, not a styling detail.

## Mission

This is **not** a redesign. Do not rebuild information architecture, navigation, or user journeys. Modernize the visual language so Maxpromo Digital reads as an established software company rather than an AI-generated SaaS template. Target audience to convince: CTOs, software engineers, IT managers, enterprise decision makers.

Reference quality bar: Stripe, Linear, GitHub, Vercel, Notion, Raycast, Figma. Avoid the visual language of generic AI startups.

## Design philosophy

Less decoration, more clarity. Less marketing, more product. Less imagery, more information. Less visual noise, more confidence. Every element must have a purpose — if removing something improves clarity, remove it.

## Color palette

- Primary Orange: `#F97316`
- Primary Text: `#18181B`
- Secondary Text: `#52525B`
- Borders: `#E4E4E7`
- Background: `#FFFFFF`
- Section Background: `#F8F9FA`
- Footer: `#161A1D`
- Footer Text: `#D6D8DB`

Orange is the only accent color. Never introduce unnecessary colors.

(Note: this supersedes the earlier `#FF6A00` orange system shown in the "Visual Facelift Instructions v1" mockup — v2.1's `#F97316` is the current source of truth.)

## Typography

Typography becomes the primary visual element. Current text is too small — increase sizes throughout.

- Hero: 76–84px, weight 800
- Section titles: 52–56px, weight 700
- Card titles: 26–30px, weight 600
- Body: 20px, line-height 1.7
- Navigation: 18px
- Buttons: 18px

Large typography creates confidence. Visuals should never overpower the written content.

## Layout

- Container width: 1500px
- Section spacing: 120–160px
- Card padding: 40px

The interface should feel calm and effortless to scan. Increase whitespace significantly everywhere.

## Hero section

Refresh the visual presentation, keep the content. Rely on typography, spacing, and trust — not decorative artwork. Keep only one strong visual element. The hero must immediately answer: Who are we? What do we build? Who do we help? Why should someone trust us?

Avoid: multiple floating graphics, generic AI illustrations, futuristic artwork.

If a visual is required, prefer: product interface, workflow diagram, architecture diagram, platform overview, OpenClaw ecosystem illustration, business process infographic. The hero should look like a software company, not an AI advertisement.

## Images

Reduce images across the entire site by at least 70%. Never add an image just to fill space — every image must have a clear business purpose.

Remove: AI-generated office people, generic developers, robots, holograms, floating AI graphics, stock-style AI artwork, generic business meetings, decorative illustrations.

Prefer instead: product screenshots, platform interfaces, dashboards, workflow diagrams, system architecture, process maps, technical infographics, data visualizations, real photography (only when genuinely needed).

If an image doesn't explain something, remove it.

## Cards

White background, 8px radius, 1px border, subtle shadow only. No gradients, no glow, no decorative backgrounds. Every card communicates exactly one idea.

## Navigation

Height 90px, sticky, white background, subtle border. No transparency, no glass effects.

## Dashboard

Should resemble enterprise software: increase spacing and typography, reduce colors. Orange highlights only the most important actions. Every widget must solve a business problem — remove decorative widgets.

## Agent marketplace

Present every AI agent like a professional software product. Each card includes: name, purpose, capabilities, connected tools, status, owner, deploy action. No robots, no AI artwork, no futuristic graphics.

## Trust section

Replace fake client logos with real technologies actually used: Cloudflare, Anthropic, OpenAI, GitHub, Vercel, n8n, Neon, Stripe. Focus on technical credibility over marketing claims.

## Footer

Background `#161A1D`, large vertical spacing, clean multi-column layout, white headings, light gray text, orange links. No gradients, no glow, no rounded corners. Should feel like the closing section of an enterprise product.

## Motion

Keep minimal: fade, small slide, subtle hover elevation. Nothing distracting.

## Remove every "vibe coded" signal

Remove: decorative gradients, glowing elements, floating shapes, meaningless charts, placeholder metrics, duplicate CTAs, AI-generated people, generic illustrations, empty marketing sections. Every section must answer a business question; every component must justify its existence.

## Accessibility

Meet WCAG AA contrast. Large click targets. Visible keyboard focus. Consistent spacing. Fast loading. No layout shifts.

## Visual goal

Every surface (maxpromo.digital, agents.maxpromo.digital, OpenClaw, dashboards, audit pages, documentation, client portals) follows the same design system, so the product feels like one mature platform built over years — not a collection of landing pages.

Target impression: professional, calm, technical, trusted, deliberate. Visitors should remember the product, the architecture, and the clarity — not the artwork or decorative effects.

## Relationship to current build

Per the project recap doc, styling is currently listed as "basic" and needing spacing/cards/icons/typography work — this spec is the answer to that gap. Implementation (actually touching `globals.css`, components, and the Tailwind config in the repo) has not started; this is the design-system reference for when that work begins, likely via Claude Code against the live repo.
