# S1-T4 — Observe the recovered line plotted from cold boot; record the §5 seam as green

| Field | Value |
|-------|-------|
| TASK_ID | S1-T4 |
| SPRINT | [Sprint 01 — Geometry reference-flow spike](./SPRINT.md) |
| TASK_TYPE | HUMAN_GATE |
| AGENT | Founder-Operator (manual) |
| ESTIMATE | 25 min |
| STATUS | Done (re-verified REDHAT-FIX-004 20260712T100751Z founder copper line YES) |
| PROPOSED_BY | product-manager + convex-planner + aisdk-planner + react-native-ui-planner (transcribed from ROADMAP human-gate) |
| TDD_MODE | `skipped` (manual observation; the automated proof is S1-T3's Maestro flow) |
| RED_GREEN_REQUIRED | no |
| CRITERION | T-REC-016 (human-gate) |
| DEPENDS_ON | S1-T1, S1-T2, S1-T3 |

## OUTCOME

The Founder-Operator watches one real recovered route plot its correct road line on the simulator
from a cold boot, and records the §5 gate→query→render seam as green — the prerequisite that
unblocks the REC deep build (Sprint 04).

## HUMAN TESTING GATE

**Gate:** The Founder-Operator watches one real recovered route plot its correct road line on the
simulator from a cold boot.

> This is a manual sign-off. It is NOT a FEATURE task and carries no TDD scenario — S1-T3's Maestro
> flow (`rec-016-cold-boot-recovered-route-plots.yaml`) is the automated proof; this task is the
> founder's own-eyes confirmation on the real running app.

### Pre-steps (one-time setup)

1. S1-T1, S1-T2, S1-T3 complete and merged; the recovered PoC route (`ai_reconstructed`, riderReady)
   is persisted on the live Convex **dev** deployment.
2. iOS simulator booted with the LaneShadow dev build (expo-dev-client) installed and connected to
   Metro against the dev deployment; `EXPO_PUBLIC_E2E` not required for the manual pass.
3. Note the recovered route's slug (`RECOVERED_ROUTE_ID`) — the "Twist of Tepusquet Loop" PoC route.

### Step-by-step (the 7 ROADMAP gate steps)

1. Reconstruct one real PoC route through the Convex action on real APIs — run **exactly** the step 1
   `literal_cmd` from `gate-plan.json` (includes `reconstructForRoute` + `--identity` when REDHAT-FIX-005
   requires it; do **not** substitute `getVerificationForRoute` for this step).
   → Expect: geometryStatus `generated`, provenance `ai_reconstructed`.
2. Run gate-plan step 2 (`getVerificationForRoute`) and confirm the deterministic gate admits the line
   within the ratio band (verification.ratio ∈ [0.6,1.6]).
3. Run gate-plan step 3 (`getRouteForReading`) and confirm persist + recompute:
   `geometryStatus == generated`, provenance `ai_reconstructed`, `riderReady == true`.
4. Query `listCuratedRoutes` national-best mode; confirm the route appears.
5. Query `listCuratedRoutes` nearest mode; confirm the route appears.
6. Cold-boot the simulator (kill + relaunch, dismiss the dev-client launcher) and tap the recovered route.
7. Watch the correct road line plot on the map (a real ≥2-point road line, not a centroid dot).

### Record the verdict

- ✅ PASS: the recovered line plots correctly from cold boot; the gate→query→render seam is green
  through the turnkey runners → record as the prerequisite that unblocks the REC deep build (Sprint 04).
- ❌ FAIL: capture what diverged (dot instead of line, missing from a query mode, wrong road) and route
  back to S1-T1/T2/T3.

## DEPENDENCIES

- Depends on: S1-T1, S1-T2, S1-T3
- Unblocks: Sprint 04 (Trust pipeline)
