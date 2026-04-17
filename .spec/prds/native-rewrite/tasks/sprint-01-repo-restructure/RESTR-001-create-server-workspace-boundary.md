# RESTR-001: Create server/ Workspace Boundary

**Task ID:** RESTR-001
**Sprint:** Sprint 1 - Repo Restructure and Server Frontload
**Assigned To:** convex-implementer
**Estimate:** 180 min
**Type:** [FEATURE] [INFRA]
**Status:** Completed

---

## CRITICAL CONSTRAINTS

1. Do this before any downstream backend task assumes `server/convex/` exists.
2. Treat `server/` as the new operational root for backend commands, not just a placeholder folder.
3. Do not move feature code yet; this task establishes the boundary only.

---

## SPECIFICATION

**Objective:** Create the `server/` workspace boundary and establish it as the authoritative home for backend tooling before any native feature work continues.

**Success State:** The repository has a real `server/` workspace with package/tooling boundaries ready to receive Convex and related backend commands.

---

## DELIVERABLES

- `server/package.json`: workspace manifest for backend commands and dependencies
- `server/README.md`: server workspace usage and command entry points
- `server/.gitignore`: server-local ignores for generated or runtime artifacts

---

## ACCEPTANCE CRITERIA

### AC-001: Server workspace exists
**GIVEN** the repo is still rooted around a flat app/backend layout
**WHEN** this task completes
**THEN** a real `server/` workspace exists with backend command scaffolding

### AC-002: Backend entry point is documented
**GIVEN** future work will run from `server/`
**WHEN** the workspace is reviewed
**THEN** backend commands and purpose are documented at the workspace root

### AC-003: Downstream tasks can target server/
**GIVEN** native-rewrite and curation-hardening depend on a stable backend root
**WHEN** the workspace is created
**THEN** subsequent tasks can safely reference `server/` as the backend root

---

## VERIFICATION

- Confirm `server/` exists with a backend workspace manifest and README.
- Confirm downstream task docs can consistently target `server/` as the backend working directory.

---

## READING LIST

- `.spec/prds/native-rewrite/04-uc-restructure.md` — restructure acceptance criteria and server-root expectations
- `.spec/prds/native-rewrite/06-technical-requirements.md` — end-state repo layout and working-directory rules
- `.spec/prds/curation-hardening/tasks/INDEX.md` — parallel execution note already expecting `server/convex/` paths

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `server/package.json`
- `server/README.md`
- `server/.gitignore`

**NEVER MODIFY:**
- `RULES.md` — project rules remain authoritative
- Unrelated native feature implementation files outside the restructure scope
- Business logic unrelated to repo layout or backend/client entry points

---

## DEPENDENCIES

- None

---

## OUT OF SCOPE

- Moving Convex files
- Moving the Expo app

---

## REVIEW (convex-reviewer)

**Review Date:** 2026-04-16
**Commit SHA:** ff9981f017b07d6e6b9b4359e7a6e1aff0552ca8
**Verdict:** APPROVED

### Acceptance Criteria Checklist

- [x] AC-001: Server workspace exists with backend command scaffolding (server workspace files created in commit `ff9981f017b07d6e6b9b4359e7a6e1aff0552ca8`)
- [x] AC-002: Backend entry point is documented (`server/README.md` documents purpose + entry point commands; `server/package.json` provides scripts that fail fast when `server/convex/` is missing)
- [x] AC-003: Downstream tasks can target `server/` (downstream `.spec/prds/native-rewrite/*` docs and `.spec/prds/curation-hardening/tasks/INDEX.md` already reference `server/` / `server/convex/`)

### Task-Local Verification

- `git rev-parse --verify ff9981f017b07d6e6b9b4359e7a6e1aff0552ca8^{commit}` (commit exists)
- `git show --stat --patch ff9981f017b07d6e6b9b4359e7a6e1aff0552ca8` (changes limited to `server/.gitignore`, `server/README.md`, `server/package.json`)
- Confirmed `server/package.json`, `server/README.md`, `server/.gitignore` exist in working tree
