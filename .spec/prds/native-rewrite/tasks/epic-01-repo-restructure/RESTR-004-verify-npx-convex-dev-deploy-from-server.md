# RESTR-004: Verify npx convex dev/deploy from server/

**Task ID:** RESTR-004
**Epic:** Epic 1 - Repo Restructure & Server Frontload
**Assigned To:** convex-implementer
**Estimate:** 180 min
**Type:** [FEATURE] [INFRA]
**Status:** Backlog

---

## CRITICAL CONSTRAINTS

1. Verification is a real operational gate, not a documentation-only claim.
2. Fix any command/path breakage uncovered by the verification pass before declaring the restructure done.
3. Capture the actual supported backend workflow from `server/` so parallel work can start safely.

---

## SPECIFICATION

**Objective:** Prove that the relocated backend works operationally by running the supported Convex workflows from `server/` and fixing any breakage found.

**Success State:** The team can run `npx convex dev` and `npx convex deploy` from `server/` with the new structure.

---

## DELIVERABLES

- `server/README.md`: operational verification notes for backend commands
- `server/package.json`: verification-ready scripts for backend dev/deploy/test flows
- `server/convex/`: any fixes required after operational verification

---

## ACCEPTANCE CRITERIA

### AC-001: Convex dev works from server
**GIVEN** the backend has moved under `server/`
**WHEN** `npx convex dev` runs from `server/`
**THEN** it uses the relocated backend successfully

### AC-002: Convex deploy works from server
**GIVEN** deployment must still function after the move
**WHEN** `npx convex deploy` runs from `server/`
**THEN** it targets the relocated backend successfully

### AC-003: Parallel work has a stable backend entry point
**GIVEN** curation-hardening wants to run in tandem after the move
**WHEN** verification passes
**THEN** backend contributors can rely on `server/` as the operational root

---

## VERIFICATION

- Run `cd server && npx convex dev` and confirm the relocated backend is discovered correctly.
- Run `cd server && npx convex deploy` and confirm the relocated backend can deploy from the new working directory.

---

## READING LIST

- `.spec/prds/native-rewrite/04-uc-restructure.md` — UC-RESTR-06 verification requirements
- `server/README.md` — server-root command workflow after relocation
- `.spec/prds/curation-hardening/tasks/INDEX.md` — parallel-execution rationale for `server/convex/` paths

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `server/README.md`
- `server/package.json`
- `server/convex/`

**NEVER MODIFY:**
- `RULES.md` — project rules remain authoritative
- Unrelated native feature implementation files outside the restructure scope
- Business logic unrelated to repo layout or backend/client entry points

---

## DEPENDENCIES

- RESTR-003

---

## OUT OF SCOPE

- Expo app move
- Native feature implementation
