# DESIGN-003: CuratedRouteDetailsSheet Bottom Sheet

**Task ID:** DESIGN-003
**Epic:** Epic 4 - Discovery UI & Data Flywheel
**Assigned To:** frontend-designer
**Priority:** P0
**Effort:** M
**Estimate:** 120 min
**Type:** [DESIGN]
**Depends On:** DESIGN-001 (RouteDiscoveryScreen layout)

---

## BACKGROUND

The CuratedRouteDetailsSheet is a bottom sheet that appears when a user taps a route pin on the discovery map (UC-DISC-05). It shows the route name, archetype badge, composite score as a visual bar (0-10 scale), 3 highlights, attribute bars (curviness/scenery/traffic/challenge), distance, length, and action buttons (Show on Map, Save, Hide). The sheet supports swipe-to-dismiss.

This is a DESIGN task — the component receives route data as props and renders visually. CUR-014 will wire the "Show on Map" and feedback actions.

**PRD references:** UC-DISC-05 (View Route Details), styles/RULES.md.

---

## ACCEPTANCE CRITERIA

### AC-001: All fields render
**GIVEN** route data is passed to the details sheet
**WHEN** the sheet opens
**THEN** the following fields are displayed: route name, archetype badge, composite score (visual bar 0-10), 3 highlights, attribute bars (curviness, scenery, traffic, challenge), distance from user, route length
**AND** the sheet uses BottomSheetWrapper (existing pattern)
**AND** the layout is scrollable for smaller screens

**Verify:** Open sheet with mock route data, verify all fields render correctly.

### AC-002: Swipe dismisses
**GIVEN** the route details sheet is open
**WHEN** the user swipes down on the sheet
**THEN** the sheet animates closed
**AND** the map returns to the pin display state
**AND** the selected pin is deselected

**Verify:** Open sheet, swipe down, verify smooth dismiss animation.

### AC-003: Show on Map closes sheet and shows polyline
**GIVEN** the route details sheet is open
**WHEN** the user taps "Show on Map"
**THEN** the sheet closes
**AND** the `onShowOnMap(routeId)` callback is fired
**AND** the parent component can render the route polyline on the map

**Verify:** Tap "Show on Map", verify callback fires and sheet closes.

### AC-004: Save logs feedback
**GIVEN** the route details sheet is open
**WHEN** the user taps "Save" (bookmark icon)
**THEN** the `onSave(routeId)` callback is fired
**AND** the save icon toggles to filled/active state (optimistic update)
**AND** the user receives visual confirmation (icon state change)

**Verify:** Tap Save, verify callback fires and icon toggles.

### AC-005: Hide requires confirmation
**GIVEN** the route details sheet is open
**WHEN** the user taps "Hide"
**THEN** a confirmation dialog appears: "Hide this route?"
**AND** confirming fires `onHide(routeId)` and closes the sheet
**AND** canceling dismisses the confirmation only (sheet stays open)

**Verify:** Tap Hide, verify confirmation dialog. Confirm and verify callback + sheet close.

---

## TEST CRITERIA

- [ ] All route fields render (name, badge, score, highlights, attributes, distance, length)
- [ ] Score renders as visual bar (0-10 scale)
- [ ] Attribute bars render for curviness, scenery, traffic, challenge
- [ ] Swipe-to-dismiss works
- [ ] "Show on Map" button fires callback and closes sheet
- [ ] "Save" button toggles icon state and fires callback
- [ ] "Hide" button shows confirmation dialog before firing callback
- [ ] All colors from useSemanticTheme (no hardcoded hex)
- [ ] Sheet uses BottomSheetWrapper pattern
- [ ] Component renders without errors

---

## READING LIST

- `styles/RULES.md` -- Theme tokens, copper accent, surface colors
- `.spec/prds/curation/04-uc-discovery.md` -- UC-DISC-05 (View Route Details)
- Existing bottom sheet patterns in project (BottomSheetWrapper)

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `components/discovery/curated-route-details-sheet.tsx` (NEW) — Main details sheet
- `components/discovery/score-indicator.tsx` (NEW) — Visual score bar (0-10)
- `components/discovery/attribute-bar.tsx` (NEW) — Attribute progress bar

**NEVER:**
- Duplicate existing RouteDetailsSheet (if one exists for user routes — this is for curated routes)
- Use regular TextInput in a Gorhom sheet (use KeyboardAvoidingInput if needed)
- Import real data hooks (design task — use mock props)
- Hardcode hex colors

---

## CODE PATTERN

