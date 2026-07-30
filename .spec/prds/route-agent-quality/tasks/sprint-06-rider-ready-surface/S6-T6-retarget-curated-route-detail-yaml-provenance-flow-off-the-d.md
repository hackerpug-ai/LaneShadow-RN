# S6-T6 — Retarget curated-route-detail.yaml provenance flow off the dead AC-1 testID to deep-link/map-pin; thin-region + saved-reachability Maestro flows

> Status: ⬜ Pending
> Proposed By: `react-native-ui-planner`

| Field | Value |
|---|---|
| TASK_ID | S6-T6 |
| SPRINT | [Sprint 06 — Rider-ready surface](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | `react-native-ui-implementer` |
| ESTIMATE | 150 min |
| EFFORT | M |
| PRIORITY | P0 |
| PROPOSED_BY | `react-native-ui-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | touches CAP-GEO-03 |
| DEPENDS_ON | S6-T2, S6-T3 |

RUNTIME_COMMANDS:
- typecheck: `pnpm type-check`
- lint: `pnpm lint`
- test: `pnpm test`
- run: `pnpm ios`

## BACKGROUND
The existing `.maestro/curated-route-detail.yaml` flow targets the testID `curated-chat-card-cherohala-skyway` at lines 29-33 for its AC-1 branch, but a codebase grep confirms that testID does NOT exist anywhere in `components/` or `app/` — the flow is silently failing the AC-1 assertion or falling through to the AC-2/AC-3 branches. This task (1) retargets the AC-1 branch onto a STABLE selector — the deep-link entry `laneshadow:///curated-route/{routeId}` (already used in the AC-2 branch and in `.maestro/rec-016-cold-boot-recovered-route-plots.yaml:141`) — and the map-pin entry (`curated-map-pin-{routeId}`, emitted at app/(app)/(tabs)/index.tsx:1581) — so the chat-card → detail and map-pin → detail parity assertion is preserved without depending on a dead testID; (2) authors a new `.maestro/discovery-honest-absence.yaml` flow that drives the real surface produced by S6-T3 against a thin-coverage simulated location (the TC-7 human-surface proof); (3) authors a new `.maestro/curated-saved-reachability.yaml` flow that saves a curated route, flips it non-ready on the backend (quarantine), and reopens it from Saved to assert detail still resolves (UC-SURF-06 AC-1/2).

## 🚫 CRITICAL CONSTRAINTS (Never tier)
- The retargeted Maestro selector MUST be stable — deep-link universal link OR a production testID verified by grep; NEVER reintroduce the dead `curated-chat-card-*` testID, and NEVER introduce a flow-local testID that could rot.
- NEVER inject routes via a fixture backend or stub the detail screen — seed the real Convex dev via public_api and drive the real `getCuratedRouteDetail` and `listCuratedRoutes` paths.
- The honest-absence flow (`.maestro/discovery-honest-absence.yaml`) MUST observe the literal 'no routes near you yet' caption produced by S6-T3 — declare the cross-task dependency, do not bypass it with a stubbed surface.
- The saved-reachability flow MUST actually flip `riderReady` to false mid-run (via public_api quarantine mutation) — a flow that skips the state change is degenerate (DEGENERATE_ONLY).
- The retarget MUST preserve the original AC-1 intent (chat-card entry → detail screen, with polyline assertion) — retargeting is substituting the ENTRY selector, not deleting the branch.

## SPECIFICATION

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR)
### AC-1 [PRIMARY] — AC-1

