# TASK: AUTH-S03-R01 - Missing Auth Component Inventory and Cross-Platform Story Contract

TASK_TYPE: DESIGN_SYSTEM
STATUS: Completed
PRIORITY: P0
EFFORT: S
AGENT: implementer=swift-planner + kotlin-planner | reviewer=swift-reviewer + kotlin-reviewer
SPRINT: sprint-03-auth-design-e2e-remediation
ESTIMATE: 90 min

## Outcome

Produce the authoritative native auth component gap inventory and story ID contract that R02-R05 must implement.

## Critical Constraints

- MUST treat `.spec/design/system/views/auth/auth-screen.html` as the visual source of truth.
- MUST identify atom, molecule, and template gaps separately for iOS and Android.
- MUST define the same sandbox story IDs for both platforms.
- NEVER accept a platform-only story unless `tokens/sandbox/parity-exemptions.json` explains it.
- STRICTLY distinguish "component exists" from "component satisfies the AuthScreen recipe and states."

## Specification

Objective: create a checked-in remediation inventory that lists every missing auth primitive, molecule, view state, story ID, and evidence requirement before implementation resumes.

Success state: `AUTH-S03-R01-component-contract.md` exists in this sprint folder and is specific enough for R02-R08 to execute without rediscovering the design gap.

## Acceptance Criteria

AC-1: Missing component inventory is explicit
GIVEN the design composes `ls-btn`, `ls-input`, `ls-divider`, `ls-icon`, `ls-spinner`, `ls-card`, `mol-form-field`, and `mol-social-btn`
WHEN the inventory is written
THEN it lists each native iOS and Android implementation gap by file path and state.
VERIFY: `test -f .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md && rg "LSIcon|LSDivider|LSSpinner|LSAuthProviderButton|AuthScreen" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`

AC-2: Story IDs are canonical and cross-platform
GIVEN the component parity rules in `RULES.md`
WHEN the story contract is written
THEN every auth atom, molecule, and template variant has a lowercase dot-separated ID shared by iOS and Android.
VERIFY: `rg "molecules.auth-provider-button.apple|templates.auth-screen.email-entry|templates.auth-screen.dark" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`

AC-3: Design references are threaded
GIVEN AuthScreen has authoritative HTML and README files
WHEN the inventory maps work to tasks
THEN each R02-R08 task has a design source reference and expected screenshot/evidence source.
VERIFY: `rg ".spec/design/system/views/auth/auth-screen.html|molecules/social-button/README.md" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`

AC-4: Existing weak tests are called out
GIVEN current iOS tests render view models but do not perform the human gate
WHEN the inventory defines evidence gaps
THEN it identifies which current tests are support-only and which missing WDA/device steps R08 must add.
VERIFY: `rg "support-only|WDA|human test" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`

## Test Criteria

| ID | Boolean Statement | Maps To AC | Verify |
|---|---|---|---|
| TC-1 | The component contract names every AuthScreen atom and molecule from the design source. | AC-1 | `rg "ls-btn|ls-input|ls-divider|ls-icon|ls-spinner|mol-social-btn" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md` |
| TC-2 | The component contract defines shared iOS and Android story IDs. | AC-2 | `rg "templates.auth-screen" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md` |
| TC-3 | The component contract links the HTML AuthScreen source. | AC-3 | `rg "auth-screen.html" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md` |
| TC-4 | The component contract labels render-only tests as support-only. | AC-4 | `rg "support-only" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md` |

## Reading List

- `.spec/design/system/views/auth/auth-screen.html` - authoritative view.
- `.spec/design/system/views/auth/README.md` - variants, anatomy, accessibility.
- `.spec/design/system/molecules/social-button/README.md` - OAuth button recipe.
- `RULES.md` - component parity and real-device E2E policy.

## Guardrails

write_allowed:
- `.spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md` (CREATE)

write_prohibited:
- `ios/**` - implementation belongs to R02/R04/R06.
- `android/**` - implementation belongs to R03/R05/R07.
- `.spec/design/system/**` - design source is already authored.

## Design

