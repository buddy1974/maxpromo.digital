# Known Risks

## 2026-07-10 — Build/typecheck/lint unverified after public MVP sprint (BLOCKING)

The Cowork session's sandboxed shell had a stale page-cache bug on this repo's mount: content of files edited during the session was served from an old cached copy (confirmed via `stat` mtimes up to a month stale) even though every file was correctly written to the real Windows filesystem. As a result, `npm run build`, `npx tsc --noEmit`, and `npm run lint` could not be run trustworthily from inside that session. Every changed file was manually re-verified structurally sound (balanced JSX, no truncation) by reading it directly, but this is not a substitute for a real build.
**Action required: run `npm run build`, `npx tsc --noEmit`, and `npm run lint` locally before the next deploy.**

## 2026-07-10 — In-memory rate limiting won't survive multi-instance/serverless scale

Rate limiting added this sprint (`newsletter/subscribe`, `estimate`, `estimate/send`, `discovery/estimate`, `discovery/send`, `portfolio/auth`, `os/login`) uses an in-memory, per-process, per-IP sliding window (`lib/rate-limit.ts`) — no Redis/Upstash dependency exists in this repo. Fine at current traffic; will not hold once the app runs across multiple serverless instances or survives cold starts reliably. Revisit with a shared store if traffic or deployment topology changes.

## 2026-07-10 — Newsletter honeypot is backend-only

A honeypot field check was added to `app/api/newsletter/subscribe/route.ts`, but no frontend form currently sends a hidden `website`/`company_url` field, so it's currently a no-op. Needs `components/NewsletterSignup.tsx` (or equivalent) updated with a hidden field to activate.

## 2026-07-10 — Open Graph image is an interim fallback

`app/layout.tsx` now points OpenGraph/Twitter `images` at `/logo.png` (square logo) so shared links never render blank, but this is not a proper 1200×630 social-preview asset. Produce a dedicated OG image.

## 2026-07-10 — Homepage pain cards and 5 service-page hero photos still missing

`public/images/homepage/pain/` and 5 `public/images/services/{slug}/hero.jpg` paths have no approved photography. Both currently degrade gracefully (no broken images), but the visual is incomplete until real photography is dropped in — shot lists exist in `public/images/homepage/README.md` and `public/images/services/README.md`.

## 2026-07-10 — Unverified locale-leak claims from the release audit

`/de/automation-audit`, `/de/discovery`, `/de/portfolio`, `/de/automation-lab`, `/de/data-deletion` were flagged in a prior audit as rendering English content on German routes. This was not independently re-checked in the 2026-07-10 sprint — status unknown, needs verification.

## 2026-07-10 — Sandbox-only orphan files (non-blocking, cosmetic)

Six `.fuse_hidden########` files and one `.tsc_out.txt` were left in the working tree by the sandbox's FUSE mount during concurrent file writes this session. They are untracked, contain no useful content (old pre-edit copies), and could not be deleted from the sandbox (`Operation not permitted`). Safe to delete by hand if still present.
