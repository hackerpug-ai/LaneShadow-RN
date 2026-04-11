# DESIGN-006: StateFilter State/Region Selector

**Task ID:** DESIGN-006
**Epic:** Epic 4 - Discovery UI & Data Flywheel
**Assigned To:** frontend-designer
**Priority:** P1
**Effort:** M
**Estimate:** 90 min
**Type:** [DESIGN]
**Depends On:** DESIGN-001 (RouteDiscoveryScreen layout)

---

## BACKGROUND

The StateFilter is a bottom-sheet-based state/region selector for filtering discovery routes by US state. It displays a searchable FlatList of states with route counts, supports multi-select, and auto-centers the map on selected state(s). This enables UC-DISC-03: riders planning trips to specific areas can jump directly to a state's routes.

This is a DESIGN task — the component receives state data and callbacks as props. CUR-012 will wire the data connection.

**PRD references:** UC-DISC-03 (Filter by State/Region), styles/RULES.md.

---

## ACCEPTANCE CRITERIA

### AC-001: Searchable state list
**GIVEN** the state filter bottom sheet is open
**WHEN** the component renders
**THEN** a searchable FlatList of US states is displayed
**AND** each state row shows the state name and route count
**AND** a search input at the top filters the list by state name
**AND** states with zero routes are hidden

**Verify:** Open state filter, search for "Colo", verify Colorado appears with its route count.

### AC-002: Select centers map
**GIVEN** the state filter is open with states listed
**WHEN** the user selects one or more states
**THEN** the `onSelectionChange(states)` callback fires
**AND** the parent can auto-center the map on the selected state(s) centroid
**AND** the selected state rows show a checkmark or highlight

**Verify:** Select "Colorado", verify callback fires with state code "CO".

### AC-003: Multi-select works
**GIVEN** the state filter is open
**WHEN** the user taps multiple states
**THEN** all tapped states are added to the selection
**AND** the route count in the header updates to reflect the total matching routes
**AND** tapping a selected state deselects it

**Verify:** Select Colorado and Utah, verify both highlighted.

### AC-004: Clear resets to proximity
**GIVEN** one or more states are selected
**WHEN** the user taps "Clear" or the "All" option
**THEN** the state selection is cleared
**AND** the callback fires with empty selection
**AND** the parent returns to proximity-based (location-centered) routing

**Verify:** Select states, tap Clear, verify selection cleared and callback fires.

---

## TEST CRITERIA

- [ ] Searchable FlatList of states renders
- [ ] Each state shows route count
- [ ] Search input filters list by state name
- [ ] States with zero routes are hidden
- [ ] Multi-select works (select/deselect toggle)
- [ ] Clear button resets selection
- [ ] Uses BottomSheetWrapper pattern
- [ ] No hardcoded hex colors
- [ ] Component renders without errors

---

## READING LIST

- `styles/RULES.md` -- Theme tokens
- `.spec/prds/curation/04-uc-discovery.md` -- UC-DISC-03 (Filter by State/Region)
- Existing BottomSheetWrapper pattern in project

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `components/discovery/state-filter-sheet.tsx` (NEW) — Bottom sheet with search + state list
- `components/discovery/state-list-item.tsx` (NEW) — Individual state row

**NEVER:**
- Use full-screen modal for the state selector
- Block map while the filter sheet is active (map should remain interactive)
- Import real data hooks (use mock props)
- Hardcode hex colors

---

## CODE PATTERN

```typescript
// components/discovery/state-filter-sheet.tsx
import { useSemanticTheme } from '@theme/hooks/useSemanticTheme';
import { BottomSheetWrapper } from '@components/common/BottomSheetWrapper';

interface StateFilterSheetProps {
  visible: boolean;
  states: { code: string; name: string; routeCount: number }[];
  selected: string[];
  onSelectionChange: (states: string[]) => void;
  onDismiss: () => void;
}

export function StateFilterSheet({
  visible, states, selected, onSelectionChange, onDismiss
}: StateFilterSheetProps) {
  const [search, setSearch] = useState('');
  const filtered = states
    .filter(s => s.routeCount > 0)
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <BottomSheetWrapper visible={visible} onDismiss={onDismiss}>
      <TextInput
        placeholder="Search states..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item.code}
        renderItem={({ item }) => (
          <StateListItem
            state={item}
            isSelected={selected.includes(item.code)}
            onPress={() => {
              const next = selected.includes(item.code)
                ? selected.filter(s => s !== item.code)
                : [...selected, item.code];
              onSelectionChange(next);
            }}
          />
        )}
      />
      <Button onPress={() => onSelectionChange([])}>Clear</Button>
    </BottomSheetWrapper>
  );
}
```

---

## AGENT INSTRUCTIONS

1. Read `styles/RULES.md` for theme tokens
2. Study existing BottomSheetWrapper pattern
3. Create `state-filter-sheet.tsx` with search input and FlatList
4. Create `state-list-item.tsx` as the individual state row component
5. States with zero routes should be filtered out
6. Search should filter by state name (case-insensitive)
7. Use mock state data for design testing (50 US states with sample counts)
8. All styling via useSemanticTheme()

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. Run `npm run typecheck` — must pass
2. Run `npm run lint` — zero lint errors
3. Verify `state-filter-sheet.tsx` uses BottomSheetWrapper
4. Verify search input filters the state list
5. Verify multi-select toggle behavior
6. Verify no hardcoded hex colors

---

## AGENT ASSIGNMENT

**Primary:** frontend-designer
**Reason:** Presentational component — list layout, search, selection state.

---

## EVIDENCE GATES

- [ ] `components/discovery/state-filter-sheet.tsx` exists
- [ ] `components/discovery/state-list-item.tsx` exists
- [ ] TypeScript compiles cleanly
- [ ] No hardcoded hex colors

---

## REVIEW CRITERIA

- Search is responsive and filters quickly
- State rows show name and count clearly
- Selected states are visually distinct
- Clear button is accessible and obvious
- Bottom sheet is the right size (not full screen)
- List scrolls smoothly with many states

---

## DEPENDENCIES

- **DESIGN-001** — RouteDiscoveryScreen provides the context for the state filter

---

## NOTES

- The component accepts `states` data as props — CUR-012 will aggregate state+count from the local database.
- State data format: `{ code: string, name: string, routeCount: number }`.
- The parent handles map centering when selection changes — the component only fires the callback.
