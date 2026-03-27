# US-031 Pre-Existing Issues

## Verification Method
Confirmed via `git stash` → run checks → `git stash pop`.

## Pre-existing TypeCheck Failure
- `components/map/route-polyline.test.tsx(109)` — syntax errors (TS1005, TS1136, etc.)
- Exists on baseline commit b2ec3f3 before any US-031 changes

## Pre-existing Lint Failure
- ESLint: "react-native" plugin not found in configuration
- Exists on baseline commit b2ec3f3 before any US-031 changes

## Jest Compilation Failure (with my changes in working tree)
- `convex/db/savedRoutes.ts` lines 306/364 — `startLabel`/`endLabel` type errors
- Caused by concurrent US-036 task changes that are in the working tree
- These changes were NOT introduced by US-031; they are from another agent's US-036 work
- My specific test file passes via `bun test` (14/14 pass)
