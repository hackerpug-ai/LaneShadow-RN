================================================================================
TASK: UI-193 - VoiceListeningVisualizer (Android)
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

Implement VoiceListeningVisualizer component in Jetpack Compose following the translation matrix specification.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- react-native/android/app/src/main/java/com/laneshadow/components/ui/VoiceListeningVisualizer.kt (NEW): Jetpack Compose implementation
- react-native/android/app/src/test/java/com/laneshadow/components/ui/VoiceListeningVisualizerTest.kt (NEW): Component tests

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
  WHEN: VoiceListeningVisualizer is rendered with required props
  THEN: Component displays matching RN wrapper defaults

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: VoiceListeningVisualizerTest.kt
  TEST_FUNCTION: testVoiceListeningVisualizerDefaultRendering

AC-2: All style properties match matrix
  GIVEN: Translation matrix defines layout, typography, colors
  WHEN: Component is rendered in all variants
  THEN: Measured values match matrix (height, padding, radius, font-size)

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: VoiceListeningVisualizerTest.kt
  TEST_FUNCTION: testVoiceListeningVisualizerStylePropertiesMatchMatrix

AC-3: Component handles all states
  GIVEN: Component supports states (hover, pressed, disabled, error, loading)
  WHEN: Each state is triggered
  THEN: Visual feedback matches RN wrapper behavior

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: VoiceListeningVisualizerTest.kt
  TEST_FUNCTION: testVoiceListeningVisualizerStates

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. matrices/ui/templates/VoiceListeningVisualizer.md
   - Lines: ALL
   - Focus: TRANSLATION SOURCES and STYLE PROPERTIES MATRIX

2. react-native/components/ui/voicelisteningvisualizer.tsx
   - Lines: ALL
   - Focus: Public API, props, variants, visual decisions

3. brain/docs/native/kotlin-compose-patterns.md
   - Sections: Component structure, state handling
   - Focus: Framework-specific patterns

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- react-native/android/app/src/main/java/com/laneshadow/components/ui/VoiceListeningVisualizer.kt (NEW)
- react-native/android/app/src/test/java/com/laneshadow/components/ui/VoiceListeningVisualizerTest.kt (NEW)

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
fun VoiceListeningVisualizer(
    modifier: Modifier = Modifier,
    // Props from RN wrapper
) {
    // Implementation following matrix
}

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** VoiceListeningVisualizer exists as React Native wrapper
**Gap:** No Jetpack Compose implementation exists

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

AGENT: kotlin-implementer

1. READ matrices/ui/templates/VoiceListeningVisualizer.md for complete style properties
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
