---
view_map: 1
project: LaneShadow Native Integration (V3)
generated: 2026-05-15T08:00:00Z
revised: 2026-05-15T18:00:00Z
prd: .spec/prds/v3-integration/README.md
doctrine_source: RULES.md § Design Rules › One View, Many States
authoritative_for: ".spec/prds/v3-integration/ROADMAP.md sprint titling, kb-sprint-plan + kb-sprint-tasks-plan view inventory, swift-planner + kotlin-planner + mobile-planner agent prompts, .spec/design/system/views/<screen>/<state>/ folder structure"
note: "Previously titled SITE-MAP.md; renamed to VIEW-MAP.md 2026-05-15 because LaneShadow is a mobile app, not a website."
---

# Target View Map — LaneShadow V3

This document defines the **target information architecture (view map)** of the LaneShadow app under the V3 integration plan. ("View map" not "site map" because LaneShadow is a mobile app, not a website.) It is the canonical reference for:

- What conceptual views exist
- How they nest (states + modals + overlays vs. sibling routes)
- The doctrine that decides when a new variant becomes a STATE vs. a SCREEN
- Cross-references from each state to its design system folder + sprint owner

The implementation today partially violates this target IA (legacy `RouteResults`, `RouteDetails`, `Sessions`, `SavedRoutes`, `Settings` routes still exist as sibling templates). Cleanup is tracked by the MAPAPP-UNIFY epics. **This document is the destination, not the current snapshot.**

---

## 1. Doctrine — One View, Many States

> When a view has multiple mocks/variants (idle / planning / loading / error / success / etc.), those are **STATES** of one persistent screen, **NEVER** separate screens.

— RULES.md § Design Rules › One View, Many States (codified 2026-05-14)

**Why:** Mounting a different SwiftUI/Compose template per variant unmounts shared infrastructure (map atom, camera, tile cache, polylines, animation timers), breaks the persistent-host contract, produces visual jank during transitions, and forces duplicate composition code that drifts apart over time.

**How to apply (planning):**

- One screen + a `<View>State` enum + state-derived overlays
- Transitions are state mutations, **never** `NavigationLink` push / `navController.navigate(...)`
- Persistent atoms (map, video player, canvas) mounted ONCE; input bindings change by state
- Capture/snapshot tests target the unified screen with state injected via sandbox stories — **never** per-template captures
- Modal overlays (cancel sheets, drawers, bottom sheets) are acceptable as TRANSIENT compositions over a host state — they are NOT separate screens

**Anti-pattern reject list:**

- `<Variant>Screen.swift` / `<Variant>Screen.kt` whose only difference from a sibling is the overlay set or input-binding state
- `AppFlowView` / router that swaps between sibling templates which each own their own `LSMap` / `LSMapHost`
- `NavigationLink` between two states of the same conceptual screen
- Snapshot tests that compare per-template captures instead of per-state captures of one template

---

## 2. Target IA Tree

