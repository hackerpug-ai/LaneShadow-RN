# Epic 1: Repo Restructure & Server Frontload

**Sequence:** 1
**Timeline:** Phase 1
**Status:** Planned

---

## Overview

Frontload the repository restructure so backend work can move to `server/convex/`, the Expo app can move to `react-native/`, and downstream native-rewrite plus curation-hardening work can proceed against the intended repo layout.

---

## Human Test Deliverable

A reviewer can inspect this epic and verify the repo layout now matches the intended multi-app structure closely enough for native-rewrite and curation-hardening work to continue in parallel.

**Test Steps:**
1. Review the server workspace task and confirm `server/` is established before Convex relocation.
2. Review the Convex move task and confirm backend code is intended to live under `server/convex/`.
3. Review the config/scripts/hooks/docs task and confirm root workflows now enter `server/` for backend work.
4. Review the verification task and confirm `npx convex dev` and `npx convex deploy` are explicitly gated from `server/`.
5. Review the Expo move task and confirm the legacy app is planned to live under `react-native/` before native feature work proceeds.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| RESTR-001 | Create server/ Workspace Boundary | convex-implementer | 180 min |
| RESTR-002 | Move convex/ to server/convex/ | convex-implementer | 300 min |
| RESTR-003 | Update convex.json, Scripts, Hooks, and Docs for server/ | convex-implementer | 240 min |
| RESTR-004 | Verify npx convex dev/deploy from server/ | convex-implementer | 180 min |
| RESTR-005 | Move Expo App into react-native/ and Repair Root References | worker | 360 min |

---

## Human Testing Gate

**Gate:** The repo supports `server/convex/` as the backend root and `react-native/` as the Expo app root, with backend commands verified from `server/`.

---

## Source Coverage

- `04-uc-restructure.md`
- `06-technical-requirements.md`
- `README.md`
- `curation-hardening/tasks/INDEX.md`

---

## Blocks

- Native foundation work in Epic 2 and beyond
- Parallel curation-hardening work that expects `server/convex/`
