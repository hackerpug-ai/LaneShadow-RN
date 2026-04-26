# UC-SBX-01-ios: Story registry + tier aggregation + parity manifest (finalize) — iOS

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** swift-implementer
**Estimate:** 240 min
**Type:** INFRA
**Status:** Backlog
**Priority:** P0
**Effort:** L
**PRD Refs:** UC-SBX-01

---

## Background

Finalize the iOS sandbox story registry to aggregate all six ComponentTier enums into `LaneShadowSandboxEntry`, normalize every story id to dotted notation, and author the cross-platform parity manifest plus iOS introspection script that powers `pnpm sandbox:parity-check`. Wires native-sandbox `Story`/`SandboxRoot` API into LaneShadow's tier aggregation pattern.

## Critical Constraints

**MUST:**
- Aggregate exactly six tier enums (Atom, Molecule, Organism, Template, Modifier, Infrastructure) inside `LaneShadowSandboxEntry.makeRootView()` per RULES §6 — ComponentTier is fixed at 6 values.
- Each tier file (`AtomStories.swift`, etc.) MUST be a pure reducer over per-component story files; no inline story declarations in tier aggregators.
- Every story `id` MUST follow `{tier}.{component}.{variant}` dot notation (lowercased, hyphen-delimited variant).
- Author `tokens/sandbox/stories.parity.json` with the canonical schema `{ shared: [...], ios_only: [...], android_only: [...] }` and emit a Swift introspection script that can list every registered iOS story id.
- Register the host-side `infrastructure.registry.*` stories under `InfrastructureStories.all` for self-documentation of the registry itself.

**NEVER:**
- Modify `~/Projects/native-sandbox/**` — it is an external SPM dependency.
- Extend `ComponentTier` beyond the six PRD-fixed values (atom, molecule, organism, template, modifier, infrastructure).
- Declare story IDs that do not match `^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]+$`.
- Add story IDs to `stories.parity.json#shared` without confirming an Android counterpart exists.
- Touch any path under `android/**`, `react-native/**`, or `tokens/platforms/swift/Sources/LaneShadowTheme/**`.

**STRICTLY:**
- `LaneShadowStories.all` must be the single concatenation source consumed by `SandboxRoot(stories:)`.
- `pnpm sandbox:parity-check` must exit 0 against the new manifest before this task ships.
- All tier aggregator files compile when `*Stories.all` is empty (sandbox boots with zero stories cleanly).

## Specification

**Objective:** Finalize the iOS sandbox story registry to aggregate all six ComponentTier enums into `LaneShadowSandboxEntry`, normalize every story id to dotted notation, and author the cross-platform parity manifest plus iOS introspection script that powers `pnpm sandbox:parity-check`.

**Success State:** Opening the iOS sandbox renders the unified six-tier story tree from `LaneShadowStories.all`; every story id matches `{tier}.{component}.{variant}`; `tokens/sandbox/stories.parity.json` is checked in; and `pnpm sandbox:parity-check` exits 0 confirming iOS-side coverage equals the shared manifest minus the `ios_only` allow-list.

## Acceptance Criteria

### AC-1 — Six-tier aggregation in entry
- **GIVEN** A developer opens `ios/LaneShadow/Sandbox/LaneShadowSandboxEntry.swift`
- **WHEN** They locate `LaneShadowSandboxEntry.makeRootView()` (or the body wiring `SandboxRoot(stories:)`)
- **THEN** They find a single concatenation of `AtomStories.all + MoleculeStories.all + OrganismStories.all + TemplateStories.all + ModifierStories.all + InfrastructureStories.all` passed to `SandboxRoot(stories:themeController:previewWrapper:)`
- **Verify:** Read `ios/LaneShadow/Sandbox/LaneShadowSandboxEntry.swift` + `LaneShadowStories.swift`; confirm all six tier enums exist and are concatenated
- **TDD State:** RED

### AC-2 — Tier aggregators are pure reducers
- **GIVEN** A developer opens `ios/LaneShadow/Sandbox/Stories/AtomStories.swift` (and each peer tier file)
- **WHEN** They inspect the body of `static var all: [Story]`
- **THEN** Each tier file ONLY concatenates per-component story files (e.g., `LSButtonStories.all + LSBadgeStories.all + …`); no `Story(...)` literal is declared inside a tier aggregator
- **Verify:** Grep `ios/LaneShadow/Sandbox/Stories/{Atom,Molecule,Organism,Template,Modifier,Infrastructure}Stories.swift` for `Story(` literals — zero matches expected
- **TDD State:** RED

