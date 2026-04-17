# LaneShadow

LaneShadow is a React Native + Convex project in the middle of a repo restructure.

## Canonical Rules

Project operating rules live in [RULES.md](./RULES.md).
Tooling/runtime command truth for this restructure baseline is defined by this README, `lefthook.yml`, and workspace `package.json` scripts until `RULES.md` is fully synchronized.

## Current Repository Layout

```text
LaneShadow/
├── server/                 # Backend workspace root
│   ├── convex/             # Convex functions, schema, generated files
│   └── package.json        # Backend command entry points
├── react-native/           # Planned Expo app root (created in RESTR-005)
├── app/ components/ ...    # Current Expo app location (temporary)
├── lefthook.yml            # Git hook configuration
└── package.json            # Root command delegator
```

## Toolchain Baseline

- Type checking: `tsgo` (`pnpm type-check:native`)
- Lint/format: `biome` (`pnpm lint`, `pnpm format`)
- Git hooks: `lefthook` (`pnpm prepare` installs hooks)
- Backend runtime and data APIs: Convex from `server/`

## Root Scripts

### Backend (delegates to `server/`)

- `pnpm server:dev`
- `pnpm server:deploy`
- `pnpm server:codegen`
- `pnpm server:dashboard`

### App workflow

- `pnpm client:dev`
- `pnpm ios`
- `pnpm android`
- `pnpm web`

App scripts are migration-safe:
- If `react-native/` exists, commands run there.
- If it does not exist yet, commands run from repository root.

### Combined workflow

- `pnpm dev` runs backend + app dev loops concurrently.

## Hooks

Hooks are managed with `lefthook`:

- `pre-commit`: `tsgo` typecheck + `biome` checks
- `pre-push`: Convex verification through `server/` (`pnpm --dir server run convex:dev -- --once`)

## Environment

Create `.env.local` at the active app root (currently repo root; later `react-native/`) and set:

- `EXPO_PUBLIC_CONVEX_URL`

For backend-only work, run commands from `server/` or via root `server:*` scripts.

## Notes

- Do not reintroduce legacy hook or lint/format assumptions.
- Convex backend ownership is `server/convex/`; root `convex` paths should be treated as compatibility artifacts during migration.
