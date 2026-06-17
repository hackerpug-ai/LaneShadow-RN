# Server workspace (legacy)

Backend source has moved to the repository root.

- Convex backend code: `convex/`
- Shared client/server utilities: `shared/`
- Type generation script: `scripts/generate-mobile-types.ts`
- Health check script: `scripts/check-convex-health.mjs`

Run backend commands from the repository root:

```bash
pnpm convex:dev       # start convex dev
pnpm convex:codegen   # regenerate generated types
pnpm convex:deploy    # deploy to Convex
```

This directory is kept only for historical reference and will be removed once all remaining references are migrated.
