# OPS-001: Guard against empty-Convex-deployment drift (combined dev script + loud health check; canary = listCuratedRoutes)

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** INFRA · **Status:** ✅ Completed · **Priority:** P1 · **Effort:** S · **Estimate:** 60 min  
**Agent:** convex-implementer  
**Proposed By:** convex-planner  
**Agent rationale:** The health check probes the Convex function-spec and the listCuratedRoutes canary, and the combined dev script runs convex dev from server/ alongside Metro — both backend/devops concerns owned by the convex-implementer who knows the deployment surface and the canary contract.  

## Outcome

The combined dev script runs convex dev from server/ alongside Metro, and the health check exits non-zero with a loud message when the deployment reports 0 functions or is missing the listCuratedRoutes canary, and passes against the seeded deployment.

## Specification

scripts/check-convex-health.mjs runs `npx convex function-spec` from server/, parses spec.functions, exits 1 with a loud message if the list is empty or lacks curatedRoutes.js:listCuratedRoutes, and prints a success line with the function count otherwise. package.json exposes `convex:health` (node scripts/check-convex-health.mjs) and `dev`/`dev:all` (pnpm server:dev & pnpm client:dev where server:dev → cd server && pnpm dev → convex dev, client:dev → expo). This task re-verifies/hardens the dev-workflow-integrity guard (Sprint 01 app-live prerequisite + R-DATA-6): (1) against an empty/missing deployment the health check exits non-zero with a loud message naming the missing canary; (2) against the seeded deployment it exits 0 reporting the function count including listCuratedRoutes; (3) the combined dev script demonstrably starts convex dev from server/ alongside Metro (verify the script composition; ensure server:dev resolves to convex dev, not a stub). Hardening to consider: clean up the function-spec-temp.json temp file on both success and failure; make the empty-vs-missing-canary messages distinct; ensure a non-zero exit propagates if convex dev is not running (function-spec connection failure path).

## Critical Constraints

- VERIFY/HARDEN — scripts/check-convex-health.mjs and the convex:health npm script exist. Harden, do not rewrite from scratch.
- The failure path MUST exit non-zero AND emit a loud, actionable message (e.g. 'Convex deployment is empty - is convex dev running from server/?') — a silent or exit-0 failure defeats the guard's purpose.
- The canary MUST be the real listCuratedRoutes function identifier (curatedRoutes.js:listCuratedRoutes) — not a generic 'any function' check.
- The combined dev script MUST launch convex dev from server/ AND Metro; do not start Metro alone (the empty-deployment incident class this guards).

## Acceptance Criteria

### AC-1: health check fails loudly on empty/canary-missing deployment, passes on seeded
*(PRIMARY)*
- **flow_ref:** `HF-DATA-01-EDGE` · `.spec/scenarios/UC-DATA-01/edge-empty-deployment-canary.scenario.md` *(bound 2026-06-23 by /kb-e2e-retrofit --apply)*
- **GIVEN** the convex:health script and a Convex deployment in two states (no listCuratedRoutes vs seeded with listCuratedRoutes)
- **WHEN** node scripts/check-convex-health.mjs runs against each
- **THEN** it exits non-zero with a loud message naming the missing canary when listCuratedRoutes is absent/empty, and exits 0 with a function-count success line when listCuratedRoutes is present
- **Test tier:** `integration` · **Service:** live Convex dev deployment (npx convex function-spec) via scripts/check-convex-health.mjs
- **Verify:** `pnpm test scripts/__tests__/check-convex-health.integration.test.ts` → `healthCheckFailsLoudOnEmptyPassesOnSeeded`
- **Scenario** (start `live_dev_deployment`):
  - must observe: exit code !== 0; stderr contains 'curatedRoutes.js:listCuratedRoutes' (the named missing canary)
  - must NOT observe: exit code 0; empty stderr on failure
  - negative control (would fail if): health check exits 0 on an empty/canary-missing deployment; failure is silent (no stderr); canary is a generic 'any function exists' check rather than listCuratedRoutes

