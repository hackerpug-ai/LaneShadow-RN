# DESIGN-008: Route Feedback Actions: Save, Hide, Rate Patterns

**Task ID:** DESIGN-008
**Epic:** Epic 4 - Discovery UI & Data Flywheel
**Assigned To:** frontend-designer
**Priority:** P2
**Effort:** S
**Estimate:** 60 min
**Type:** [DESIGN]
**Depends On:** DESIGN-003 (CuratedRouteDetailsSheet)

---

## BACKGROUND

This task designs the feedback action components for the data flywheel: a Save toggle (bookmark icon with optimistic update), a Hide action with confirmation, and a post-ride rating sheet (5 stars). These components enable the feedback loop described in S3-FLY where rider actions (save, hide, rate) feed back into route quality scoring over time.

This is a DESIGN task — components receive callbacks as props. CUR-014 will wire the Save/Hide actions. Rating is a P2 feature for post-ride feedback collection.

**PRD references:** S3-FLY (Data Flywheel), UC-DISC-05 (View Route Details), styles/RULES.md.

---

## ACCEPTANCE CRITERIA

### AC-001: Save optimistic update + feedback log
**GIVEN** the route feedback actions component is rendered for a route
**WHEN** the user taps the Save toggle (bookmark icon)
**THEN** the icon immediately toggles between outline and filled states (optimistic)
**AND** the `onSaveToggle(routeId, isSaved)` callback fires
**AND** the visual state change occurs before any network confirmation

**Verify:** Tap Save, verify immediate icon toggle. Tap again, verify toggle back to unsaved.

### AC-002: Hide requires confirmation
**GIVEN** the route feedback actions component is rendered
**WHEN** the user taps the Hide action
**THEN** a confirmation dialog appears with message "Hide this route from discovery?"
**AND** confirming fires `onHide(routeId)` callback
**AND** canceling dismisses the dialog without action
**AND** the Hide action uses a warning/intent color for the button

**Verify:** Tap Hide, verify confirmation appears. Cancel, verify no action. Confirm, verify callback.

### AC-003: Rate after ride completion
**GIVEN** a ride has been completed (ride state is "completed")
**WHEN** the post-ride rating sheet is presented
**THEN** a 5-star rating interface appears
**AND** each star is tappable for ratings 1-5
**AND** tapping a star highlights that star and all preceding stars
**AND** submitting fires `onRate(routeId, rating)` callback
**AND** the sheet can be dismissed without rating ("Skip" option)

**Verify:** Present rating sheet, tap 4 stars, verify highlight and callback on submit.

---

## TEST CRITERIA

- [ ] Save toggle renders with bookmark icon (outline/filled states)
- [ ] Save toggle has optimistic visual update
- [ ] Hide button renders with confirmation dialog
- [ ] Confirmation dialog has Confirm and Cancel options
- [ ] Rating sheet renders 5 tappable stars
- [ ] Star highlight cascades (1-5 from left to right)
- [ ] Rating sheet has "Skip" dismiss option
- [ ] All colors from useSemanticTheme (no hardcoded hex)
- [ ] Components render without errors

---

## READING LIST

- `styles/RULES.md` -- Theme tokens, intent colors (warning for Hide)
- `.spec/prds/curation/04-uc-discovery.md` -- UC-DISC-05
- `.spec/prds/curation/09-technical-requirements.md` -- Data Flywheel component

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `components/discovery/route-feedback-actions.tsx` (NEW) — Save/Hide action row
- `components/discovery/post-ride-rating-sheet.tsx` (NEW) — Post-ride 5-star rating

**NEVER:**
- Show rating during an active ride (only post-completion)
- Import real data hooks (use mock props and callbacks)
- Hardcode hex colors
- Allow Hide without confirmation

---

## CODE PATTERN

