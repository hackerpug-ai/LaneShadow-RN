================================================================================
TASK: UI-147 - IntentSearchSheet (Android)
================================================================================

TASK_TYPE: FEATURE
STATUS: Backlog
PRIORITY: P2
EFFORT: M
AGENT: kotlin-implementer
SPRINT: sprint-02-ui-component-translation

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Implement IntentSearchSheet component in Jetpack Compose following the translation matrix specification.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/components/atoms/IntentSearchSheet.kt (NEW): Jetpack Compose implementation
- react-native/android/app/src/test/java/com/laneshadow/components/ui/IntentSearchSheetTest.kt (NEW): Component tests

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Component renders in all variants/sizes/states specified in matrix
- [ ] All style properties match translation matrix (layout, typography, colors)
- [ ] Component accepts props matching RN wrapper API
- [ ] Tests cover visual regression and state changes
- [ ] Component documented with usage examples

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Business logic beyond presentation layer
- Network requests or data fetching
- State management (use uncontrolled props)
- Animations not specified in RN source

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Component renders in default state
  GIVEN: App is running and component is mounted
  WHEN: IntentSearchSheet is rendered with required props
  THEN: Component displays matching RN wrapper defaults

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: IntentSearchSheetTest.kt
  TEST_FUNCTION: testIntentSearchSheetDefaultRendering

AC-2: All style properties match matrix
  GIVEN: Translation matrix defines layout, typography, colors
  WHEN: Component is rendered in all variants
  THEN: Measured values match matrix (height, padding, radius, font-size)

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: IntentSearchSheetTest.kt
  TEST_FUNCTION: testIntentSearchSheetStylePropertiesMatchMatrix

AC-3: Component handles all states
  GIVEN: Component supports states (hover, pressed, disabled, error, loading)
  WHEN: Each state is triggered
  THEN: Visual feedback matches RN wrapper behavior

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: IntentSearchSheetTest.kt
  TEST_FUNCTION: testIntentSearchSheetStates

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. matrices/ui/organisms/IntentSearchSheet.md
   - Lines: ALL
   - Focus: TRANSLATION SOURCES and STYLE PROPERTIES MATRIX

2. react-native/components/ui/intentsearchsheet.tsx
   - Lines: ALL
   - Focus: Public API, props, variants, visual decisions

3. brain/docs/native/kotlin-compose-patterns.md
   - Sections: Component structure, state handling
   - Focus: Framework-specific patterns

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- android/app/src/main/java/com/laneshadow/ui/components/atoms/IntentSearchSheet.kt (NEW)
- react-native/android/app/src/test/java/com/laneshadow/components/ui/IntentSearchSheetTest.kt (NEW)

WRITE-PROHIBITED:
- matrices/** — read-only references
- Any file not explicitly listed above

MUST:
- [ ] Follow exact style properties from matrix (layout, typography, colors)
- [ ] Match RN wrapper prop API (names, types, defaults)
- [ ] Use framework primitives from matrix TRANSLATION SOURCES
- [ ] Test all variants, sizes, and states from matrix
- [ ] Document public API with code comments

MUST NOT:
- [ ] Add props not in RN wrapper
- [ ] Hardcode values—use design tokens from matrix
- [ ] Skip states specified in matrix
- [ ] Modify other components

--------------------------------------------------------------------------------
CODE PATTERN
--------------------------------------------------------------------------------

// Jetpack Compose pattern
@Composable
fun IntentSearchSheet(
    modifier: Modifier = Modifier,
    // Props from RN wrapper
) {
    // Implementation following matrix
}

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** IntentSearchSheet exists as React Native wrapper
**Gap:** No Jetpack Compose implementation exists

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

AGENT: kotlin-implementer

1. READ matrices/ui/organisms/IntentSearchSheet.md for complete style properties
2. READ RN wrapper source for API contract
3. IMPLEMENT component in Jetpack Compose
4. TEST all variants, sizes, states from matrix
5. VERIFY measurements match matrix values

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- UI-001 — Design token system available
- FND-001 — Atom matrices complete (if atom)
- FND-002 — Molecule matrices complete (if molecule)
- FND-003 — Organism matrices complete (if organism)
- FND-004 — Composition matrices complete (if composition)

Blocks: (none — UI tasks are leaf nodes)

## THEME COMPLIANCE (MANDATORY)

**Non-negotiable requirements for all UI component implementations:**

### Token Category Usage

1. **Colors**: Use `LaneShadowTheme.colors` (Android) or `Theme.shared.colors` (iOS)
   - Primary, secondary, tertiary, success, warning, danger, info
   - Surface, background, border, input, ring, card, popover
   - All color state variants (default, hover, pressed, disabled, focus)

2. **Typography**: Use `LaneShadowTheme.type` (Android) or `Theme.shared.type` (iOS)
   - Label, body, title, heading, display scales
   - sm/md/lg variants per scale

3. **Spacing**: Use `LaneShadowTheme.space` (Android) or `Theme.shared.space` (iOS)
   - xs, sm, md, lg, xl, 2xl, 3xl, 4xl

4. **Border Radius**: Use `LaneShadowTheme.radius` (Android) or `Theme.shared.radius` (iOS)
   - none, sm, md, lg, xl, 2xl, full

5. **Elevation**: Use `LaneShadowTheme.elevation` (Android) or `Theme.shared.elevation` (iOS)
   - level0, level1, level2, level3, level4, level5, level8

6. **Motion**: Use `LaneShadowTheme.motion` (Android) or `Theme.shared.motion` (iOS)
   - Duration, delay, scale, easing values

7. **Opacity**: Use `LaneShadowTheme.opacity` (Android) or `Theme.shared.opacity` (iOS)
   - step00 through step11 values

### Source of Truth

All component styling MUST derive from the platform theme accessor. Do NOT hardcode colors, dimensions, or values. Cross-reference your component's STYLE PROPERTIES MATRIX file in `.spec/prds/native-rewrite/matrices/ui/` to identify which tokens apply to each property.

### Verification

Before marking this task complete, verify:
- [ ] No hardcoded color values (hex, RGB, etc.)
- [ ] No hardcoded dimension values (dp, pt, sp, etc.)
- [ ] All styling values reference theme tokens
- [ ] Component renders in both light and dark themes
- [ ] Sandbox story demonstrates theme compliance

