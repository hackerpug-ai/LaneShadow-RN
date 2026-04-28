================================================================================
TASK: FID-S02-R01 - Motion Token Gap — Add Missing 1400ms Recipe Keys
================================================================================

TASK_TYPE:  FIX
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=convex-implementer (token schema) | reviewer=convex-reviewer

RUNTIME_COMMANDS:
  native-compliance: scripts/tokens/enforce-native-compliance.sh
  token-validate: pnpm tokens:validate

PROGRESS: Not started

--------------------------------------------------------------------------------
OUTCOME (1 sentence)
--------------------------------------------------------------------------------

`tokens/semantic/motion.tokens.json` contains all 5 motion recipe keys with correct 1400ms/200ms durations so both platforms can read from tokens instead of hardcoding.

--------------------------------------------------------------------------------
SOURCE
--------------------------------------------------------------------------------

Red-hat review 2026-04-28 Finding 1 (CRITICAL).
Both platforms hardcode durations because the recipe keys don't exist in the token file.
iOS hardcodes the correct 1400ms value; Android falls back to wrong 600ms/400ms values.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST NOT change any existing token keys or values
- MUST follow the established motion.tokens.json schema for recipe definitions
- MUST include: duration (ms), easing (string), repeatMode where applicable
- After landing, iOS and Android implementations must update to read from these tokens instead of hardcoded values

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] motion.tokens.json contains `sketchPolylineLoop` with duration 1400ms, easing "linear", repeatMode "restart" (AC-1)
- [ ] motion.tokens.json contains `breathingHeadDot` with duration 1400ms, easing "easeInOut", repeatMode "reverse" (AC-2)
- [ ] motion.tokens.json contains `bestBadgeEnter` with duration 200ms, easing "spring" (AC-3)
- [ ] motion.tokens.json contains `recordDotPulse` with duration 1400ms, easing "easeInOut", repeatMode "reverse" (AC-4)
- [ ] motion.tokens.json contains `chatOverlayEnter` with duration (design spec), easing "easeOut" (AC-5)
- [ ] `pnpm tokens:validate` passes
- [ ] `scripts/tokens/enforce-native-compliance.sh` passes
- [ ] iOS LSMotion.swift / Android LSMotion.kt read from these tokens (no "TOKEN GAP" comments)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: sketchPolylineLoop recipe exists
  GIVEN: tokens/semantic/motion.tokens.json is loaded
  WHEN:  The sketchPolylineLoop key is read
  THEN:  duration = 1400, easing = "linear", repeatMode = "restart"

AC-2: breathingHeadDot recipe exists
  GIVEN: tokens/semantic/motion.tokens.json is loaded
  WHEN:  The breathingHeadDot key is read
  THEN:  duration = 1400, easing = "easeInOut", repeatMode = "reverse"

AC-3: bestBadgeEnter recipe exists
  GIVEN: tokens/semantic/motion.tokens.json is loaded
  WHEN:  The bestBadgeEnter key is read
  THEN:  duration = 200, easing = "spring" (interpolatingSpring)

AC-4: recordDotPulse recipe exists
  GIVEN: tokens/semantic/motion.tokens.json is loaded
  WHEN:  The recordDotPulse key is read
  THEN:  duration = 1400, easing = "easeInOut", repeatMode = "reverse"

AC-5: chatOverlayEnter recipe exists
  GIVEN: tokens/semantic/motion.tokens.json is loaded
  WHEN:  The chatOverlayEnter key is read
  THEN:  duration = (per design spec), easing = "easeOut"

AC-6: Platform implementations updated
  GIVEN: The 5 new tokens exist
  WHEN:  iOS LSMotion.swift and Android LSMotion.kt are inspected
  THEN:  No "TOKEN GAP" comments remain; all recipes read from token values

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- tokens/semantic/motion.tokens.json (MODIFY — add 5 recipe keys)
- ios/LaneShadow/Theme/LSMotion.swift (MODIFY — read from tokens, remove hardcoded fallbacks)
- android/app/src/main/java/com/laneshadow/ui/theme/LSMotion.kt (MODIFY — read from tokens, remove "slow"/"deliberate" fallbacks)
- ios/LaneShadow/Views/Screens/PlanningScreen.swift (MODIFY — remove hardcoded 1.4)
- android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt (MODIFY — read recipe token)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSPhaseIndicator.kt (MODIFY — read recipe token)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt (MODIFY — read recipe token)

writeProhibited:
- Any file not explicitly listed above
- Test files (separate remediation task)

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: None (token gap is root cause)
Blocks:     R02 (test quality), R03 (missing files), R04 (snapshot re-capture)
Parallel:   R03 can run in parallel

================================================================================
