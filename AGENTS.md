# AGENTS — LaneShadow RN

This project is the **React Native + Convex** fork of LaneShadow.

## Stack

- **Frontend**: React Native / Expo (in `react-native/`)
- **Backend**: Convex (in `server/convex/`, deployed from `server/`)
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
server/          # Convex backend (convex functions, schema, models)
convex/          # Symlink → server/convex/ (legacy path)
tokens/          # Design tokens (shared)
.spec/           # Plans, PRDs, research
```

## Convex Backend

When working on Convex code, read `server/convex/_generated/ai/guidelines.md` first.

## Pre-Commit Checks

TypeScript typecheck + Biome lint run on commit via lefthook.

## Agent Dispatch

- Convex tasks → `convex-implementer` / `convex-reviewer`
- RN tasks → `react-native-ui-implementer` / `react-native-ui-reviewer`
- Planning → `planner`

No native iOS/Android specialists needed — this is RN-only.