**Requirement:** GIVEN the existing `.maestro/curated-route-detail.yaml` AC-1 branch (lines 19-44) references the dead testID `curated-chat-card-cherohala-skyway` WHEN the retargeted flow runs against the real iOS simulator + real Convex dev (seeded with Cherohala Skyway as a rider-ready route) THEN the AC-1 branch resolves the detail screen via the deep-link entry `laneshadow:///curated-route/cherohala-skyway` (mirroring the AC-2 branch's `openLink` pattern at line 50) AND asserts the same detail-screen testIDs (`curated-route-detail-name`, `curated-detail-map`, `curated-route-detail-polyline`) as the original flow; the literal `Cherohala Skyway` is observed at `curated-route-detail-name`.

TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: maestro-ios-simulator  ·  FLOW_REF: UC-SURF-05  ·  VERIFY: `maestro test .maestro/curated-route-detail.yaml`

SCENARIO:
- `start_ref` seed_method: `public_api`
- SEED: Seed real Convex dev with Cherohala Skyway as a rider-ready route whose `routePolyline` is present and whose slug is `cherohala-skyway`. The route MUST be discoverable via the production `listCuratedRoutes` query so the deep-link target resolves through the real `getCuratedRouteDetail` (app/(app)/curated-route/[id].tsx).
- ACTION (api_client): Run `maestro test .maestro/curated-route-detail.yaml` against the booted iOS simulator after `pnpm ios` produces a dev client connected to Metro localhost:8081; the flow's AC-1 branch uses `openLink: laneshadow:///curated-route/cherohala-skyway` to enter the detail screen.
- MUST_OBSERVE: ["testID 'curated-route-detail-name' resolves with literal text 'Cherohala Skyway'", "testID 'curated-detail-map' resolves (the map section root, app/(app)/curated-route/[id].tsx:343)", "testID 'curated-route-detail-polyline' resolves (the polyline-presence probe, [id].tsx:362)"]
- MUST_NOT_OBSERVE: ["literal 'curated-chat-card-cherohala-skyway' anywhere in .maestro/curated-route-detail.yaml (the dead testID must be gone)", "Maestro output 'Element not found' for the old testID", "literal 'Render Error' or 'ConvexError' on the detail screen", 'empty flow file or unchanged dead-testID flow (the stub signature)']
- NEGATIVE_CONTROL (would_fail_if): ["the flow still targets `curated-chat-card-cherohala-skyway` (the dead testID — no element matches in production code, grep proves absence in components/** and app/**); OR the retargeted selector is itself unstable (e.g. a testID introduced for this flow and then renamed in a later sprint); OR the test asserts only `assertVisible` without observing the literal text 'Cherohala Skyway' (WEAK_ORACLE)."]
- EVIDENCE: `screenshot` (required_capture=True)

### AC-2 — AC-2

**Requirement:** GIVEN the new flow `.maestro/discovery-honest-absence.yaml` (authored here as the TC-7 human-surface proof for S6-T3) WHEN the flow runs against the iOS simulator with a simulated device location in a thin-coverage region (no rider-ready routes within the nearest-mode radius) on real Convex dev THEN the flow observes the literal caption `no routes near you yet` on screen (testID `discovery-empty-honest`) AND observes zero populated pills AND the literal substring `0mi` appears in NO screenshot or DOM dump.

TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: maestro-ios-simulator  ·  FLOW_REF: UC-SURF-04  ·  VERIFY: `maestro test .maestro/discovery-honest-absence.yaml`

SCENARIO:
- `start_ref` seed_method: `public_api`
- SEED: Seed real Convex dev with rider-ready routes ONLY outside the test location's nearest radius (e.g. all routes in NC/SC, simulated location at SLC 40.76,-111.89). Set the iOS simulator location via `xcrun simctl location booted set 40.76,-111.89` (mirroring discovery-full-gate.yaml's documented cold-boot location grant precondition).
- ACTION (api_client): Run `maestro test .maestro/discovery-honest-absence.yaml` against the booted iOS simulator after `pnpm ios`; the flow cold-boots the app, signs in via `e2e-test-login-button`, waits for `chat-input-suggestion-chips` to mount, then asserts the honest-absence caption.
- MUST_OBSERVE: ["testID 'discovery-empty-honest' resolves with literal text containing 'no routes near you yet'", "screenshot artifact '01-thin-region-honest-absence-caption' exists AND testID 'discovery-empty-honest' resolves with literal 'no routes near you yet'"]
- MUST_NOT_OBSERVE: ["literal substring '0mi' in any screenshot or accessibility tree dump", "literal 'No nearby routes' (the legacy string S6-T3 retires)", 'any element with testID matching /^discovery-suggestion-pill-/', "testID 'chat-error-message' (the thin-region state is NOT an error)"]
- NEGATIVE_CONTROL (would_fail_if): ["the flow does not seed a thin-coverage region and so observes populated pills instead (DEGENERATE_ONLY); OR the flow stubs the discovery surface instead of driving the real HomeMapScreen (SEED_NOT_REAL); OR the flow asserts only 'empty pill row' without the literal caption (WEAK_ORACLE)."]
- EVIDENCE: `screenshot` (required_capture=True)

