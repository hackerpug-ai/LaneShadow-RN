# Home Empty State Design Spec

**Task:** DESIGN-S01-003
**Test ID:** `home-empty-state`
**Sprint:** 01 — Discovery on the Route Plan View

---

## Gating Condition

The empty-state overlay displays ONLY when BOTH of the following conditions are true:

```
hasActiveRoute === false AND transcriptMessages.length === 0
```

### Source Definitions

- **`hasActiveRoute`**: Derived from `!!agentActiveOption` in `app/(app)/(tabs)/index.tsx` line 257
- **`transcriptMessages`**: The filtered array of session messages from `useQuery(api.db.sessionMessages.list, ...)` in `index.tsx`

### Behavior

- **Visible** when: No route is active AND no transcript messages exist (fresh home state)
- **Hidden** when: A route appears on the map OR any transcript message exists
- **Re-shows** when: Route is cleared and no messages remain

---

## Copy Strings and Typography

### Discovery Invite Line

**Copy:** `"Discover roads near you"`

**Typography:**
- Token: `semantic.type.body.md`
- Font size: `12pt`
- Line height: `18pt`
- Font weight: `400`
- Font style: `italic`

**Color:**
- Token: `semantic.color.onSurface.muted`

---

### Empty Catalog Line

**Copy:** `"No routes near you yet"`

**Gating Condition:** Shown ONLY when `useCuratedDiscovery` returns `isEmpty === true` (routes array is empty). Hidden during loading (`isLoading === true`) and hidden when routes exist.

**Typography:**
- Token: `semantic.type.body.sm`
- Font size: `11pt`
- Line height: `16pt`
- Font weight: `400`

**Color:**
- Token: `semantic.color.onSurface.muted`

---

## Layout and Visual Spec

### Container

**Background:**
- Token: `semantic.color.surface.glass`
- Light mode: `rgba(253,251,248,0.72)` — 72% alpha
- Dark mode: `rgba(45,34,24,0.72)` — 72% alpha
- **NOT** `semantic.color.surface.overlay` (which is 92% alpha)

**Border Radius:**
- Token: `semantic.radius.lg`
- Value: `14pt`

**Padding:**
- Horizontal: `semantic.space.xl` — `24pt`
- Vertical: `semantic.space.lg` — `16pt`

**Elevation:**
- Token: `semantic.elevation[2]`

### Positioning

- Position: `absolute`
- Bottom: Positioned above the ChatInput component
- Bottom offset: ChatInput height (~90pt including suggestion chips) + `semantic.space.md` (12pt) margin
- **Alternative:** Use ChatInput's `bottomOffset` prop via component's own marginBottom

### Alignment

- Horizontal: `alignSelf: 'center'` OR `left: 0, right: 0` with `alignItems: 'center'`
- Text alignment: `center`

---

## zIndex and Interaction Model

### zIndex Value

**zIndex:** `10`

### Rationale

The ChatInput component uses `zIndex: 20` (defined in `components/chat/chat-input.tsx` StyleSheet line 417). The empty-state overlay MUST render below ChatInput so that suggestion pill tap events pass through to the ChatInput.

**Rule:** The empty-state overlay MUST have zIndex ≤ 10 to ensure it does not intercept touch events on the suggestion chips (testID `chat-input-suggestion-chips`).

### Pointer Events

The overlay View should have:

```tsx
pointerEvents="none"
```

**Rationale:** The overlay is purely informational. Setting `pointerEvents="none"` ensures that taps on the suggestion chips area are NOT blocked by the empty-state overlay.

### Interaction Flow

1. User opens app with no route → Empty-state overlay is visible
2. User taps a suggestion pill → Route appears → Empty-state overlay is hidden
3. User clears the route → Empty-state overlay re-appears (if no messages exist)

---

## Token Reference Summary

| Purpose | Token Path |
|---------|------------|
| Background | `semantic.color.surface.glass` |
| Copy color | `semantic.color.onSurface.muted` |
| Discovery typography | `semantic.type.body.md` |
| Empty catalog typography | `semantic.type.body.sm` |
| Border radius | `semantic.radius.lg` |
| Padding horizontal | `semantic.space.xl` |
| Padding vertical | `semantic.space.lg` |
| Bottom margin | `semantic.space.md` |
| Elevation | `semantic.elevation[2]` |

---

## Implementation Notes

1. **testID**: The overlay View or its wrapper MUST have `testID="home-empty-state"` for automated testing
2. **No hardcoded colors**: All colors MUST use semantic token paths via `useSemanticTheme()`
3. **Do NOT use `surface.overlay`**: The overlay token is 92% alpha and is reserved for modals. This component uses the 72% alpha `surface.glass` token.
4. **Two-variant copy**: The discovery invite line is always shown; the empty catalog line is conditionally shown based on `useCuratedDiscovery.isEmpty`
5. **Font style italic**: The discovery invite line requires `fontStyle: 'italic'` — this is intentional design, not a typo