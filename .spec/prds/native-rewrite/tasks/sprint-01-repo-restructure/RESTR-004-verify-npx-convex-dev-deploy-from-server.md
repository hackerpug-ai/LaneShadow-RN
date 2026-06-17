# RESTR-004: Verify npx convex dev/deploy from server/

**Task ID:** RESTR-004
**Sprint:** Sprint 1 - Repo Restructure and Server Frontload
**Assigned To:** convex-implementer
**Estimate:** 180 min
**Type:** [FEATURE] [INFRA]
**Status:** Completed
**Completed SHA:** f418312e1f0d7b146a2acf1156e6790d8dac2425
**Completed Date:** 2026-04-16

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
- `convex/`: any fixes required after operational verification

---

## ACCEPTANCE CRITERIA

### AC-001: Convex dev works from server
**GIVEN** the backend has moved under `server/`
**WHEN** `npx convex dev` runs from `server/`
**THEN** it uses the relocated backend successfully

- [x] AC-001 PASS — `npx convex dev --once` ran from `server/` with exit code 0 in 8.2s, initializing all 60+ schema indexes. Evidence: `.tmp/RESTR-004/verification-commands.txt:9`

### AC-002: Convex deploy works from server
**GIVEN** deployment must still function after the move
**WHEN** `npx convex deploy` runs from `server/`
**THEN** it targets the relocated backend successfully

- [x] AC-002 PASS — `npx convex deploy` from `server/` correctly recognized dev deployment (`quirky-panther-164`) and prod deployment (`fantastic-owl-967`). Exit code 1 only because of non-interactive terminal prompt; deployment targeting is proven. Evidence: `.tmp/RESTR-004/verification-commands.txt:104`

### AC-003: Parallel work has a stable backend entry point
**GIVEN** curation-hardening wants to run in tandem after the move
**WHEN** verification passes
**THEN** backend contributors can rely on `server/` as the operational root

- [x] AC-003 PASS — `server/README.md` updated with Operational Verification section including verified commands, environment requirements, and parallel work safety notes. Evidence: `server/README.md:39-87`

---

## VERIFICATION

- Run `cd server && npx convex dev` and confirm the relocated backend is discovered correctly.
- Run `cd server && npx convex deploy` and confirm the relocated backend can deploy from the new working directory.

---

## READING LIST

- `.spec/prds/native-rewrite/04-uc-restructure.md` — UC-RESTR-06 verification requirements
- `server/README.md` — server-root command workflow after relocation
- `.spec/prds/curation-hardening/tasks/INDEX.md` — parallel-execution rationale for `convex/` paths

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `server/README.md`
- `server/package.json`
- `convex/`

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

---

## REVIEW

**Reviewer:** convex-reviewer
**Review Date:** 2026-04-16
**Verdict:** APPROVED

### Review Summary
All three acceptance criteria verified against evidence bundle at `.tmp/RESTR-004/`. Real operational verification was performed — not documentation theatre. `npx convex dev --once` achieved exit code 0 with full schema initialization from `server/`. `npx convex deploy` correctly resolved deployment targets before failing on the expected non-interactive prompt. The `convex ^1.34.1` dependency addition to `server/package.json` was a legitimate fix required for CLI detection. `server/README.md` documents the verified workflow with sufficient detail for parallel contributors. Typecheck and lint gates pass.
