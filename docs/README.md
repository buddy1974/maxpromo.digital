# Maxpromo Platform — Documentation

One documentation tree for the whole platform. Every application references
these documents; none keeps its own copy.

| Directory | What lives here |
|---|---|
| `architecture/` | How the platform is put together. Start with `platform.md`. |
| `adr/` | Decision records. Why things are the way they are. |
| `governance/` | The standards every change must meet, and the open risk register. |
| `deployment/` | Vercel projects, environments, verification runbooks. |
| `brand/` | The design system: tokens, typography, accent rules, writing voice. |
| `openclaw/` | Company operating memory and how OpenClaw governs the platform. |
| `history/` | Superseded documents, kept because decisions are only legible with their history. Nothing here is current. |

## Where to look first

- **New to the platform?** `architecture/platform.md`
- **Making a change?** `governance/standards.md`
- **Locked out of Agent Bureau?** `deployment/agent-bureau-owner-access.md`
- **Wondering why something is the way it is?** `adr/`
- **Writing copy or building UI?** `brand/`

## The rule

Durable facts live here, never in chat history. If a decision was made, it goes
in `adr/`. If a risk was found, it goes in `governance/known-risks.md`. If
something shipped, it goes in `history/change-log.md`.

A document in `history/` describes how things were, not how they are. It is
kept so that a decision record referring to it still makes sense.
