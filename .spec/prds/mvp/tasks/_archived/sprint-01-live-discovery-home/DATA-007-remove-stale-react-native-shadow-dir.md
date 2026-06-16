# DATA-007: Remove stale react-native/ shadow directory + fix workspace config

| Field | Value |
|---|---|
| Sprint | sprint-01-live-discovery-home |
| Agent | planner |
| Estimate | 60 min |
| Type | INFRA |
| Status | Backlog |
| Proposed By | convex-planner |

## Background
A stale `react-native/` shadow directory duplicates the real React Native source at the repo root and breaks workspace resolution / Metro resolution / the Convex server workspace path (`pnpm --dir server run convex:dev`), threatening green builds on both iOS and Android. It must be removed and the workspace config corrected so builds stay green. This is enabling plumbing for the rest of the sprint.

## Critical Constraints
- MUST remove the stale `react-native/` shadow directory (NOT the real root `app/`/`components/`/`server/` source trees).
- MUST fix workspace config (root `package.json` workspaces, `metro.config.js` watchFolders/nodeModulesPaths, `tsconfig.json` paths, `app.config.ts`/`app.json`) so resolution points only at the real root source.
- MUST keep both iOS and Android builds green.
- NEVER delete or alter the real source trees (`components/`, `app/`, `server/`, `hooks/`, `contexts/`).
- NEVER introduce a new dependency.

## Specification
**Objective:** Remove the stale `react-native/` shadow directory and correct workspace config so both-platform builds are green.
**Success State:** `pnpm type-check` and `pnpm --dir server run convex:dev -- --once` both exit 0 on a clean tree, and no `react-native/` shadow dir remains.

## Implementation Steps
1. Confirm the `react-native/` directory is a stale shadow (diff a sample file vs the root equivalent) — do NOT remove the real source.
2. Remove the stale `react-native/` shadow directory.
3. Audit + fix root `package.json` `workspaces`, `metro.config.js` `watchFolders`/`nodeModulesPaths`, and `tsconfig.json` paths so they reference only the real root source and `server/`.
4. Verify `app.config.ts`/`app.json` project root / entry resolve to the real source.
5. Run the verification checklist.

## Verification Checklist
- [ ] `test -d react-native` returns non-zero (shadow dir gone): `test -d react-native && echo PRESENT || echo GONE` → `GONE`
- [ ] TypeScript clean: `pnpm type-check` → Exit 0
- [ ] Convex build clean: `pnpm --dir server run convex:dev -- --once` → Exit 0, functions compile
- [ ] `git status` shows only the intended config deletions/edits (no accidental removal of real source)

## Reading List
- Root `package.json` (workspaces)
- `metro.config.js` (watchFolders, nodeModulesPaths)
- `tsconfig.json` + `server/tsconfig.json` (paths)
- `app.config.ts`, `app.json`
- PRD `.spec/prds/mvp/01-scope.md` (repo-cleanup bullet)

## Guardrails
**Write Allowed:** remove `react-native/` (shadow); modify `package.json` (workspaces), `metro.config.js`, `tsconfig.json`, `app.config.ts`, `app.json`, `.watchmanconfig` if needed.
**Write Prohibited:** `components/`, `app/`, `server/`, `hooks/`, `contexts/`, `assets/` — the real source trees (read-only).

## Code Pattern / Design
- Pattern: single canonical source tree at repo root; `server/` as the Convex workspace; Metro `watchFolders` limited to root + `server/`.
- Anti-pattern: two competing `react-native/` and root trees; Metro watching a stale duplicate causing duplicate-module / wrong-resolve errors.

## Agent Instructions
INFRA task — no TDD. Execute the implementation steps, then run the verification checklist. Fix any resolution errors revealed by type-check / convex build before declaring done.

## Dependencies
- depends_on: none
- blocks: all other Sprint 1 tasks (clean workspace is the enabling prerequisite)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{ "requirements": [ {"id":"AC-1","type":"acceptance_criterion","description":"The stale react-native/ shadow directory is removed and the real source trees are untouched","verify":"test -d react-native && echo PRESENT || echo GONE"}, {"id":"AC-2","type":"acceptance_criterion","description":"Workspace config resolves only to the real root source so pnpm type-check exits 0","verify":"pnpm type-check"}, {"id":"AC-3","type":"acceptance_criterion","description":"The Convex server workspace builds clean (pnpm --dir server run convex:dev -- --once exits 0)","verify":"pnpm --dir server run convex:dev -- --once"}, {"id":"TC-1","type":"test_criterion","description":"The react-native/ shadow directory is gone","maps_to_ac":"AC-1","verify":"test -d react-native && echo PRESENT || echo GONE"}, {"id":"TC-2","type":"test_criterion","description":"TypeScript type-check passes on a clean tree","maps_to_ac":"AC-2","verify":"pnpm type-check"}, {"id":"TC-3","type":"test_criterion","description":"Convex server build passes","maps_to_ac":"AC-3","verify":"pnpm --dir server run convex:dev -- --once"} ] }
-->
