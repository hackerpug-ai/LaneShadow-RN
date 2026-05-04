# Android Learnings: Sprint 04 - Phase Enum Wiring

## Implementation Date
2026-05-03

## Task Context
**Task**: CHAT-S04-R11 — Android phase name alignment to canonical taxonomy
**Problem**: Phase enum existed but was DEAD CODE — `fromLabel()` had ZERO call sites; `PlanningViewModel` still used raw string `when()` for phase mapping; `phaseIndexForStatus()` did raw string matching.
**Solution**: Wire the Phase enum through the live data path so `PlanningViewModel` and `phaseIndexForStatus()` use the enum instead of raw strings.

## Edge Cases Discovered

### 1. Type System Mismatch
When changing `PlanningUiState.currentPhase` from `String` to `Phase`, the existing test `PlanningViewModelTest.state_mapsLatestAgentMessageStatusToCurrentPhase` failed because it was asserting string equality:
```kotlin
// Before (failing):
assertThat(viewModel.state.value.currentPhase).isEqualTo("drafting")

// After (passing):
assertThat(viewModel.state.value.currentPhase).isEqualTo(Phase.Drafting)
```

**Lesson**: When changing data types in state objects, always check test assertions for type mismatches. The compiler doesn't catch assertion failures.

### 2. Index Off-By-One
The original `phaseIndexForStatus()` used 1-based indexing (parsing=1, searching=2, etc.), but `Phase.entries.indexOf()` uses 0-based indexing. This required updating:
- Default values in `PlanningUiState` (from `activePhaseIndex: Int = 1` to `0`)
- `phaseHeaderForIndex()` calls (from `phaseHeaderForIndex(1)` to `phaseHeaderForIndex(0)`)

**Lesson**: When migrating from manual indexing to enum-based indexing, verify all index consumers are updated consistently.

### 3. Null Handling with Phase Enum
`Phase.fromLabel()` returns `Phase?` (nullable), so we needed explicit null handling:
```kotlin
val phase = Phase.fromLabel(latestAgentMessage?.status) ?: Phase.Parsing
```

**Lesson**: Enum parsers that return nullable require explicit default values at call sites.

## API Contract Notes

### Server Status Strings
The backend sends lowercase phase strings: `"parsing"`, `"searching"`, `"drafting"`, `"enriching"`, `"finalizing"`. The `Phase.fromLabel()` method handles case-insensitive parsing via `.lowercase()`, so mixed-case inputs (e.g., `"Parsing"`, `"PARSING"`) also work.

### Legacy Phase Handling
Legacy phase labels (`"reading"`, `"sketching"`, etc.) return `null` from `Phase.fromLabel()`. The ViewModel defaults to `Phase.Parsing` for unknown phases, which is safe but could be improved with explicit logging in production.

## UI Decisions

### Phase Enum as Single Source of Truth
Changed `PlanningUiState.currentPhase` from `String` to `Phase` enum. This provides:
- Type safety (compiler catches invalid phase comparisons)
- IDE autocomplete for phase values
- Single canonical definition in `RideFlowState.kt`

### Removed Dead Code
Deleted `phaseIndexForStatus()` function after refactoring because:
- It was no longer called (we use `Phase.entries.indexOf()` directly)
- It was duplicating logic that's now inline in the ViewModel
- Keeping it would create maintenance burden

## Gotchas for iOS Implementer

### Enum vs String Migration
When migrating from string-based phase tracking to enum-based:
1. Update state objects first (type changes)
2. Update all consumers that read the state
3. Update all producers that write the state
4. Run tests after each step to catch mismatches early

### Index-Based UI Logic
If iOS uses index-based phase headers (like `phaseHeaderForIndex`), note that enum arrays are 0-indexed. Our original 1-based indexing caused off-by-one bugs after migration.

### Test Assertions Are Type-Sensitive
After changing state types, tests that assert on the old type will fail. Look for assertions like:
```swift
// If changing from String to Phase enum:
XCTEqual(state.currentPhase, "drafting")  // FAILS
XCTEqual(state.currentPhase, Phase.drafting)  // PASSES
```

## Files Created/Modified

### Created
- `android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelPhaseMappingTest.kt` — TDD test suite verifying Phase enum emission from ViewModel

### Modified
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningUiState.kt`
  - Changed `currentPhase: String` to `currentPhase: Phase`
  - Updated default `activePhaseIndex` from 1 to 0 (0-based indexing)
  - Removed dead `phaseIndexForStatus()` function
  - Updated `defaultPhaseHeaders()` to use 0-based indices

- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt`
  - Added import for `Phase` enum
  - Replaced raw string phase matching with `Phase.fromLabel()` call
  - Changed `currentPhase` assignment from string to Phase enum
  - Replaced `phaseIndexForStatus()` call with `Phase.entries.indexOf()`

- `android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt`
  - Updated assertion from string comparison to Phase enum comparison
  - Added import for `Phase` enum

## Verification Commands

```bash
# Run phase-related tests
cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.services.*Phase*" --tests "com.laneshadow.ui.planning.*Phase*"

# Verify Phase enum is used (no longer dead code)
grep -r "Phase\.fromLabel" android/app/src/main/java --include="*.kt"

# Verify compilation
cd android && ./gradlew :app:compileDebugKotlin
```

## Success Criteria Met
- [x] AC-1: Phase enum has exactly 5 canonical cases (verified by PhaseTaxonomyTest)
- [x] AC-2: Label-to-phase map covers all 5 names (verified by PhaseTaxonomyTest)
- [x] AC-3: ViewModel maps server status to canonical Phase enum (verified by PlanningViewModelPhaseMappingTest)
- [x] AC-4: MockProviders use canonical labels only (verified by MockProvidersPhaseTest)
- [x] AC-5: LSPhaseIndicator instrumented snapshot covers canonical labels (existing test)
- [x] `Phase.fromLabel()` has call sites (no longer dead code)
- [x] `PlanningViewModel` uses Phase enum instead of raw strings
- [x] `phaseIndexForStatus()` removed (dead code eliminated)