```typescript
// components/discovery/curated-route-details-sheet.tsx
import { useSemanticTheme } from '@theme/hooks/useSemanticTheme';
import { BottomSheetWrapper } from '@components/common/BottomSheetWrapper';

interface CuratedRouteDetailsSheetProps {
  visible: boolean;
  route: CuratedRouteDetails | null;
  isSaved: boolean;
  onDismiss: () => void;
  onShowOnMap: (routeId: string) => void;
  onSave: (routeId: string) => void;
  onHide: (routeId: string) => void;
}

export function CuratedRouteDetailsSheet({
  visible, route, isSaved, onDismiss, onShowOnMap, onSave, onHide
}: CuratedRouteDetailsSheetProps) {
  const { semantic } = useSemanticTheme();
  const [confirmHide, setConfirmHide] = useState(false);

  if (!visible || !route) return null;

  return (
    <BottomSheetWrapper visible={visible} onDismiss={onDismiss}>
      <ScrollView>
        {/* Header: name + archetype badge */}
        <Text style={styles.name}>{route.name}</Text>
        <Badge label={route.archetype} />

        {/* Score indicator (0-10 visual bar) */}
        <ScoreIndicator score={route.compositeScore} />

        {/* 3 highlights */}
        {route.highlights.map(h => (
          <Text key={h}>* {h}</Text>
        ))}

        {/* Attribute bars */}
        <AttributeBar label="Curviness" value={route.curvatureScore} />
        <AttributeBar label="Scenery" value={route.scenicScore} />
        <AttributeBar label="Traffic" value={route.trafficScore} />
        <AttributeBar label="Challenge" value={route.technicalScore} />

        {/* Distance + length */}
        <Text>{route.distance} away  |  {route.lengthMiles} miles</Text>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Button onPress={() => onShowOnMap(route.routeId)}>Show on Map</Button>
          <IconButton
            icon={isSaved ? 'bookmark' : 'bookmark-outline'}
            onPress={() => onSave(route.routeId)}
          />
          <Button onPress={() => setConfirmHide(true)}>Hide</Button>
        </View>
      </ScrollView>

      {/* Hide confirmation dialog */}
      {confirmHide && (
        <ConfirmationDialog
          title="Hide this route?"
          onConfirm={() => { onHide(route.routeId); setConfirmHide(false); }}
          onCancel={() => setConfirmHide(false)}
        />
      )}
    </BottomSheetWrapper>
  );
}
```

---

## AGENT INSTRUCTIONS

1. Read `styles/RULES.md` for theme tokens and design patterns
2. Study existing BottomSheetWrapper pattern in the project
3. Create `curated-route-details-sheet.tsx` with all fields and action buttons
4. Create `score-indicator.tsx` — a visual progress bar for the 0-10 composite score
5. Create `attribute-bar.tsx` — a labeled progress bar for route attributes (0.0-1.0 scale)
6. Use mock route data for design testing
7. Ensure swipe-to-dismiss works via BottomSheetWrapper
8. Add confirmation dialog for Hide action
9. All styling via useSemanticTheme()

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. Run `npm run typecheck` — must pass
2. Run `npm run lint` — zero lint errors
3. Verify all three new files exist with correct exports
4. Verify score-indicator renders a visual bar (not just a number)
5. Verify attribute-bar has label + progress fill
6. Verify Hide action has confirmation step
7. Verify no hardcoded hex colors

---

## AGENT ASSIGNMENT

**Primary:** frontend-designer
**Reason:** Presentational component with visual design elements (score bars, attribute bars, action buttons).

---

## EVIDENCE GATES

- [ ] `components/discovery/curated-route-details-sheet.tsx` exists
- [ ] `components/discovery/score-indicator.tsx` exists
- [ ] `components/discovery/attribute-bar.tsx` exists
- [ ] TypeScript compiles cleanly
- [ ] No hardcoded hex colors

---

## REVIEW CRITERIA

- All lean fields rendered in an organized, scannable layout
- Score indicator is visually prominent and uses copper accent
- Attribute bars use appropriate colors (green for good traffic, etc.)
- Action buttons are clearly labeled and accessible
- Hide confirmation prevents accidental dismissal
- Sheet is scrollable for long content on small screens
- Bottom sheet animation is smooth

---

## DEPENDENCIES

- **DESIGN-001** — RouteDiscoveryScreen provides the map context where the sheet appears

---

## NOTES

- The composite score should display as a 0-10 visual bar (not 0.0-1.0 — the raw database value is 0.0-1.0 but display should multiply by 10 for the visual).
- Attribute bars use the raw 0.0-1.0 database values directly.
- Traffic score is inverted (1.0 = low traffic = good), so the bar should visually indicate "better" as more filled.
- The "Show on Map" button is the primary action — make it visually prominent.
