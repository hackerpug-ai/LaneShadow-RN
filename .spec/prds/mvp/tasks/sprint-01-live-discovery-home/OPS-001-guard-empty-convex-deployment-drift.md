# OPS-001: Guard against empty-Convex-deployment drift (combined dev script + loud health check)

| Field | Value |
|---|---|
| Sprint | [sprint-01-live-discovery-home](./SPRINT.md) |
| Type | INFRA |
| Agent | implementer = `convex-implementer` · reviewer = `convex-reviewer` |
| Estimate | 60 min |
| Priority | P1 |
| Status | Backlog |
| Proposed By | convex-planner |
| Depends on | — |
| Blocks | DISC-007 (D9 on-device capstone — relies on a non-empty live deployment) |
| PRD refs | ROADMAP Sprint 01 Human Testing Gate · DELTA-001 §1 (discovery rides the live home, dead if the deployment is empty) |

## Background

The app went **dead** on 2026-06-14 with a `FunctionPathNotFound` reconnect loop. Root cause: the Convex **dev deployment had 0 functions** because `convex dev` was not running from `server/` (stale `convex mcp` processes were pointed at an old `~/Projects/LaneShadow` checkout). Every client subscription (`listCuratedRoutes`, `planningSessions.listSessions`, …) resolved to a non-existent path → the server closed the socket → reconnect every ~10–23s, forever. The immediate fix was operational (`npx convex dev --once` from `server/` restored 169 functions). This task makes that footgun **impossible to hit silently**.

## Critical constraints

- **MUST** fail LOUDLY (non-zero exit + explicit message) when the deployment reports 0 functions or the known canary query is missing — silence on an empty deployment is the exact footgun being closed.
- **MUST** start `convex dev` from the `server/` directory in the combined dev script (the original failure was wrong cwd).
- **MUST** keep it small and real — a working script + a real introspection check, no always-pass probe.
- **NEVER** make the health check pass unconditionally or swallow the error (a green check on an empty deployment reproduces the incident — cardinal stubbing sin).
- **NEVER** add a new runtime dependency (use the convex CLI + node built-ins already present).
- **NEVER** modify Convex function contracts or client code.

## Specification

**Objective:** A combined dev command runs `convex dev` from `server/` alongside Metro; a fast health check fails loudly when the deployment has 0 functions or is missing a known query — so app-dead-on-empty-deployment never silently recurs.

**Success state:** Running the combined dev script brings up both Metro and `convex dev` (from `server/`); the health check exits 0 and prints the function count against a healthy deployment, and exits non-zero with an actionable message against an empty/wrong-cwd deployment.

## Implementation steps

1. Add a combined dev script to root `package.json` (e.g. `dev:all`) that runs Metro and `convex dev` concurrently with the convex process cwd pinned to `server/` (reuse the existing `cd server && pnpm dev` pattern from `server:dev`; dependency-free `&`/concurrency as the root `dev` script already uses).
2. Add `scripts/check-convex-health.mjs` (node, no new deps) that shells out to the convex CLI from `server/` to list deployed functions (`convex function-spec` / equivalent introspection) and parses the result.
3. Pass only if the function list is non-empty AND includes `api.curatedRoutes.listCuratedRoutes` (the canary). Otherwise print a specific message and `exit 1`.
4. Wire the check as a script (e.g. `convex:health`); optionally invoke it at the start of the combined dev script so a bad deployment surfaces immediately.
5. Run type-check, lint, and a one-shot convex build to confirm no regression.

## Verification checklist

- [ ] `pnpm dev:all` starts Metro AND `convex dev` with cwd=`server/` — both ready banners observed.
- [ ] `pnpm convex:health` against the live healthy deployment exits 0 and prints a function count > 0 including `listCuratedRoutes`.
- [ ] With `convex dev` NOT running from `server/` (empty deployment), `pnpm convex:health` exits non-zero and prints the actionable "is `convex dev` running from server/?" message — verified by redirecting at runtime, not by editing the check to fail.
- [ ] No new entry in `dependencies`/`devDependencies` (grep the diff).
- [ ] `pnpm type-check` exit 0; `pnpm lint` exit 0; `pnpm --dir server run convex:dev -- --once` builds.
- [ ] `git diff --name-only` ⊆ write-allowed.

## Reading list

- `package.json:5-25` — **PRIMARY PATTERN** existing scripts (`dev`, `server:dev` = `cd server && pnpm dev`, type-check/lint/test). Extend this pattern; do not invent a new tool.
- `server/convex/curatedRoutes.ts:156-159` — `api.curatedRoutes.listCuratedRoutes` is the canary the health check asserts is present.
- `server/package.json` — the server-side dev/convex scripts + convex CLI invocation (reuse for introspection + the cwd=server/ requirement).
- `~/Projects/brain/docs/HUMAN-TESTING-GATE-VERIFICATION.md` — fail-loud-on-missing-wiring philosophy; this check is the durable version.

## Guardrails

**Write-allowed:** `package.json` (MODIFY: add combined dev + `convex:health` script entries only) · `scripts/check-convex-health.mjs` (NEW: node, no new deps) · `server/package.json` (MODIFY: only if a server-side passthrough is cleaner; scripts only)

**Write-prohibited:** `server/convex/**` function source (no contract change) · any `app/**`/`hooks/**`/`components/**` · `package.json` `dependencies`/`devDependencies` (no new dependency) · any file not listed.

## Verification gates

1. `pnpm convex:health` exits 0 against the live healthy deployment (prints count > 0 incl. `listCuratedRoutes`).
2. `pnpm convex:health` exits non-zero with the actionable message against an empty/wrong-cwd deployment (verified by redirecting at runtime, not editing the check).
3. Combined dev script starts Metro + `convex dev` (cwd=`server/`) — both ready banners observed.
4. `pnpm type-check` (0) · `pnpm lint` (0) · `pnpm --dir server run convex:dev -- --once` builds.
5. `git diff --name-only` ⊆ write-allowed; no new dependency.

## Dependencies

- **Depends on:** — (independent).
- **Blocks:** DISC-007 (D9 capstone — relies on a non-empty live deployment).

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"IMPL-1","type":"implementation_step","description":"Combined dev script (Metro + convex dev cwd=server/) added to root package.json, starting both concurrently","verify":"pnpm dev:all starts both processes (Metro banner + convex dev ready from server/)"},
    {"id":"IMPL-2","type":"implementation_step","description":"scripts/check-convex-health.mjs introspects the configured Convex deployment's function list (no new dep)","verify":"node scripts/check-convex-health.mjs runs against the deployment"},
    {"id":"IMPL-3","type":"implementation_step","description":"Health check exits non-zero with an actionable message when the deployment is empty or missing api.curatedRoutes.listCuratedRoutes; exits 0 and prints the count when healthy","verify":"pnpm convex:health exit code + message verified against healthy and empty deployments"},
    {"id":"IMPL-4","type":"implementation_step","description":"No new runtime dependency added (convex CLI + node built-ins only)","verify":"git diff package.json shows no dependencies/devDependencies change"},
    {"id":"VERIFY-1","type":"verification","description":"Combined dev script launches both processes","verify":"manual: Metro + convex dev ready banners"},
    {"id":"VERIFY-2","type":"verification","description":"Health check exits non-zero against empty deployment, 0 against live healthy deployment","verify":"pnpm convex:health in both states"},
    {"id":"VERIFY-3","type":"verification","description":"type-check + lint pass; convex build still succeeds","verify":"pnpm type-check && pnpm lint && pnpm --dir server run convex:dev -- --once"}
  ]
}
-->
