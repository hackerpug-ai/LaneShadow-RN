# REDHAT-FIX-005 — Protect or internalize reconstruct and verification entry points to prevent unauthenticated quota/write access; fixes H5

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-005 |
| SPRINT | [Sprint 01 — Geometry reference-flow spike](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 90 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-01 |
| PRD_REFS | T-REC-016, UC-REC-02, UC-VER-01, Finding H5 |
| DEPENDS_ON | S1-T2 |
| BLOCKS | — |
| AUTHORITY | [.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md](../../../../reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md) |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

Unauthenticated public reconstruct/verification fails closed so strangers cannot burn Anthropic/Google quota or rewrite geometry; authenticated/internal path still works for tests and gate.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST add requireIdentity (or remove public surface and keep internal-only) on reconstructForRoute, getVerificationForRoute, and all fixed-geometry/fixed-anchors public wrappers that can write or burn quota
- MUST leave a legitimate path for integration tests and human gate (npx convex run --identity JSON)
- MUST prove unauthenticated call fails with UNAUTHENTICATED / ConvexError and does not invoke Anthropic/Google

**NEVER**
- NEVER leave an open public action that can burn Anthropic or Google quota without identity
- NEVER hard-code secrets or Clerk tokens into the repo
- NEVER break S1-T2 engine tests by removing identity injection without updating callers

**STRICTLY**
- STRICTLY match requireIdentity pattern from convex/guards.ts and curatedRoutes
- STRICTLY if public wrappers deleted, document internal path for gate CLI and update gate-plan / REDHAT-FIX-003

## DONE WHEN

- [ ] AC-1: Unauthenticated reconstruct rejected
- [ ] AC-2: Unauthenticated verification rejected
- [ ] AC-3: Authenticated path still works
- [ ] AC-4: Fixed helpers and gate docs auth-safe
- [ ] Only SCOPE.writeAllowed files modified (`git diff --name-only`)
- [ ] Do **not** mark Sprint 01 Done from this task alone

## SPECIFICATION

**Objective:** Close H5 by ensuring reconstruct and verification entry points are not anonymously invokable for quota burn or geometry rewrite.

**Success state:** Unauthenticated public reconstruct/verification fails; authenticated --identity (or documented internal-only) path still succeeds; no open quota burn path remains.

**Agent rationale:** Owns convex/curatedGeometryReconstruct.ts public wrappers and guards.ts requireIdentity pattern.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `unauthenticated_cli` (seed_method: `public_api`): npx convex run without --identity
- `authenticated_cli` (seed_method: `public_api`): Synthetic Clerk-style identity via --identity JSON
- `poc_route` (seed_method: `public_api`): PoC for authenticated fixed-geometry proof

## ACCEPTANCE CRITERIA

### AC-1 [PRIMARY]

**Requirement:** GIVEN Public reconstructForRoute wrapper on Convex deployment WHEN invoked without Clerk identity (no --identity) THEN call fails closed (UNAUTHENTICATED) and does not complete reconstruct write

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment live npx convex run
- VERIFY: `pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts -t 'unauthenticated reconstruct'`
- FLOW_REF: `UC-REC-02`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: requireIdentity absent; wrapper no-op success; test mocks auth never hits deployment
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `unauthenticated_cli`
    - ACTION: invoked without Clerk identity (no --identity)
    - MUST_OBSERVE: non-zero exit OR ConvexError/UNAUTHENTICATED; no successful unauthenticated geometryStatus generated
    - MUST_NOT_OBSERVE: unauthenticated ok:true with geometryStatus generated; quota burn completing without identity

### AC-2

**Requirement:** GIVEN Public getVerificationForRoute on deployment WHEN invoked without identity THEN call fails closed (or wrapper removed from public surface)

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment
- VERIFY: `pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts -t 'unauthenticated verification'`
- FLOW_REF: `UC-VER-01`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: getVerificationForRoute returns verification without identity
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `unauthenticated_cli`
    - ACTION: invoked without identity
    - MUST_OBSERVE: UNAUTHENTICATED failure OR function not publicly exported
    - MUST_NOT_OBSERVE: unauthenticated JSON verification success payload

### AC-3

**Requirement:** GIVEN Synthetic Clerk identity via npx convex run --identity WHEN reconstructForRouteWithFixedGeometry (or authenticated reconstruct) runs for a seeded test route THEN call succeeds and returns real geometryStatus from engine/persist path

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev + --identity
- VERIFY: `pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts -t 'authenticated'`
- FLOW_REF: `UC-REC-02`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: requireIdentity blocks valid --identity; engine stubbed empty
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `authenticated_cli`
    - ACTION: reconstructForRouteWithFixedGeometry (or authenticated reconstruct) runs for a seeded test route
    - MUST_OBSERVE: ok true / exit 0; geometryStatus generated or review
    - MUST_NOT_OBSERVE: UNAUTHENTICATED when --identity supplied; empty success without geometryStatus

### AC-4

**Requirement:** GIVEN Public fixed-geometry/fixed-anchors helpers and human-gate CLI docs WHEN auth remediation lands THEN all quota/write public helpers require identity (or internal), geometryGatePersist still passes with identity

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex source + geometryGatePersist live tests
- VERIFY: `rg -n 'requireIdentity' convex/curatedGeometryReconstruct.ts && pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'degenerate'`
- FLOW_REF: `T-REC-016`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: only reconstructForRoute gated but fixed helpers open; geometryGatePersist stops passing identity
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `poc_route`
    - ACTION: auth remediation lands
    - MUST_OBSERVE: requireIdentity on public reconstruct/verification surfaces; geometryGatePersist degenerate suite exit 0
    - MUST_NOT_OBSERVE: open unauthenticated fixed-geometry write path

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | reconstructForRoute without identity fails with UNAUTHENTICATED on live deployment | AC-1 | `pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts -t 'unauthenticated reconstruct'` |
| TC-2 | getVerificationForRoute without identity fails or is not public | AC-2 | `pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts -t 'unauthenticated verification'` |
| TC-3 | Authenticated fixed-geometry reconstruct returns geometryStatus on live deployment | AC-3 | `pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts -t 'authenticated'` |
| TC-4 | requireIdentity appears in curatedGeometryReconstruct public wrappers source | AC-4 | `rg -n 'requireIdentity' convex/curatedGeometryReconstruct.ts` |
| TC-5 | geometryGatePersist AC-4 degenerate suite still passes after auth gating | AC-4 | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'degenerate'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometryReconstruct.ts (MODIFY)
- convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts (NEW)
- convex/__tests__/geometryGatePersist.integration.test.ts (MODIFY identity flags only if needed)
- convex/__tests__/reconstructReferenceFlow.integration.test.ts (MODIFY identity flags only if needed)
- .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/gate-plan.json (MODIFY add --identity when required)

**writeProhibited:**
- convex/actions/curatedGeometryReconstruct.ts — engine body
- convex/curatedGeometryGate.ts
- react-native/**
- Any file not explicitly listed above

## READING LIST

- `convex/guards.ts` (15-29) — requireIdentity pattern
- `convex/curatedRoutes.ts` (310-323) — public vs internal split
- `convex/curatedGeometryReconstruct.ts` (all) — H5 surface
- `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (54-57,238-239) — AUTHORITY H5

## DESIGN

- pattern: export const reconstructForRoute = action({ handler: async (ctx, args) => { await requireIdentity(ctx); return ctx.runAction(internal.actions...) } })
- pattern_source: `convex/curatedRoutes.ts:310-316 + convex/guards.ts:15-29`
- anti_pattern: Public action with zero auth that proxies to a Node action burning paid APIs.
- references: `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md`, `./SPRINT.md`

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| Auth integration suite | `pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts` | Exit 0; unauth fail; auth pass |
| Regression gate persist | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts` | Exit 0 with identity |
| Convex build | `pnpm convex:dev --once` | Exit 0 |
| Typecheck | `pnpm type-check` | Exit 0 |
| Lint | `pnpm lint` | Exit 0 |
| Scope | `git diff --name-only` | ⊆ write_allowed |

## CODING STANDARDS

- `brain/docs/CONVEX-RULES.md`
- `convex/_generated/ai/guidelines.md`
- `brain/docs/CODING-STANDARDS.md`

## DEPENDENCIES

- Depends on: S1-T2
- Blocks: —

## NOTES

- Source authority: red-hat review `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (2026-07-12T07:30:55Z).
- Fixes H5. Coordinate with REDHAT-FIX-003 gate-plan identity. proposed_by=convex-planner.
- Do not implement product code beyond write_allowed. Do not call the sprint done.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-005",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "unauthenticated_cli": {
      "description": "npx convex run without --identity",
      "seed_method": "public_api",
      "records": [
        "reconstruct + verification without identity"
      ]
    },
    "authenticated_cli": {
      "description": "Synthetic Clerk-style identity via --identity JSON",
      "seed_method": "public_api",
      "records": [
        "TEST_IDENTITY pattern"
      ]
    },
    "poc_route": {
      "description": "PoC for authenticated fixed-geometry proof",
      "seed_method": "public_api",
      "records": [
        "prefer fixed-geometry to avoid paid APIs"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN Public reconstructForRoute wrapper on Convex deployment WHEN invoked without Clerk identity (no --identity) THEN call fails closed (UNAUTHENTICATED) and does not complete reconstruct write",
      "verify": "pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts -t 'unauthenticated reconstruct'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment live npx convex run",
        "negative_control": {
          "would_fail_if": [
            "requireIdentity absent",
            "wrapper no-op success",
            "test mocks auth never hits deployment"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "unauthenticated_cli",
            "action": {
              "actor": "api_client",
              "steps": [
                "invoked without Clerk identity (no --identity)"
              ]
            },
            "end_state": {
              "must_observe": [
                "non-zero exit OR ConvexError/UNAUTHENTICATED",
                "no successful unauthenticated geometryStatus generated"
              ],
              "must_not_observe": [
                "unauthenticated ok:true with geometryStatus generated",
                "quota burn completing without identity"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN Public getVerificationForRoute on deployment WHEN invoked without identity THEN call fails closed (or wrapper removed from public surface)",
      "verify": "pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts -t 'unauthenticated verification'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "negative_control": {
          "would_fail_if": [
            "getVerificationForRoute returns verification without identity"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "unauthenticated_cli",
            "action": {
              "actor": "api_client",
              "steps": [
                "invoked without identity"
              ]
            },
            "end_state": {
              "must_observe": [
                "UNAUTHENTICATED failure OR function not publicly exported"
              ],
              "must_not_observe": [
                "unauthenticated JSON verification success payload"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN Synthetic Clerk identity via npx convex run --identity WHEN reconstructForRouteWithFixedGeometry (or authenticated reconstruct) runs for a seeded test route THEN call succeeds and returns real geometryStatus from engine/persist path",
      "verify": "pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts -t 'authenticated'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev + --identity",
        "negative_control": {
          "would_fail_if": [
            "requireIdentity blocks valid --identity",
            "engine stubbed empty"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "authenticated_cli",
            "action": {
              "actor": "api_client",
              "steps": [
                "reconstructForRouteWithFixedGeometry (or authenticated reconstruct) runs for a seeded test route"
              ]
            },
            "end_state": {
              "must_observe": [
                "ok true / exit 0",
                "geometryStatus generated or review"
              ],
              "must_not_observe": [
                "UNAUTHENTICATED when --identity supplied",
                "empty success without geometryStatus"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN Public fixed-geometry/fixed-anchors helpers and human-gate CLI docs WHEN auth remediation lands THEN all quota/write public helpers require identity (or internal), geometryGatePersist still passes with identity",
      "verify": "rg -n 'requireIdentity' convex/curatedGeometryReconstruct.ts && pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'degenerate'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex source + geometryGatePersist live tests",
        "negative_control": {
          "would_fail_if": [
            "only reconstructForRoute gated but fixed helpers open",
            "geometryGatePersist stops passing identity"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "poc_route",
            "action": {
              "actor": "api_client",
              "steps": [
                "auth remediation lands"
              ]
            },
            "end_state": {
              "must_observe": [
                "requireIdentity on public reconstruct/verification surfaces",
                "geometryGatePersist degenerate suite exit 0"
              ],
              "must_not_observe": [
                "open unauthenticated fixed-geometry write path"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "reconstructForRoute without identity fails with UNAUTHENTICATED on live deployment",
      "verify": "pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts -t 'unauthenticated reconstruct'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "getVerificationForRoute without identity fails or is not public",
      "verify": "pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts -t 'unauthenticated verification'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Authenticated fixed-geometry reconstruct returns geometryStatus on live deployment",
      "verify": "pnpm test convex/__tests__/curatedGeometryReconstructAuth.integration.test.ts -t 'authenticated'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "requireIdentity appears in curatedGeometryReconstruct public wrappers source",
      "verify": "rg -n 'requireIdentity' convex/curatedGeometryReconstruct.ts",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "geometryGatePersist AC-4 degenerate suite still passes after auth gating",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'degenerate'",
      "maps_to_ac": "AC-4"
    }
  ]
}
-->
