# Pre-Existing Issues Blocking Full Verification

## Repo-Wide Lint Gate
- `pnpm exec biome check --no-errors-on-unmatched` exits 1 on files outside this task scope.
- The reported files are `biome.json`, `.kb-run-sprint/state.json`, `implementer_response.json`, `LaneShadow-AppIcon-Pack-Gradient/web/site.webmanifest`, and `logo/web/site.webmanifest`.
- The touched task files `server/convex/actions/agent/sendMessage.ts` and `server/convex/actions/agent/__tests__/sendMessage.test.ts` pass `pnpm exec biome check` directly.

## Repo-Wide Test Gate
- `pnpm test` still exits 1 for unrelated failures outside this task scope.
- Current failures include `convex/__tests__/semanticSearch.test.ts` and `server/convex/__tests__/semanticSearch.test.ts` (`fn.handler is not a function`), `convex/__fixtures__/auth-error-taxonomy.test.ts` and `server/convex/__fixtures__/auth-error-taxonomy.test.ts`, plus existing map/protomaps-related failures already present elsewhere in the suite.
- The task-focused regressions pass: planning integration, monotone planning phase, and the new lazy planning-row regression all exit 0.

## Live Convex Verification
- Live Convex verification is no longer blocked by configuration. A real run succeeded against `dev:quirky-panther-164`; see `.tmp/FIX-S08-CVX-T01/ac-4-trace.json`.
- AC-4 / TC-6 remain unmet because the exact required prompt only produced planning phases `parsing -> drafting -> finalizing`, not three intermediate phases.