```
LaneShadow App
│
├── Auth Flow  (pre-authentication, separate from MapApp — conceptually different screen)
│   │   Allowed: this IS a sibling route to MapApp because the auth flow has
│   │   no persistent map host. Sign-in / sign-up / verification are states
│   │   of ONE Auth screen (OneAuth pattern per Sprint 03).
│   │
│   ├── default               .spec/design/system/views/auth/default/
│   ├── email-entry           .spec/design/system/views/auth/email-entry/
│   ├── existing-user-sign-in .spec/design/system/views/auth/existing-user-sign-in/
│   ├── new-user-create-account
│   ├── invalid-email-error
│   └── submitting-loading
│
└── MapApp  (authenticated — ONE persistent map host; the only authenticated "screen")
    │   Owns: LSMap atom (camera, tiles, polylines all preserved across state)
    │           LSTopBar (center slot state-derived)
    │           LSMapControls workbar (mode state-derived)
    │           topOverlays / bottomOverlays / leadingDrawer slots (state-derived)
    │
    │   State enum: MapAppState
    │     case idle
    │     case planning(sessionId)
    │     case routeResults(sessionId, routePlanId)
    │     case routeDetails(routePlanId)   ← currently bottom-sheet overlay on routeResults
    │     case error(ErrorContext)         ← future; replaces overlays without remounting LSMap
    │
    ├── State: Idle  .spec/design/system/views/mapapp/idle/
    │   │   Owner: Sprint 06 (IdleScreen, shipped) + IDLE-SYNC carry-forward
    │   ├── default              .../mapapp/idle/default/
    │   ├── first-ride           .../mapapp/idle/first-ride/
    │   ├── typing-send          .../mapapp/idle/typing-send/
    │   ├── no-location          .../mapapp/idle/no-location/
    │   ├── weather-advisory     .../mapapp/idle/weather-advisory/
    │   ├── filter-sheet         .../mapapp/idle/filter-sheet/         (modal overlay)
    │   │
    │   ├── Modal: Menu Drawer       (slides over Idle)
    │   │   Owned by Idle; never a separate route.
    │   │
    │   └── Modal: Sessions Drawer   (slides over Idle)  .spec/design/system/views/mapapp/sessions-drawer/
    │       Owner: future sprint (currently Sprint 11 in ROADMAP — renaming to "Map View · Sessions Drawer")
    │       Variants:
    │         default / empty / scrolled / new-confirm
    │       NOT a separate route. Composed via LSMapLayer.leadingDrawer slot.
    │
    ├── State: Planning  .spec/design/system/views/mapapp/planning/
    │   │   Owner: Sprint 08 (Map View · Planning State, in flight)
    │   │   Behavior: sketch polyline overlay + locked chat + phase indicator + breathing dot
    │   ├── scouting             .../mapapp/planning/scouting/         (phase 1 active)
    │   ├── drawing              .../mapapp/planning/drawing/          (phase 2 active)
    │   ├── weather              .../mapapp/planning/weather/          (phase 3 active)
    │   ├── scoring              .../mapapp/planning/scoring/          (phase 4 active)
    │   ├── slow-planning        .../mapapp/planning/slow-planning/
    │   ├── single-candidate     .../mapapp/planning/single-candidate/
    │   │
    │   └── Modal: Cancel-Prompt Sheet  .../mapapp/planning/cancel-prompt/
    │       Owned by Planning; not a separate route. Composed as an overlay above MapApp.
    │
    ├── State: RouteResults  .spec/design/system/views/mapapp/route-results/
    │   │   Owner: Sprint 09 (Map View · Route Results State, in flight — Phase D retrofit shipped 3f2800033)
    │   │   Behavior: three real polylines + navigator message + route attachment cards + refine + recall
    │   ├── default--best-pre-selected       .../mapapp/route-results/default--best-pre-selected/  (double-dash preserved from original design source)
    │   ├── default--dark                     .../mapapp/route-results/default--dark/  (dark theme of default)
    │   ├── alt1-tapped--sage-promoted       .../mapapp/route-results/alt1-tapped--sage-promoted/
    │   ├── two-candidates                   .../mapapp/route-results/two-candidates/
    │   ├── refining                         .../mapapp/route-results/refining/
    │   ├── weather-divergent                .../mapapp/route-results/weather-divergent/
    │   ├── message-dismissed                .../mapapp/route-results/message-dismissed/
    │   │
    │   └── State: RouteDetails  .spec/design/system/views/mapapp/route-details/
    │       │   Owner: Sprint 10 (Map View · Route Details State, planned)
    │       │   Behavior: bottom-sheet overlay over RouteResults — metrics, weather timeline, save/ride
    │       │   Composition: LSMapLayer.bottomOverlays or LSBottomSheet over MapApp body
    │       ├── default                      .../mapapp/route-details/default/
    │       ├── mixed-weather                .../mapapp/route-details/mixed-weather/
    │       ├── saved-state                  .../mapapp/route-details/saved-state/
    │       ├── medium-detent                .../mapapp/route-details/medium-detent/         (detent variant)
    │       └── dismissing                   .../mapapp/route-details/dismissing/            (transition)
    │
    ├── State: Error  .spec/design/system/views/mapapp/error/
    │   │   Owner: future sprint (currently in ROADMAP-ICEBOX as deferred)
    │   │   Composition: replaces topOverlays + bottomOverlays of MapApp — LSMap stays mounted
    │   │   The Error state is NOT a separate route. Recovery returns to whichever
    │   │   state was active when the error fired.
    │   ├── default
    │   ├── offline
    │   ├── extended
    │   ├── generic-failure
    │   └── recovered
    │
    └── (Future surfaces — not yet states/modals; deferred)
        ├── Saved Routes browsing  → future MapApp state or drawer (NEVER sibling route)
        ├── Settings                → future modal sheet over MapApp (NEVER sibling route)
        ├── Offline Regions         → future modal or settings sub-state (NEVER sibling route)
        └── Manual PlanRideSheet    → future modal over MapApp.idle (NEVER sibling route)
```

