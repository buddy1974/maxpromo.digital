# Visual Facelift v2.1 — Maxpromo Digital / Agent Bureau

**Status:** Proposed by Product Owner (Marcel), 2026-08-11. **Not yet implemented.**
**Scope claimed by this spec:** maxpromo.digital, agents.maxpromo.digital, OpenClaw,
Dashboards, Audit pages, Documentation, Client portals — i.e. the entire design
system, including this repo (`maxpromo-agent-bureau`).

> ⚠️ **Conflicts with a locked decision.** `PLAN.md` §7–8 records a Product-Owner-locked
> decision (2026-05-29): *"Landing aesthetic: HYBRID (locked). Maxpromo Digital visual
> system as anchor — dark premium, orange accent…"* — currently implemented in
> `tailwind.config.ts` (`ink-950…600` dark surfaces, `#ff6a1a` accent) and used across
> `components/marketing/*` and `components/dashboard/*`.
>
> This v2.1 spec calls for a **white-background, light-mode, Stripe/Linear/GitHub-style**
> system — the opposite surface direction. Treat this file as a **pending supersession**
> of the 2026-05-29 lock, not an already-approved change. See the companion decision-log
> entry (ADR-002) and the implementation plan delivered alongside this document.

---

## 0. Design philosophy note (Product Owner, pre-spec)

One of the biggest giveaways of an AI-built website today isn't the code — it's the
imagery. When every section has a smiling stock person, a futuristic AI illustration,
or a glossy 3D render, experienced developers immediately think "template" or
"AI-generated." This is a first-class part of the design philosophy below, not an
afterthought: imagery is treated as a credibility signal, not decoration.

---

## 1. Mission

This is **not** a redesign. Do not rebuild the information architecture, navigation,
or user journeys. Modernize the visual language so Maxpromo Digital and Agents looks
like an established software company rather than an AI-generated SaaS template.

The goal is to convince CTOs, software engineers, IT managers, and enterprise decision
makers that they are dealing with a serious engineering company.

**Reference quality:** Stripe, Linear, GitHub, Vercel, Notion, Raycast, Figma.
Avoid the visual language of generic AI startups.

## 2. Design philosophy

- Less decoration. More clarity.
- Less marketing. More product.
- Less imagery. More information.
- Less visual noise. More confidence.
- Every element should have a purpose. If removing something improves clarity, remove it.

## 3. Colour palette

| Token | Hex |
|---|---|
| Primary Orange | `#F97316` |
| Primary Text | `#18181B` |
| Secondary Text | `#52525B` |
| Borders | `#E4E4E7` |
| Background | `#FFFFFF` |
| Section Background | `#F8F9FA` |
| Footer | `#161A1D` |
| Footer Text | `#D6D8DB` |

Orange is the only accent colour. Never introduce unnecessary colours.

## 4. Typography

Typography becomes the primary visual element. Current text is too small — increase
font sizes throughout the site.

| Element | Size | Weight |
|---|---|---|
| Hero | 76–84px | 800 |
| Section Titles | 52–56px | 700 |
| Card Titles | 26–30px | 600 |
| Body | 20px (line-height 1.7) | — |
| Navigation | 18px | — |
| Buttons | 18px | — |

Large typography creates confidence. Never allow visuals to overpower the written content.

## 5. Layout

- Increase whitespace significantly.
- Container width: 1500px
- Section spacing: 120–160px
- Card padding: 40px

The interface should feel calm and effortless to scan.

## 6. Hero section

Completely refresh the visual presentation while keeping the content. The hero should
rely on typography, spacing, and trust rather than decorative artwork. Reduce visual
clutter — keep only one strong visual element.

The hero should immediately answer: Who are we? What do we build? Who do we help?
Why should someone trust us?

Avoid multiple floating graphics, generic AI illustrations, futuristic artwork.

If a visual is required, prefer: product interface, workflow diagram, architecture
diagram, platform overview, OpenClaw ecosystem illustration, business process
infographic. The hero should look like a software company, not an AI advertisement.

## 7. Images

Reduce images across the entire website by at least 70%. Do not add images simply to
fill empty space. Every image must have a clear business purpose.

**Remove:** AI-generated office people, generic developers, robots, holograms,
floating AI graphics, stock-style AI artwork, generic business meetings, decorative
illustrations.

**Prefer instead:** product screenshots, platform interfaces, dashboards, workflow
diagrams, system architecture, process maps, technical infographics, data
visualisations, real photography only when genuinely needed.

If an image does not explain something, remove it.

## 8. Cards

White background, 8px radius, 1px border, subtle shadow only. No gradients, no glow,
no decorative backgrounds. Every card must communicate one clear idea.

## 9. Navigation

Height 90px. Sticky. White background. Subtle border. No transparency, no glass effects.

## 10. Dashboard

Should resemble enterprise software. Increase spacing and typography, reduce colours.
Orange highlights only the most important actions. Every widget must solve a business
problem — remove decorative widgets.

## 11. Agent marketplace

Present every AI agent like a professional software product. Each card includes: name,
purpose, capabilities, connected tools, status, owner, deploy action. No robots, no AI
artwork, no futuristic graphics.

## 12. Trust

Replace fake client logos. Highlight real technologies instead: Cloudflare, Anthropic,
OpenAI, GitHub, Vercel, n8n, Neon, Stripe. Focus on technical credibility over
marketing claims.

## 13. Footer

Background `#161A1D`. Large vertical spacing. Clean multi-column layout. White
headings, light gray text, orange links. No gradients, no glow, no rounded corners.
The footer should feel like the closing section of an enterprise product.

## 14. Motion

Keep animation minimal: fade, small slide, subtle hover elevation. Nothing distracting.

## 15. Remove every "vibe coded" signal

Remove: decorative gradients, glowing elements, floating shapes, meaningless charts,
placeholder metrics, duplicate calls to action, AI-generated people, generic
illustrations, empty marketing sections. Every section must answer a business
question. Every component must justify its existence.

## 16. Accessibility

Meet WCAG AA contrast standards. Large click targets. Visible keyboard focus.
Consistent spacing. Fast loading. No layout shifts.

## 17. Visual goal

Every page — maxpromo.digital, agents.maxpromo.digital, OpenClaw, Dashboards, Audit
pages, Documentation, Client portals — must follow the same design system. The
website should not feel like a collection of landing pages; it should feel like a
mature software platform built over many years.

**Overall impression:** Professional. Calm. Technical. Trusted. Deliberate.
Visitors should remember the product, the architecture, and the clarity of the
experience — not the artwork or decorative effects.
