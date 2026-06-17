# LaneShadow RN — Project Rules

**This is the React Native + Convex fork of LaneShadow.**

---

## Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| React Native (iOS) | Primary | Expo-managed |
| React Native (Android) | Primary | Expo-managed |
| Web | Secondary | Expo web |
| Convex | Required | Backend (API, database, subscriptions) |

---

## User Context

**Required reading:** [User Profiles](.spec/USER-PROFILES.md)

LaneShadow serves recreational cruiser and touring riders who ride for enjoyment and scenery.

---

## Brand Philosophy

**Required reading:** [`.spec/brand/PHILOSOPHY.md`](.spec/brand/PHILOSOPHY.md)

---

## Convex Backend

Read `server/convex/_generated/ai/guidelines.md` before working on Convex code.

---

## Directory Layout

```
react-native/    # Expo/RN app
server/          # Convex backend workspace
convex/          # Symlink → server/convex/
tokens/          # Design tokens
.spec/           # Plans, PRDs, research
```

---

## Pre-Commit Checks

Via lefthook:
1. TypeScript type check — `pnpm type-check`
2. Biome lint/format — `pnpm exec biome check`
3. Token validation (when tokens/ changes)

---

## Agent Dispatch

| Agent | When to Use |
|-------|-------------|
| `convex-planner` | Convex schema/API planning |
| `convex-implementer` | Convex mutations/queries |
| `convex-reviewer` | Convex code review |
| `react-native-ui-implementer` | RN component implementation |
| `react-native-ui-reviewer` | RN code review |
| `planner` | Sprint/task planning |

---

## Verification

| Check | Command |
|-------|---------|
| TypeCheck | `pnpm type-check` |
| Lint | `pnpm lint` |
| Test | `pnpm test` |
| Convex build | `pnpm --dir server run convex:dev -- --once` |

---

## Metro MCP — Runtime Debugging

See [metro-mcp docs](https://metromcp.dev) for full reference.

### When to use

- **Inspect React Native components** — ask the agent to find misaligned elements, check styles, trace the tree
- **Track network requests** — debug API calls, inspect request/response bodies, spot failures
- **Capture console logs** — stream Hermes logs directly into agent context
- **Take screenshots** — verify visual output in simulator/emulator without manual capture
- **CPU profiling** — find render bottlenecks via Hermes CDP or React Profiler
- **Test recording** — record user flows and generate Appium/Maestro/Detox tests

### When NOT to use

- Convex backend logic — use `convex` MCP tools instead
- Static analysis (lint, typecheck) — use `pnpm lint` / `pnpm type-check`
- Build/CI failures — check logs; metro-mcp only knows the running app

### How to trigger in agent sessions

Ask the agent directly with natural language. Examples:

- "Inspect the component tree on the current screen"
- "What network requests fired when the app loaded?"
- "Take a screenshot of the home screen"
- "Profile the Settings tab — is anything slow?"
- "Record my interaction on the checkout flow and generate a Detox test"

### Prerequisites

1. Metro dev server must be running (`pnpm dev` or `pnpm start`)
2. App must be built and running in iOS Simulator, Android Emulator, or USB device with Hermes enabled
3. Metro-mcp auto-discovers the Metro port (8081, 8082, or 19000–19002) — no extra config needed unless using a custom port
4. If using Chrome DevTools alongside the MCP, use the `open_devtools` tool instead of pressing "j" in Metro (avoids CDP connection conflict)

---

## .spec Directory

All plans stored in `.spec/prd/`. See `.spec/PRD.md` for overview.
This fork preserves all original plans from the main LaneShadow repo.
