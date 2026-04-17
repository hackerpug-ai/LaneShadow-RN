# RESTR-003: Update convex.json, Scripts, Hooks, and Docs for server/

**Task ID:** RESTR-003
**Epic:** Epic 1 - Repo Restructure & Server Frontload
**Assigned To:** convex-implementer
**Estimate:** 240 min
**Type:** [FEATURE] [INFRA]
**Status:** Backlog

---

## CRITICAL CONSTRAINTS

1. Update both human-facing documentation and machine-facing scripts/hooks in the same pass.
2. Eliminate root-path assumptions for Convex commands once `server/convex/` is authoritative.
3. Keep curation-hardening and native-rewrite task docs aligned with the new backend root.

---

## SPECIFICATION

**Objective:** Update root and server-level configuration so every backend command, hook, and documented workflow runs from `server/`.

**Success State:** Developers and automation both invoke Convex from `server/` with no remaining root-path assumptions.

---

## DELIVERABLES

- `package.json`: root scripts delegated to `server/` and `react-native/` appropriately
- `lefthook.yml`: hooks updated for new server working directory
- `CLAUDE.md`: project docs updated for `server/` and `react-native/` paths
- `README.md`: root usage docs updated for the new repo layout

---

## ACCEPTANCE CRITERIA

### AC-001: Scripts delegate correctly
**GIVEN** backend code now lives under `server/`
**WHEN** root commands run
**THEN** they delegate backend work through the `server/` workspace

### AC-002: Hooks use the new working directory
**GIVEN** automation may run typecheck, lint, or backend checks
**WHEN** hooks execute
**THEN** they enter `server/` for Convex work instead of assuming repo-root Convex files

### AC-003: Documentation matches reality
**GIVEN** developers will follow repo docs during the restructure
**WHEN** they read project documentation
**THEN** paths and commands consistently reference `server/` and `react-native/`

---

## VERIFICATION

- Review root scripts, hooks, and docs for any remaining root `convex/` assumptions.
- Confirm curation-hardening/native-rewrite docs now describe `server/` as the backend working directory.

---

## READING LIST

- `.spec/prds/native-rewrite/04-uc-restructure.md` — UC-RESTR-04 and UC-RESTR-05 requirements
- `lefthook.yml` — current hook working-directory assumptions
- `package.json` — current root scripts and task entry points

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `package.json`
- `lefthook.yml`
- `CLAUDE.md`
- `README.md`

**NEVER MODIFY:**
- `RULES.md` — project rules remain authoritative
- Unrelated native feature implementation files outside the restructure scope
- Business logic unrelated to repo layout or backend/client entry points

---

## DEPENDENCIES

- RESTR-002

---

## OUT OF SCOPE

- Runtime feature development
- Expo app relocation
