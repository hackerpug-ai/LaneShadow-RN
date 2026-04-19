================================================================================
TASK: PRE-002 - Complete iOS Theme Accessors (motion, opacity)
================================================================================

TASK_TYPE: FEATURE
STATUS: Backlog
PRIORITY: P0
EFFORT: M
ESTIMATE: 120 min
AGENT: swift-implementer
SPRINT: sprint-01a-foundation-rewrite

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Wire iOS theme structs for motion and opacity to the public Theme aggregate, completing the missing token categories that FND-007 defined but never exposed to SwiftUI views.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift (MODIFY): Add motion/opacity structs and wire to Theme aggregate
- iOS theme module compiles with all token categories exposed
- Sandbox swatch story renders opacity tokens successfully

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] ThemeMotion struct added with duration + easing accessors
- [ ] ThemeOpacity struct added with all 12 opacity steps
- [ ] Theme aggregate includes motion and opacity fields
- [ ] buildMotion() and buildOpacity() builder methods implemented
- [ ] Sandbox opacity swatch story compiles and renders
- [ ] `swift build` in tokens/platforms/swift exits 0

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Implementing view code that uses motion/opacity
- Creating sandbox stories for motion (opacity swatch done by PRE-004)
- Refactoring existing color/space/radius accessors

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- Wire motion, opacity by following existing buildColor/buildSpace/buildRadius patterns
- Use ThemeSchema.swift motion/opacity DTOs already defined in FND-007
- Export via Theme struct aggregate initialization
- Match naming: ThemeMotion, ThemeOpacity
- Keep API consistent with color/space/radius (direct property access)

MUST NOT:
- Use getter methods instead of struct properties
- Hardcode motion/opacity values
- Modify existing color/space/radius accessors
- Break backward compatibility

STRICTLY:
- Follow 08e-cross-platform-theme-module.md token pipeline
- Reuse builder patterns from existing buildElevation implementation
- Verify Swift builds without errors

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Expose all FND-007 token categories to iOS views by completing the theme builder methods and wiring motion/opacity to the Theme aggregate.

**Current state**: ThemeSchema.swift has motion/opacity value structs defined but Theme.swift doesn't expose them.

**Target state**: Views can access motion via `@Environment(\.theme).motion.durationMs`, opacity via `@Environment(\.theme).opacity.step08`.

**Success looks like**: `swift build` in tokens/platforms/swift exits 0 and a debug opacity swatch renders without error.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Motion accessor implemented
  GIVEN: ThemeSchema.swift has motion token values from FND-007
  WHEN: The agent adds ThemeMotion struct and buildMotion() method
  THEN: Theme aggregate includes `let motion: ThemeMotion`
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-2: Opacity accessor implemented
  GIVEN: ThemeSchema.swift has opacity token values from FND-007
  WHEN: The agent adds ThemeOpacity struct with 12 steps and buildOpacity() method
  THEN: Theme aggregate includes `let opacity: ThemeOpacity`
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-3: Builder methods added
  GIVEN: Token values exist in schema
  WHEN: The agent adds buildMotion() and buildOpacity() methods
  THEN: Methods follow existing builder patterns (color, space, radius)
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-4: Swift build succeeds
  GIVEN: All accessors are wired
  WHEN: Agent runs `cd tokens/platforms/swift && swift build`
  THEN: Build exits 0 with no type errors
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-5: App compiles with new accessors
  GIVEN: Theme module builds successfully
  WHEN: Agent builds iOS app
  THEN: `xcodebuild -scheme LaneShadow -configuration Debug build` exits 0
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift
   - Lines: ALL
   - Focus: Theme struct definition and builder methods

2. tokens/platforms/swift/Sources/LaneShadowTheme/ThemeSchema.swift
   - Lines: ALL (motion, opacity value structs)
   - Focus: DTO structure from FND-007

3. .spec/prds/native-rewrite/08e-cross-platform-theme-module.md
   - Sections: Token pipeline, accessor patterns
   - Focus: Consistent API design across platforms

4. tokens/semantic/semantic.tokens.json
   - Sections: motion, opacity token definitions
   - Focus: Available token values to expose

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift (MODIFY)

WRITE-PROHIBITED:
- ThemeSchema.swift — read-only, DTOs already defined
- iOS app views — no implementation code
- Any other theme files

MUST:
- [ ] Add two new structs (ThemeMotion, ThemeOpacity)
- [ ] Add builder methods (buildMotion, buildOpacity)
- [ ] Wire via Theme aggregate
- [ ] Mirror patterns from buildColor/buildSpace/buildRadius

MUST NOT:
- [ ] Use getter methods instead of properties
- [ ] Hardcode token values
- [ ] Modify existing color/space/radius accessors

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** FND-007 added token definitions to semantic.tokens.json but iOS theme module is incomplete.

**Why now:** Sprint 2 tasks assume all token categories are accessible. Views can't reference motion/opacity tokens without this accessor layer.

**Platform parity:** PRE-001 completes the same work for Android (elevation, motion, opacity).

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

AGENT: swift-implementer

1. READ Theme.swift and identify the Theme struct and builder methods
2. READ ThemeSchema.swift and locate motion and opacity value structs
3. MODEL existing builders (buildColor, buildSpace, buildRadius, buildElevation)
4. ADD ThemeMotion struct with all motion token accessors
5. ADD ThemeOpacity struct with all opacity steps
6. ADD buildMotion() and buildOpacity() methods following existing pattern
7. WIRE both to Theme aggregate initialization
8. RUN `cd tokens/platforms/swift && swift build` and verify exits 0
9. RUN iOS app build and verify Xcode build succeeds
10. COMMIT with message: "PRE-002: Complete iOS theme accessors (motion, opacity)"

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- FND-007 — Token definitions exist

Blocks:
- PRE-004 — iOS sandbox infrastructure depends on complete theme module
- All Sprint 2 iOS UI tasks

