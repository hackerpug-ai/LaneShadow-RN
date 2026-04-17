# UI-021: Android molecules 4/12 — route cards (all): `RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard`

**Task ID:** UI-021
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 720 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Molecules
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `molecules` slice for `Android molecules 4/12 — route cards (all): RouteThumbnail, RouteBadge, RouteOptionCard (ui), RouteOptionCard (planning), SessionCard, SavedRouteCard, FavoriteRoadCard, RouteAttachmentCard (ui), RouteAttachmentCard (chat), RouteLegTimeline, RoutePin, WaypointCard`.

**Objective:** Implement Android molecules 4/12 — route cards (all): `RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard` as Jetpack Compose work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the Android sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard`.
- Use only shared semantic tokens for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Compose only from already-defined atoms on the same platform and preserve RN layout hierarchy.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- android/app/src/main/java/com/laneshadow/ui/molecules/**
- android/app/src/main/java/com/laneshadow/ui/sandbox/**
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard`.
**Verify:** `printf "%s\n" "`RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard`"`

### AC-2
**GIVEN** Sprint 2 requires token-only styling and light and dark support.
**WHEN** The task scenarios render in the sandbox.
**THEN** All visuals use shared semantic tokens and render correctly in both color modes without hardcoded UI primitives.
**Verify:** `rg -n "Token consumption|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md`

### AC-3
**GIVEN** Every translated component must be reviewable before rider-facing wiring resumes.
**WHEN** Sandbox scenarios are registered for this task.
**THEN** Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable.
**Verify:** `rg -n "RN reference|scenario|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

### AC-4
**GIVEN** Parity includes behavior as well as visuals.
**WHEN** The task is validated against the parity spec.
**THEN** Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family.
**Verify:** `rg -n "Accessibility|Keyboard handling|RTL support|Animation parity|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md`

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct Android Compose directories with parity-aligned names and signatures: `RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard`. | `printf "%s\n" "`RouteThumbnail`, `RouteBadge`, `RouteOptionCard` (ui), `RouteOptionCard` (planning), `SessionCard`, `SavedRouteCard`, `FavoriteRoadCard`, `RouteAttachmentCard` (ui), `RouteAttachmentCard` (chat), `RouteLegTimeline`, `RoutePin`, `WaypointCard`"` |
| TC-2 | AC-2 | All visuals use shared semantic tokens and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `detekt --input android --config .detekt/config.yml && ./android/gradlew assembleDebug` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `.spec/prds/native-rewrite/08b-android-component-map.md`

## GUARDRAILS

### WRITE-ALLOWED
- android/app/src/main/java/com/laneshadow/ui/molecules/**
- android/app/src/main/java/com/laneshadow/ui/sandbox/**
- android/app/src/test/java/com/laneshadow/**
- android/app/src/androidTest/java/com/laneshadow/**

### WRITE-PROHIBITED
- ios/**
- server/**
- convex/**
- Any unrelated sprint folders outside .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/**

### MUST
- Follow the parity contract in `.spec/prds/native-rewrite/08d-component-parity-spec.md`.
- Keep sandbox scenarios deterministic and labeled with RN reference paths.
- Limit changes to the component family or sandbox or reporting surface owned by this task.

### MUST NOT
- Do not add backend or auth dependencies just to render scenarios.
- Do not modify unrelated platform directories or downstream sprint artifacts.

## CODE PATTERN

**Reference:** `.spec/prds/native-rewrite/08b-android-component-map.md`

**Pattern:** Single reusable @Composable with variant props or enums, token-backed MaterialTheme access, and sandbox fixture registration.

**Anti-pattern:** Backend-aware composables, duplicated variant files, or hardcoded visual constants.

## DESIGN NOTES

- Preserve RN spacing, composition hierarchy, and edge-case fixtures such as long labels, loading, and error states.
- Avoid unstyled Material defaults and route all styling through the documented Compose theme layer.

## VERIFICATION GATES

- detekt --input android --config .detekt/config.yml
- ./android/gradlew assembleDebug
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-013

## CODING STANDARDS

- .spec/prds/native-rewrite/08d-component-parity-spec.md — naming, interface, token, state, animation, accessibility, keyboard, and RTL parity
- .spec/prds/native-rewrite/08-design-system.md — token generation and consumption rules
- ~/Projects/brain/docs/TDD-METHODOLOGY.md — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- Feature wiring beyond sandbox-ready component translation.
- Changes to unrelated sprints or backend and server code.
