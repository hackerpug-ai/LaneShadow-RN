# AGENTS — LaneShadow RN

This project is the **React Native + Convex** fork of LaneShadow.

## Stack

- **Frontend**: React Native / Expo (in `react-native/`)
- **Backend**: Convex (in `convex/` at repository root)
- **Shared**: Client/server shared utilities and types (in `shared/`)
- **Tokens**: Design tokens in `tokens/`
- **Testing**: Vitest

## Key Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start Convex + Expo concurrently |
| `pnpm ios` | Run on iOS simulator |
| `pnpm android` | Run on Android emulator |
| `pnpm test` | Run Vitest tests |
| `pnpm lint` | Biome lint |
| `pnpm type-check` | TypeScript check (server + RN) |

## Directory Layout

```
react-native/    # Expo/RN app (screens, components, hooks, stores)
convex/          # Convex backend (convex functions, schema, models)
shared/          # Shared client/server utilities and types
tokens/          # Design tokens (shared)
.spec/           # Plans, PRDs, research
```

## Convex Backend

When working on Convex code, read `convex/_generated/ai/guidelines.md` first.

## Pre-Commit Checks

TypeScript typecheck + Biome lint run on commit via lefthook.

## Agent Dispatch

- Convex tasks → `convex-implementer` / `convex-reviewer`
- RN tasks → `react-native-ui-implementer` / `react-native-ui-reviewer`
- Planning → `planner`

No native iOS/Android specialists needed — this is RN-only.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
