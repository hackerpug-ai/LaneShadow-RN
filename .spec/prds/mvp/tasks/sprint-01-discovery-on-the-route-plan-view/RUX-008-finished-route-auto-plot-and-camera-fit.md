# RUX-008: Auto-plot and camera-fit a finished route to the whole route on the map (map mode), via the existing doFit seam

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P0 · **Effort:** M · **Estimate:** 150 min
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer
**Proposed By:** react-native-ui-planner
**Agent rationale:** When a route completes while the rider is in chat mode, the auto-fit effect (`index.tsx:676-684`) calls `doFit`, but `doFit` defers because the map isn't mounted (`index.tsx:560-564` sets `pendingFitRef` and returns); the pending fit only flushes on a manual return to map mode (`590-597`). There is no auto-switch-to-map on completion, so the route "finishes in chat and is not mapped." The fix is a small frontend change — `setChatMode(false)` on a NEW plan completion so the deferred `doFit` flushes — reusing the EXISTING `doFit` multi-point/centroid branches. The WHOLE-route line for curated routes additionally depends on backend geometry (DATA-011); this task is BONDED to DATA-011 and must not stub geometry.

> **Remedial — Sprint 1 testing feedback (2026-06-20, item #3):** "after the route is finished you should zoom to the mapped route on the map (if in map mode) and the entire route should be in view, right now it just finishes in chat and is not mapped (IDK if its because the discovery route failed or what or can't be mapped. May need additional work)."

## Outcome

When a new route plan completes, the screen surfaces it on the map: if the rider is in chat mode it switches to map mode so the deferred fit flushes, the route plots (`home-route-polyline`), and the camera frames the WHOLE route (multi-point `fitToCoordinates`) — or, for a centroid/bounds-only route, frames the route's extent. Agent-planned (`planRide`) routes already carry real geometry, so this delivers the full "entire route in view" for them; curated routes draw the whole line once DATA-011 lands real geometry (until then they frame to extent, not a misleading point).

## Specification

Two sub-causes (one frontend, one backend):

**Frontend (this task):** On completion in chat mode, `doFit` (`index.tsx:558-587`) defers (`560-564`: no `mapRef.current` → `pendingFitRef = true; return`) and only flushes when `mapMounted` flips (`590-597`) — i.e. on a manual return to map. There is no auto-switch. In the completion bridge (`index.tsx:516-529`, `PLANNING_SUCCESS`) and/or the auto-fit effect (`676-684`), when a plan transitions to completed AND `chatMode === true`, call `setChatMode(false)` so the deferred `doFit` flushes and the route plots+frames. Reuse the EXISTING `doFit` branches — multi-point → `fitToCoordinates` (whole route, 566-577), single-point → `setCameraPosition` zoom 12 (578-583). No new fit code. Gate the auto-switch on a NEW plan via the existing `lastFittedPlanIdRef`/`lastSeenPlanIdRef` guards (676-684 / 723-736) so a rider is not yanked out of chat on every reactive update.

**Backend (DATA-011, NOT this task):** curated discovery routes currently ship a single-point polyline (`discoverCuratedRoutes.ts:166` `encodeCentroidToPolyline`; same in `createCuratedRoutePlan`, routePlans.ts:394), so `doFit` takes the centroid branch — no route line. DATA-011 populates real geometry; once it lands, `doFit`'s multi-point branch frames the whole route with zero further frontend change. **"Entire route in view" for curated routes is load-bearing on DATA-011 — do NOT report it complete on the frontend alone, and do NOT fake geometry here.** Agent-planned routes already carry real geometry (`planRide.ts:138-143`, proven by `planRide.integration.test.ts:106-117`), so this task fully delivers them.

## Critical Constraints

- **MUST** auto-switch chat→map (`setChatMode(false)`) when a NEW plan completes so the deferred `doFit` flushes and the route plots — reusing the existing `doFit`/`requestFitToRoute` seam (no new fit implementation).
- **MUST** frame the WHOLE route for a multi-point geometry (`fitToCoordinates`), and take the centroid/extent branch for a geometry-less route — never the wrong branch.
- **MUST** guard with `lastFittedPlanIdRef`/`lastSeenPlanIdRef` so the auto-switch fires once per new plan, not on every render (no repeated yanking).
- **NEVER** add a second map render path or a new fit function. **NEVER** stub or fabricate route geometry (curated whole-line depends on DATA-011 — Supreme Rule). **NEVER** auto-switch on a stale/already-fitted plan.

## Acceptance Criteria

### AC-1: A finished route auto-plots and frames on the map without a manual toggle (real device)
*(PRIMARY)*
- **GIVEN** the signed-in home in chat mode with a "twisties near Asheville" agent discovery in progress
- **WHEN** the agent route completes
- **THEN** the screen switches to map mode and the finished route is plotted (`home-route-polyline`) and framed by the camera — not left only in the chat transcript
- **Test tier:** `e2e` · **Service:** dev client + live Convex dev + Simulator location
- **Verify:** `maestro test .maestro/rux-008-finished-route-auto-plots.yaml -e EMAIL=$CLERK_TEST_EMAIL -e PASSWORD=$CLERK_TEST_PASSWORD`

### AC-2: A completed multi-point route flips to map and fits the WHOLE route (wiring)
*(SUPPLEMENTARY)*
- **GIVEN** an agent plan completes with a multi-point `overviewGeometry` (fixture with a real decoded polyline) and the rider in chat mode
- **WHEN** the completion bridge fires
- **THEN** `chatMode` becomes false and `doFit` calls `fitToCoordinates` with `coords.length > 1` (whole route), not the centroid branch
- **Test tier:** `integration` (jsdom; Convex+RN mocked per harness reality) · **Service:** @testing-library/react-native with a fit-spy on the rnmapbox mock
- **Verify:** `pnpm test "app/(app)/(tabs)/index.finished-route-fit.integration.test.tsx" -t finishedMultiPointRouteAutoPlotsAndFitsWholeRoute`

### AC-3: Centroid-only route frames once and the guard prevents re-yanking
*(SUPPLEMENTARY)*
- **GIVEN** a centroid-only completed plan (today's curated shape, pre-DATA-011) WHEN completion fires in map mode THEN `doFit` takes the `setCameraPosition` zoom 12 branch once; AND given a plan already fitted, a re-render does NOT re-switch modes or re-fit
- **Test tier:** `integration` (jsdom; mocked per harness reality) · **Service:** @testing-library/react-native
- **Verify:** `pnpm test "app/(app)/(tabs)/index.finished-route-fit.integration.test.tsx" -t centroidRouteFramesOnceAndDoesNotReYank`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | On a real device, a finished agent route appears on the map without a manual toggle, framed by the camera. | AC-1 | `maestro test .maestro/rux-008-finished-route-auto-plots.yaml` |
| TC-2 | Multi-point completion → `chatMode` false + `fitToCoordinates` with `coords.length > 1`. | AC-2 | `pnpm test "app/(app)/(tabs)/index.finished-route-fit.integration.test.tsx" -t finishedMultiPointRouteAutoPlotsAndFitsWholeRoute` |
| TC-3 | Centroid route → one `setCameraPosition` zoom 12 call; re-render does not re-switch/re-fit. | AC-3 | `pnpm test "app/(app)/(tabs)/index.finished-route-fit.integration.test.tsx" -t centroidRouteFramesOnceAndDoesNotReYank` |

## Reading List

- `app/(app)/(tabs)/index.tsx` (516-529) — `PLANNING_SUCCESS` completion bridge (hook the auto-switch here)
- `app/(app)/(tabs)/index.tsx` (676-684) — auto-fit effect + `lastFittedPlanIdRef` guard (reuse the guard)
- `app/(app)/(tabs)/index.tsx` (558-597) — `doFit` (multi-point `fitToCoordinates` / centroid `setCameraPosition` zoom 12) + pending-fit flush (reuse; do not reimplement)
- `app/(app)/(tabs)/index.tsx` (723-736) — `lastSeenPlanIdRef` new-plan detection (reuse to fire once)
- `app/(app)/(tabs)/index.tsx` (826-839, 1258-1263) — `routePolylines` memo builds the polyline; `home-route-polyline` render (read; renders when map mounted)
- `convex/actions/agent/planRide.ts` (138-143) — agent routes carry real geometry (the multi-point branch IS exercised for them)
- `convex/actions/agent/tools/discoverCuratedRoutes.ts` (166, 192-195) — curated centroid-only geometry (the DATA-011 dependency; out of scope here)
- `__mocks__/rnmapbox-maps.ts` — fit-spy handle for AC-2/AC-3 (shared with RUX-006)

## Guardrails

**WRITE-ALLOWED:** `app/(app)/(tabs)/index.tsx` (completion bridge + auto-fit effect only), `.maestro/rux-008-finished-route-auto-plots.yaml` (NEW), `app/(app)/(tabs)/index.finished-route-fit.integration.test.tsx` (NEW), `__mocks__/rnmapbox-maps.ts` (additive fit-spy if not added by RUX-006)
**WRITE-PROHIBITED:** `convex/actions/agent/tools/discoverCuratedRoutes.ts` and `convex/db/routePlans.ts` (the backend geometry fix is DATA-011), `components/map/route-polyline-component.tsx`, `hooks/use-active-session-route.ts`

## Design

- Light design input only (no DESIGN-S01 artifact): the auto-switch-to-map-on-completion is an interaction decision. The founder's gap text strongly implies yes ("it should zoom to the mapped route … with the ENTIRE route in view"). Confirm intent; no new visuals (map, polyline, fit framing all already exist).
- **Pattern:** new plan completed + chat mode → `setChatMode(false)` → deferred `doFit` flushes → `fitToCoordinates` (whole route) / centroid branch.
- **Anti-pattern:** route result stranded in the transcript with a blank map until a manual toggle; or a new fit code path; or re-firing the switch every render.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test "app/(app)/(tabs)/index.finished-route-fit.integration.test.tsx"` |
| e2e | `maestro test .maestro/rux-008-finished-route-auto-plots.yaml -e EMAIL=$CLERK_TEST_EMAIL -e PASSWORD=$CLERK_TEST_PASSWORD` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'app/(app)/(tabs)/index.tsx'` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-bug: the AC-2 test must FAIL on current code (no auto chat→map switch → fitToCoordinates never called while in chat mode) before the change makes it pass` |
| human_gate | `On-device (live Convex): plan a ride from chat → on completion the app shows the route on the map (no manual toggle) framed to the whole route. Curated whole-line gate runs after DATA-011 lands.` |

## Coding Standards

- Reuse `doFit` + `requestFitToRoute` + the `lastFittedPlanIdRef`/`lastSeenPlanIdRef` guards; no new fit/plot code path.
- Auto-switch only on a NEW plan completion; preserve the rider's chat mode for already-seen/fitted plans.
- No `any` on the completed plan/option passed to the fit path.

## Dependencies

- **Bonded to:** DATA-011 (curated route geometry generation) — integrate and verify the whole-route line for curated routes together; do not report curated "entire route in view" complete without DATA-011.
- Depends on: DISC-020 (chat-driven curated routes render) and the existing `doFit` seam
- Coordinates with: RUX-006 / RUX-007 (same `index.tsx`, distinct regions); shares the `__mocks__/rnmapbox-maps.ts` fit-spy with RUX-006 (one adds it, the other reuses)

## Notes

**Harness reality (carry into the test plan):** vitest aliases Convex `_generated/*` to mocks (vitest.config.ts:150-162) and stubs rnmapbox without an imperative handle (195) — so AC-2/AC-3 assert the auto-switch + branch selection via a fit-spy added to the mock, against mocked Convex; the genuine "watched it work" tier is the Maestro e2e flow (AC-1) against live Convex dev. **Backend-dependency honesty:** this task delivers the auto-plot + auto-fit + correct branch. For agent-planned routes (real geometry) that fully satisfies "entire route in view." For curated routes, the visible whole-route LINE depends on DATA-011 landing real geometry — until then curated routes frame to extent (centroid/bounds), and the curated whole-line human gate runs only after DATA-011. This split is the honest scope; do not fabricate geometry to make a screenshot pass.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "chat_mode_agent_discovery_in_progress": {
      "description": "signed-in home in chat mode, an agent NL discovery ('twisties near Asheville') in progress against live Convex, completing to a route with real multi-point geometry",
      "seed_method": "public_api",
      "records": [ "chatMode === true", "an agent plan that completes with a multi-point overviewGeometry" ]
    },
    "completed_multipoint_plan_in_chat": {
      "description": "a completed plan with a real multi-point decoded overviewGeometry, rider in chat mode (test fixture)",
      "seed_method": "test_harness_props",
      "records": [ "chatMode === true", "completed plan with overviewGeometry decoding to >1 coordinate", "fresh planId (not previously fitted)" ]
    },
    "completed_centroid_plan_in_map": {
      "description": "a centroid-only completed plan (pre-DATA-011 curated shape), rider in map mode",
      "seed_method": "test_harness_props",
      "records": [ "chatMode === false", "completed plan whose overviewGeometry decodes to a single coordinate" ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN chat mode with an agent discovery in progress WHEN the route completes THEN the screen switches to map mode and the route plots + frames (not left only in chat)",
      "verify": "maestro test .maestro/rux-008-finished-route-auto-plots.yaml -e EMAIL=$CLERK_TEST_EMAIL -e PASSWORD=$CLERK_TEST_PASSWORD",
      "scenario": {
        "start_ref": "chat_mode_agent_discovery_in_progress", "tier": "visible", "test_tier": "e2e",
        "verification_service": "dev client + live Convex dev + Simulator location",
        "negative_control": { "would_fail_if": [
          "after completion in chat mode, home-route-polyline does not appear until a manual tap of chat-input-chat-view-button (current pending-fit-only-on-remount behavior)",
          "the route stays only in the transcript with a blank map",
          "the app crashes or shows no route after completion"
        ] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [ {
          "start_ref": "chat_mode_agent_discovery_in_progress",
          "action": { "actor": "user", "steps": [
            "sign in; enter chat mode; send 'twisties near Asheville'",
            "wait for the agent to complete",
            "assert home-route-polyline visible WITHOUT a manual map toggle; capture 03-finished-route-on-map",
            "assert the chat toggle reads 'Open full chat' (i.e. now in map mode)"
          ] },
          "end_state": {
            "must_observe": [ "home-route-polyline visible without a manual toggle", "in map mode after completion" ],
            "must_not_observe": [ "route present only in the transcript with a blank map", "home-route-polyline appearing only after a manual chat-view toggle" ]
          }
        } ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN a completed multi-point plan in chat mode WHEN the bridge fires THEN chatMode flips false and doFit calls fitToCoordinates with coords.length > 1 (whole route)",
      "verify": "pnpm test \"app/(app)/(tabs)/index.finished-route-fit.integration.test.tsx\" -t finishedMultiPointRouteAutoPlotsAndFitsWholeRoute",
      "scenario": {
        "start_ref": "completed_multipoint_plan_in_chat", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "@testing-library/react-native + fit-spy on the rnmapbox mock (Convex+RN mocked per harness reality)",
        "negative_control": { "would_fail_if": [
          "no auto chat→map switch → fitToCoordinates never called while in chat mode (current code)",
          "setCameraPosition zoom 12 (wrong branch) called for a multi-point route",
          "0 fit calls after completion"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "completed_multipoint_plan_in_chat",
          "action": { "actor": "system", "steps": [ "drive a completed multi-point plan while chatMode === true", "assert chatMode flips false and the fit-spy received fitToCoordinates with coords.length > 1" ] },
          "end_state": {
            "must_observe": [ "chatMode became false", "fitToCoordinates called with coords.length > 1" ],
            "must_not_observe": [ "setCameraPosition zoom 12 for the multi-point route", "0 fit calls" ]
          }
        } ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN a centroid-only completed plan in map mode WHEN completion fires THEN doFit takes setCameraPosition zoom 12 once; AND an already-fitted plan re-render does not re-switch/re-fit",
      "verify": "pnpm test \"app/(app)/(tabs)/index.finished-route-fit.integration.test.tsx\" -t centroidRouteFramesOnceAndDoesNotReYank",
      "scenario": {
        "start_ref": "completed_centroid_plan_in_map", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "@testing-library/react-native (mocked per harness reality)",
        "negative_control": { "would_fail_if": [
          "the auto-switch re-fires every render (missing lastFittedPlanIdRef guard) — repeated mode switches",
          "fitToCoordinates called with a 1-coord array for the centroid route",
          "setCameraPosition called with zoom !== 12"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "completed_centroid_plan_in_map",
          "action": { "actor": "system", "steps": [ "drive a centroid-only completed plan in map mode", "assert one setCameraPosition zoom 12 call", "re-render with the same plan", "assert no additional fit call and chatMode unchanged" ] },
          "end_state": {
            "must_observe": [ "setCameraPosition called once with zoom === 12", "second render → no additional fit call; chatMode unchanged" ],
            "must_not_observe": [ "repeated mode switches", "fitToCoordinates with a 1-coord array" ]
          }
        } ]
      }
    },
    { "id": "TC-1", "type": "test_criterion", "description": "Real-device finished route auto-appears on the map framed, no manual toggle.", "maps_to_ac": "AC-1", "verify": "maestro test .maestro/rux-008-finished-route-auto-plots.yaml" },
    { "id": "TC-2", "type": "test_criterion", "description": "Multi-point completion flips to map and fits the whole route.", "maps_to_ac": "AC-2", "verify": "pnpm test \"app/(app)/(tabs)/index.finished-route-fit.integration.test.tsx\" -t finishedMultiPointRouteAutoPlotsAndFitsWholeRoute" },
    { "id": "TC-3", "type": "test_criterion", "description": "Centroid route frames once; guard prevents re-yanking.", "maps_to_ac": "AC-3", "verify": "pnpm test \"app/(app)/(tabs)/index.finished-route-fit.integration.test.tsx\" -t centroidRouteFramesOnceAndDoesNotReYank" }
  ]
}
-->
