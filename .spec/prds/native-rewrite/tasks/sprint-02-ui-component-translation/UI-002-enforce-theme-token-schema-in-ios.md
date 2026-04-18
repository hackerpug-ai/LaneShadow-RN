# UI-002: Enforce theme token schema in iOS

**Task ID:** UI-002
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 360 min
**Type:** [FEATURE] [INFRA]
**Status:** Planned
**Phase:** Foundation — Token Enforcement
**Quality Score:** 115/115

---

## BACKGROUND

UI-001 defines `tokens/theme.schema.json` and `tokens/theme.json` as the single semantic token contract. This task makes that contract **enforced in the iOS app**: tokens are parsed from `tokens/theme.json`, validated against the schema at build time, and exposed to SwiftUI as a strongly-typed `Theme` API. Any drift between `tokens/theme.json` and the iOS `Theme` surface fails the iOS build before any component task can begin.

**Objective:** Make the JSON schema authoritative on iOS — at build time, at type-check time, and at runtime.

**Success State:** A reviewer can mutate `tokens/theme.json` (add/remove/rename a token) and the iOS build either updates automatically or fails with a clear schema-drift error; SwiftUI screens consume tokens exclusively through the typed `Theme` namespace.

## CRITICAL CONSTRAINTS

### MUST
- Add an Xcode build phase (or SwiftPM plugin) that runs `pnpm tokens:validate` and fails the build on validation failure.
- Generate a Swift `Theme` namespace from `tokens/theme.json` (color, spacing, typography, radius, elevation, motion, opacity), wired to light/dark via `ColorScheme`.
- Reject hardcoded UI primitives via a SwiftLint custom rule (or equivalent linter) covering color literals, magic numbers in padding/spacing, and `Color(hex:)`-style constructors outside the generated `Theme` file.
- Provide an iOS unit test that asserts every key in `tokens/theme.json` is reachable through the `Theme` API.

### NEVER
- Hand-edit the generated `Theme.swift` file — it must be regenerated from `tokens/theme.json`.
- Define iOS-only token names that diverge from the JSON contract.
- Skip the build-time schema validation phase.

### STRICTLY
- Any platform-specific value (e.g., SF Symbol fallback) must be expressed as an explicit waiver inside the generated `Theme` extension, not as a divergent token name.

## DELIVERABLES

- `ios/LaneShadow/DesignSystem/Theme.generated.swift`
- `ios/LaneShadow/DesignSystem/Theme+SwiftUI.swift` (typed accessors)
- `ios/scripts/generate-theme.swift` (or Node) — generator
- `ios/scripts/validate-theme.sh` — wraps `pnpm tokens:validate` for the build phase
- `ios/.swiftlint.yml` — custom rules forbidding raw color/number literals in non-Theme files
- `ios/LaneShadowTests/ThemeContractTests.swift`
- Xcode project: pre-build phase wired to validation + generation

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** UI-001 produced `tokens/theme.json` and `tokens/theme.schema.json`.
**WHEN** The iOS app is built.
**THEN** A pre-build phase runs `pnpm tokens:validate` and fails the build on validation error.
**Verify:** `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -showBuildSettings 2>/dev/null | rg -n "tokens:validate" || rg -n "tokens:validate" ios/LaneShadow.xcodeproj/project.pbxproj ios/scripts/`

### AC-2
**GIVEN** Tokens are the single source of truth.
**WHEN** `Theme.generated.swift` is produced.
**THEN** Every key in `tokens/theme.json` is reachable through the typed `Theme` namespace, with light/dark color variants resolved via `ColorScheme`.
**Verify:** `cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -only-testing:LaneShadowTests/ThemeContractTests`

### AC-3
**GIVEN** Sprint 2 forbids hardcoded UI primitives.
**WHEN** Lint runs against the iOS source tree.
**THEN** Color literals, hex constructors, and magic spacing values are flagged outside the generated Theme file.
**Verify:** `cd ios && swiftlint lint --strict --config .swiftlint.yml`

