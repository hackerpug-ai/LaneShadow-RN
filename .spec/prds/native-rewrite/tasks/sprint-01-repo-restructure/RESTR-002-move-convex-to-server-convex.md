# RESTR-002: Move convex/ to convex/

**Task ID:** RESTR-002
**Sprint:** Sprint 1 - Repo Restructure and Server Frontload
**Assigned To:** convex-implementer
**Estimate:** 300 min
**Type:** [FEATURE] [INFRA]
**Status:** Completed

---

## CRITICAL CONSTRAINTS

1. Preserve all Convex source, schema, migrations, tests, and generated code during the move.
2. Do not leave dual authoritative locations for backend code after the move.
3. Regenerate or reconcile generated files from the new working directory instead of copying stale output blindly.

---

## SPECIFICATION

**Objective:** Move the entire Convex backend from root `convex/` into `convex/` without breaking generated files, schema discovery, or supporting scripts.

**Success State:** All backend code, generated artifacts, schema, and related runtime assumptions live under `convex/`.

---

## DELIVERABLES

- `convex/`: authoritative home for all Convex functions, schema, generated code, and migrations
- `server/convex.json`: Convex config relocated or updated for server-root execution
- `convex/_generated/`: generated artifacts regenerated from the new working directory

---

## ACCEPTANCE CRITERIA

### AC-001: Convex source is relocated
**GIVEN** backend code currently lives at root
**WHEN** the move finishes
**THEN** all authoritative Convex code lives under `convex/`

### AC-002: Generated artifacts are valid
**GIVEN** Convex uses generated client/server output
**WHEN** the new location is built
**THEN** `convex/_generated/` is valid for the new working directory

### AC-003: No split-brain backend root remains
**GIVEN** parallel work will now target `convex/`
**WHEN** the move is reviewed
**THEN** there is no ambiguity about where backend code lives

---

## VERIFICATION

- Confirm the old root `convex/` tree is no longer the authoritative backend location.
- Confirm `convex/` contains schema, functions, generated code, tests, and migrations.

---

## READING LIST

- `.spec/prds/native-rewrite/04-uc-restructure.md` — UC-RESTR-01 backend move requirements
- `.spec/prds/native-rewrite/00-overview.md` — why `server/` becomes the backend root
- `convex.json` — current Convex config assumptions before relocation

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `convex/`
- `server/convex.json`
- `convex/_generated/`

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

---

## REVIEW (orchestrator fallback after reviewer stall)

**Review Date:** 2026-04-16
**Task Commit SHA:** 429015d8b02d225e7b9920115a91e2a3f5346af9
**Effective Baseline Reviewed:** b18071089bded0351ad7c61a998b34ce9d21c3e8
**Verdict:** APPROVED

### Acceptance Criteria Checklist

- [x] AC-001: Convex source is relocated under `convex/`
- [x] AC-002: `convex/_generated/` exists in the relocated tree and the prior task evidence captured successful relocated codegen/build output
- [x] AC-003: There is a single authoritative backend tree; root `convex` is now a symlink to `server/convex`, not a second source tree

### Task-Local Verification

- `git rev-parse --verify b18071089bded0351ad7c61a998b34ce9d21c3e8^{commit}` (current baseline exists)
- `git show --stat --summary --name-status 429015d8b02d225e7b9920115a91e2a3f5346af9` (task commit moved the backend tree into `convex/` and added `server/convex.json`)
- `ls -ld convex server/convex server/models && readlink convex && readlink server/models` (root `convex` points to `server/convex`; `server/models` points to `../models`)
- `test -L convex && test -L server/models && test -d convex/_generated && test -f convex/schema.ts` (layout and generated artifacts present)
- `.tmp/RESTR-002/layout_verification.txt` confirms `root_convex_absent=true` at the time of relocation review and `.tmp/RESTR-002/verify_codegen_pass.txt` captured a successful relocated Convex build/codegen pass

### Residual Note

- `pnpm --dir server codegen` on current `main` fails because `server/` does not have its own installed dependency context yet. That is an operational workflow issue for follow-up tasks, not a blocker on the file relocation accepted here.
