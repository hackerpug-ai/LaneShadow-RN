# DESIGN-004: ArchetypeFilter Horizontal Scrollable Chips

**Task ID:** DESIGN-004
**Epic:** Epic 4 - Discovery UI & Data Flywheel
**Assigned To:** frontend-designer
**Priority:** P1
**Effort:** S
**Estimate:** 60 min
**Type:** [DESIGN]
**Depends On:** DESIGN-001 (RouteDiscoveryScreen layout)

---

## BACKGROUND

The ArchetypeFilter is a horizontal scrollable chip bar for filtering discovery routes by ride archetype. It displays 6 archetype chips (twisties, mountain, coastal, adventure, scenic_byway, desert) plus an "All" chip. Each chip shows a count of matching routes. Supports multi-select. Selection persists across sessions.

This is a DESIGN task that replaces the placeholder filter bar from DESIGN-001 with a fully featured filter component.

**PRD references:** UC-DISC-02 (Filter by Archetype), styles/RULES.md.

---

## ACCEPTANCE CRITERIA

### AC-001: 7 chips scrollable
**GIVEN** the archetype filter component is rendered
**WHEN** the component mounts
**THEN** 7 chips are displayed horizontally: "All" + 6 archetype chips (Twisties, Mountain, Coastal, Adventure, Scenic Byway, Desert)
**AND** the chips are horizontally scrollable when they exceed screen width
**AND** each chip displays a count of matching routes

**Verify:** Render component, verify all 7 chips visible with counts.

### AC-002: Multi-select works
**GIVEN** the archetype filter is rendered
**WHEN** the user taps one or more archetype chips
**THEN** the selected chips highlight with the copper accent
**AND** the `onSelectionChange` callback fires with the updated selection array
**AND** multiple chips can be active simultaneously

**Verify:** Tap "Twisties" and "Mountain", verify both highlighted and callback fires.

### AC-003: All clears filter
**GIVEN** one or more archetype chips are selected
**WHEN** the user taps the "All" chip
**THEN** all archetype selections are cleared
**AND** the callback fires with an empty selection array
**AND** the "All" chip shows an active/selected state

**Verify:** Select archetypes, tap "All", verify all deselected.

### AC-004: Persists across sessions
**GIVEN** the user has selected specific archetypes
**WHEN** the app is closed and reopened
**THEN** the previously selected archetypes are still active
**AND** the corresponding chips show selected state

**Verify:** Select chips, kill app, reopen, verify selection restored. (Note: persistence wiring is in CUR-012, but the component must accept and render initial selection via props.)

---

## TEST CRITERIA

- [ ] 7 chips render (All + 6 archetypes) in horizontal scroll
- [ ] Each chip shows route count
- [ ] Multi-select works (multiple chips can be active)
- [ ] "All" chip clears all selections
- [ ] Active chips use copper accent color from semantic theme
- [ ] Uses existing Chip component (not a new chip implementation)
- [ ] No hardcoded hex colors
- [ ] Component renders without errors

---

## READING LIST

- `styles/RULES.md` -- Copper accent color, theme tokens
- `.spec/prds/curation/04-uc-discovery.md` -- UC-DISC-02 (Filter by Archetype)
- Existing Chip component in project

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `components/discovery/archetype-filter.tsx` (NEW)

**NEVER:**
- Create a new chip component (use existing Chip from the project)
- Use dropdown/modal for archetype selection
- Import real data hooks (use mock props)
- Hardcode hex colors

---

## CODE PATTERN

```typescript
// components/discovery/archetype-filter.tsx
import { useSemanticTheme } from '@theme/hooks/useSemanticTheme';
import { Chip } from 'react-native-paper';  // existing Chip component

const ARCHETYPES = [
  { key: 'all', label: 'All' },
  { key: 'twisties', label: 'Twisties' },
  { key: 'mountain', label: 'Mountain' },
  { key: 'coastal', label: 'Coastal' },
  { key: 'adventure', label: 'Adventure' },
  { key: 'scenic_byway', label: 'Scenic Byway' },
  { key: 'desert', label: 'Desert' },
] as const;

interface ArchetypeFilterProps {
  selected: string[];
  counts: Record<string, number>;
  onSelectionChange: (selected: string[]) => void;
}

export function ArchetypeFilter({ selected, counts, onSelectionChange }: ArchetypeFilterProps) {
  const { semantic } = useSemanticTheme();

  const handlePress = (key: string) => {
    if (key === 'all') {
      onSelectionChange([]);
      return;
    }
    const next = selected.includes(key)
      ? selected.filter(s => s !== key)
      : [...selected, key];
    onSelectionChange(next);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {ARCHETYPES.map(({ key, label }) => (
        <Chip
          key={key}
          selected={key === 'all' ? selected.length === 0 : selected.includes(key)}
          onPress={() => handlePress(key)}
          style={styles.chip}
        >
          {label} ({counts[key] ?? 0})
        </Chip>
      ))}
    </ScrollView>
  );
}
```

---

## AGENT INSTRUCTIONS

1. Read `styles/RULES.md` for theme tokens
2. Find and study the existing Chip component in the project
3. Create `archetype-filter.tsx` using the existing Chip component
4. Implement multi-select with toggle behavior
5. "All" chip clears selection; other chips toggle in/out of selection
6. Each chip displays a count from props
7. Use mock counts for design testing
8. All styling via useSemanticTheme()

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. Run `npm run typecheck` — must pass
2. Run `npm run lint` — zero lint errors
3. Verify `archetype-filter.tsx` uses existing Chip component (not a custom implementation)
4. Verify 7 chips render (All + 6 archetypes)
5. Verify multi-select logic (can select multiple, "All" clears all)
6. Verify no hardcoded hex colors

---

## AGENT ASSIGNMENT

**Primary:** frontend-designer
**Reason:** Presentational component — chip layout, styling, and selection state.

---

## EVIDENCE GATES

- [ ] `components/discovery/archetype-filter.tsx` exists and renders 7 chips
- [ ] Uses existing Chip component
- [ ] Multi-select works
- [ ] TypeScript compiles cleanly
- [ ] No hardcoded hex colors

---

## REVIEW CRITERIA

- Uses existing Chip component (no custom chip implementation)
- Horizontal scrolling works smoothly
- Selected chips are visually distinct (copper accent)
- Count badges are legible and do not crowd the label
- "All" chip behavior is intuitive
- Chip labels match the 6 archetype enum values

---

## DEPENDENCIES

- **DESIGN-001** — RouteDiscoveryScreen provides the context for the filter bar

---

## NOTES

- The 6 archetypes are: twisties, mountain, coastal, adventure, scenic_byway, desert.
- Display labels should be human-readable: "Scenic Byway" not "scenic_byway".
- The component accepts `selected` and `counts` as props — persistence is handled by the parent (CUR-012).
