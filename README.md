# Maxpromo Platform

The Maxpromo Digital software platform: the public site, Agent Bureau, the
internal operating system, and the packages they share.

```bash
npm install
npm run dev:web       # maxpromo.digital           → :3020
npm run dev:bureau    # agents.maxpromo.digital
npm run verify        # token audit, typecheck, lint, build — all workspaces
```

## Layout

```
apps/web        maxpromo.digital, nine product showcase domains, and the
                internal OS at /os
apps/bureau     agents.maxpromo.digital

packages/
  design-tokens the design system. Zero dependencies. The only place a colour
                is defined
  ui            shared components and the status tone system
  config        legal identity and company constants
  tooling       the design-token audit, shared tsconfig and eslint base

docs/           architecture, decisions, governance, deployment, brand
```

## Where to start

- **Architecture** — `docs/architecture/platform.md`
- **Standards every change must meet** — `docs/governance/standards.md`
- **The design system** — `docs/brand/design-system.md`
- **Deploying** — `docs/deployment/vercel.md`

Applications deploy independently as separate Vercel projects and are governed
together. Nothing merges without `npm run verify` passing.