### AC-3 — Dotted story-id convention
- **GIVEN** Any registered story across all six tiers
- **WHEN** A developer reads its `id:` value
- **THEN** The id matches `{tier}.{component}.{variant}` (lowercased, hyphen-delimited variant) — e.g., `atoms.button.primary`, `molecules.route-card.default`, `infrastructure.registry.parity-manifest`
- **Verify:** Run the iOS introspection script; pipe ids through a regex `^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]+$` and assert all match
- **TDD State:** RED

### AC-4 — Parity manifest authored
- **GIVEN** The repo at `tokens/sandbox/`
- **WHEN** A developer opens `tokens/sandbox/stories.parity.json`
- **THEN** They find a JSON object with `{ shared: string[], ios_only: string[], android_only: string[] }` listing every story id required on both platforms; `shared` includes every Navigator screen story id (`templates.idle.default`, `templates.planning.default`, `templates.routeResults.default`, `templates.routeDetails.default`, `templates.sessions.default`, `templates.error.default`)
- **Verify:** Read `tokens/sandbox/stories.parity.json`; assert schema and required screen ids
- **TDD State:** RED

### AC-5 — Parity check exits clean
- **GIVEN** The parity manifest and iOS introspection script are in place
- **WHEN** A developer runs `pnpm sandbox:parity-check`
- **THEN** The script collects iOS story ids via the iOS reflection script, compares to `shared ∪ ios_only`, and exits 0; an injected iOS-only id outside the allow-list causes a non-zero exit
- **Verify:** Run `pnpm sandbox:parity-check` → exit 0; temporarily add a synthetic id, rerun → non-zero exit; revert
- **TDD State:** RED

### AC-6 — Sandbox renders all registered stories
- **GIVEN** A developer launches `/native-sandbox --platform ios` (or `pnpm sandbox:ios`)
- **WHEN** The sandbox boots
- **THEN** Every story id present in `LaneShadowStories.all` appears in the tier-grouped sidebar and renders without crash when selected
- **Verify:** Launch `pnpm sandbox:ios`; visually confirm tier headings + at least one story per tier renders
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | LaneShadowStories.all contains stories from exactly six tiers | AC-1 | Unit test in `ios/LaneShadowTests/Sandbox/StoryRegistryTests.swift` asserts `Set(LaneShadowStories.all.map(\.tier)).count == 6` | unit |
| TC-2 | No tier aggregator declares Story literals directly | AC-2 | Lint test scans tier aggregator source files; asserts no `Story(` token appears | unit |
| TC-3 | Every story id matches dotted regex | AC-3 | Unit test iterates `LaneShadowStories.all` and asserts each `id` matches the dotted regex | unit |
| TC-4 | Parity manifest schema is valid and contains screen ids | AC-4 | Test loads `tokens/sandbox/stories.parity.json`, decodes into typed struct, asserts six required `templates.*` ids in `shared` | unit |
| TC-5 | pnpm sandbox:parity-check exits 0 on clean repo | AC-5 | CI-level shell verification — run `pnpm sandbox:parity-check`; assert exit code 0 | integration |

## Reading List

- `.spec/prds/v2/09-uc-sbx.md` lines `23-34` — UC-SBX-01 acceptance criteria — six-tier aggregation, dotted id convention, parity manifest schema
- `.spec/prds/v2/11-technical-requirements.md` lines `all` — Story / SandboxRoot / ComponentTier API surface and parity manifest contract
- `concepts/designs.html` lines `all` — REQUIRED READING — visual design source for this task
- `ios/LaneShadow/Sandbox/LaneShadowSandboxEntry.swift` lines `1-115` — Current entry — must be normalized to call `SandboxRoot(stories: LaneShadowStories.all, …)`
- `ios/LaneShadow/Sandbox/LaneShadowStories.swift` lines `all` — Top-level concatenation point for the six tier enums
- `ios/LaneShadow/Sandbox/Stories/` lines `all` — Tier aggregator files (Atoms/Molecules/Organisms exist; ensure Template/Modifier/Infrastructure are present)
- `~/Projects/native-sandbox/ios/Sources/NativeSandbox/Model/` lines `all` — READ-ONLY — `Story`, `ComponentTier`, `ArgValues` API the host must conform to
- `tokens/sandbox/` lines `all` — Authoring location for `stories.parity.json`
- `RULES.md` lines `§6, §10` — ComponentTier 6-value rule + argTypes contract

## Guardrails

