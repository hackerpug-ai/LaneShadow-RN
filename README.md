# LaneShadow

LaneShadow is a React Native + Convex project in the middle of a repo restructure.

## Canonical Rules

Project operating rules live in [RULES.md](./RULES.md).
Tooling/runtime command truth for this restructure baseline is defined by this README, `lefthook.yml`, and workspace `package.json` scripts until `RULES.md` is fully synchronized.

## Current Repository Layout

```text
LaneShadow/
├── react-native/           # Expo app workspace
│   ├── app/                # Expo Router app directory
│   ├── components/         # React Native components
│   ├── hooks/              # Custom hooks
│   ├── screens/            # Screen components
│   ├── stores/             # State management
│   ├── providers/          # Context providers
│   ├── app.config.ts       # Expo configuration
│   └── package.json        # App workspace entry
├── server/                 # Backend workspace root
│   ├── convex/             # Convex functions, schema, generated files
│   └── package.json        # Backend command entry points
├── lefthook.yml            # Git hook configuration
├── pnpm-workspace.yaml     # Monorepo workspace config
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

App scripts delegate to the `react-native/` workspace.

### Combined workflow

- `pnpm dev` runs backend + app dev loops concurrently.

## Hooks

Hooks are managed with `lefthook`:

- `pre-commit`: `tsgo` typecheck + `biome` checks
- `pre-push`: Convex verification through `server/` (`pnpm --dir server run convex:dev -- --once`)

## Environment

Create `.env.local` at `react-native/` and set:

- `EXPO_PUBLIC_CONVEX_URL`

For backend-only work, run commands from `server/` or via root `server:*` scripts.

## Notes

- Do not reintroduce legacy hook or lint/format assumptions.
- Convex backend ownership is `server/convex/`; root `convex` paths should be treated as compatibility artifacts during migration.
