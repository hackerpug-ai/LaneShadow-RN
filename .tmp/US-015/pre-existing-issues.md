# Pre-existing Issues - US-015

## Convex dev --once fails in worktree

The pre-commit hook runs `npx convex dev --once` which fails with exit code 1
in non-interactive terminals (worktree environment):

```
✖ Cannot prompt for input in non-interactive terminals. (What would you like to configure?)
```

**Verification**: Stashed all changes and re-ran — same failure on clean main code.
This is a worktree configuration issue, not caused by US-015 changes.

## TypeScript and lint checks pass

- `npm run type-check` (tsc --noEmit): EXIT 0
- `npm run lint` (eslint): EXIT 0, 0 errors, 778 warnings (all pre-existing)
