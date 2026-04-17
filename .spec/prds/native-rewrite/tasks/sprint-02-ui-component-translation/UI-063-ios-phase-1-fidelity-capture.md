# UI-063: iOS phase-1 fidelity capture: run screenshot harness on all scenarios in UI-061 set, compare against RN baseline, file variance report

**Task ID:** UI-063
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-reviewer
**Reviewer:** swift-reviewer
**Estimate:** 240 min
**Type:** [FEATURE] [INFRA]
**Status:** Planned
**Phase:** Fidelity Review
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `review` slice for `iOS phase-1 fidelity capture: run screenshot harness on all scenarios in UI-061 set, compare against RN baseline, file variance report`.

**Objective:** Capture the phase-1 iOS screenshot set, compare it against the RN baseline, and publish a scenario-keyed variance report.

**Success State:** The phase-1 scenario slice is captured in light and dark mode, compared to RN, and summarized in a report that references scenario IDs, RN paths, and failure severity.

## CRITICAL CONSTRAINTS

### MUST
- Follow the UI-061 capture protocol exactly, including scenario IDs, mode coverage, and device metadata.
- Freeze or disable non-deterministic animations before capture.
- File a variance report that cites scenario ID, RN reference path, and suspected root cause for each mismatch.

### NEVER
- Capture ad-hoc scenarios outside the approved phase-1 set.
- Use live auth, backend, or unstable map fixtures.

### STRICTLY
- Artifact names must be keyed by scenario ID and mode.

## DELIVERABLES

- ios/LaneShadow/Views/artifacts/**
- ios/LaneShadow/Sandbox/**
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** UI-061 defines the approved scenario slice.
**WHEN** The reviewer runs the screenshot harness on the assigned platform.
**THEN** All phase-1 scenarios are captured in the required modes with artifact names keyed by scenario ID.
**Verify:** `rg -n "UI-061|phase-1 fidelity" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

### AC-2
**GIVEN** RN baseline references are available from the scenario registry.
**WHEN** Captured screenshots are compared to RN outputs.
**THEN** Every variance is recorded with scenario ID, RN reference path, severity, and suspected root cause.
**Verify:** `rg -n "variance report|RN baseline" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

### AC-3
**GIVEN** Some components include motion or async placeholders.
**WHEN** Capture is prepared for diffing.
**THEN** Animations are frozen or disabled, deterministic fixtures are used, and screenshots remain reproducible across runs.
**Verify:** `rg -n "deterministic|fixtures|Animation parity" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

### AC-4
**GIVEN** The platform review is complete.
**WHEN** A variance report is published.
**THEN** Review findings clearly distinguish acceptable platform variance from parity failures that block downstream sprints.
**Verify:** `printf "review artifact expected for UI-063
"`

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | All phase-1 scenarios are captured in the required modes with artifact names keyed by scenario ID. | `rg -n "UI-061\|phase-1 fidelity" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-2 | AC-2 | Every variance is recorded with scenario ID, RN reference path, severity, and suspected root cause. | `rg -n "variance report\|RN baseline" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-3 | AC-3 | Animations are frozen or disabled, deterministic fixtures are used, and screenshots remain reproducible across runs. | `rg -n "deterministic\|fixtures\|Animation parity" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Review findings clearly distinguish acceptable platform variance from parity failures that block downstream sprints. | `printf "review artifact expected for UI-063
"` |
| TC-5 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `swiftformat --lint ios/LaneShadow --config .swiftformat && xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `.spec/prds/native-rewrite/08c-ios-component-map.md`

## GUARDRAILS

### WRITE-ALLOWED
- ios/LaneShadow/Views/artifacts/**
- ios/LaneShadow/Sandbox/**
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**
- ios/LaneShadowUITests/**

### WRITE-PROHIBITED
- android/**
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

**Reference:** `.spec/prds/native-rewrite/08c-ios-component-map.md`

**Pattern:** Single SwiftUI view with enum or binding-driven variants, theme environment consumption, and deterministic sandbox scenarios.

**Anti-pattern:** Default SwiftUI styling, live service dependencies, or platform-specific naming drift.

## DESIGN NOTES

- Follow the phase-1 capture protocol exactly, including scenario IDs, device metadata, and mode coverage.
- Freeze motion and async placeholders before diffing.
- Cite scenario IDs and RN paths in every variance finding.

## VERIFICATION GATES

- Run the approved screenshot harness for the phase-1 set
- Produce a variance report keyed by scenario ID
- swiftformat --lint ios/LaneShadow --config .swiftformat
- xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test

## DEPENDENCIES

- UI-061
- UI-004
- UI-006
- UI-016
- UI-020
- UI-022
- UI-042
- UI-054
- UI-058

## CODING STANDARDS

- .spec/prds/native-rewrite/08d-component-parity-spec.md — naming, interface, token, state, animation, accessibility, keyboard, and RTL parity
- .spec/prds/native-rewrite/08-design-system.md — token generation and consumption rules
- ~/Projects/brain/docs/TDD-METHODOLOGY.md — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- Feature wiring beyond sandbox-ready component translation.
- Changes to unrelated sprints or backend and server code.
