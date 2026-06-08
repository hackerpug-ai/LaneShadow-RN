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

## .spec Directory

All plans stored in `.spec/prd/`. See `.spec/PRD.md` for overview.
This fork preserves all original plans from the main LaneShadow repo.