**WRITE-ALLOWED:**
- `ios/LaneShadow/Sandbox/LaneShadowSandboxEntry.swift`
- `ios/LaneShadow/Sandbox/LaneShadowStories.swift`
- `ios/LaneShadow/Sandbox/Stories/AtomStories.swift`
- `ios/LaneShadow/Sandbox/Stories/MoleculeStories.swift`
- `ios/LaneShadow/Sandbox/Stories/OrganismStories.swift`
- `ios/LaneShadow/Sandbox/Stories/TemplateStories.swift`
- `ios/LaneShadow/Sandbox/Stories/ModifierStories.swift`
- `ios/LaneShadow/Sandbox/Stories/InfrastructureStories.swift`
- `ios/LaneShadow/Sandbox/Stories/Infrastructure/**`
- `ios/LaneShadowTests/Sandbox/StoryRegistryTests.swift`
- `tokens/sandbox/stories.parity.json`
- `scripts/sandbox/list-ios-story-ids.sh`

**WRITE-PROHIBITED:**
- `android/**`
- `react-native/**`
- `tokens/platforms/swift/Sources/LaneShadowTheme/**` — read only
- `~/Projects/native-sandbox/**` — external dep

## Code Pattern

**Reference:** Tier-aggregation reducer pattern (Storywright-derived): each tier enum is a pure reducer over per-component story files; the entry is a single concatenation site.

**Source:** PRD UC-SBX-01; existing iOS sandbox conventions in `ios/LaneShadow/Sandbox/Stories/`.

**Anti-Pattern:** Declaring `Story(...)` literals inside tier aggregators, declaring story ids without dotted notation, or bypassing `LaneShadowStories.all` to register stories ad hoc.

## Design

**References:**
- `concepts/designs.html`
- `.spec/prds/v2/09-uc-sbx.md#UC-SBX-01`

**Interaction Notes:**
- Sandbox root presents a tier-grouped sidebar (Atoms / Molecules / Organisms / Templates / Modifiers / Infrastructure).
- Selecting a story renders it inside `previewWrapper` with the live theme.
- No host UI changes beyond the entry view.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `swiftlint --quiet --strict` | Zero warnings, zero errors |
| build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build` | BUILD SUCCEEDED |
| unit-tests | `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | StoryRegistryTests pass; all id-regex assertions green |
| parity | `pnpm sandbox:parity-check` | Exit 0; iOS story set matches `shared ∪ ios_only` |
| sandbox-launch | `pnpm sandbox:ios` | Sandbox boots; six-tier sidebar renders; all stories selectable |

## Agent Assignment

**Agent:** swift-implementer

**Rationale:** Pure Swift sandbox infrastructure work — wires native-sandbox `Story`/`SandboxRoot` API into LaneShadow's tier aggregation pattern and authors the cross-platform parity manifest. swift-implementer owns all iOS sandbox host code under `ios/LaneShadow/Sandbox/**`.

## Coding Standards

- `brain/docs/swift-rules.md`
- `RULES.md §6 ComponentTier`
- `RULES.md §10 args`

## Dependencies

**Depends On:** _(none)_

**Blocks:** UC-SCR-01-ios, UC-SCR-02-ios, UC-SCR-03-ios, UC-SCR-04-ios, UC-SCR-05-ios, UC-SCR-06-ios, UC-SBX-02-ios, UC-SBX-03-ios, UC-SBX-06-ios

## TDD Workflow

1. **RED** — Write StoryRegistryTests asserting tier count, dotted ids, parity manifest schema
2. **GREEN** — Implement aggregator files, normalize ids, author manifest + introspection script
3. **REFACTOR** — Collapse duplication; clean
4. **VERIFY** — Run all five gates; commit only when green

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Six-tier aggregation in entry","verify":"manual + grep"},
{"id":"AC-2","type":"acceptance_criterion","description":"Tier aggregators are pure reducers","verify":"grep"},
{"id":"AC-3","type":"acceptance_criterion","description":"Dotted story-id convention","verify":"introspection regex"},
{"id":"AC-4","type":"acceptance_criterion","description":"Parity manifest authored","verify":"schema decode"},
{"id":"AC-5","type":"acceptance_criterion","description":"Parity check exits clean","verify":"shell"},
{"id":"AC-6","type":"acceptance_criterion","description":"Sandbox renders all registered stories","verify":"manual launch"},
{"id":"TC-1","type":"test_criterion","description":"Tier count == 6","verify":"unit","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"No Story literals in aggregators","verify":"unit","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"All ids match dotted regex","verify":"unit","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Manifest schema valid + screen ids present","verify":"unit","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"sandbox:parity-check exits 0","verify":"integration","maps_to_ac":"AC-5"}
]}
-->