references:
- `.spec/design/system/views/auth/auth-screen.html`
- `.spec/design/system/views/auth/README.md`
- `.spec/design/system/molecules/social-button/README.md`

pattern: Treat the HTML component list as the contract, then map each class to native atom/molecule/template files and sandbox story IDs.
pattern_source: `.spec/design/system/views/auth/README.md`
anti_pattern: Planning from the existing native SignInScreen appearance instead of the design source.

## Verification Gates

- Component contract exists: `test -f .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`
- Snapshot parity commands listed: `rg "pnpm snapshots:check|pnpm snapshots:parity-coverage" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`

## Dependencies

depends_on: []
blocks: [AUTH-S03-R02, AUTH-S03-R03, AUTH-S03-R04, AUTH-S03-R05, AUTH-S03-R08]

## Reviewer Verification (2026-04-29)

- AC-1 PASS: Contract inventory lists concrete iOS + Android file paths and missing states (evidence: `.spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`:52, 63-64).
- AC-2 PASS: Story IDs are canonical (lowercase dot-separated) and explicitly shared across iOS + Android (evidence: `.spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`:81, 86).
- AC-3 PASS: R02-R08 table threads design sources (`auth-screen.html`, `social-button/README.md`) and expected evidence outputs (evidence: `.spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`:19-21, 98-107).
- AC-4 PASS: Weak tests are labeled support-only and the WDA/human gate is called out for R08 (evidence: `.spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md`:50, 115-120, 124).
- Baseline gates: `pnpm type-check:native` and `pnpm lint` fail due to missing generated Convex modules and missing `node_modules`/`biome`; reproduced as pre-existing in `.tmp/AUTH-S03-R01/pre-existing-issues.md`.
- Implementation commit: `fe7d3f57de1bddec259c1c80f8792c3c411e48fe`; merged via `main`.
- Reviewers: `swift-reviewer` and `kotlin-reviewer`.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"GIVEN the design composes auth atoms and molecules WHEN the inventory is written THEN it lists each native iOS and Android implementation gap by file path and state.","verify":"test -f .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md && rg \"LSIcon|LSDivider|LSSpinner|LSAuthProviderButton|AuthScreen\" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md"},
{"id":"AC-2","type":"acceptance_criterion","description":"GIVEN component parity rules WHEN the story contract is written THEN every auth variant has a shared iOS and Android story ID.","verify":"rg \"molecules.auth-provider-button.apple|templates.auth-screen.email-entry|templates.auth-screen.dark\" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md"},
{"id":"AC-3","type":"acceptance_criterion","description":"GIVEN AuthScreen design sources WHEN the inventory maps work to tasks THEN each remediation task has a design source reference.","verify":"rg \".spec/design/system/views/auth/auth-screen.html|molecules/social-button/README.md\" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md"},
{"id":"AC-4","type":"acceptance_criterion","description":"GIVEN current weak tests WHEN evidence gaps are documented THEN support-only tests and missing WDA/device steps are identified.","verify":"rg \"support-only|WDA|human test\" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md"},
{"id":"TC-1","type":"test_criterion","description":"The component contract names every AuthScreen atom and molecule from the design source.","maps_to_ac":"AC-1","verify":"rg \"ls-btn|ls-input|ls-divider|ls-icon|ls-spinner|mol-social-btn\" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md"},
{"id":"TC-2","type":"test_criterion","description":"The component contract defines shared iOS and Android story IDs.","maps_to_ac":"AC-2","verify":"rg \"templates.auth-screen\" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md"},
{"id":"TC-3","type":"test_criterion","description":"The component contract links the HTML AuthScreen source.","maps_to_ac":"AC-3","verify":"rg \"auth-screen.html\" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md"},
{"id":"TC-4","type":"test_criterion","description":"The component contract labels render-only tests as support-only.","maps_to_ac":"AC-4","verify":"rg \"support-only\" .spec/prds/v3-integration/tasks/sprint-03-auth-design-e2e-remediation/AUTH-S03-R01-component-contract.md"}
]}
-->
