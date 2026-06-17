# RESTR-003: Update convex.json, Scripts, Hooks, and Docs for server/

**Task ID:** RESTR-003
**Sprint:** Sprint 1 - Repo Restructure and Server Frontload
**Assigned To:** convex-implementer
**Estimate:** 240 min
**Type:** [FEATURE] [INFRA]
**Status:** Completed

---

## CRITICAL CONSTRAINTS

1. Update both human-facing documentation and machine-facing scripts/hooks in the same pass.
2. Align with the current toolchain baseline: `tsgo` for native typecheck, `biome` for lint/format, `lefthook` instead of Husky.
3. Eliminate root-path assumptions for Convex commands once `convex/` is authoritative.
4. Keep curation-hardening and native-rewrite task docs aligned with the new backend root.

---

## SPECIFICATION

**Objective:** Update root and server-level configuration so the current toolchain and documented workflows invoke Convex from `server/` where appropriate, without reintroducing legacy Husky/ESLint assumptions.

**Success State:** Developers and automation use the current `tsgo`/`biome`/`lefthook` stack, and any Convex-specific command paths consistently resolve through `server/` with no remaining root-path assumptions.

---

## DELIVERABLES

- `package.json`: root scripts delegated to `server/` and `react-native/` appropriately
- `lefthook.yml`: hook jobs aligned with the current toolchain and server-root Convex workflow
- `CLAUDE.md`: project docs updated for `server/` and `react-native/` paths
- `README.md`: root usage docs updated for the new repo layout

---

## ACCEPTANCE CRITERIA

### AC-001: Scripts delegate correctly
**GIVEN** backend code now lives under `server/`
**WHEN** root commands run
**THEN** they delegate backend work through the `server/` workspace instead of assuming repo-root Convex paths

### AC-002: Hooks use the new working directory
**GIVEN** automation now uses `lefthook` with `tsgo` and `biome`
**WHEN** hook jobs execute
**THEN** any Convex-specific verification runs against the `server/` workflow and no legacy Husky/ESLint assumptions remain

### AC-003: Documentation matches reality
**GIVEN** developers will follow repo docs during the restructure
**WHEN** they read project documentation
**THEN** paths, commands, and tool references consistently reflect `server/`, `react-native/`, `tsgo`, `biome`, and `lefthook`

---

## VERIFICATION

- Review root scripts, hooks, and docs for any remaining root `convex/` assumptions or stale Husky/ESLint references.
- Confirm curation-hardening/native-rewrite docs now describe `server/` as the backend working directory.

---

## READING LIST

- `.spec/prds/native-rewrite/04-uc-restructure.md` — UC-RESTR-04 and UC-RESTR-05 requirements
- `lefthook.yml` — current hook working-directory assumptions
- `package.json` — current root scripts and task entry points
- `biome.json` — current lint/format tooling baseline

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

---

## REVIEW (orchestrator fallback after reviewer stall)

**Review Date:** 2026-04-16
**Commit SHA:** cf7e349ea463a8eb38ef41a36f4d52c3b5c19446
**Verdict:** APPROVED

### Acceptance Criteria Checklist

- [x] AC-001: Root backend scripts now delegate through `server/` instead of assuming repo-root Convex paths
- [x] AC-002: `lefthook` Convex verification now runs through the `server/` workflow and the task does not reintroduce Husky/ESLint assumptions
- [x] AC-003: Top-level docs now reflect `server/`, `react-native/`, `tsgo`, `biome`, and `lefthook`

### Task-Local Verification

- `git rev-parse --verify cf7e349ea463a8eb38ef41a36f4d52c3b5c19446^{commit}` (commit exists)
- `git show --stat --summary --name-status cf7e349ea463a8eb38ef41a36f4d52c3b5c19446` (changes limited to `package.json`, `lefthook.yml`, `CLAUDE.md`, `README.md`)
- `tmp/RESTR-003-evidence.md` records RED/GREEN acceptance-criteria checks and task-local `pnpm typecheck` pass
- Verified current `package.json` delegates backend commands to `pnpm --dir server ...`
- Verified current `lefthook.yml` pre-push Convex check runs `pnpm --dir server run convex:dev -- --once`
- Verified current `README.md` and `CLAUDE.md` describe the new layout/toolchain baseline

### Residual Note

- This task correctly rewires scripts/hooks/docs, but it does not by itself make `server/` fully self-contained as an independently installed backend workspace. That operational work is deferred to RESTR-004.
