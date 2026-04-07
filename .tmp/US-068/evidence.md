# US-068 Evidence Bundle

**Task**: User Favorites Lookup Tool
**Commit SHA**: 043eaf7a (full: see git log)
**Base SHA**: df6e033883acfda026e3a9c855cbcaa4b29cbfd9

## TDD Summary

| AC | Test File | Test Function | RED Evidence |
|----|-----------|---------------|--------------|
| AC-1 | getUserFavorites.test.ts | "with favorites" returns sorted by rating desc | Failed: getUserFavorites module not found |
| AC-2 | getUserFavorites.test.ts | "no favorites" returns empty array | Failed: getUserFavorites module not found |
| AC-3 | getUserFavorites.test.ts | "region filter" filters to bbox only | Failed: getUserFavorites module not found |
| AC-4 | getUserFavorites.test.ts | "max limit" returns at most 10 | Failed: getUserFavorites module not found |

## Files Created/Modified

- `convex/actions/agent/tools/getUserFavorites.ts` (NEW) — core tool implementation
- `convex/actions/agent/tools/__tests__/getUserFavorites.test.ts` (NEW) — 4 tests, all passing
- `convex/actions/agent/lib/piTools.ts` (MODIFIED) — added getUserFavorites to AgentToolSchemas

## Quality Gates

- [x] pnpm type-check — 0 errors
- [x] pnpm lint — 0 errors (warnings only, all pre-existing)
- [x] vitest run — 4/4 tests pass
