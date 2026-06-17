# Home Empty State Spec

**Task:** DESIGN-S01-003  
**Component:** Home empty/invite overlay (testID `home-empty-state`)  
**Scope:** Visual spec for the no-route empty state showing discovery invite and empty catalog messaging

---

## 1. Gating Condition

The empty-state overlay renders **only** when both of the following conditions are true:

```typescript
show_when: hasActiveRoute === false AND transcriptMessages.length === 0
```

**Source details:**
- `hasActiveRoute`: Derived from `!!agentActiveOption` in `app/(app)/(tabs)/index.tsx` line 252
- `transcriptMessages`: Raw transcript messages filtered array from `useQuery(api.db.sessionMessages.list, ...)` in `index.tsx` line 304-307

**Visual behavior:**
- Overlay is hidden when a route is displayed on the map (UC-DISC-09)
- Overlay re-shows when the route is cleared and transcript is empty
- Overlay hides when any transcript messages exist (conversational state)

---

## 2. Copy Strings and Typography

### Discovery Invite (Primary)

**Copy:** `"Discover roads near you"`  
**Typography:** `semantic.type.body.md` + `fontStyle: 'italic'`
- fontSize: 12
- lineHeight: 18
- fontWeight: 400
- fontStyle: italic

**Color:** `semantic.color.onSurface.muted`
- Light: `#6B6460`
- Dark: `#9CA3AF`

**Display:** Always shown when overlay is visible

---

### Empty Catalog (Secondary)

**Copy:** `"No routes near you yet"`  
**Typography:** `semantic.type.body.sm`
- fontSize: 11
- lineHeight: 16
- fontWeight: 400

**Color:** `semantic.color.onSurface.muted`
- Light: `#6B6460`
- Dark: `#9CA3AF`

**Display:** Shown only when `useCuratedDiscovery` returns `isEmpty === true` (routes === [])
- Hidden during loading (`isLoading === true`)
- Hidden when routes exist

**Source:** Curated discovery hook at `app/(app)/(tabs)/index.tsx` lines 255-259

---

## 3. Layout and Visual Spec

### Container Styles

| Property | Token Path | Resolved Value | Notes |
|----------|------------|----------------|-------|
| **Background** | `semantic.color.surface.glass` | Light: `rgba(253,251,248,0.72)`, Dark: `rgba(45,34,24,0.72)` | 72% alpha glassmorphic scrim — NOT surface.overlay (92%) |
| **Border Radius** | `semantic.radius.lg` | 14pt | Rounded pill shape |
| **Padding Horizontal** | `semantic.space.xl` | 24pt | Horizontal internal spacing |
| **Padding Vertical** | `semantic.space.lg` | 16pt | Vertical internal spacing |
| **Elevation** | `semantic.elevation[2]` | shadowOpacity 0.21, shadowRadius 6, elevation 2 | Subtle elevation over map |

### Positioning

- **Position:** Absolute
- **Bottom:** Positioned above ChatInput with `semantic.space.md` (12pt) margin
  - Approximate ChatInput height: 90pt (including suggestion chips area)
  - `bottom` value = ChatInput height + `semantic.space.md`
- **Alignment:** Centered horizontally via `alignSelf: 'center'` or `left: 0, right: 0` with `alignItems: 'center'`
- **Text Alignment:** Center

### Visual Treatment

The overlay appears as a glassmorphic floating pill above the input area:
- Translucent scrim background allows map to show through
- Subtle elevation creates depth without heavy shadow
- Centered positioning draws attention to the discovery messaging

---

## 4. zIndex and Interaction Model

### zIndex Specification

**Value:** `zIndex: 10`

**Rationale:** ChatInput uses `zIndex: 20` in `components/chat/chat-input.tsx` StyleSheet line 417. The empty-state overlay must render below ChatInput so it does not intercept suggestion pill tap events. Suggestion chips (testID `chat-input-suggestion-chips`) must remain tappable.

**Critical constraint:** Never specify `zIndex` higher than ChatInput (20). The overlay must be at the lower layer to allow tap-through to suggestion pills.

---

### Pointer Events

**Value:** `pointerEvents='none'`

**Rationale:** The overlay is purely informational and must not block taps on the suggestion chips area below it. With `pointerEvents='none'`, touch events pass through the overlay to interactive elements beneath.

---

## 5. For DISC-017 Implementer

The empty-state overlay is rendered in the suggestion slot that falls back to this state. The implementer for DISC-017 is responsible for rendering this overlay when:
- `hasActiveRoute === false`
- `transcriptMessages.length === 0`
- The suggestion slot has no curated routes to display (empty catalog) or is loading

**Integration notes:**
- The `useCuratedDiscovery` hook provides `isLoading`, `isEmpty`, and `routes` states
- During loading, show discovery invite only (hide empty catalog line)
- When `isEmpty === true`, show both discovery invite and empty catalog lines
- When routes exist, hide the entire overlay (suggestion pills render instead)

---

## Token Cross-References

**Glass Background** (`color.surface.glass`):
- Defined in `tokens/semantic/colors.tokens.json` lines 26-30
- Light: `rgba(253,251,248,0.72)` — 72% alpha on paper-50
- Dark: `rgba(45,34,24,0.72)` — 72% alpha on ink-700

**Muted Text Color** (`color.onSurface.muted`):
- Defined in `tokens/semantic/colors.tokens.json` lines 58-61
- Light: `#6B6460` — ink-300
- Dark: `#9CA3AF` — ink-200

**Typography Tokens:**
- `semantic.type.body.md`: fontSize 12, lineHeight 18, fontWeight 400 (lines 653-665)
- `semantic.type.body.sm`: fontSize 11, lineHeight 16, fontWeight 400 (lines 639-651)

**Spacing Tokens:**
- `semantic.space.lg`: 16pt (lines 542-544)
- `semantic.space.xl`: 24pt (lines 546-548)

**Radius Token:**
- `semantic.radius.lg`: 14pt (lines 576-578)

**Elevation Token:**
- `semantic.elevation[2]`: shadowOpacity 0.21, shadowRadius 6, elevation 2 (lines 873-900 light, 1071-1098 dark)

---

## Verification

After implementation, verify:
1. Overlay appears when no route is on map and transcript is empty
2. Overlay is hidden when a route is plotted on map
3. Overlay is hidden when transcript has messages
4. Taps on suggestion chips pass through the overlay (overlay does not intercept)
5. Empty catalog line shows only when curated routes are empty (not during loading)
6. Discovery invite is styled as italic with muted color
7. Background uses `surface.glass` (72% alpha), not `surface.overlay` (92%)
8. All colors reference semantic tokens (no hardcoded hex)
9. Touch targets meet `semantic.control.minTouchTarget` (44pt) if interactive elements are added
10. Run `pnpm tokens:validate` to confirm all token paths are valid