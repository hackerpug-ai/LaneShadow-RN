# DISC-007: D9 on-device capstone: verify the full discover-to-ride arc on the route plan view on real iOS and real Android against live Convex; surface and fix platform-specific issues; record per-platform evidence; founder dogfood

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** To Do · **Priority:** P0 · **Effort:** L · **Estimate:** 240 min
**Agent:** react-native-ui-implementer
**Proposed By:** react-native-ui-implementer *(standing in as RN planning specialist — the nominal `react-native-ui-planner` is non-responsive in this harness; the implementer holds the same RN domain expertise and is the assigned implementer)*
**TDD_MODE:** red_first · **RED_GREEN_REQUIRED:** yes

## Outcome

The founder opens the app on a real iPhone and a real Android phone pointed at live Convex, completes every step of the discover-to-ride arc on the route plan view (no separate Discover screen), records per-platform evidence, and surfaces then fixes any platform-specific breakage found during the journey — satisfying T-DISC-001 (the D9 capstone human-gate) with recorded video/screenshot proof on both platforms.

## Specification

Execute the full 6-step capstone journey from ROADMAP.md Sprint 03 gate against real iOS + real Android devices pointed at live Convex dev. This is the cross-cutting integration of every seam built in Sprints 01 + 02: plan-view landing (UC-DISC-11), curated suggestion cards over the input (UC-DISC-09), chat-driven curated discovery including state-scoped requests (UC-DISC-10), card→map→return-to-map loop, curated-route detail with score bars + geometry-or-centroid + conditions (UC-DTL-01..04), save via curatedRouteRef + Saved-screen reopen (UC-SAVE-01), and Ride-It maps deep-link with web fallback (UC-SAVE-02). The capstone IS the verification — there is no net-new feature surface. Every AC is a gate step that must pass on BOTH platforms.

For any step that fails on either platform: diagnose the root cause (code, configuration, or environment), apply the minimal fix in the file that owns the defect, re-run the step, and repeat until all 6 steps pass on both platforms. Platform-specific issues are the EXPECTED outcome of the first run — this task owns surfacing and fixing them. Record video or screenshot evidence for every passing step on each platform.

## Critical Constraints

- MUST execute every gate step on a REAL iOS device AND a REAL Android device — simulator/emulator runs are NOT sufficient (T-DISC-001 is a human-gate, not an automated e2e).
- MUST point both devices at the LIVE Convex dev deployment (data source is the 5,654-route catalog, never local mock/fixture data).
- MUST fix any step that breaks on either platform before reporting the sprint complete — the gate is ALL steps passing on BOTH platforms.
- MUST record per-platform evidence (video or screenshot) for every step; the evidence IS the deliverable.
- NEVER introduce a new UX surface, navigation route, or feature scope — this capstone VERIFIES what Sprints 01+02 built, it does not extend them.
- NEVER skip a step because it "passed on the other platform" — each platform is independently verified.
- WRITE-ALLOWED scope is ANY file in `react-native/` that needs a platform-specific fix — the capstone is the LAST line of defense before MVP done, so no file is off-limits for defect fixes. Do NOT modify `convex/` (backend is frozen for the capstone; any backend defect is a Sprint 02 regression escalated to the sprint director).

## Acceptance Criteria

### AC-1: app cold-launches to the route plan view on BOTH platforms
*(PRIMARY)*
- **flow_ref:** `.spec/scenarios/UC-DISC-11/` · T-DISC-011
- **GIVEN** a real iOS device AND a real Android device with the app built and pointed at live Convex dev
- **WHEN** the app is cold-launched on each platform
- **THEN** the app opens directly to the route plan view (`app/(app)/(tabs)/index.tsx` — map + chat home) with NO separate Discover screen, no filter-bar, no sort-toggle, no by-state picker, and no drawer-hidden chat; the drawer's only navigation entries are the standard ones (e.g. Settings, Saved) with NO "Plan a ride" or "Discover" entry
- **Test tier:** `e2e` · **Service:** real iOS device + real Android device against live Convex dev
- **Verify:** manual on-device verification + screenshot evidence of the landing screen + drawer on each platform
- **Scenario** (start `cold_launch_on_device`): must observe index.tsx as the landing route, map visible, chat input visible with no dedicated Discover screen in the route tree; must NOT observe a separate Discover tab, filter-bar chips, sort-toggle, state-picker, "Plan a ride" drawer entry; would fail if dedicated discover.tsx or RouteDiscoveryScreen is importable, if drawer reveals removed entries, or if the cold-launch routes through a non-plan-view screen.