---

## 3. Modal vs. State — Decision Rules

Every UI variant for an authenticated surface MUST be classified as one of:

| Classification | Definition | When to use | Example |
|---|---|---|---|
| **State** | A primary composition of MapApp's slot system (topOverlays / bottomOverlays / topBar). Replaces the previous state's overlay set in place. LSMap stays mounted. | The user is doing something fundamentally different (e.g. planning vs. browsing results). The state lasts long enough that the user perceives "I am now in X mode". | Idle, Planning, RouteResults, Error |
| **Sub-state** | A composition that sits inside a parent state but adds a temporary chrome (e.g. bottom sheet). Inherits everything from parent state and adds an overlay. | The variant exists ONLY within a parent state and shares its data. The sub-state can be dismissed back to parent without state-loss. | RouteDetails (sub-state of RouteResults) |
| **Modal overlay** | A transient composition (drawer, sheet, dialog) that sits over the active state. Dismissed via tap-out / explicit cancel. | The composition is short-lived AND the user expects to return to exactly the same state they were in. | Cancel-confirm sheet, Sessions drawer, Menu drawer, Filter sheet |
| **Sibling route** | A separate top-level destination. Owns its own root view + lifecycle. | The conceptual screen has NO persistent host shared with another screen. The user's mental model is "I left X and am now in Y". | Auth flow (no map). That's it — for V3, ONLY Auth and MapApp are siblings. |

**Decision flow for any new variant:**

```
Q1: Does the variant share LSMap (camera, tiles, polylines) with another variant?
  YES → it's a STATE or MODAL of MapApp. Continue.
  NO  → consider sibling route, but justify: did you check it really doesn't share state?

Q2: Is the variant fundamentally a different user mode (not just a temporary chrome)?
  YES → it's a STATE (top-level case in MapAppState enum)
  NO  → continue

Q3: Does the variant live entirely inside another state, sharing that state's data?
  YES → it's a SUB-STATE (nested case or boolean flag inside parent state)
  NO  → it's a MODAL OVERLAY (composable above the active state, separately dismissable)
```

---

## 4. Route Migration Table (current → target)

The app today has more sibling routes than the target IA allows. The MAPAPP-UNIFY epic + Sprint 09/10/11 work folds these in over time.

### iOS — `ios/LaneShadow/RootView.swift` + `Views/AppFlow/AppFlowView.swift`

| Current route / screen | Status | Target classification | Owner sprint |
|---|---|---|---|
| `AuthFlowView` | KEEP | Sibling route (Auth flow) | Sprint 03 |
| `AuthenticatedMapAppView` → `MapApp` | KEEP | Sibling route (MapApp host) | MAPAPP-UNIFY iOS Cycle 2 (`be8fff154`) |
| `IdleScreenContainer` | DEPRECATE | Folded into `MapApp` (idle state) | MAPAPP-UNIFY iOS Cycle 3 (cleanup) |
| `PlanningScreenContainer` | DEPRECATE | Folded into `MapApp` (planning state) | MAPAPP-UNIFY iOS Cycle 3 (cleanup) |
| `RouteResultsScreen` | MIGRATE | `MapAppState.routeResults` state addition | Sprint 09 |
| `RouteDetailsScreen` | MIGRATE | Bottom-sheet overlay over `MapAppState.routeResults` | Sprint 10 |
| `SessionsScreen` | MIGRATE | Modal drawer over `MapAppState.idle` | Sprint 11 |
| `ErrorScreenContainer` / `Route.error` | MIGRATE | `MapAppState.error` state addition | Future (currently iceboxed) |
| `AppFlowView` | DELETE (after Cycle 3) | — | MAPAPP-UNIFY iOS Cycle 3 |
| `AuthenticatedLandingView` | DELETE (after Cycle 3) | — | MAPAPP-UNIFY iOS Cycle 3 |

### Android — `android/app/src/main/java/com/laneshadow/navigation/{Route,MainNavGraph}.kt`

