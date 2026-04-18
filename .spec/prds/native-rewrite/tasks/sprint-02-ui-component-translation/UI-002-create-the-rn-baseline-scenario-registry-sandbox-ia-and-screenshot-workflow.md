# UI-002: Create the RN baseline scenario registry, sandbox IA, and screenshot workflow

**Task ID:** UI-002
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** frontend-designer
**Reviewer:** frontend-designer
**Estimate:** 480 min
**Type:** [FEATURE] [INFRA]
**Status:** Planned
**Phase:** Design / Sandbox Planning
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `design` slice for `Create the RN baseline scenario registry, sandbox IA, and screenshot workflow`.

**Objective:** Create the authoritative RN scenario registry and screenshot-ready sandbox information architecture that Android and iOS must mirror.

**Success State:** A reviewer can browse a stable RN scenario registry with scenario IDs, atomic grouping, RN reference paths, and deterministic screenshot naming rules.

## CRITICAL CONSTRAINTS

### MUST
- Assign stable scenario IDs and atomic group paths to every RN baseline scenario.
- Display RN reference paths in sandbox UI and screenshot artifacts.
- Make screenshot capture deterministic through fixed fixtures and naming.

### NEVER
- Rely on manual browsing as the only way to find scenarios.
- Allow scenario grouping to drift from the atomic catalog.

### STRICTLY
- Scenario IDs must stay stable across RN, Android, and iOS.

## DELIVERABLES

- react-native/stories/**
- react-native/.rnstorybook/**
- react-native/app/storybook.tsx
- .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** RN stories exist under `react-native/stories/**`.
**WHEN** A baseline scenario registry is finalized.
**THEN** Every scenario has a stable ID, atomic grouping, RN reference path, theme coverage, and fixture metadata.
**Verify:** `test -d react-native/stories && find react-native/stories -type f | wc -l`

### AC-2
**GIVEN** Sprint 2 sandboxes must mirror the same catalog structure across platforms.
**WHEN** Sandbox IA is defined.
**THEN** Tokens, Atoms, Molecules, Organisms, Templates, and Screens groups are explicitly mapped and unambiguous.
**Verify:** `ls -1 react-native/stories`

### AC-3
**GIVEN** Reviewer capture tasks depend on deterministic outputs.
**WHEN** The screenshot workflow is specified.
**THEN** Scenario IDs, fixture keys, output names, and variance report rules are fixed for cross-platform capture.
**Verify:** `rg -n "screenshot|scenario|variance" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

### AC-4
**GIVEN** Android and iOS sandbox hosts need to consume the same registry.
**WHEN** Registry consumption rules are documented.
**THEN** Both native sandboxes can open a scenario by ID and display the RN reference path beside the rendered scenario.
**Verify:** `rg -n "RN reference registry|scenario" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | Every scenario has a stable ID, atomic grouping, RN reference path, theme coverage, and fixture metadata. | `test -d react-native/stories && find react-native/stories -type f \| wc -l` |
| TC-2 | AC-2 | Tokens, Atoms, Molecules, Organisms, Templates, and Screens groups are explicitly mapped and unambiguous. | `ls -1 react-native/stories` |
| TC-3 | AC-3 | Scenario IDs, fixture keys, output names, and variance report rules are fixed for cross-platform capture. | `rg -n "screenshot\|scenario\|variance" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Both native sandboxes can open a scenario by ID and display the RN reference path beside the rendered scenario. | `rg -n "RN reference registry\|scenario" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
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
- react-native/stories/**
- react-native/.rnstorybook/**
- react-native/app/storybook.tsx
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

**Reference:** `react-native/.rnstorybook/main.ts`

**Pattern:** Derive sandbox scenarios from the RN story inventory, then layer a stable registry with explicit IDs, atomic groups, and RN reference labels.

**Anti-pattern:** Maintain separate unsynchronized scenario lists for RN, Android, and iOS.

## DESIGN NOTES

- Assign stable scenario IDs and atomic group paths across RN, Android, and iOS.
- Display RN reference paths beside rendered scenarios and screenshot artifacts.
- Use deterministic fixtures and scenario-keyed screenshot naming from the start.

## VERIFICATION GATES

- pnpm client:storybook:generate
- pnpm client:storybook
- pnpm lint
- pnpm typecheck

## DEPENDENCIES

- UI-001
- .spec/prds/native-rewrite/08a-atomic-component-catalog.md
- .spec/prds/native-rewrite/08d-component-parity-spec.md

## CODING STANDARDS

- .spec/prds/native-rewrite/08d-component-parity-spec.md — naming, interface, token, state, animation, accessibility, keyboard, and RTL parity
- .spec/prds/native-rewrite/08-design-system.md — token generation and consumption rules
- ~/Projects/brain/docs/TDD-METHODOLOGY.md — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- Feature wiring beyond sandbox-ready component translation.
- Changes to unrelated sprints or backend and server code.