### AC-2: curated suggestion cards discover roads on BOTH platforms
- **flow_ref:** `.spec/scenarios/UC-DISC-09/` · T-DISC-009
- **GIVEN** the app is on the route plan view with NO route on the map on each platform
- **WHEN** the founder observes the chat input area
- **THEN** curated-route suggestion cards appear over the input showing real road names and mileages from the live 5,654-route catalog (styled with copper accent + road icon, NOT generic `IDLE_SUGGESTIONS` planning prompts); the input placeholder reads as a discovery invite, never "Plan a scenic ride" / "Find coffee nearby"
- **Test tier:** `e2e` · **Service:** real iOS device + real Android device against live Convex dev
- **Verify:** manual on-device observation + screenshot of suggestion cards on each platform
- **Scenario** (start `no_route_on_map`): must observe curated road name + mileage on each suggestion card, copper accent style, road-variant icon, input placeholder is a discovery invite; must NOT observe `IDLE_SUGGESTIONS` generic prompts ("Plan a scenic ride", "Find coffee nearby"); would fail if hardcoded planning prompts appear, if cards show blank or 0-score, or if cards don't appear within 5 seconds.

### AC-3: suggestion-card tap → direct plot on BOTH platforms
- **flow_ref:** `.spec/scenarios/UC-DISC-09/` · T-DISC-009
- **GIVEN** curated suggestion cards are visible on each platform
- **WHEN** the founder taps a suggestion card
- **THEN** that exact curated route plots on the map immediately — NO chat message is sent, NO NL agent round-trip, NO intermediary route card in transcript; the suggestion cards disappear once the route is shown
- **Test tier:** `e2e` · **Service:** real iOS device + real Android device against live Convex dev
- **Verify:** manual on-device tap + screenshot of plotted route + confirm no chat message sent on each platform
- **Scenario** (start `suggestion_cards_visible`): must observe the tapped route's polyline/centroid rendered on the map, no new chat message in transcript, suggestion cards hidden; must NOT observe a chat message sent, a routing_card in transcript, or the map remaining empty; would fail if handleSelectCuratedRoute sends a chat message instead of plotting directly (DISC-016 regression).

### AC-4: chat-driven curated discovery + state-scoped request on BOTH platforms
- **flow_ref:** `.spec/scenarios/UC-DISC-10/` · T-DISC-010
- **GIVEN** the chat input is available on each platform
- **WHEN** the founder types "twisties near Asheville" AND separately types "scenic roads in North Carolina"
- **THEN** curated route card(s) appear in the chat history with real non-zero composite scores rendered as percentage/bars (never 0%, never raw 0–100 number); the latest curated route plots on the map; for the state-scoped request, matching NC routes are returned and plotted
- **Test tier:** `e2e` · **Service:** real iOS device + real Android device against live Convex dev
- **Verify:** manual on-device chat input + screenshot of returned cards with scores + plotted route on each platform
- **Scenario** (start `chat_ready_on_plan_view`): must observe ≥1 curated route card in chat, composite score rendered as %/bars (not 0% not 0-100 raw number), latest route plotted on map, state-scoped request returns NC routes; must NOT observe zero-score cards (DATA-008b regression), generic IDLE_SUGGESTIONS fallback, or all results from wrong state; would fail if agent tool returns flat 0-score cards or if state filter is silently dropped.

### AC-5: card→map→return-to-map loop on BOTH platforms
- **flow_ref:** `.spec/scenarios/UC-DISC-10/` · T-DISC-010
- **GIVEN** multiple curated route cards exist in the chat history on each platform
- **WHEN** the founder scrolls the chat history and taps an EARLIER curated-route card
- **THEN** that route re-renders on the map AND the view returns to map view (closes full-chat if open); clearing the route returns the suggestion cards over the input
- **Test tier:** `e2e` · **Service:** real iOS device + real Android device against live Convex dev
- **Verify:** manual on-device scroll + tap + screenshot of re-rendered route + cleared-state suggestion cards on each platform
- **Scenario** (start `multiple_chat_cards`): must observe tapped card's route rendered on map, view returned to map view, clearing route returns suggestion cards; must NOT observe wrong route plotted or stale map; would fail if earlier-card tap is a no-op or if clearing route leaves map in blank/empty state.