| Current `Route.*` case | Status | Target classification | Owner |
|---|---|---|---|
| `Route.Splash` | KEEP | Pre-auth | Sprint 03 |
| `Route.SignIn`, `SignUp`, `OAuthCallback`, `Verify` | KEEP (within Auth flow) | States of one Auth screen (OneAuth) | Sprint 03 |
| `Route.Home` | KEEP (renamed `Route.MapApp` post-cleanup) | Sibling route (MapApp host) | MAPAPP-UNIFY Android Cycle 3 (`0f008ebd4`) |
| `Route.MapApp` | KEEP | Sibling route | MAPAPP-UNIFY Android Cycle 3 |
| `Route.Sessions` | MIGRATE | Modal drawer over `MapAppState.Idle` | Sprint 11 |
| `Route.RouteResults(sessionId)` | MIGRATE | `MapAppState.RouteResults` state addition | Sprint 09 |
| `Route.RouteDetails(sessionId, routeOptionId)` | MIGRATE | Bottom-sheet overlay over RouteResults | Sprint 10 |
| `Route.SavedRoutes` | MIGRATE (future) | MapApp state OR modal | Deferred (icebox) |
| `Route.SavedRouteDetail` | MIGRATE (future) | Modal overlay on SavedRoutes | Deferred (icebox) |
| `Route.Settings` | MIGRATE (future) | Modal sheet over MapApp | Deferred (icebox) |
| `Route.Sandbox` | KEEP (dev-only) | Out of scope — internal dev tool, not user-facing | — |
| `IdleRoute`, `PlanningRoute` | DEPRECATE | Folded into `MapApp` via overlay-providers | MAPAPP-UNIFY Android Cycle 4 (cleanup) |

---

## 5. Cross-References

### Design system → state mapping

Every state in the tree above maps to a `.spec/design/system/views/<screen>/<state>/` folder after the Phase 1 reorganization codified by `ROADMAP.md`. Per-state folders contain:

- `<state>.html` excerpt OR `README.md` linking to the parent view's master mockup
- `<state>.light.png` (and `<state>.dark.png` where designed)
- `<state>.annotations.json` (design-review annotations)
- `README.md` describing state purpose, tokens, sprint owner

### MapApp source code

- iOS: `ios/LaneShadow/Features/MapApp/MapAppState.swift`, `MapAppViewModel.swift`, `ios/LaneShadow/Views/Templates/MapApp.swift`
- Android: `android/app/src/main/java/com/laneshadow/ui/mapapp/MapAppState.kt`, `MapAppViewModel.kt`, `MapApp.kt`

### Doctrine sources

- `RULES.md` § Design Rules › One View, Many States (LaneShadow project rule)
- `~/Projects/brain/docs/mobile-architecture/ios-principles.md` § State-Driven Views (Persistent Host) (universal)
- `~/Projects/brain/docs/mobile-architecture/android-principles.md` § State-Driven Views (Persistent Host) (universal)
- `~/.claude/skills/kb-sprint-tasks-plan/skill.md` § VIEW STRUCTURE — ONE VIEW, MANY STATES (planning enforcement)
- `~/.claude/skills/kb-sprint-plan/skill.md` § VIEW STRUCTURE — ONE VIEW, MANY STATES (planning enforcement)
- `~/.claude/agents/{swift,kotlin,mobile,design}-planner/agent.md` § One View, Many States — MUST (planner agent enforcement)

---

## 6. Validation — How to verify a planned variant respects this view map

Before adding any new variant to a sprint:

1. **Find the variant on this tree** — is it already listed as a state, sub-state, or modal? If yes, plan against that classification.
2. **If not present**, run the Decision Flow in § 3 to classify it. Update this view map in the same commit that introduces the variant.
3. **Check the route migration table** in § 4 — if the variant would require a new sibling route, justify why none of the existing MapApp states or modals can host it. Default answer: no, fold it in.
4. **Cross-reference the design system folder** — does the variant have a `.spec/design/system/views/<screen>/<state>/` folder? If not, design needs to ship first.
5. **Sprint owner** — every state, sub-state, and modal in this tree has exactly one owning sprint. If the variant has no owner, it's deferred (icebox) until a sprint claims it.

---

## 7. Versioning

This view map evolves with the product. When a new state, sub-state, or modal is approved:

1. Edit this file in the same PR that introduces the design + sprint plan
2. Bump `site_map: N` in frontmatter
3. Add a `## Changelog` entry at the bottom (create section as needed)
4. Re-link ROADMAP.md if the new variant changes sprint scope

Current version: **1** (2026-05-15 — initial authoring per `.claude/plans/jaunty-wandering-karp.md`)
