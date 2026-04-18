# Sprint 1: Repo Restructure and Server Frontload

**Sequence:** 1
**Status:** Completed

## Overview

Frontload the repository restructure so backend work can move to `server/convex/`, the Expo app can move to `react-native/`, and downstream native-rewrite work can proceed against the intended multi-app layout.

## Human Testing Gate

**Gate:** The repo supports `server/convex/` as the backend root and `react-native/` as the Expo app root, with root workflows and docs updated to match.

## Human Test Deliverable

The repo layout matches the intended multi-app structure closely enough for native Android and iOS feature work to proceed in later sprints.

## Human Test Steps

1. Review the repo root and confirm backend work is intended to run from `server/` rather than the old flat layout.
2. Confirm all Convex source, config, and generated files live under `server/convex/` as the authoritative backend location.
3. Run the documented backend workflow from `server/` and confirm `convex dev` resolves correctly there.
4. Confirm the Expo app is planned to live under `react-native/` and root references no longer treat the repo root as the client app root.
5. Review the top-level scripts, hooks, and docs and confirm they consistently describe the restructured layout.

## Source Coverage

- `README.md`
- `00-overview.md`
- `01-scope.md`
- `04-uc-restructure.md`
- `06-technical-requirements.md`
- `.spec/prds/curation-hardening/tasks/INDEX.md`

## Dependencies

- None

## Blocks

- Sprint 2: UI Component Translation and Fidelity Sandbox
- Sprint 3: Auth and Discovery Shell
- Sprint 4: Chat Planning and Comparison
- Sprint 5: Turn-by-Turn Navigation
- Sprint 7: Offline Maps and Cache Recovery
- Sprint 9: Gatekeeper and Platform Polish

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| RESTR-001 | Create `server/` workspace boundary | convex-implementer | 180 min |
| RESTR-002 | Move `convex/` to `server/convex/` | convex-implementer | 300 min |
| RESTR-003 | Update scripts, hooks, and docs for `server/` workflows | convex-implementer | 240 min |
| RESTR-004 | Verify `npx convex dev/deploy` from `server/` | convex-implementer | 180 min |
| RESTR-005 | Move Expo app into `react-native/` and repair root references | worker | 360 min |