### AC-6: detail → save → reopen → Ride It on BOTH platforms
- **flow_ref:** `.spec/scenarios/UC-DTL-01/` + `.spec/scenarios/UC-SAVE-01/` + `.spec/scenarios/UC-SAVE-02/` · T-DTL-001 + T-SAVE-001 + T-SAVE-002
- **GIVEN** a curated route is plotted on the map on each platform
- **WHEN** the founder taps the route (its chat card or map pin) → sees the detail (name headline, archetype badge, five score bars with composite headline as %/bars, polyline-or-centroid map with "Approximate location" badge for no-polyline routes, basic conditions or "conditions unavailable" fallback) → taps Save (loading→"Saved" in place) → opens the Saved screen → taps the saved route → it reopens without crash → taps Ride It
- **THEN** Apple Maps opens at the centroid on iOS; Google Maps opens at the centroid on Android; on Android with Google Maps uninstalled, maps opens in the browser (no crash)
- **Test tier:** `e2e` · **Service:** real iOS device + real Android device against live Convex dev
- **Verify:** manual on-device full walkthrough + screenshots at each sub-step (detail, saved-confirmed, saved-list, reopened-detail, maps app launched) on each platform
- **Scenario** (start `route_plotted_on_map`): must observe detail renders all sections (name, scores, map, conditions, Save+Ride It), Save transitions loading→confirmed in place without navigation, route appears in Saved list and reopens without crash, Ride It launches correct platform maps app at centroid with route name, web fallback works on Android without Google Maps; must NOT observe blank detail sections, crash on reopen (no legs/PlanInput error), Save navigating away, wrong maps destination, or crash on missing maps app.

### AC-7: recorded per-platform evidence
- **GIVEN** all 6 journey steps pass on both platforms
- **WHEN** the sprint is marked complete
- **THEN** video or screenshot evidence exists for EVERY step (AC-1 through AC-6) on BOTH iOS and Android; a written log lists any platform-specific issues found and the fix applied for each
- **Test tier:** `human-gate` · **Service:** real iOS device + real Android device
- **Verify:** human review of evidence artifacts + fix log
- **Scenario** (start `all_steps_pass`): must observe ≥12 pieces of evidence (6 steps × 2 platforms), fix log with ≥0 entries documenting issues found and resolved; must NOT observe missing evidence for any step on either platform; would fail if any step's evidence is missing, simulated, or from a simulator/emulator.

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | App cold-launches to the route plan view (index.tsx) with NO separate Discover screen, filter-bar, sort-toggle, state-picker, or "Plan a ride" drawer entry on BOTH platforms. | AC-1 | manual on-device verification + screenshot |
| TC-2 | Curated suggestion cards show real road name + mileage from live catalog (copper accent + road icon, NOT IDLE_SUGGESTIONS) when no route is on the map on BOTH platforms. | AC-2 | manual on-device observation + screenshot |
| TC-3 | Tapping a suggestion card plots that curated route on the map immediately with NO chat message sent on BOTH platforms. | AC-3 | manual on-device tap + screenshot |
| TC-4 | Chatting "twisties near Asheville" and "scenic roads in North Carolina" returns curated route cards with non-zero composite scores as %/bars and plots the latest; state scope survives conversationally on BOTH platforms. | AC-4 | manual on-device chat + screenshot |
| TC-5 | Tapping an earlier curated-route card in chat history re-renders it on the map and returns to map view; clearing the route returns suggestion cards on BOTH platforms. | AC-5 | manual on-device scroll + tap + screenshot |
| TC-6 | Detail view renders name, score bars, geometry-or-centroid with badge, conditions; Save transitions loading→confirmed in place; saved route appears in Saved list and reopens without crash; Ride It launches correct platform maps app at centroid with web fallback for missing Google Maps on Android — all on BOTH platforms. | AC-6 | manual on-device full walkthrough + screenshots |
| TC-7 | Video or screenshot evidence exists for every step on BOTH platforms; a written fix log documents any platform-specific issues found and resolved. | AC-7 | human review |

## Reading List

