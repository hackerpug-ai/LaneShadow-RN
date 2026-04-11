# DESIGN-005: IntentSearchInput with Loading/Offline/Cache States

**Task ID:** DESIGN-005
**Epic:** Epic 3 - Local Discovery Layer & React Hooks
**Assigned To:** frontend-designer
**Priority:** P0
**Effort:** L
**Estimate:** 150 min
**Type:** [DESIGN]
**Depends On:** DESIGN-001 (RouteDiscoveryScreen layout)

---

## BACKGROUND

The IntentSearchInput is a bottom-sheet-based search interface for natural language route discovery (UC-DISC-07). It has three visual states: cache-hit (instant, no spinner), cache-miss + online (spinner while Haiku extracts params, ~1-2s), and cache-miss + offline (empty state with recent-intent shortcut chips). An intent summary pill appears above results showing what the user searched for, and a clear button resets to browse mode.

This is a DESIGN task — the component renders mock states for visual verification. CUR-013 will wire the real `useIntentSearch` hook.

**PRD references:** UC-DISC-07 (Intent-Based Search), AD-11 (Haiku + cache single path), TRD-6.2 (intent search flow).

---

## ACCEPTANCE CRITERIA

### AC-001: Input with keyboard
**GIVEN** the discovery screen is rendered
**WHEN** the user taps the search trigger area
**THEN** a bottom sheet appears with a KeyboardAvoidingInput (per feedback pattern)
**AND** the keyboard opens automatically
**AND** the input field has a placeholder like "Describe your ideal ride..."
**AND** the bottom sheet is dismissible by swiping down

**Verify:** Tap search trigger, verify bottom sheet with keyboard-avoiding input appears.

### AC-002: Cache hit instant (no spinner)
**GIVEN** the user types an intent that matches a cached entry
**WHEN** the search is triggered
**THEN** results appear instantly (< 50ms visual response)
**AND** no loading spinner is shown
**AND** an intent summary pill appears (e.g., "Twisty mountain roads near you")

**Verify:** Mock a cache-hit state, verify no spinner and instant results.

### AC-003: Online loading spinner
**GIVEN** the user types a novel intent and the device is online
**WHEN** the search is submitted
**THEN** a loading spinner appears in the bottom sheet (1-2s expected)
**AND** the spinner uses the copper accent color
**AND** a status message like "Finding your perfect ride..." is shown
**AND** the input is disabled during loading

**Verify:** Mock an online loading state, verify spinner and disabled input.

### AC-004: Offline empty state with chips
**GIVEN** the device is offline and no cache entry exists for the intent
**WHEN** the search state resolves to OFFLINE_UNSUPPORTED
**THEN** the bottom sheet shows an empty state with message "Connect to search"
**AND** recent-intent chips are displayed (up to 6, from cached popular intents)
**AND** each chip is tappable (onPress callback) to re-run that cached search
**AND** the empty state is semi-transparent so the map remains visible

**Verify:** Mock offline state, verify "Connect to search" message with recent-intent chips.

### AC-005: Clear search resets to browse
**GIVEN** an intent search is active with results or a summary pill displayed
**WHEN** the user taps the clear button (X icon)
**THEN** the search input is cleared
**AND** the intent summary pill is removed
**AND** the map returns to browse mode (all pins visible, no filter)
**AND** the bottom sheet collapses

**Verify:** Perform a mock search, tap clear, verify reset to browse mode.

---

## TEST CRITERIA

- [ ] Bottom sheet opens with KeyboardAvoidingInput
- [ ] Cache-hit state renders with no spinner and intent summary pill
- [ ] Online loading state renders with spinner and status message
- [ ] Offline state renders with "Connect to search" and recent-intent chips
- [ ] Clear button resets search and collapses sheet
- [ ] Intent summary pill shows search text
- [ ] All colors from useSemanticTheme (no hardcoded hex)
- [ ] No attempt to show spinner for cache hits
- [ ] Component renders without runtime errors

---

## READING LIST

- `styles/RULES.md` -- Theme tokens, glassmorphic overlay patterns
- `.spec/prds/curation/04-uc-discovery.md` -- UC-DISC-07 (Intent-Based Search)
- `.spec/prds/curation/10-trd-detail.md` -- AD-11 (intent search flow)
- Existing bottom sheet patterns in project (Gorhom BottomSheet usage)

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `components/discovery/intent-search-sheet.tsx` (NEW) — Bottom sheet with search input and states
- `components/discovery/intent-summary-pill.tsx` (NEW) — Summary pill showing active intent