### AC-4
**GIVEN** The generator must be reproducible.
**WHEN** `tokens/theme.json` changes.
**THEN** Re-running the generator produces a deterministic `Theme.generated.swift` whose key set matches the JSON exactly (no orphan members, no missing members).
**Verify:** `bash ios/scripts/validate-theme.sh && bash ios/scripts/generate-theme.sh && git diff --exit-code ios/LaneShadow/DesignSystem/Theme.generated.swift`

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | Build phase runs schema validation and fails on drift. | `rg -n "tokens:validate" ios/LaneShadow.xcodeproj/project.pbxproj ios/scripts/` |
| TC-2 | AC-2 | Every JSON token key is reachable through the typed Theme API. | `cd ios && xcodebuild test -project LaneShadow.xcodeproj -scheme LaneShadow -only-testing:LaneShadowTests/ThemeContractTests` |
| TC-3 | AC-3 | SwiftLint forbids raw literals outside the Theme file. | `cd ios && swiftlint lint --strict --config .swiftlint.yml` |
| TC-4 | AC-4 | Generator output is deterministic and matches the JSON key set. | `bash ios/scripts/generate-theme.sh && git diff --exit-code ios/LaneShadow/DesignSystem/Theme.generated.swift` |
| TC-5 | ALL | iOS build remains green after enforcement is wired up. | `cd ios && xcodebuild -scheme LaneShadow build` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-001-define-theme-token-json-schema.md`
4. `.spec/prds/native-rewrite/08-design-system.md`
5. `.spec/prds/native-rewrite/08c-ios-component-map.md`
6. `.spec/prds/native-rewrite/08d-component-parity-spec.md`

## GUARDRAILS

### WRITE-ALLOWED
- `ios/**`
- `tokens/README.md` (iOS section only)

### WRITE-PROHIBITED
- `tokens/theme.schema.json` (owned by UI-001)
- `tokens/theme.json` (owned by UI-001)
- `android/**`
- `server/**`
- `react-native/**`

### MUST
- Wire the build phase so token drift fails iOS compilation, not just at runtime.
- Keep the generator deterministic — same JSON in, same Swift out.

### MUST NOT
- Do not introduce iOS-only token names.
- Do not allow raw color/spacing literals in non-Theme files.

## CODE PATTERN

**Reference:** `.spec/prds/native-rewrite/08c-ios-component-map.md`

**Pattern:** `tokens/theme.json` → `ios/scripts/generate-theme.swift` → `Theme.generated.swift` exposing `enum Theme { enum Color { static func surfaceBackground(_ scheme: ColorScheme) -> Color }; enum Spacing { static let scale4: CGFloat } ... }`. SwiftUI consumers reference `Theme.Color.surfaceBackground(colorScheme)`.

**Anti-pattern:** Static color extensions defined ad hoc per view, hex literals, or duplicate enums per feature module.

## DESIGN NOTES

- Use `Color(red:green:blue:opacity:)` from validated JSON values; never `Color(hex:)`.
- Resolve light/dark via `@Environment(\.colorScheme)` in the typed accessor layer; do not branch in views.
- Keep the generator small (one file) and run it as a pre-build script — no SwiftPM plugin gymnastics required.

## VERIFICATION GATES

- `pnpm tokens:validate`
- `bash ios/scripts/generate-theme.sh`
- `cd ios && swiftlint lint --strict --config .swiftlint.yml`
- `cd ios && xcodebuild -scheme LaneShadow build`
- `cd ios && xcodebuild test -only-testing:LaneShadowTests/ThemeContractTests`

## DEPENDENCIES

- UI-001

## CODING STANDARDS

- `.spec/prds/native-rewrite/08d-component-parity-spec.md` — token consumption rules
- `.spec/prds/native-rewrite/08-design-system.md` — schema contract
- `~/Projects/brain/docs/TDD-METHODOLOGY.md` — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- Android enforcement (UI-002B).
- Component translation (Phase B onward).
- React Native consumption refactor.
