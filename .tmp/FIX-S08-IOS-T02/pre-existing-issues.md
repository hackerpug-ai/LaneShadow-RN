# Pre-Existing Issues Blocking Full Repo Gates

## TypeScript / Generated Convex Types
- `pnpm type-check:native` still fails before touching this remediation because `server/convex/_generated/*` modules are missing from the workspace and many server files depend on them.
- Representative failures:
  - `server/convex/actions/agent/sendMessage.ts`: cannot find `../../_generated/api`
  - `server/convex/actions/agent/sendMessage.ts`: cannot find `../../_generated/dataModel`
  - `server/convex/db/clerkSync.ts`: cannot find `../_generated/server`

## Biome / Repo Formatting-Lint State
- `pnpm exec biome check --no-errors-on-unmatched` fails on pre-existing repo files unrelated to this task.
- Representative failures:
  - `biome.json`: schema version mismatch `2.4.12` vs CLI `2.4.15`
  - `implementer_response.json`: formatter diff
  - `logos/v2/preview.html`: repeated missing `alt` text lint violations

## iOS Verification State
- Focused class-level Swift Testing run passed:
  - `xcodebuild ... -only-testing:LaneShadowTests/ConvexClientLaneShadowTests`
  - Executed 2 tests and both passed.
- The per-method selectors in the task spec are still unreliable for this Swift Testing suite:
  - one selector returned success with 0 XCTest tests executed
  - the other selector crashed before establishing a test connection
- The live AC-4 trace is now captured successfully in `.tmp/FIX-S08-IOS-T02/ac-4-trace.txt` and `.tmp/FIX-S08-IOS-T02/ac-4-raw.json`.

These issues pre-date this remediation and are unrelated to the AC-4 evidence update.