- `react-native/app/(app)/(tabs)/index.tsx` (1-80) — plan view home; the surface where all discovery behavior lives
- `react-native/app/(app)/curated-route/[id].tsx` (1-140) — curated-route detail screen (DTL-001 deliverable)
- `react-native/hooks/use-curated-discovery.ts` — curated suggestion card data source (DISC-002 deliverable)
- `react-native/hooks/use-curated-route-detail.ts` — detail data hook (DTL-001 deliverable)
- `react-native/hooks/use-save-curated-route.ts` — save-curated-route mutation (SAVE-001 deliverable)
- `react-native/lib/maps-deeplink.ts` — maps deep-link util (SAVE-002 deliverable)
- `react-native/components/layouts/menu-layout.tsx` — drawer navigation (DISC-019/021 quarantine deliverable)
- `react-native/components/ui/score-dimension-bar.tsx` — score visualization primitive (DESIGN-001 deliverable)
- `convex/curatedRoutes.ts` (listCuratedRoutes + getCuratedRouteDetail) — backend data source
- `convex/db/savedRoutes.ts` — saved_routes persistence (curatedRouteRef support)
- `.spec/prds/mvp/05-uc-disc.md`#uc-disc-01 — the full-journey UC spec
- `.spec/prds/mvp/10-e2e-testing-criteria.md`#T-DISC-001 — the D9 capstone criterion
- `.spec/prds/mvp/tasks/sprint-02-route-detail-close-the-loop/FIXTURE-MANIFEST.md` — canonical fixture routes
- `.spec/prds/mvp/tasks/sprint-02-route-detail-close-the-loop/GATE-RESULTS.md` — known simulator fragility + warm-run pattern

## Guardrails

- WRITE-ALLOWED: any file in `react-native/` that needs a platform-specific fix (app source, hooks, components, lib, maestro tests) — the capstone is the LAST line of defense, no file in the RN tree is off-limits for defect fixes needed to pass the gate
- WRITE-PROHIBITED: `convex/**` (backend is frozen for the capstone; any Convex defect is a Sprint 02 regression — escalate to sprint director, do NOT fix here) · `tokens/**` · `shared/**` · `.spec/**` (spec files are read-only during execution)

## Design

- ref: `.spec/prds/mvp/05-uc-disc.md`#uc-disc-01 · `.spec/scenarios/UC-DISC-01/` · `.spec/scenarios/UC-DISC-09/` · `.spec/scenarios/UC-DISC-10/` · `.spec/scenarios/UC-DISC-11/` · `.spec/scenarios/UC-DTL-01/` · `.spec/scenarios/UC-SAVE-01/` · `.spec/scenarios/UC-SAVE-02/`
- pattern: this is a CROSS-CUTTING VERIFICATION task, not a feature implementation task. The pattern is: execute each gate step on each platform → observe pass/fail → diagnose failures → apply minimal fix → re-run step → record evidence → repeat until all steps pass on both platforms. No net-new surface is authored.
- pattern_source: ROADMAP.md Sprint 03 gate steps (6 steps) + T-DISC-001 criterion + T-DTL-004/T-SAVE-002 supporting human-gates
- anti_pattern: do NOT skip a step because it "looks like a backend issue" — investigate and classify; do NOT add features or new UX; do NOT skip evidence recording; do NOT accept a simulator-only verification; do NOT modify convex/ (escalate backend defects)
- **Known issues to expect** (from Sprint 02 GATE-RESULTS.md): expo-dev-client can freeze its render surface after Maestro interaction in simulator; on-device warm runs without Maestro intervention are the reliable verification path. The founder operates the app manually on real devices — Maestro is NOT a hard requirement for this capstone; manual evidence is the primary deliverable.

## Verification Gates

| Gate | Command |
|------|---------|
| TypeCheck | `pnpm type-check` |
| Biome | `pnpm exec biome check` |
| iOS build | `pnpm ios --device` (Expo build for real iOS device) |
| Android build | `pnpm android` (Expo build for real Android device) |
| Convex health | `pnpm convex:dev --once` (confirm backend deploys clean) |
| Device evidence | Manual: screenshot/video recording of all 6 gate steps on BOTH platforms |

## Coding Standards

- If a platform-specific fix is needed: follow the existing RN code conventions (TypeScript strict, semantic tokens, testID convention, router.push for navigation, expo-linking for deep links).
- Any code change MUST pass `pnpm type-check` + `pnpm exec biome check` before committing.
- Fixes should be minimal and surgical — target the root cause, not a workaround.

## Dependencies

