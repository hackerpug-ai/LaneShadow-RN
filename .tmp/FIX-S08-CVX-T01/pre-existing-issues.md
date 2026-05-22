# Pre-Existing Issues Blocking Full Verification

The following failures reproduce after stashing all task changes, so they are not caused by FIX-S08-CVX-T01.

## Lint
- `logos/preview.html` and `logos/v2/preview.html`: existing `lint/a11y/useAltText` errors from missing `alt`/`aria-label` on preview images.

## Tests
- `server/convex/__fixtures__/auth-error-taxonomy.test.ts`: fixture missing `GEOCODE_UPSTREAM_ERROR`.
- `server/convex/db/__tests__/savedRoutes.delete.test.ts`: `deleteById.handler is not a function` in all three cases.
- `pnpm test` also ends with `ERR_IPC_CHANNEL_CLOSED` after the unrelated failures above.

Verification method: `git stash push -u`, rerun `pnpm exec biome check --no-errors-on-unmatched` and `pnpm test`, then `git stash pop`.