### AC-3 — AC-3

**Requirement:** GIVEN the new flow `.maestro/curated-saved-reachability.yaml` (UC-SURF-06) WHEN the rider saves a curated route, the operator flips that route to non-ready (quarantine) on real Convex dev via public_api, and the rider reopens it from the Saved tab THEN the detail screen resolves normally (testID `curated-route-detail-name` shows the route name, NO error screen, NO block) — proving the gate filters what gets SUGGESTED but never the rider's own library.

TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: maestro-ios-simulator  ·  FLOW_REF: UC-SURF-06  ·  VERIFY: `maestro test .maestro/curated-saved-reachability.yaml`

SCENARIO:
- `start_ref` seed_method: `public_api`
- SEED: Seed real Convex dev with a rider-ready curated route (e.g. Cherohala Skyway) and a test rider account (CLERK_TEST_EMAIL / CLERK_TEST_PASSWORD) with no saved routes. Mid-flow, after the rider saves the route, a public_api mutation flips the route to `quarantine` (so `riderReady` becomes false) — the saved-route detail must still resolve via getCuratedRouteDetail.
- ACTION (api_client): Run `maestro test .maestro/curated-saved-reachability.yaml`; the flow cold-boots, signs in, navigates to a curated route detail via the deep-link entry, taps Save, then mid-flow the operator (or a flow-side `runScript` callback) flips the route to non-ready, then the flow navigates to Saved and reopens the route.
- MUST_OBSERVE: ["testID 'curated-route-detail-name' resolves with the route's literal name on the post-quarantine reopen", "testID 'curated-detail-map' resolves (the detail screen rendered, not a 404)", "screenshot 'saved-route-still-resolves-after-quarantine' archived"]
- MUST_NOT_OBSERVE: ["literal 'Render Error' or 'ConvexError' or 'NOT_FOUND' after the quarantine flip", 'the Saved list empty state (the saved route is still listed)', "any 'route unavailable' or 'blocked' affordance"]
- NEGATIVE_CONTROL (would_fail_if): ['the implementation blocks saved-route detail when riderReady flips false (the gate filters saved routes — the exact bug UC-SURF-06 forbids); OR the flow never actually flips riderReady (DEGENERATE_ONLY — no state change); OR the flow uses a stubbed detail screen (SEED_NOT_REAL).']
- EVIDENCE: `screenshot` (required_capture=True)

### AC-4 — AC-4

**Requirement:** GIVEN the retargeted `.maestro/curated-route-detail.yaml` (AC-1 + AC-3 branches) WHEN the deep-link entry (AC-1 retarget) and the map-pin entry (AC-3) are exercised back-to-back THEN both entries resolve the SAME detail screen for the same routeId (testID `curated-route-detail-name` with the same literal name) — preserving the original parity assertion that `goToCuratedRoute` is the single shared push target (app/(app)/(tabs)/index.tsx:482).

TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: maestro-ios-simulator  ·  FLOW_REF: UC-SURF-05  ·  VERIFY: `maestro test .maestro/curated-route-detail.yaml`

