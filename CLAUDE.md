# LaneShadow Project Instructions

**All project rules are documented in [RULES.md](RULES.md).**

This is the authoritative instruction document for all agents, subagents, and team members. Consult it for:
- User context and personas
- Local domain experts to dispatch
- Agent and commit policies
- Planning workflows
- Design rules
- Convex backend guidelines
- .spec directory structure

**Start with [RULES.md](RULES.md).**

## Repo Layout (Current)

- Backend operational root: `server/`
- Convex code root: `server/convex/`
- Mobile app root: repository root today; planned migration target is `react-native/`

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
