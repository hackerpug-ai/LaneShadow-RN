# Pre-Existing Issues Blocking Commit

## TypeScript Errors
- `server/convex/http.ts` - multiple implicit `any` errors
- `server/convex/migrations/*` - missing `../_generated/server` imports
- `server/convex/queries/osm.ts` - missing `../_generated/server` and implicit `any` errors
- `server/convex/semanticSearch.ts` - missing generated Convex modules and many implicit `any` errors
- `server/convex/types.ts`, `server/convex/users.ts`, `server/lib/storage/upload-to-convex.ts` - missing generated Convex imports

## Lint Errors
- `logos/v2/preview.html` - multiple `lint/a11y/useAltText` errors
- Biome summary: 43 errors, 128 warnings, 1 info in unrelated files

## Verification
- `pnpm type-check:native` and `pnpm exec biome check --no-errors-on-unmatched` were re-run from this worktree after only iOS source/test changes for FIX-S08-IOS-T02.
- The failures are outside the touched iOS files for this task and match the existing unrelated server/logo state in this worktree.
