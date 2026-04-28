================================================================================
TASK: FID-S02-R03 - Android Missing Molecules — LSCancelConfirmSheet + LSSavedPill
================================================================================

TASK_TYPE:  FIX
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  test: cd android && ./gradlew test

PROGRESS: Not started

--------------------------------------------------------------------------------
OUTCOME (1 sentence)
--------------------------------------------------------------------------------

Android gains LSCancelConfirmSheet (centered confirm dialog for Planning V02 cancel + Sessions S05 new-confirm) and LSSavedPill (small "Saved" pill atom for RouteDetails V01 saved-state), matching iOS counterparts.

--------------------------------------------------------------------------------
SOURCE
--------------------------------------------------------------------------------

Red-hat review 2026-04-28 Finding 4 (CRITICAL).
Two molecule files are genuinely missing from the Android codebase.
LSConfirmDialog.kt and LSWifiOffWatermark.kt DO exist (verified on disk).
LSCancelConfirmSheet.kt and LSSavedPill.kt do NOT exist (file system search confirmed).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST match the visual design and token usage of iOS counterparts
- LSCancelConfirmSheet MUST use `surface.scrim` backdrop + `surface.card` dialog surface + Keep (tertiary) / Cancel (signal) buttons
- LSSavedPill MUST render "Saved" text with glass background + copper accent beside LSBestBadge
- NEVER hardcode color/spacing/typography — use theme tokens

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] LSCancelConfirmSheet.kt exists in molecules/ with scrim + card + Keep/Cancel actions (AC-1)
- [ ] LSSavedPill.kt exists in atoms/ with "Saved" text + glass/copper styling (AC-2)
- [ ] PlanningScreenStory V02 cancel-confirm uses LSCancelConfirmSheet (AC-3)
- [ ] RouteDetailsScreenStory V01 saved-state uses LSSavedPill beside LSBestBadge (AC-4)
- [ ] `./gradlew :app:compileDebugKotlin` passes
- [ ] `./gradlew test` passes

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSCancelConfirmSheet molecule
  GIVEN: LSCancelConfirmSheet composable is rendered with title "Cancel this plan?"
  WHEN:  The sheet draws
  THEN:  Surface.scrim backdrop covers screen, surface.card centered dialog renders title text, Keep button uses button.tertiary tokens, Cancel button uses button.signal tokens

AC-2: LSSavedPill atom
  GIVEN: LSSavedPill composable is rendered
  WHEN:  The pill draws
  THEN:  "Saved" text renders with surface.glass background + signal.default border/accent

AC-3: Planning V02 uses LSCancelConfirmSheet
  GIVEN: templates.planning-screen.v-cancel-confirm story is rendered
  WHEN:  The cancel-confirm variant is active
  THEN:  LSCancelConfirmSheet renders with correct title and buttons

AC-4: RouteDetails V01 uses LSSavedPill
  GIVEN: templates.route-details.v01-saved story is rendered with isSaved = true
  WHEN:  The saved-state variant is active
  THEN:  LSSavedPill renders beside LSBestBadge

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/molecules/LSCancelConfirmSheet.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSSavedPill.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt (MODIFY — wire cancel-confirm sheet)
- android/app/src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt (MODIFY — wire saved pill)

writeProhibited:
- ios/** — iOS counterparts already exist
- tokens/** — no token changes
- Any file not explicitly listed above

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: None
Blocks:     R04 (snapshot re-capture needs these components)
Parallel:   R01 (motion tokens), R02 (iOS tests)

================================================================================