```typescript
// components/discovery/route-feedback-actions.tsx
import { useSemanticTheme } from '@theme/hooks/useSemanticTheme';

interface RouteFeedbackActionsProps {
  routeId: string;
  isSaved: boolean;
  onSaveToggle: (routeId: string, isSaved: boolean) => void;
  onHide: (routeId: string) => void;
}

export function RouteFeedbackActions({ routeId, isSaved, onSaveToggle, onHide }: RouteFeedbackActionsProps) {
  const { semantic } = useSemanticTheme();
  const [confirmHide, setConfirmHide] = useState(false);

  return (
    <View style={styles.container}>
      <IconButton
        icon={isSaved ? 'bookmark' : 'bookmark-outline'}
        onPress={() => onSaveToggle(routeId, !isSaved)}
        iconColor={isSaved ? semantic.color.primary : semantic.color.onSurface}
      />
      <Button
        mode="text"
        onPress={() => setConfirmHide(true)}
        textColor={semantic.color.danger}
      >
        Hide
      </Button>

      {confirmHide && (
        <ConfirmationDialog
          title="Hide this route from discovery?"
          onConfirm={() => { onHide(routeId); setConfirmHide(false); }}
          onCancel={() => setConfirmHide(false)}
        />
      )}
    </View>
  );
}
```

```typescript
// components/discovery/post-ride-rating-sheet.tsx
import { useSemanticTheme } from '@theme/hooks/useSemanticTheme';

interface PostRideRatingSheetProps {
  visible: boolean;
  routeName: string;
  onRate: (rating: number) => void;
  onSkip: () => void;
}

export function PostRideRatingSheet({ visible, routeName, onRate, onSkip }: PostRideRatingSheetProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const { semantic } = useSemanticTheme();

  if (!visible) return null;

  return (
    <BottomSheetWrapper visible={visible} onDismiss={onSkip}>
      <Text>How was your ride?</Text>
      <Text>{routeName}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
            <Icon
              name={star <= selectedRating ? 'star' : 'star-outline'}
              color={star <= selectedRating ? semantic.color.primary : semantic.color.onSurface}
              size={32}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Button onPress={() => onRate(selectedRating)} disabled={selectedRating === 0}>
        Submit
      </Button>
      <Button mode="text" onPress={onSkip}>Skip</Button>
    </BottomSheetWrapper>
  );
}
```

---

## AGENT INSTRUCTIONS

1. Read `styles/RULES.md` for theme tokens and intent colors
2. Create `route-feedback-actions.tsx` with Save toggle and Hide button with confirmation
3. Create `post-ride-rating-sheet.tsx` with 5-star rating interface
4. Save toggle uses optimistic UI (immediate icon state change)
5. Hide uses danger/warning color and requires confirmation
6. Rating sheet shows stars that cascade-highlight on tap
7. Rating sheet has Skip option for dismissal without rating
8. Use mock callbacks for design testing

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. Run `npm run typecheck` — must pass
2. Run `npm run lint` — zero lint errors
3. Verify `route-feedback-actions.tsx` has optimistic save toggle
4. Verify Hide action has confirmation dialog
5. Verify `post-ride-rating-sheet.tsx` has 5-star rating with cascade highlight
6. Verify no hardcoded hex colors

---

## AGENT ASSIGNMENT

**Primary:** frontend-designer
**Reason:** Presentational components — icons, rating stars, confirmation dialogs.

---

## EVIDENCE GATES

- [ ] `components/discovery/route-feedback-actions.tsx` exists with Save/Hide
- [ ] `components/discovery/post-ride-rating-sheet.tsx` exists with 5-star rating
- [ ] TypeScript compiles cleanly
- [ ] No hardcoded hex colors

---

## REVIEW CRITERIA

- Save toggle provides instant visual feedback (optimistic)
- Hide confirmation is clear and uses warning styling
- Star rating is intuitive (tap to rate, cascade highlight)
- Skip option respects user choice not to rate
- Action buttons are accessible and appropriately sized for touch targets
- Feedback actions match the LaneShadow visual style (copper accent, warm tones)

---

## DEPENDENCIES

- **DESIGN-003** — CuratedRouteDetailsSheet provides the context where feedback actions appear

---

## NOTES

- The post-ride rating sheet is a P2 feature. It may not be wired to a real API immediately, but the design component should be ready for integration.
- The Save toggle should support both "save" and "unsave" (toggle behavior), not just save.
- The Hide confirmation dialog should use the danger intent color for the "Hide" confirm button.
- The rating sheet is triggered after ride completion, not during an active ride. The parent component controls visibility based on ride state.