**NEVER:**
- Show a loading spinner for cache hits (instant rendering is the UX signal)
- Attempt on-device inference (this is visual only — no LLM code)
- Use regular TextInput in a Gorhom sheet (must use KeyboardAvoidingInput per feedback pattern)
- Import real data hooks (use mock state props)

---

## CODE PATTERN

```typescript
// components/discovery/intent-search-sheet.tsx
import { useSemanticTheme } from '@theme/hooks/useSemanticTheme';
import BottomSheet, { BottomSheetTextInput } from '@gorhom/bottom-sheet';

type SearchState =
  | { status: 'idle' }
  | { status: 'cache_hit'; summary: string }
  | { status: 'searching' }
  | { status: 'offline_unsupported'; recentIntents: string[] }
  | { status: 'results'; summary: string };

interface IntentSearchSheetProps {
  searchState: SearchState;
  onSearch: (query: string) => void;
  onClear: () => void;
  onRecentIntentTap: (intent: string) => void;
  visible: boolean;
}

export function IntentSearchSheet({
  searchState, onSearch, onClear, onRecentIntentTap, visible
}: IntentSearchSheetProps) {
  const { semantic } = useSemanticTheme();

  if (!visible) return null;

  return (
    <BottomSheet snapPoints={['60%']}>
      <KeyboardAvoidingView>
        <View style={styles.inputRow}>
          <BottomSheetTextInput
            placeholder="Describe your ideal ride..."
            onSubmitEditing={({ nativeEvent }) => onSearch(nativeEvent.text)}
            editable={searchState.status !== 'searching'}
          />
          <TouchableOpacity onPress={onClear}>
            <Icon name="close" />
          </TouchableOpacity>
        </View>

        {searchState.status === 'cache_hit' && (
          <IntentSummaryPill text={searchState.summary} />
        )}

        {searchState.status === 'searching' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={semantic.color.primary} />
            <Text>Finding your perfect ride...</Text>
          </View>
        )}

        {searchState.status === 'offline_unsupported' && (
          <View style={styles.offlineContainer}>
            <Text>Connect to search</Text>
            <ScrollView horizontal>
              {searchState.recentIntents.map(intent => (
                <Chip key={intent} onPress={() => onRecentIntentTap(intent)}>
                  {intent}
                </Chip>
              ))}
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}
```

---

## AGENT INSTRUCTIONS

1. Read `styles/RULES.md` and study existing bottom sheet patterns in the project
2. Create `intent-search-sheet.tsx` with all four visual states (idle, cache_hit, searching, offline_unsupported)
3. Create `intent-summary-pill.tsx` as a compact pill showing the active search intent
4. Use KeyboardAvoidingInput pattern (per feedback) — not regular TextInput
5. Mock all states with sample data — no real hooks
6. Ensure cache-hit state has zero loading indicators (instant visual feedback)
7. Ensure offline state shows recent-intent chips as tappable shortcuts
8. Use `useSemanticTheme()` for all styling

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. Run `npm run typecheck` — must pass
2. Run `npm run lint` — zero lint errors
3. Verify `intent-search-sheet.tsx` has four distinct render paths for the four states
4. Verify cache-hit path has no ActivityIndicator or spinner component
5. Verify offline path has chips for recent intents
6. Verify no real data hooks imported
7. Verify KeyboardAvoidingInput pattern used (not raw TextInput)

---

## AGENT ASSIGNMENT

**Primary:** frontend-designer
**Reason:** Pure presentational component with multiple visual states. No business logic.

---

## EVIDENCE GATES

- [ ] `components/discovery/intent-search-sheet.tsx` exists and renders all 4 states
- [ ] `components/discovery/intent-summary-pill.tsx` exists
- [ ] TypeScript compiles cleanly
- [ ] No hardcoded hex colors

---

## REVIEW CRITERIA

- All four states have distinct visual treatments
- Cache-hit is visually instant — no spinner, no delay indication
- Online searching state has clear loading feedback
- Offline state is helpful (recent-intent chips) not just an error message
- Intent summary pill is compact and informative
- Clear button resets all visual state
- Bottom sheet uses Gorhom BottomSheet pattern
- Keyboard avoidance works correctly

---

## DEPENDENCIES

- **DESIGN-001** — RouteDiscoveryScreen provides the context where the search sheet appears

---

## NOTES

- The `recentIntents` prop in offline state maps to the `topHitIntents(db, 6)` call in the useIntentSearch hook. For design purposes, use mock strings like "Twisty mountain roads", "Coastal rides near me", etc.
- The intent summary pill should use the copper accent and be dismissible.
- This component will be wired to `useIntentSearch` in CUR-013.