SCENARIO:
- `start_ref` seed_method: `public_api`
- SEED: Same Cherohala Skyway seed as AC-1; the route has a map-pin on the plan tab (curated-map-pin-cherohala-skyway) AND a deep-link target (laneshadow:///curated-route/cherohala-skyway).
- ACTION (api_client): Run `maestro test .maestro/curated-route-detail.yaml`; the AC-1 branch enters via deep-link, the AC-3 branch enters via map-pin tap; both branches assert the same detail-screen testIDs and literal name.
- MUST_OBSERVE: ["both AC-1 and AC-3 branches assert testID 'curated-route-detail-name' with literal 'Cherohala Skyway'", "both branches assert testID 'curated-detail-map'"]
- MUST_NOT_OBSERVE: ['divergent detail targets between the two entry paths', "AC-3 referencing the dead 'curated-chat-card' testID"]
- NEGATIVE_CONTROL (would_fail_if): ['deep-link and map-pin push different routes', 'AC-3 silently skipped']
- EVIDENCE: `screenshot` (required_capture=True)

### AC-5 — AC-5

**Requirement:** GIVEN the retargeted selectors in `.maestro/curated-route-detail.yaml` (deep-link URL + `curated-map-pin-{routeId}` + `curated-route-detail-name` + `curated-detail-map` + `curated-route-detail-polyline`) WHEN the retargeted flow is inspected THEN every selector referenced is either (a) a stable universal-link scheme (laneshadow:///) owned by the app's deep-link config OR (b) a testID present in production code (verified via grep) — NO selector introduced for this flow that could rot in a future sprint.

TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: maestro-ios-simulator  ·  FLOW_REF: UC-SURF-05  ·  VERIFY: `bash -c 'grep -E "curated-chat-card|curated-route-detail-name|curated-detail-map|curated-route-detail-polyline|curated-map-pin" .maestro/curated-route-detail.yaml && ! grep -q curated-chat-card .maestro/curated-route-detail.yaml'`

SCENARIO:
- `start_ref` seed_method: `public_api`
- SEED: No backend seed — this is a static-analysis gate on the flow YAML plus a runtime gate that the referenced testIDs resolve in production code.
- ACTION (api_client): Run the static grep assertion (no `curated-chat-card-*` reference remains; all referenced testIDs exist in app/** and components/**); run the Maestro flow once to confirm every selector resolves.
- MUST_OBSERVE: ["0 matches for 'curated-chat-card' in .maestro/curated-route-detail.yaml", "every testID referenced exists in 'app/**' via grep"]
- MUST_NOT_OBSERVE: ["any 'curated-chat-card' reference", 'a flow-only testID not in production code']
- NEGATIVE_CONTROL (would_fail_if): ['retarget reintroduces a chat-card testID', 'static check is the only verification']
- EVIDENCE: `stdout` (required_capture=True)

## TEST CRITERIA
- **TC-1** (→ AC-1): RED: before retarget, `maestro test .maestro/curated-route-detail.yaml` fails at the AC-1 branch with 'Element not found' for `curated-chat-card-cherohala-skyway`. Capture the failing run artifact (screenshot + stdout) as RED evidence.
  - VERIFY: `maestro test .maestro/curated-route-detail.yaml 2>&1 | grep -E 'curated-chat-card|Element not found'`
- **TC-2** (→ AC-1): GREEN: after retarget, `maestro test .maestro/curated-route-detail.yaml` passes end-to-end on the iOS simulator against real Convex dev; AC-1 (deep-link), AC-2 (no-polyline deep-link), and AC-3 (map-pin) all green.
  - VERIFY: `maestro test .maestro/curated-route-detail.yaml`
- **TC-3** (→ AC-2): GREEN: `.maestro/discovery-honest-absence.yaml` passes on the simulator with simulated SLC location against real Convex dev seeded with thin-coverage; observes literal 'no routes near you yet' and zero populated pills.
  - VERIFY: `maestro test .maestro/discovery-honest-absence.yaml`
- **TC-4** (→ AC-3): GREEN: `.maestro/curated-saved-reachability.yaml` passes — saved route still resolves detail after the route's riderReady flips false; no error screen, no block.
  - VERIFY: `maestro/curated-saved-reachability.yaml`
- **TC-5** (→ AC-5): Static: `grep -c curated-chat-card .maestro/curated-route-detail.yaml` returns 0; `grep -E 'curated-route-detail-name|curated-detail-map|curated-route-detail-polyline|curated-map-pin' .maestro/curated-route-detail.yaml` returns at least 4 distinct matches.
  - VERIFY: `bash -c '! grep -q curated-chat-card .maestro/curated-route-detail.yaml && grep -cE "curated-route-detail-name|curated-detail-map|curated-route-detail-polyline|curated-map-pin" .maestro/curated-route-detail.yaml'`
- **TC-6** (→ AC-4): Parity: AC-1 (deep-link entry) and AC-3 (map-pin entry) branches both resolve `curated-route-detail-name` with the literal 'Cherohala Skyway' — verified by two distinct screenshot artifacts in the same run.
  - VERIFY: `maestro test .maestro/curated-route-detail.yaml --include-tags parity`

## SCOPE (file-level write permissions)
**writeAllowed:**
- `.maestro/curated-route-detail.yaml`
- `.maestro/discovery-honest-absence.yaml`
- `.maestro/curated-saved-reachability.yaml`
**writeProhibited:**
- `app/** (production code is owned by S6-T3 / UC-SURF-05 tasks; this task is a flow-only retarget)`
- `components/** (same — production UI is owned by sibling tasks)`
- `convex/** (backend is owned by S6-T2)`
- `hooks/** (the discovery hook extension is owned by S6-T3)`
- `Existing passing flows (.maestro/rec-016-cold-boot-recovered-route-plots.yaml, .maestro/rux-001-route-carousel-paging.yaml, .maestro/discovery-full-gate.yaml, .maestro/_common-launch-to-plan.yaml) — read-only references, never modify`

## READING LIST
- .maestro/curated-route-detail.yaml [PRIMARY PATTERN — the existing flow to retarget; lines 19-44 hold the dead AC-1 testID]
- .maestro/rec-016-cold-boot-recovered-route-plots.yaml:1-138 [the cold-boot + Expo dev-client + auth sequence to imitate for the two new flows; this is the canonical cold-boot pattern that handles the developer-menu race]
- .maestro/discovery-full-gate.yaml:27-60 [the documented clearKeychain/location-grant caveat to honor in the honest-absence flow]
- .maestro/_common-launch-to-plan.yaml [the shared helper — but do NOT use for clearKeychain flows per discovery-full-gate.yaml:28-32]
- .maestro/rux-001-route-carousel-paging.yaml [a working reference for assert/tapOn testID patterns and screenshot discipline]
- app/(app)/(tabs)/index.tsx:1568-1583 [the curated-map-pin testID emission — confirms `curated-map-pin-{routeId}` is stable]
- app/(app)/(tabs)/index.tsx:482-487 [goToCuratedRoute — the shared push target both entries must funnel through]
- app/(app)/curated-route/[id].tsx:26-50,343,415 [the detail-screen testID contract — `curated-detail-map`, `curated-route-detail-name`]
- .spec/prds/route-agent-quality/07-uc-surf.md:64-103 [UC-SURF-04 + UC-SURF-06 — authoritative ACs the flows prove]
- .spec/prds/route-agent-quality/11-e2e-testing-criteria.md:170-194 [T-SURF-011..T-SURF-021 — the e2e criteria these flows satisfy]

## DESIGN
- Reference: .spec/prds/route-agent-quality/07-uc-surf.md (UC-SURF-04, UC-SURF-05, UC-SURF-06)
- Reference: .spec/prds/route-agent-quality/11-e2e-testing-criteria.md:170-194 (T-SURF-011..T-SURF-021)
- Reference: .maestro/rec-016-cold-boot-recovered-route-plots.yaml (the canonical cold-boot + Expo dev-client + auth sequence)
- Reference: app/(app)/(tabs)/index.tsx:1568-1583 (curated-map-pin emission — stable testID)
- Reference: app/(app)/curated-route/[id].tsx:343,415 (detail-screen testID contract)

**Pattern:** Stable-selector Maestro flow: (1) entry via universal-link deep-link (`openLink: laneshadow:///curated-route/{slug}`) which is owned by the app's expo-linking config and survives UI refactors; (2) entry via production testID (`curated-map-pin-{routeId}`, `curated-route-detail-name`) verified by grep before the flow ships; (3) assertions on production testIDs only — never on a flow-local testID introduced just for the e2e. The cold-boot sequence is inlined (not delegated to _common-launch-to-plan.yaml) because clearKeychain:true flows must own their location-grant precondition (discovery-full-gate.yaml:28-32).
- pattern_source: `.maestro/rec-016-cold-boot-recovered-route-plots.yaml:23-138 [the inlined cold-boot + Expo dev-client + auth + late-arriving-intro-dismiss sequence is the canonical race-free pattern]`

**Anti-pattern:** DO NOT target a testID that exists only in the flow's own expectations (brittle). DO NOT use `_common-launch-to-plan.yaml` after `clearKeychain:true` (the location-grant race documented in discovery-full-gate.yaml:28-32). DO NOT introduce a new `curated-chat-card-*` testID just to make the old flow pass — the chat-card surface does not exist (grep-confirmed). DO NOT seed a fixture backend or mock the detail screen (SEED_NOT_REAL). DO NOT skip the AC-1 branch 'because the testID is dead' — the branch's INTENT (chat-card entry → detail) is preserved by retargeting onto the deep-link entry.

## EVIDENCE / VERIFICATION GATES
- **static-grep-dead-testid-gone** — `bash -c '! grep -q curated-chat-card .maestro/curated-route-detail.yaml'` → 
- **static-grep-stable-testids-present** — `bash -c 'grep -cE "curated-route-detail-name|curated-detail-map|curated-route-detail-polyline|curated-map-pin" .maestro/curated-route-detail.yaml'` → 
- **yaml-lint** — `bash -c 'for f in .maestro/curated-route-detail.yaml .maestro/discovery-honest-absence.yaml .maestro/curated-saved-reachability.yaml; do python3 -c "import yaml,sys; yaml.safe_load(open(sys.argv[1]))" "$f"; done'` → 
- **e2e-retargeted-detail** — `maestro test .maestro/curated-route-detail.yaml` → 
- **e2e-honest-absence** — `maestro test .maestro/discovery-honest-absence.yaml` → 
- **e2e-saved-reachability** — `maestro test .maestro/curated-saved-reachability.yaml` → 

## DEPENDENCIES
- Depends on: S6-T2, S6-T3

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S6-T6",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "default": {
      "description": "auto-fixture for start_ref default (AC-1)",
      "seed_method": "public_api",
      "records": [
        "pre-state for default"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the existing `.maestro/curated-route-detail.yaml` AC-1 branch (lines 19-44) references the dead testID `curated-chat-card-cherohala-skyway` WHEN the retargeted flow runs against the real iOS simulator + real Convex dev (seeded with Cherohala Skyway as a rider-ready route) THEN the AC-1 branch resolves the detail screen via the deep-link entry `laneshadow:///curated-route/cherohala-skyway` (mirroring the AC-2 branch's `openLink` pattern at line 50) AND asserts the same detail-screen testIDs (`curated-route-detail-name`, `curated-detail-map`, `curated-route-detail-polyline`) as the original flow; the literal `Cherohala Skyway` is observed at `curated-route-detail-name`.",
      "verify": "maestro test .maestro/curated-route-detail.yaml",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "maestro-ios-simulator",
        "negative_control": {
          "would_fail_if": [
            "the flow still targets `curated-chat-card-cherohala-skyway` (the dead testID \u2014 no element matches in production code, grep proves absence in components/** and app/**); OR the retargeted selector is itself unstable (e.g. a testID introduced for this flow and then renamed in a later sprint); OR the test asserts only `assertVisible` without observing the literal text 'Cherohala Skyway' (WEAK_ORACLE).",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot"
        },
        "cases": [
          {
            "start_ref": "default",
            "action": {
              "via": "api_client",
              "steps": [
                "exercise AC-1 against real surface under start condition"
              ]
            },
            "end_state": {
              "must_observe": [
                "testID 'curated-route-detail-name' resolves with literal text 'Cherohala Skyway'",
                "testID 'curated-detail-map' resolves (the map section root, app/(app)/curated-route/[id].tsx:343)",
                "testID 'curated-route-detail-polyline' resolves (the polyline-presence probe, [id].tsx:362)"
              ],
              "must_not_observe": [
                "literal 'curated-chat-card-cherohala-skyway' anywhere in .maestro/curated-route-detail.yaml (the dead testID must be gone)",
                "Maestro output 'Element not found' for the old testID",
                "literal 'Render Error' or 'ConvexError' on the detail screen",
                "empty flow file or unchanged dead-testID flow (the stub signature)"
              ]
            },
            "seed_method": "public_api"
          },
          {
            "start_ref": "default",
            "action": {
              "via": "api_client",
              "steps": [
                "exercise AC-1 against real surface under start condition"
              ]
            },
            "end_state": {
              "must_observe": [
                "testID 'curated-route-detail-name' resolves with literal text 'Cherohala Skyway'",
                "testID 'curated-detail-map' resolves (the map section root, app/(app)/curated-route/[id].tsx:343)",
                "testID 'curated-route-detail-polyline' resolves (the polyline-presence probe, [id].tsx:362)"
              ],
              "must_not_observe": [
                "literal 'curated-chat-card-cherohala-skyway' anywhere in .maestro/curated-route-detail.yaml (the dead testID must be gone)",
                "Maestro output 'Element not found' for the old testID",
                "literal 'Render Error' or 'ConvexError' on the detail screen",
                "empty flow file or unchanged dead-testID flow (the stub signature)"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the new flow `.maestro/discovery-honest-absence.yaml` (authored here as the TC-7 human-surface proof for S6-T3) WHEN the flow runs against the iOS simulator with a simulated device location in a thin-coverage region (no rider-ready routes within the nearest-mode radius) on real Convex dev THEN the flow observes the literal caption `no routes near you yet` on screen (testID `discovery-empty-honest`) AND observes zero populated pills AND the literal substring `0mi` appears in NO screenshot or DOM dump.",
      "verify": "maestro test .maestro/discovery-honest-absence.yaml",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "maestro-ios-simulator",
        "negative_control": {
          "would_fail_if": [
            "the flow does not seed a thin-coverage region and so observes populated pills instead (DEGENERATE_ONLY); OR the flow stubs the discovery surface instead of driving the real HomeMapScreen (SEED_NOT_REAL); OR the flow asserts only 'empty pill row' without the literal caption (WEAK_ORACLE).",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot"
        },
        "cases": [
          {
            "start_ref": "default",
            "action": {
              "via": "api_client",
              "steps": [
                "exercise AC-2 against real surface under start condition"
              ]
            },
            "end_state": {
              "must_observe": [
                "testID 'discovery-empty-honest' resolves with literal text containing 'no routes near you yet'",
                "screenshot artifact '01-thin-region-honest-absence-caption' exists AND testID 'discovery-empty-honest' resolves with literal 'no routes near you yet'"
              ],
              "must_not_observe": [
                "literal substring '0mi' in any screenshot or accessibility tree dump",
                "literal 'No nearby routes' (the legacy string S6-T3 retires)",
                "any element with testID matching /^discovery-suggestion-pill-/",
                "testID 'chat-error-message' (the thin-region state is NOT an error)",
                "empty (0)"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the new flow `.maestro/curated-saved-reachability.yaml` (UC-SURF-06) WHEN the rider saves a curated route, the operator flips that route to non-ready (quarantine) on real Convex dev via public_api, and the rider reopens it from the Saved tab THEN the detail screen resolves normally (testID `curated-route-detail-name` shows the route name, NO error screen, NO block) \u2014 proving the gate filters what gets SUGGESTED but never the rider's own library.",
      "verify": "maestro test .maestro/curated-saved-reachability.yaml",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "maestro-ios-simulator",
        "negative_control": {
          "would_fail_if": [
            "the implementation blocks saved-route detail when riderReady flips false (the gate filters saved routes \u2014 the exact bug UC-SURF-06 forbids); OR the flow never actually flips riderReady (DEGENERATE_ONLY \u2014 no state change); OR the flow uses a stubbed detail screen (SEED_NOT_REAL).",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot"
        },
        "cases": [
          {
            "start_ref": "default",
            "action": {
              "via": "api_client",
              "steps": [
                "exercise AC-3 against real surface under start condition"
              ]
            },
            "end_state": {
              "must_observe": [
                "testID 'curated-route-detail-name' resolves with the route's literal name on the post-quarantine reopen",
                "testID 'curated-detail-map' resolves (the detail screen rendered, not a 404)",
                "screenshot 'saved-route-still-resolves-after-quarantine' archived"
              ],
              "must_not_observe": [
                "literal 'Render Error' or 'ConvexError' or 'NOT_FOUND' after the quarantine flip",
                "the Saved list empty state (the saved route is still listed)",
                "any 'route unavailable' or 'blocked' affordance"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the retargeted `.maestro/curated-route-detail.yaml` (AC-1 + AC-3 branches) WHEN the deep-link entry (AC-1 retarget) and the map-pin entry (AC-3) are exercised back-to-back THEN both entries resolve the SAME detail screen for the same routeId (testID `curated-route-detail-name` with the same literal name) \u2014 preserving the original parity assertion that `goToCuratedRoute` is the single shared push target (app/(app)/(tabs)/index.tsx:482).",
      "verify": "maestro test .maestro/curated-route-detail.yaml",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "maestro-ios-simulator",
        "negative_control": {
          "would_fail_if": [
            "deep-link and map-pin push different routes",
            "AC-3 silently skipped",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot"
        },
        "cases": [
          {
            "start_ref": "default",
            "action": {
              "via": "api_client",
              "steps": [
                "exercise AC-4 against real surface under start condition"
              ]
            },
            "end_state": {
              "must_observe": [
                "both AC-1 and AC-3 branches assert testID 'curated-route-detail-name' with literal 'Cherohala Skyway'",
                "both branches assert testID 'curated-detail-map'"
              ],
              "must_not_observe": [
                "divergent detail targets between the two entry paths",
                "AC-3 referencing the dead 'curated-chat-card' testID",
                "empty/start signature: result count == 0 or field absent"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the retargeted selectors in `.maestro/curated-route-detail.yaml` (deep-link URL + `curated-map-pin-{routeId}` + `curated-route-detail-name` + `curated-detail-map` + `curated-route-detail-polyline`) WHEN the retargeted flow is inspected THEN every selector referenced is either (a) a stable universal-link scheme (laneshadow:///) owned by the app's deep-link config OR (b) a testID present in production code (verified via grep) \u2014 NO selector introduced for this flow that could rot in a future sprint.",
      "verify": "bash -c 'grep -E \"curated-chat-card|curated-route-detail-name|curated-detail-map|curated-route-detail-polyline|curated-map-pin\" .maestro/curated-route-detail.yaml && ! grep -q curated-chat-card .maestro/curated-route-detail.yaml'",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "maestro-ios-simulator",
        "negative_control": {
          "would_fail_if": [
            "retarget reintroduces a chat-card testID",
            "static check is the only verification",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "stdout"
        },
        "cases": [
          {
            "start_ref": "default",
            "action": {
              "via": "api_client",
              "steps": [
                "exercise AC-5 against real surface under start condition"
              ]
            },
            "end_state": {
              "must_observe": [
                "0 matches for 'curated-chat-card' in .maestro/curated-route-detail.yaml",
                "every testID referenced exists in 'app/**' via grep"
              ],
              "must_not_observe": [
                "any 'curated-chat-card' reference",
                "a flow-only testID not in production code",
                "empty/start signature: result count == 0 or field absent"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "RED: before retarget, `maestro test .maestro/curated-route-detail.yaml` fails at the AC-1 branch with 'Element not found' for `curated-chat-card-cherohala-skyway`. Capture the failing run artifact (screenshot + stdout) as RED evidence.",
      "verify": "maestro test .maestro/curated-route-detail.yaml 2>&1 | grep -E 'curated-chat-card|Element not found'",
      "maps_to_ac": "AC-1",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-1"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-1 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "GREEN: after retarget, `maestro test .maestro/curated-route-detail.yaml` passes end-to-end on the iOS simulator against real Convex dev; AC-1 (deep-link), AC-2 (no-polyline deep-link), and AC-3 (map-pin) all green.",
      "verify": "maestro test .maestro/curated-route-detail.yaml",
      "maps_to_ac": "AC-1",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-2"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-2 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "GREEN: `.maestro/discovery-honest-absence.yaml` passes on the simulator with simulated SLC location against real Convex dev seeded with thin-coverage; observes literal 'no routes near you yet' and zero populated pills.",
      "verify": "maestro test .maestro/discovery-honest-absence.yaml",
      "maps_to_ac": "AC-2",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-3"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-3 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "GREEN: `.maestro/curated-saved-reachability.yaml` passes \u2014 saved route still resolves detail after the route's riderReady flips false; no error screen, no block.",
      "verify": "maestro/curated-saved-reachability.yaml",
      "maps_to_ac": "AC-3",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-4"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-4 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Static: `grep -c curated-chat-card .maestro/curated-route-detail.yaml` returns 0; `grep -E 'curated-route-detail-name|curated-detail-map|curated-route-detail-polyline|curated-map-pin' .maestro/curated-route-detail.yaml` returns at least 4 distinct matches.",
      "verify": "bash -c '! grep -q curated-chat-card .maestro/curated-route-detail.yaml && grep -cE \"curated-route-detail-name|curated-detail-map|curated-route-detail-polyline|curated-map-pin\" .maestro/curated-route-detail.yaml'",
      "maps_to_ac": "AC-5",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-5"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-5 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Parity: AC-1 (deep-link entry) and AC-3 (map-pin entry) branches both resolve `curated-route-detail-name` with the literal 'Cherohala Skyway' \u2014 verified by two distinct screenshot artifacts in the same run.",
      "verify": "maestro test .maestro/curated-route-detail.yaml --include-tags parity",
      "maps_to_ac": "AC-4",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-6"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-6 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    }
  ]
}
-->