================================================================================
TASK: PRE-001 - Complete Android Theme Accessors (elevation, motion, opacity)
================================================================================

TASK_TYPE: FEATURE
STATUS: Complete
PRIORITY: P0
EFFORT: M
ESTIMATE: 120 min
AGENT: kotlin-implementer
SPRINT: sprint-01a-foundation-rewrite

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Wire Android theme DTOs for elevation, motion, and opacity to the public theme accessor, completing the missing token categories that FND-007 defined but never exposed to components.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/LaneShadowTheme.kt (MODIFY): Wire elevation, motion, opacity data classes + builder functions
- Android theme module compiles with all token categories exposed
- Sandbox swatch story renders elevation tokens successfully

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] LaneShadowElevation data class added with all 4-5 elevation levels
- [ ] LaneShadowMotion data class added with duration + easing accessors
- [ ] LaneShadowOpacity data class added with all 12 opacity steps
- [ ] laneShadowThemeValues() function wires all three new accessor fields
- [ ] CompositionLocal injection includes new accessors
- [ ] Sandbox elevation swatch story compiles and renders LocalLaneShadowTheme.current.elevation.level2
- [ ] `./android/gradlew :theme:build` exits 0

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Implementing component code that uses elevation/motion/opacity
- Creating sandbox stories for motion or opacity (elevation swatch done by PRE-003)
- Refactoring existing color/space/radius accessors

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- Wire elevation, motion, opacity by mimicking existing space/radius accessor pattern
- Use ThemeSchema.kt elevation/motion/opacity DTOs already defined in FND-007
- Export via laneShadowThemeValues() return aggregate
- Match existing naming: LaneShadowElevation, LaneShadowMotion, LaneShadowOpacity
- Keep accessor API consistent with color/space/radius (direct property access, not methods)

MUST NOT:
- Add ad-hoc getters/methods instead of data class fields
- Hardcode elevation/motion/opacity values
- Modify existing color/space/radius accessors
- Break backward compatibility with existing theme consumers

STRICTLY:
- Follow 08e-cross-platform-theme-module.md token pipeline
- Reuse builder patterns from existing radiusValues() / spaceValues() implementations
- Verify Gradle builds without errors

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Expose all FND-007 token categories to Android components by completing the theme accessor data classes and wiring them to the CompositionLocal.

**Current state**: ThemeSchema.kt has ElevationModesDto, MotionValuesDto, OpacityValuesDto defined but unused. LaneShadowTheme.kt only exposes colors, space, radius, type.

**Target state**: Components can access elevation via `LocalLaneShadowTheme.current.elevation.level2`, motion via `LocalLaneShadowTheme.current.motion.durationMs`, opacity via `LocalLaneShadowTheme.current.opacity.step08`.

**Success looks like**: `pnpm tokens:sync && ./android/gradlew :app:compileDebugKotlin` exits 0 and a debug elevation swatch renders without error.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Elevation accessor implemented
  GIVEN: ThemeSchema.kt has ElevationModesDto from FND-007
  WHEN: The agent adds LaneShadowElevation data class and builder
  THEN: Theme aggregate includes `val elevation: LaneShadowElevation`
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-2: Motion accessor implemented
  GIVEN: ThemeSchema.kt has MotionValuesDto from FND-007
  WHEN: The agent adds LaneShadowMotion data class with duration/easing fields
  THEN: Theme aggregate includes `val motion: LaneShadowMotion`
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-3: Opacity accessor implemented
  GIVEN: ThemeSchema.kt has OpacityValuesDto from FND-007
  WHEN: The agent adds LaneShadowOpacity data class with 12 opacity steps
  THEN: Theme aggregate includes `val opacity: LaneShadowOpacity`
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-4: Gradle build succeeds
  GIVEN: All accessors are wired
  WHEN: Agent runs `./android/gradlew :theme:build`
  THEN: Build exits 0 with no type errors
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-5: App compiles with new accessors
  GIVEN: Theme module builds successfully
  WHEN: Agent compiles Android app
  THEN: `./android/gradlew :app:compileDebugKotlin` exits 0
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/LaneShadowTheme.kt
   - Lines: ALL
   - Focus: laneShadowThemeValues() function and CompositionLocal setup

2. tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/ThemeSchema.kt
   - Lines: ALL (ElevationModesDto, MotionValuesDto, OpacityValuesDto)
   - Focus: DTO structure from FND-007

3. .spec/prds/native-rewrite/08e-cross-platform-theme-module.md
   - Sections: Token pipeline, accessor patterns
   - Focus: Consistent API design across platforms

4. tokens/semantic/semantic.tokens.json
   - Sections: elevation, motion, opacity token definitions
   - Focus: Available token values to expose

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/LaneShadowTheme.kt (MODIFY)

WRITE-PROHIBITED:
- ThemeSchema.kt — read-only, DTOs already defined
- Android app components — no implementation code
- Any other theme files

MUST:
- [ ] Add three new data classes (Elevation, Motion, Opacity)
- [ ] Wire via laneShadowThemeValues() function
- [ ] Mirror builder patterns from existing accessors
- [ ] Build and verify no type errors

MUST NOT:
- [ ] Add ad-hoc getters instead of data class fields
- [ ] Hardcode token values
- [ ] Modify existing color/space/radius accessors

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** FND-007 added token definitions to semantic.tokens.json and DTOs to ThemeSchema.kt, but the Android theme module doesn't expose them.

**Why now:** Sprint 2 tasks assume all token categories are accessible. Components can't reference elevation/motion/opacity tokens without this accessor layer.

**Platform parity:** FND-002 completes the same work for iOS (motion, opacity).

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

AGENT: kotlin-implementer

1. READ LaneShadowTheme.kt and identify the laneShadowThemeValues() function
2. READ ThemeSchema.kt and locate ElevationModesDto, MotionValuesDto, OpacityValuesDto
3. MODEL existing builders (colorValues, spaceValues, radiusValues) to understand pattern
4. ADD LaneShadowElevation, LaneShadowMotion, LaneShadowOpacity data classes
5. ADD builder functions following existing pattern
6. WIRE all three to laneShadowThemeValues() return aggregate
7. RUN `./android/gradlew :theme:build` and verify exits 0
8. RUN `./android/gradlew :app:compileDebugKotlin` and verify exits 0
9. COMMIT with message: "PRE-001: Complete Android theme accessors (elevation, motion, opacity)"

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- FND-007 — Token definitions and DTOs exist

Blocks:
- PRE-003 — Android sandbox infrastructure depends on complete theme module
- All Sprint 2 Android UI tasks

