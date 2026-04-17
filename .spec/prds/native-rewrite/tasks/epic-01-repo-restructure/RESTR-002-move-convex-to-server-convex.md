# RESTR-002: Move convex/ to server/convex/

**Task ID:** RESTR-002
**Epic:** Epic 1 - Repo Restructure & Server Frontload
**Assigned To:** convex-implementer
**Estimate:** 300 min
**Type:** [FEATURE] [INFRA]
**Status:** Backlog

---

## CRITICAL CONSTRAINTS

1. Preserve all Convex source, schema, migrations, tests, and generated code during the move.
2. Do not leave dual authoritative locations for backend code after the move.
3. Regenerate or reconcile generated files from the new working directory instead of copying stale output blindly.

---

## SPECIFICATION

**Objective:** Move the entire Convex backend from root `convex/` into `server/convex/` without breaking generated files, schema discovery, or supporting scripts.

**Success State:** All backend code, generated artifacts, schema, and related runtime assumptions live under `server/convex/`.

---

## DELIVERABLES

- `server/convex/`: authoritative home for all Convex functions, schema, generated code, and migrations
- `server/convex.json`: Convex config relocated or updated for server-root execution
- `server/convex/_generated/`: generated artifacts regenerated from the new working directory

---

## ACCEPTANCE CRITERIA

### AC-001: Convex source is relocated
**GIVEN** backend code currently lives at root
**WHEN** the move finishes
**THEN** all authoritative Convex code lives under `server/convex/`

### AC-002: Generated artifacts are valid
**GIVEN** Convex uses generated client/server output
**WHEN** the new location is built
**THEN** `server/convex/_generated/` is valid for the new working directory

### AC-003: No split-brain backend root remains
**GIVEN** parallel work will now target `server/convex/`
**WHEN** the move is reviewed
**THEN** there is no ambiguity about where backend code lives

---

## VERIFICATION

- Confirm the old root `convex/` tree is no longer the authoritative backend location.
- Confirm `server/convex/` contains schema, functions, generated code, tests, and migrations.

---

## READING LIST

- `.spec/prds/native-rewrite/04-uc-restructure.md` — UC-RESTR-01 backend move requirements
- `.spec/prds/native-rewrite/00-overview.md` — why `server/` becomes the backend root
- `convex.json` — current Convex config assumptions before relocation

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `server/convex/`
- `server/convex.json`
- `server/convex/_generated/`

**NEVER MODIFY:**
- `RULES.md` — project rules remain authoritative
- Unrelated native feature implementation files outside the restructure scope
- Business logic unrelated to repo layout or backend/client entry points

---

## DEPENDENCIES

- RESTR-001

---

## OUT OF SCOPE

- Hook/script updates outside backend path rewrites
- Moving the Expo app