### AC-2: combined dev script starts convex dev from server/ alongside Metro
- **GIVEN** the package.json dev/dev:all + server:dev + client:dev script chain
- **WHEN** the script composition is inspected/exercised
- **THEN** server:dev resolves to convex dev launched from server/ (not a stub) and runs alongside client:dev (Metro/expo)
- **Test tier:** `integration` · **Service:** package.json script chain + server/package.json convex:dev
- **Verify:** `pnpm test scripts/__tests__/check-convex-health.integration.test.ts` → `combinedDevScriptLaunchesConvexFromServerAndMetro`
- **Scenario** (start `live_dev_deployment`):
  - must observe: server:dev chain ends at 'npx convex dev' run from server/; dev runs server:dev AND client:dev concurrently
  - must NOT observe: server:dev resolving to a no-op/stub; dev launching client:dev alone
  - negative control (would fail if): server:dev does not invoke convex dev from server/; dev launches only Metro (the empty-deployment incident)

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration: health check exits non-zero with a loud listCuratedRoutes-named message on empty/canary-missing, exits 0 with a count on seeded (R-DATA-6 drift guard). | AC-1 | `pnpm test scripts/__tests__/check-convex-health.integration.test.ts` |
| TC-2 | Integration: the combined dev script chain launches convex dev from server/ alongside Metro (no Metro-alone path). | AC-2 | `pnpm test scripts/__tests__/check-convex-health.integration.test.ts` |

## Reading List

- `scripts/check-convex-health.mjs` (1-66) — PRIMARY PATTERN — function-spec parse, empty/canary checks, loud exit; the guard under verification
- `package.json` (5-21) — dev/dev:all/server:dev/client:dev/convex:health script chain
- `server/package.json` (6-15) — convex:dev resolution (the guarded sh wrapper that errors if convex/ is missing)
- `convex/curatedRoutes.ts` (156-283) — the listCuratedRoutes canary export the health check probes
- `.spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view/SPRINT.md` (80-90) — OPS-001 source coverage + dev-workflow-integrity capability

## Guardrails

- WRITE-ALLOWED: `scripts/check-convex-health.mjs (MODIFY — harden: temp-file cleanup, distinct empty-vs-missing messages, connection-failure exit)`
- WRITE-ALLOWED: `scripts/__tests__/check-convex-health.integration.test.ts (NEW)`
- WRITE-ALLOWED: `package.json (MODIFY — only if the dev/server:dev chain is found to not launch convex dev)`
- WRITE-PROHIBITED: convex/** — no backend code change in this ops task
- WRITE-PROHIBITED: server/package.json — do not weaken the convex/ existence guard
- WRITE-PROHIBITED: Any file not listed above

## Design

- ref: .spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view/SPRINT.md
- ref: .spec/prds/mvp/09-technical-requirements/04-api-design.md
- pattern: Loud fail-closed dev health check: probe function-spec, assert the real listCuratedRoutes canary, exit non-zero with an actionable message on drift; combined dev script keeps convex dev co-running with Metro.

## Verification Gates

| Gate | Command |
|------|---------|
| gate | `pnpm type-check` |
| gate | `pnpm test scripts/__tests__/check-convex-health.integration.test.ts` |
| gate | `pnpm exec biome check scripts/check-convex-health.mjs` |
| gate | `pnpm convex:health (manual evidence against live dev — exit 0 + count including listCuratedRoutes)` |
| gate | `pnpm --dir server run convex:dev -- --once` |

## Coding Standards

- Fail closed and loud — never exit 0 on a degraded deployment.
- Name the real canary (curatedRoutes.js:listCuratedRoutes), not a generic check.
- Clean up temp artifacts on all exit paths.
- Deterministic guard: the health check is regular code, not an agent decision.

## Dependencies

- Depends on: DATA-005 (the listCuratedRoutes canary must exist)
- Blocks: the Sprint 01 human testing gate (every subscription depends on a non-empty deployment)
- Parallel: DATA-001, DATA-002, DATA-004

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "live_dev_deployment": {
      "description": "the live Convex dev deployment, exercised in seeded (listCuratedRoutes present) and a simulated empty/canary-missing function-spec",
      "seed_method": "cli",
      "records": [
        "function-spec WITH curatedRoutes.js:listCuratedRoutes (seeded)",
        "function-spec WITHOUT curatedRoutes.js:listCuratedRoutes (drift)"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the health check WHEN run against empty/canary-missing vs seeded THEN non-zero + loud named-canary message on drift, exit 0 + count on seeded",
      "verify": "pnpm test scripts/__tests__/check-convex-health.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the dev script chain WHEN inspected THEN server:dev launches convex dev from server/ alongside client:dev (Metro)",
      "verify": "pnpm test scripts/__tests__/check-convex-health.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "loud-fail / pass health check with listCuratedRoutes canary (R-DATA-6)",
      "verify": "pnpm test scripts/__tests__/check-convex-health.integration.test.ts",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "combined dev script composition (convex dev + Metro)",
      "verify": "pnpm test scripts/__tests__/check-convex-health.integration.test.ts",
      "maps_to_ac": "AC-2"
    }
  ]
}
-->