- Depends on: ALL Sprint 01 tasks (DATA-001/002/004/005/008/008b, OPS-001, DISC-002/016/017/018/019/020/021, DESIGN-S01-001..004) AND ALL Sprint 02 tasks (DATA-006, DATA-003, DTL-001, DESIGN-001/002/003/004, SAVE-001, SAVE-002)
- Blocks: None (terminal sprint)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "DISC-007",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "cold_launch_on_device": { "description": "real iOS device + real Android device with app built against live Convex dev", "seed_method": "ui_flow", "records": ["cold-launch app on each platform"] },
    "no_route_on_map": { "description": "plan view with no active route — suggestion cards visible", "seed_method": "ui_flow", "records": ["open app, ensure no route on map"] },
    "suggestion_cards_visible": { "description": "curated suggestion cards rendered over chat input", "seed_method": "ui_flow", "records": ["live catalog loaded, cards visible"] },
    "chat_ready_on_plan_view": { "description": "chat input available on plan view", "seed_method": "ui_flow", "records": ["plan view loaded, chat input interactive"] },
    "multiple_chat_cards": { "description": "multiple curated route cards in chat history from prior discovery queries", "seed_method": "ui_flow", "records": ["at least 2 curated route cards in chat history"] },
    "route_plotted_on_map": { "description": "a curated route plotted on the plan view map", "seed_method": "ui_flow", "records": ["tap a suggestion card or chat card to plot a route"] },
    "all_steps_pass": { "description": "all 6 gate steps verified passing on both platforms", "seed_method": "ui_flow", "records": ["complete journey exercised on both platforms"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "GIVEN a real iOS AND real Android device pointed at live Convex dev WHEN the app is cold-launched THEN it opens directly to the route plan view (index.tsx) with NO separate Discover screen, filter-bar, sort-toggle, state-picker, or 'Plan a ride' drawer entry.", "verify": "manual on-device verification + screenshot on each platform", "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "primary": false, "description": "GIVEN no route on the map WHEN the founder observes the chat input THEN curated suggestion cards show real road name + mileage from live catalog (copper accent + road icon, NOT IDLE_SUGGESTIONS).", "verify": "manual on-device observation + screenshot on each platform", "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "primary": false, "description": "GIVEN suggestion cards visible WHEN the founder taps a card THEN that curated route plots on the map immediately with NO chat message sent.", "verify": "manual on-device tap + screenshot on each platform", "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "primary": false, "description": "GIVEN chat input available WHEN the founder chats 'twisties near Asheville' and 'scenic roads in North Carolina' THEN curated route cards appear with real non-zero scores as %/bars and the latest plots; state scope survives conversationally.", "verify": "manual on-device chat + screenshot on each platform", "maps_to_ac": null },
    { "id": "AC-5", "type": "acceptance_criterion", "primary": false, "description": "GIVEN multiple curated route cards in chat history WHEN the founder taps an earlier card THEN it re-renders on map and returns to map view; clearing the route returns suggestion cards.", "verify": "manual on-device scroll + tap + screenshot on each platform", "maps_to_ac": null },
    { "id": "AC-6", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a plotted route WHEN the founder taps it → detail (name, scores, geometry-or-centroid + badge, conditions) → Save (loading→confirmed) → Saved-screen reopen → Ride It THEN the correct platform maps app opens at centroid with web fallback for missing Google Maps on Android.", "verify": "manual on-device full walkthrough + screenshots on each platform", "maps_to_ac": null },
    { "id": "AC-7", "type": "acceptance_criterion", "primary": false, "description": "GIVEN all 6 steps pass WHEN the sprint is marked complete THEN video/screenshot evidence exists for EVERY step on BOTH platforms and a fix log documents any issues found.", "verify": "human review", "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "App cold-launches to route plan view with NO separate Discover screen on BOTH platforms.", "verify": "manual on-device verification + screenshot", "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "Curated suggestion cards show real name+mileage (copper accent, NOT IDLE_SUGGESTIONS) when no route on BOTH platforms.", "verify": "manual on-device observation + screenshot", "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "Suggestion-card tap plots route directly with NO chat message on BOTH platforms.", "verify": "manual on-device tap + screenshot", "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "Chat-driven discovery returns scored cards and state-scoped results on BOTH platforms.", "verify": "manual on-device chat + screenshot", "maps_to_ac": "AC-4" },
    { "id": "TC-5", "type": "test_criterion", "description": "Earlier-card tap re-renders route and returns to map view; clearing route returns suggestion cards on BOTH platforms.", "verify": "manual on-device scroll + tap + screenshot", "maps_to_ac": "AC-5" },
    { "id": "TC-6", "type": "test_criterion", "description": "Full detail→save→reopen→Ride It arc with platform-correct maps handoff and web fallback on BOTH platforms.", "verify": "manual on-device full walkthrough + screenshots", "maps_to_ac": "AC-6" },
    { "id": "TC-7", "type": "test_criterion", "description": "Recorded per-platform evidence exists for every step; fix log documents issues found.", "verify": "human review", "maps_to_ac": "AC-7" }
  ]
}
-->
