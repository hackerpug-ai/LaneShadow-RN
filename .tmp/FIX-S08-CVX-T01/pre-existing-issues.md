# Pre-Existing Issues Blocking Full Verification

## Live Convex Runtime
- `CONVEX_DEPLOYMENT` is unset in the current shell.
- `CONVEX_TEAM_TOKEN` is also empty.
- No local runtime env file is present in the worktree; `find . -maxdepth 3 \( -name '.env*' -o -name '*.local' \)` found only `./.env.example`.
- `pnpm --dir server run convex:dev -- --once` fails because Convex needs interactive setup and this terminal cannot answer the prompt.
- `cd server && npx convex run db/planningSessions:createSession '{}'` fails immediately with `No CONVEX_DEPLOYMENT set`.

## Repo-Wide Lint Gate
- `pnpm exec biome check --no-errors-on-unmatched` exits 1 on pre-existing formatting drift outside this task scope.
- The reported files include `.kb-run-sprint/state.json`, `implementer_response.json`, `LaneShadow-AppIcon-Pack-Gradient/web/site.webmanifest`, and `logo/web/site.webmanifest`.
- This remediation did not modify those files.

## Repo-Wide Test Gate
- `pnpm test` exits 1 for unrelated failures outside this task scope.
- `server/convex/actions/agent/providers/__tests__/protomapsProvider.test.ts` and `convex/actions/agent/providers/__tests__/protomapsProvider.test.ts` fail because `console.warn` was not called where the current test expects it.
- `server/convex/actions/agent/tools/__tests__/compileSketch.test.ts` and `convex/actions/agent/tools/__tests__/compileSketch.test.ts` fail because `GOOGLE_MAPS_API_KEY` is missing and because existing polyline expectations do not match current output.
- This remediation did not modify those files.
