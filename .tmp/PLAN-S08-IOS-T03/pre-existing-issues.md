# Pre-Existing Issues Blocking Commit

## TypeScript Errors
- `server/convex/semanticSearch.ts` — multiple implicit `any` parameter errors (`TS7006`)
- `server/convex/types.ts` — missing generated module `./_generated/dataModel` (`TS2307`)
- `server/convex/users.ts` — missing generated modules `./_generated/dataModel` and `./_generated/server` plus implicit `any` errors
- `server/lib/storage/upload-to-convex.ts` — missing generated module `../../convex/_generated/api` (`TS2307`)

## Lint Warnings / Errors
- `logos/v2/preview.html` — multiple `lint/a11y/useAltText` violations on `<img>` tags
- Repo-wide Biome run reports `42 errors` and `128 warnings` outside the iOS remediation scope

## Test Failures
- None in the iOS remediation scope after switching Swift Testing evidence to suite-level selection

All issues were re-verified as pre-existing by stashing only the `PLAN-S08-IOS-T03` remediation files and rerunning `pnpm type-check:native` and `pnpm exec biome check --no-errors-on-unmatched` against the clean baseline on 2026-05-19.
