# DESIGN-002: RoutePin Archetype-Badged Map Pin

**Task ID:** DESIGN-002
**Epic:** Epic 3 - Local Discovery Layer & React Hooks
**Assigned To:** frontend-designer
**Priority:** P0
**Effort:** M
**Estimate:** 120 min
**Type:** [DESIGN]
**Depends On:** DESIGN-001 (RouteDiscoveryScreen layout)

---

## BACKGROUND

The RoutePin is the map pin component for route discovery. Each pin shows a copper circle body with an archetype icon badge, an optional rank number (top 10 in "Best" sort), and a distance label ("Nearest" sort). The pin must be compact (< 44x44dp), use semantic theme tokens, and provide press-state feedback.

This is a DESIGN task — the component receives route data as props and renders visually. The data connection will be made by CUR-012.

**PRD references:** UC-DISC-01 (pins on map), UC-DISC-04 (rank badge for Best, distance for Nearest), styles/RULES.md.

---

## ACCEPTANCE CRITERIA

### AC-001: Pin renders with archetype icon
**GIVEN** a route pin component with archetype data
**WHEN** the pin is rendered on the map
**THEN** the pin displays a copper circle body
**AND** an archetype icon is overlaid (e.g., winding road for twisties, mountain for mountain)
**AND** the pin size does not exceed 44x44dp
**AND** colors come from `useSemanticTheme()` — copper accent for the body

**Verify:** Render pins for all 6 archetypes, verify each shows the correct icon.

### AC-002: Rank badge for top-10 Best sort
**GIVEN** the sort mode is "Best" and the route is in the top 10
**WHEN** the pin is rendered
**THEN** a small rank number (1-10) is displayed as a badge on the pin
**AND** the badge is positioned in the top-right corner of the pin
**AND** the badge uses the copper accent color with contrasting text

**Verify:** Render 10 pins with ranks 1-10, verify badge positioning and styling.

### AC-003: Distance label for Nearest sort
**GIVEN** the sort mode is "Nearest" and a distance value is provided
**WHEN** the pin is rendered
**THEN** a distance label appears below the pin (e.g., "3.2 mi")
**AND** the label uses a semi-transparent background for readability
**AND** the label does not overlap other pin elements

**Verify:** Render pins with various distances, verify labels render cleanly.

### AC-004: Press state feedback
**GIVEN** a route pin is rendered on the map
**WHEN** the user presses/taps the pin
**THEN** visual feedback is provided (scale animation or opacity change)
**AND** the press state is clearly distinguishable from the default state
**AND** the feedback animation is smooth (< 200ms)

**Verify:** Tap a pin and observe visual press feedback.

---

## TEST CRITERIA

- [ ] Pin renders for all 6 archetypes with correct icons
- [ ] Pin body is copper circle from semantic theme tokens
- [ ] Pin size is <= 44x44dp
- [ ] Rank badge renders for top-10 routes in Best sort mode
- [ ] Distance label renders for routes in Nearest sort mode
- [ ] Press state provides visual feedback
- [ ] No hardcoded hex colors (all from useSemanticTheme)
- [ ] No elevation > 3 on any element
- [ ] Component renders without errors

---

## READING LIST

- `styles/RULES.md` -- Color tokens (Copper #B87333 primary), design priorities
- `.spec/prds/curation/04-uc-discovery.md` -- UC-DISC-01, UC-DISC-04
- Existing `components/map/` -- Mapbox marker patterns

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `components/discovery/route-pin.tsx` (NEW)

**NEVER:**
- Use elevation > 3 on any element
- Hardcode hex colors
- Make pin larger than 44x44dp
- Import real data hooks or Zustand stores
- Use Mapbox default markers (custom React Native View-based markers only)

---

## CODE PATTERN

```typescript
// components/discovery/route-pin.tsx
import { useSemanticTheme } from '@theme/hooks/useSemanticTheme';
import { MarkerView } from '@rnmapbox/maps';

interface RoutePinProps {
  routeId: string;
  archetype: Archetype;
  rank?: number;        // 1-10 for Best sort, undefined otherwise
  distance?: string;    // "3.2 mi" for Nearest sort, undefined otherwise
  onPress: (routeId: string) => void;
}

export function RoutePin({ routeId, archetype, rank, distance, onPress }: RoutePinProps) {
  const { semantic } = useSemanticTheme();
  const [pressed, setPressed] = useState(false);

  return (
    <MarkerView coordinate={[lng, lat]}>
      <TouchableOpacity
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={() => onPress(routeId)}
        style={styles.pinContainer}
      >
        {/* Copper circle body */}
        <View style={[styles.pinBody, { backgroundColor: semantic.color.primary }]}>
          <ArchetypeIcon archetype={archetype} size={20} color={semantic.color.onPrimary} />
        </View>

        {/* Rank badge (top-10 Best sort) */}
        {rank != null && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        )}

        {/* Distance label (Nearest sort) */}
        {distance != null && (
          <View style={styles.distanceLabel}>
            <Text style={styles.distanceText}>{distance}</Text>
          </View>
        )}
      </TouchableOpacity>
    </MarkerView>
  );
}
```

---

## AGENT INSTRUCTIONS

1. Read `styles/RULES.md` for color tokens and design constraints
2. Study existing Mapbox marker patterns in `components/map/`
3. Create `route-pin.tsx` with `MarkerView`-based custom pin
4. Implement archetype icon mapping (6 archetypes → MaterialCommunityIcons or similar)
5. Add conditional rank badge (top-right, copper accent)
6. Add conditional distance label (below pin, semi-transparent background)
7. Add press-state feedback (scale or opacity animation)
8. Use mock props for design testing — no real data imports
9. Ensure pin dimensions stay within 44x44dp

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. Run `npm run typecheck` — must pass
2. Run `npm run lint` — zero lint errors
3. Verify `route-pin.tsx` uses `useSemanticTheme()` (no hardcoded hex)
4. Verify pin dimensions are within 44x44dp
5. Verify no elevation > 3
6. Verify component has onPress callback prop
7. Verify rank badge and distance label are conditional (only shown when provided)

---

## AGENT ASSIGNMENT

**Primary:** frontend-designer
**Reason:** Pure presentational component — visual design, iconography, animation.

---

## EVIDENCE GATES

- [ ] `components/discovery/route-pin.tsx` exists and exports `RoutePin`
- [ ] TypeScript compiles cleanly
- [ ] No hardcoded hex colors
- [ ] Pin size <= 44x44dp

---

## REVIEW CRITERIA

- Copper circle body using semantic theme primary color
- Archetype icons are distinct and recognizable at pin scale
- Rank badge is compact and does not obscure the archetype icon
- Distance label is legible against the map background
- Press feedback is subtle but noticeable
- Pin size respects the 44x44dp constraint

---

## DEPENDENCIES

- **DESIGN-001** — RouteDiscoveryScreen provides the map context where pins render

---

## NOTES

- Archetype icons should be from the project's icon library (MaterialCommunityIcons or similar). The 6 archetypes are: twisties, mountain, coastal, adventure, scenic_byway, desert.
- The rank badge should use a small circular shape (16x16dp or less) positioned at the top-right of the pin body.
- The distance label should be a small rounded pill shape below the pin with semi-transparent background.
