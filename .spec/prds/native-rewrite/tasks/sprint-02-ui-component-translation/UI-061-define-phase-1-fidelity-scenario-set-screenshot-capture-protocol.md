# UI-061: Define phase-1 fidelity scenario set (atom subset 1, molecule subsets 1+3+4, organism subset 2, template subset 1, onboarding screen) + screenshot capture protocol

**Task ID:** UI-061
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** frontend-designer
**Reviewer:** frontend-designer
**Estimate:** 240 min
**Type:** [FEATURE] [INFRA]
**Status:** Planned
**Phase:** Design / Sandbox Planning
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `design` slice for `Define phase-1 fidelity scenario set (atom subset 1, molecule subsets 1+3+4, organism subset 2, template subset 1, onboarding screen) + screenshot capture protocol`.

**Objective:** Define the exact phase-1 fidelity scenario set and capture protocol so reviewer tasks can produce deterministic variance reports.

**Success State:** UI-062 and UI-063 can run against an explicit scenario list with fixed fixtures, fixed device expectations, and clear diff-report rules.

## CRITICAL CONSTRAINTS

### MUST
- Select the explicit phase-1 scenario IDs called out by the sprint and tie each one to deterministic fixtures.
- Define diff-report severity rules for token mismatches, layout shifts, and missing states.

### NEVER
- Include auth-, backend-, or network-dependent scenarios.

### STRICTLY
- Capture both light and dark mode unless a scenario-specific waiver is documented.

## DELIVERABLES

- .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** A baseline scenario registry exists and Sprint 2 defines the required verification slice.
**WHEN** The phase-1 set is selected.
**THEN** The exact scenario IDs for atom subset 1, molecule subsets 1+3+4, organism subset 2, template subset 1, and onboarding screens are documented.
**Verify:** `rg -n "UI-061|phase-1 fidelity" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

### AC-2
**GIVEN** Reviewer capture must be deterministic.
**WHEN** Fixtures and device assumptions are defined.
**THEN** Every selected scenario has fixed fixture data, theme mode requirements, and stable device or simulator assumptions.
**Verify:** `rg -n "deterministic|fixtures|light and dark" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md .spec/prds/native-rewrite/08d-component-parity-spec.md`

### AC-3
**GIVEN** Diffs will include both valid and invalid variance.
**WHEN** Report rules are defined.
**THEN** Token mismatches, layout shifts, missing states, and accessibility regressions are treated as failures and documented by scenario ID.
**Verify:** `rg -n "variance report|Token consumption|Visual parity|Accessibility" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md .spec/prds/native-rewrite/08d-component-parity-spec.md`

### AC-4
**GIVEN** Android and iOS reviewers must run the same protocol.
**WHEN** Capture prerequisites are frozen.
**THEN** UI-062 and UI-063 can execute the same scenario list, output naming, and report shape without ambiguity.
**Verify:** `rg -n "UI-062|UI-063" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The exact scenario IDs for atom subset 1, molecule subsets 1+3+4, organism subset 2, template subset 1, and onboarding screens are documented. | `rg -n "UI-061\|phase-1 fidelity" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-2 | AC-2 | Every selected scenario has fixed fixture data, theme mode requirements, and stable device or simulator assumptions. | `rg -n "deterministic\|fixtures\|light and dark" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-3 | AC-3 | Token mismatches, layout shifts, missing states, and accessibility regressions are treated as failures and documented by scenario ID. | `rg -n "variance report\|Token consumption\|Visual parity\|Accessibility" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-4 | AC-4 | UI-062 and UI-063 can execute the same scenario list, output naming, and report shape without ambiguity. | `rg -n "UI-062\|UI-063" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-5 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm typecheck && pnpm lint` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `react-native/styles/theme.ts`

## GUARDRAILS

### WRITE-ALLOWED
- .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/**

### WRITE-PROHIBITED
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

**Reference:** `.spec/prds/native-rewrite/08-design-system.md`

**Pattern:** Lock design-system contracts before native implementation so every downstream task can reference the same token and scenario source of truth.

**Anti-pattern:** Allow token, scenario, or parity rules to drift during component translation.

## DESIGN NOTES

- Select the exact phase-1 scenario IDs called out by the sprint and bind each one to fixed fixtures.
- Define diff failure rules for token mismatches, layout shifts, missing states, and accessibility regressions.
- Require light and dark capture unless a scenario-specific waiver is documented.

## VERIFICATION GATES

- pnpm lint
- pnpm typecheck
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- None

## CODING STANDARDS

- .spec/prds/native-rewrite/08d-component-parity-spec.md — naming, interface, token, state, animation, accessibility, keyboard, and RTL parity
- .spec/prds/native-rewrite/08-design-system.md — token generation and consumption rules
- ~/Projects/brain/docs/TDD-METHODOLOGY.md — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- Feature wiring beyond sandbox-ready component translation.
- Changes to unrelated sprints or backend and server code.
