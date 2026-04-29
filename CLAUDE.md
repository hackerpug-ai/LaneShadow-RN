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

## Critical Reading

- **Cross-Platform Component Parity** ([RULES.md](RULES.md#cross-platform-component-parity)) — iOS and Android sandbox stories MUST share the same `id` string (canonical naming spec: lowercase, dot-separated, kebab-case). The story id is the PNG filename stem and the parity key. Run `pnpm snapshots:check` before merge; never bypass.
- **Real Device E2E Testing** ([RULES.md](RULES.md#real-device-e2e-testing), [docs/REAL_DEVICE_E2E.md](docs/REAL_DEVICE_E2E.md)) — human gates for non-sandbox code must include real-device E2E evidence. iOS uses direct WDA over HTTP; Android-only observations must be recorded honestly as MANUAL/BLOCKED until an equivalent device harness exists.

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
