# LaneShadow Project Instructions

**Core project governance is documented in [RULES.md](RULES.md).**

Consult it for:
- User context and personas
- Local domain experts to dispatch
- Agent and commit policies
- Planning workflows
- Design rules
- Convex backend guidelines
- .spec directory structure

**Start with [RULES.md](RULES.md).** For active hook/tooling commands during this restructure, follow `lefthook.yml` and workspace `package.json` scripts.

## Repo Layout (Current)

- Backend operational root: `server/`
- Convex code root: `server/convex/`
- Mobile app root: `react-native/`

## Toolchain Baseline

- Type checking: `tsgo` (see `pnpm type-check:native`)
- Lint/format: `biome`
- Git hooks: `lefthook` (not Husky)

## Command Entry Points

- Backend dev: `pnpm server:dev`
- Backend deploy: `pnpm server:deploy`
- Backend codegen: `pnpm server:codegen`
- App dev: `pnpm client:dev`
- Full dev loop: `pnpm dev`
