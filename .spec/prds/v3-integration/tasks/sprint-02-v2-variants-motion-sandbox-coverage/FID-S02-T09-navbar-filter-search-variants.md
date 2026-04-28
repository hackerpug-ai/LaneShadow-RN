================================================================================
TASK: FID-S02-T09 - LSNavBar Filter-Chip Row + Search-Slot Variants (iOS + Android)
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=swift-implementer + kotlin-implementer | reviewer=swift-reviewer + kotlin-reviewer

RUNTIME_COMMANDS:
  ios-typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  ios-test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  android-typecheck: cd android && ./gradlew :app:compileDebugKotlin
  android-test: cd android && ./gradlew test
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-5 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSNavBar` on both platforms gains two new variants — a horizontally-scrolling filter-chip row and an inset search-slot field — both registered as canonical sandbox stories with visual + behavioral parity.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST register canonical story IDs identical on both platforms: `organisms.nav-bar.basic`, `organisms.nav-bar.filter-chip-row`, `organisms.nav-bar.search-slot`
- MUST use SwiftUI `ScrollView(.horizontal, showsIndicators: false)` for iOS chip row and Compose `LazyRow` for Android — NOT a fixed-width `HStack` / `Row`
- MUST use `theme.colors.surface.inset` background for the search field on both platforms with `theme.radius.lg` corners and a leading search icon (`Image(systemName: "magnifyingglass")` on iOS, `Icons.Default.Search` on Android)
- NEVER hardcode color/spacing/typography literals
- MUST keep the LSNavBar API surface backwards-compatible: `filterChips: [FilterChipSpec]?` and `searchSlot: SearchSlotSpec?` are both optional with `nil`/`null` defaults

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] iOS LSNavBar accepts `filterChips: [FilterChipSpec]?` and renders them in a horizontally-scrolling row when non-empty (AC-1 PRIMARY)
- [ ] Android LSNavBar accepts `filterChips: List<FilterChipSpec>?` with parity behavior (AC-2)
- [ ] iOS LSNavBar accepts `searchSlot: SearchSlotSpec?` and renders an inset search field when non-nil (AC-3)
- [ ] Android LSNavBar accepts `searchSlot: SearchSlotSpec?` with parity behavior (AC-4)
- [ ] Sandbox stories `organisms.nav-bar.basic`, `organisms.nav-bar.filter-chip-row`, `organisms.nav-bar.search-slot` registered on both platforms with identical IDs (AC-5)
- [ ] Both `xcodebuild test` and `./gradlew test` pass + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: iOS filter-chip row [PRIMARY]
  GIVEN: An LSNavBar story passes `filterChips = [FilterChipSpec(label: "Mileage"), FilterChipSpec(label: "Difficulty"), FilterChipSpec(label: "Surface")]`
  WHEN:  The bar renders
  THEN:  Below the toolbar, a horizontal `ScrollView(.horizontal, showsIndicators: false)` renders an `LSFilterChip` per spec; chips overflow horizontally without truncation; tapping a chip toggles its `isSelected` state with copper-tint styling

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/NavBarVariantTests.swift
  TEST_FUNCTION: testIOSNavBarFilterChipRow

AC-2: Android filter-chip row
  GIVEN: An LSNavBar story passes `filterChips = listOf(FilterChipSpec("Mileage"), FilterChipSpec("Difficulty"), FilterChipSpec("Surface"))`
  WHEN:  The bar composes
  THEN:  Below the toolbar, a Compose `LazyRow` renders an `LSFilterChip` per spec; horizontal overflow scrolls; tap toggles `isSelected` with copper-tint styling

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/NavBarVariantTests.kt
  TEST_FUNCTION: testAndroidNavBarFilterChipRow

AC-3: iOS search-slot
  GIVEN: An LSNavBar story passes `searchSlot = SearchSlotSpec(placeholder: "Search routes…")`
  WHEN:  The bar renders
  THEN:  Below the toolbar, an inset search field renders with `surface.inset` background, `radius.lg` corners, leading `Image(systemName: "magnifyingglass")`, and the placeholder text in `content.tertiary`

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/NavBarVariantTests.swift
  TEST_FUNCTION: testIOSNavBarSearchSlot

AC-4: Android search-slot
  GIVEN: An LSNavBar story passes `searchSlot = SearchSlotSpec(placeholder = "Search routes…")`
  WHEN:  The bar composes
  THEN:  Below the toolbar, a Compose `OutlinedTextField`-style inset field renders with `surface.inset` background, `theme.radius.lg` corners, leading `Icons.Default.Search`, and placeholder text in `content.tertiary`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/NavBarVariantTests.kt
  TEST_FUNCTION: testAndroidNavBarSearchSlot

AC-5: Story registration on both platforms
  GIVEN: Sandbox is loaded
  WHEN:  Story IDs are enumerated
  THEN:  Both iOS and Android registries contain canonical IDs `organisms.nav-bar.basic`, `organisms.nav-bar.filter-chip-row`, `organisms.nav-bar.search-slot` (no platform-specific IDs and no `infrastructure.` prefix)

  TDD_STATE:     none
  TEST_FILE:     (verified via `pnpm snapshots:check`)
  TEST_FUNCTION: n/a (declarative)

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSNavBar.swift (MODIFY — add filterChips + searchSlot parameters)
- ios/LaneShadow/Views/Atoms/LSFilterChip.swift (NEW or MODIFY — exists from V2 atoms; verify before creating)
- ios/LaneShadow/Sandbox/Stories/Organisms/LSNavBarStory.swift (MODIFY — register two new stories)
- ios/LaneShadowTests/Sandbox/NavBarVariantTests.swift (NEW)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSNavBar.kt (MODIFY — add filterChips + searchSlot parameters)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSFilterChip.kt (NEW or MODIFY — verify before creating)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSNavBarStory.kt (MODIFY — register two new stories)
- android/app/src/test/java/com/laneshadow/sandbox/NavBarVariantTests.kt (NEW)

writeProhibited:
- server/**, react-native/**
- tokens/** — must NOT add new tokens; verify `surface.inset` and `radius.lg` exist
- Any file not explicitly listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios + android LSNavBar (MODIFY): both gain `filterChips: ...?` + `searchSlot: ...?` optional parameters
- ios + android LSFilterChip (NEW or MODIFY): atomic chip with selected / unselected states (use existing if it exists)
- ios + android LSNavBarStory (MODIFY): three canonical stories registered (basic, filter-chip-row, search-slot)
- NavBarVariantTests on both platforms: per-AC verification

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/organisms/topbar-navbar/ [PRIMARY REFERENCE]
   - Focus: filter-chip row + search-slot HTML mockup reference
2. .spec/prds/v3-integration/remediations/04-organisms-chrome.md
   - Sections: Gap B-02 (filter-chip row), Gap B-03 (search slot)
3. ios/LaneShadow/Views/Organisms/LSNavBar.swift (current)
   - Focus: existing API surface — add new params with nil defaults
4. android/app/src/main/java/com/laneshadow/ui/organisms/LSNavBar.kt (current)
   - Focus: existing API surface — add new params with null defaults
5. ios/LaneShadow/Views/Atoms/LSFilterChip.swift / android equivalent (if they exist)
   - Focus: chip atom shape + states (verify existence before NEWing)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per AC (skip for AC-5 — it is declarative; verified at parity-check time)
Gate 2: One test per AC (1-4)
Gate 3: Story IDs identical across iOS + Android — verify via `pnpm snapshots:check`
Gate 4: All tests pass — `xcodebuild test` AND `./gradlew test`
Gate 5: Both platforms compile
Gate 6: Native compliance — `scripts/tokens/enforce-native-compliance.sh` exits 0
Gate 7: Scope compliance — `git diff --name-only ⊆ writeAllowed`

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- New atoms beyond LSFilterChip (e.g. SearchField as a new atom) — use existing atoms or inline composition where possible
- Real filter-state logic (sandbox-only — chip taps just toggle local state)
- LSTopBar variants (this task is LSNavBar only)
- Adding new tokens

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** LSNavBar on both platforms supports back+title+close only. Filter chip rows and search slots are unavailable, forcing future screens (e.g. SavedRoutesListScreen in Sprint 05, OfflineRegionsListScreen in Sprint 06) to compose chrome ad-hoc.

**Gap:** Sprints 05 and 06 will need both variants. Landing them in Sprint 02 with sandbox stories means downstream sprints just consume the parameters; no chrome rework needed mid-integration.

--------------------------------------------------------------------------------
REVIEW
--------------------------------------------------------------------------------

For swift-reviewer (must pass ≤5):
- One iOS test per AC-1, AC-3
- LSNavBar API change is additive with `nil` defaults (existing call sites compile unchanged)
- Story IDs canonical and identical to Android side
- filter-chip row uses ScrollView(.horizontal, showsIndicators: false) with no clipping
- SCOPE respected on iOS files

For kotlin-reviewer (must pass ≤5):
- One Android test per AC-2, AC-4
- LSNavBar API change is additive with `null` defaults (existing call sites compile unchanged)
- Story IDs canonical and identical to iOS side
- filter-chip row uses Compose LazyRow with proper itemsIndexed and key
- SCOPE respected on Android files

Should verify (both reviewers, ≤5 combined):
- LSFilterChip exists or is added cleanly without bloating the atom inventory
- Search field tap state and keyboard show/hide is sane (no auto-focus leakage)
- Reduced-motion / large-font paths still render
- Accessibility: filter chip selected state announced via `accessibilityValue`/`stateDescription`; search field has `accessibilityLabel`/`contentDescription`

Verdict: [APPROVED | NEEDS_FIXES]
Feedback (required if NEEDS_FIXES):
```
[Specific, actionable issues — reference file:line where possible]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: None (LSNavBar work is independent of typography / drawer / motion sprints)
Blocks:     FID-S02-T10 (snapshot baselines)
Parallel:   FID-S02-T01..T08

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN iOS LSNavBar story with filterChips=[Mileage,Difficulty,Surface] WHEN bar renders THEN ScrollView(.horizontal,showsIndicators:false) renders LSFilterChip per spec, horizontal overflow without truncation, chip tap toggles isSelected with copper-tint", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN Android LSNavBar story with filterChips=listOf(Mileage,Difficulty,Surface) WHEN bar composes THEN Compose LazyRow renders LSFilterChip per spec, horizontal overflow scrolls, chip tap toggles isSelected with copper-tint", "verify": "./gradlew test" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN iOS LSNavBar story with searchSlot=SearchSlotSpec(placeholder:'Search routes…') WHEN bar renders THEN inset search field with surface.inset bg + radius.lg + leading magnifyingglass icon + placeholder in content.tertiary", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN Android LSNavBar story with searchSlot=SearchSlotSpec(placeholder='Search routes…') WHEN bar composes THEN inset OutlinedTextField-style field with surface.inset bg + radius.lg + leading Icons.Default.Search + placeholder content.tertiary", "verify": "./gradlew test" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN sandbox loaded WHEN story IDs enumerated THEN both iOS and Android registries contain organisms.nav-bar.basic, organisms.nav-bar.filter-chip-row, organisms.nav-bar.search-slot with no infrastructure. prefix and no platform suffix", "verify": "pnpm snapshots:check" },
    { "id": "TC-1", "type": "test_criterion", "description": "iOS LSNavBar with non-nil filterChips renders horizontal ScrollView; LSFilterChip count equals input array length; chip tap mutates isSelected", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/NavBarVariantTests/testIOSNavBarFilterChipRow" },
    { "id": "TC-2", "type": "test_criterion", "description": "Android LSNavBar with non-null filterChips renders LazyRow; LSFilterChip count equals input list size; chip tap mutates isSelected", "maps_to_ac": "AC-2", "verify": "./gradlew test --tests '*.NavBarVariantTests.testAndroidNavBarFilterChipRow'" },
    { "id": "TC-3", "type": "test_criterion", "description": "iOS LSNavBar with non-nil searchSlot renders inset search field with surface.inset background, radius.lg corners, magnifyingglass leading icon", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/NavBarVariantTests/testIOSNavBarSearchSlot" },
    { "id": "TC-4", "type": "test_criterion", "description": "Android LSNavBar with non-null searchSlot renders inset Compose text field with surface.inset background, theme.radius.lg corners, Icons.Default.Search leading icon", "maps_to_ac": "AC-4", "verify": "./gradlew test --tests '*.NavBarVariantTests.testAndroidNavBarSearchSlot'" },
    { "id": "TC-5", "type": "test_criterion", "description": "Story registries on both platforms contain identical canonical IDs organisms.nav-bar.{basic,filter-chip-row,search-slot} as verified by pnpm snapshots:check", "maps_to_ac": "AC-5", "verify": "pnpm snapshots:check" }
  ]
}
-->
