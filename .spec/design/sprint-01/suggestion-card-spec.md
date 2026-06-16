# Suggestion Card Visual Specification — Curated Pill Variant

**Sprint:** sprint-01-discovery-on-the-route-plan-view
**Task:** DESIGN-S01-001
**Document Version:** 1.0
**Generated:** 2026-06-16

---

## 1. Current State Audit — `SuggestionChips` Implementation

**File:** `components/chat/chat-input.tsx` (lines 75-150)

The `SuggestionChips` component renders horizontal scrollable suggestion pills with two variants:

1. **Generic text suggestions** — simple pills with no border
2. **Curated route suggestions** (`CuratedPill` with `routeId`) — styled as glassmorphic chips with copper accent

### Current Implementation (Lines 110-116)

```tsx
style={[
  styles.chip,
  isCurated
    ? {
        borderWidth: 1,
        borderColor: semantic.color.border.default,           // ❌ GAP 1
        borderRadius: semantic.radius.md,                     // ✅ CORRECT
        minHeight: 44,                                         // ⚠️ GAP 2 (magic number)
        backgroundColor: semantic.color.surface.default,      // ❌ GAP 3
        paddingHorizontal: semantic.space.md,                  // ✅ CORRECT
        paddingVertical: semantic.space.sm,                   // ✅ CORRECT
      }
    : { /* generic variant */ }
]}
```

### Icon Color (Line 127-130)

```tsx
<Icon
  source="road-variant"
  size={16}
  color={semantic.color.accent?.default ?? '#EE7C2B'}        // ❌ GAP 4 (unnecessary fallback)
/>
```

### Visibility Rule (Line 268)

```tsx
{isIdle && !hasActiveRoute && suggestions.length > 0 && !isPlanning && !chatMode && (
  <SuggestionChips ... />
)}
```

✅ **CORRECT** — matches required visibility condition. The spec confirms:
- `isIdle === true` (phase === 'IDLE')
- `hasActiveRoute === false` (derived from `!!agentActiveOption` at `app/(app)/(tabs)/index.tsx:257`)
- `suggestions.length > 0`
- `!isPlanning`
- `!chatMode`

---

## 2. Token Gap Table

| Location | Current Value | Gap Type | Required Token Path |
|----------|---------------|----------|---------------------|
| `chat-input.tsx:111` | `semantic.color.border.default` | wrong-token | `semantic.color.border.glass` (or `tokens/semantic/colors.tokens.json` → `color.border.glass`) |
| `chat-input.tsx:114` | `semantic.color.surface.default` | wrong-token | `semantic.color.surface.glass` (or `tokens/semantic/colors.tokens.json` → `color.surface.glass`) |
| `chat-input.tsx:113` | `minHeight: 44` (magic number) | magic-number | `semantic.control.minTouchTarget` (value: 44) |
| `chat-input.tsx:130` | `semantic.color.accent?.default ?? '#EE7C2B'` | unnecessary-fallback | `semantic.color.accent.default` only |
| `chat-input.tsx:110-122` | No elevation/shadow | missing-token | `semantic.elevation[2]` (shadowOpacity 0.21, shadowRadius 6, elevation 2) |
| N/A | Scroll container scrim | missing-scrim | TBD — decision needed: wrapping scrim View vs individual chip backgrounds |

### Token Path Details

**`semantic.color.surface.glass`**
- Defined in `tokens/semantic/colors.tokens.json` (lines 26-30)
- Light: `rgba(253,251,248,0.72)` — 72% alpha paper-50
- Dark: `rgba(45,34,24,0.72)` — 72% alpha ink-700
- This is the **canonical glassmorphic surface token** per `07-ui-infrastructure.md` §1

**`semantic.color.border.glass`**
- Defined in `tokens/semantic/colors.tokens.json` (lines 256-260)
- Light: `rgba(255,255,255,0.55)` — elevated translucent edge
- Dark: `rgba(242,238,232,0.22)` — reduced alpha for dark mode
- Required for glassmorphic chips on map overlays

**`semantic.color.accent.default`**
- Defined in `tokens/semantic/semantic.tokens.json` (lines 137-150, 399-412)
- Light: `#EE7C2B` (copper-500)
- Dark: `#EE7C2B` (unchanged)
- The `?? '#EE7C2B'` fallback is **unnecessary** — the token is stable in both light and dark themes

**`semantic.control.minTouchTarget`**
- Defined in `tokens/semantic/semantic.tokens.json` (lines 1439-1448, 1551-1556)
- Value: `44` pt
- Per `07-ui-infrastructure.md` §6: all touch targets ≥44pt

**`semantic.elevation[2]`**
- Defined in `tokens/semantic/semantic.tokens.json` (lines 873-900, 1071-1098)
- shadowColor: `#000000`
- shadowOffset: `{ width: 0, height: 2 }`
- shadowOpacity: `0.21`
- shadowRadius: `6`
- elevation: `2`

---

## 3. Chip Variant Spec — Curated Pill

### Prop Shape

```tsx
export interface CuratedPill {
  label: string       // Display text (e.g., "Canyon Loop · 12mi")
  routeId: string     // Route identifier for `onSelectRoute` dispatch
}
```

### Exact Style Specification

| Property | Value | Token Path |
|----------|-------|------------|
| Background | `rgba(253,251,248,0.72)` (light) / `rgba(45,34,24,0.72)` (dark) | `semantic.color.surface.glass` |
| Border width | `1` pt | `semantic.borderWidth.thin` |
| Border color | `rgba(255,255,255,0.55)` (light) / `rgba(242,238,232,0.22)` (dark) | `semantic.color.border.glass` |
| Border radius | `10` pt | `semantic.radius.md` |
| Min height | `44` pt | `semantic.control.minTouchTarget` |
| Padding horizontal | `12` pt | `semantic.space.md` |
| Padding vertical | `8` pt | `semantic.space.sm` |
| Elevation | shadowOpacity 0.21, shadowRadius 6, elevation 2 | `semantic.elevation[2]` |

### Icon Specification

| Property | Value | Token Path |
|----------|-------|------------|
| Source | `road-variant` (react-native-paper) | N/A (icon name constant) |
| Size | `16` pt | `semantic.iconSize.small` |
| Color | `#EE7C2B` (copper-500, unchanged in dark) | `semantic.color.accent.default` |

**Critical note:** The icon color MUST reference `semantic.color.accent.default` directly. Do NOT use the `?? '#EE7C2B'` fallback pattern — the token is stable in both themes.

### Label Text Specification

| Property | Value | Token Path |
|----------|-------|------------|
| Font size | `11` pt | `semantic.type.body.sm.fontSize` |
| Line height | `16` pt | `semantic.type.body.sm.lineHeight` |
| Font weight | `400` (base), `500` override for readability | `semantic.type.body.sm.fontWeight` |
| Color | `#1E1A16` (light) / `#F2EEE8` (dark) | `semantic.color.onSurface.default` |

**Note:** The current implementation overrides `fontWeight` to `500` (line 138) — this is **acceptable** for improved readability on small text.

### TestID

Pattern: `discovery-suggestion-pill-{routeId}`

**Current status:** ✅ **ALREADY CORRECT** at `chat-input.tsx:105`

---

## 4. Visibility Rule Specification

### Rendering Condition

The `SuggestionChips` component renders **only when** all of the following are true:

1. **Idle phase:** `isIdle === true` (i.e., `state.phase === 'IDLE'`)
2. **No active route:** `hasActiveRoute === false`
3. **Suggestions available:** `suggestions.length > 0`
4. **Not planning:** `!isPlanning`
5. **Not in chat mode:** `!chatMode`

### Implementation Verification

**Current code at `chat-input.tsx:268`:**

```tsx
{isIdle && !hasActiveRoute && suggestions.length > 0 && !isPlanning && !chatMode && (
  <SuggestionChips ... />
)}
```

✅ **VERIFIED CORRECT** — matches the required visibility rule exactly.

### `hasActiveRoute` Derivation

The `hasActiveRoute` prop is derived from `agentActiveOption` at `app/(app)/(tabs)/index.tsx:257`:

```tsx
const hasActiveRoute = !!agentActiveOption
```

When a route is selected and shown on the map, `agentActiveOption` is truthy, so `hasActiveRoute` becomes `true`, and suggestion chips are hidden.

---

## 5. For DISC-016/DISC-017 Implementer — Required Changes

### Required Token Substitutions (Find/Replace Table)

| Find (Line) | Replace With | Notes |
|-------------|--------------|-------|
| `borderColor: semantic.color.border.default` (line 111) | `borderColor: semantic.color.border.glass` | Glass border for overlay context |
| `backgroundColor: semantic.color.surface.default` (line 114) | `backgroundColor: semantic.color.surface.glass` | 72% alpha scrim for glassmorphic effect |
| `minHeight: 44` (line 113) | `minHeight: semantic.control.minTouchTarget` | Reference token, not magic number |
| `color={semantic.color.accent?.default ?? '#EE7C2B'}` (line 130) | `color={semantic.color.accent.default}` | Remove unnecessary fallback |

### Missing Elevation

Add elevation to the curated chip style object (after line 117):

```tsx
isCurated
  ? {
      borderWidth: 1,
      borderColor: semantic.color.border.glass,
      borderRadius: semantic.radius.md,
      minHeight: semantic.control.minTouchTarget,
      backgroundColor: semantic.color.surface.glass,
      paddingHorizontal: semantic.space.md,
      paddingVertical: semantic.space.sm,
      ...semantic.elevation[2], // ✅ ADD THIS LINE
    }
  : { /* generic variant */ }
```

### Scroll Container Scrum — Decision Required

**Question:** Does the `SuggestionChips` scroll container (the `ScrollView` at line 87) need a wrapping `surface.glass` scrim View behind it as a group?

**Options:**

1. **Individual chip backgrounds only** — current approach. Each chip has its own `surface.glass` background. No group scrim needed.
2. **Wrapping scrim View** — add a parent `View` with `backgroundColor: semantic.color.surface.glass` behind the `ScrollView` for a continuous glass strip.

**Recommendation:** **Option 1 (individual chip backgrounds only)** — this is the current implementation and matches the chip-pill pattern. A group scrim is unnecessary since chips are self-contained touch targets.

### Implementation Checklist

- [ ] Replace `border.default` with `border.glass`
- [ ] Replace `surface.default` with `surface.glass`
- [ ] Replace magic number `44` with `semantic.control.minTouchTarget`
- [ ] Remove `?? '#EE7C2B'` fallback from icon color
- [ ] Add `...semantic.elevation[2]` to curated chip style
- [ ] Verify `testID="discovery-suggestion-pill-{routeId}"` pattern (already correct)
- [ ] Verify `onSelectRoute` prop is wired (already correct at line 103)
- [ ] Verify visibility rule (already correct at line 268)

---

## 6. Legacy Anti-Pattern to Avoid

**Do NOT replicate the `CC` hex-alpha pattern from `route-attachment-card.tsx`**

Some existing code uses inline `rgba()` with hex-encoded alpha components (e.g., `rgba(18, 18, 18, 0xCC)` for 80% alpha). This is a legacy anti-pattern.

**Correct approach:** Always reference `semantic.color.surface.glass` (or other predefined alpha tokens) — never inline `rgba(..., 0.72)`.

The `surface.glass` token already defines the correct 72% alpha values for both light and dark themes. Use the token, not the raw value.

---

## 7. Verification Gates

### File-Level Checks

```bash
# Spec exists at canonical path
test -s .spec/design/sprint-01/suggestion-card-spec.md && echo PASS

# No token schema regressions
pnpm tokens:validate

# TypeScript check passes
pnpm type-check

# Biome lint passes
pnpm exec biome check .spec/design/sprint-01/suggestion-card-spec.md

# Scope compliance (only spec file modified)
git diff --name-only | grep -v '.spec/design/sprint-01/suggestion-card-spec.md' | wc -l | xargs -I{} test {} -eq 0 && echo SCOPE_CLEAN
```

### Token Validation Checks

```bash
# surface.glass token alias present
grep -q 'surface.glass' .spec/design/sprint-01/suggestion-card-spec.md && echo PASS

# minTouchTarget token citation present
grep -q 'minTouchTarget' .spec/design/sprint-01/suggestion-card-spec.md && echo PASS

# No hardcoded hex colors in 'Required token' column
# (Manual verification during review)
```

### Human Gate

**Sprint gate step 2 — real iOS device verification:**

1. Open app on device
2. Ensure no route is shown on map (`hasActiveRoute === false`)
3. Verify curated suggestion cards are visible
4. Confirm copper road-variant icon on each curated pill
5. Confirm glass-scrim background (72% alpha effect visible against map)
6. Confirm distinct visual treatment vs generic planning prompts
7. Tap a curated pill — verify route plots (DISC-016 integration)

---

## 8. Cross-References

- **Design system rule:** `.spec/prds/mvp/09-technical-requirements/10-design-system.md` §1 (glassmorphic overlays use `surface.glass`)
- **Touch target rule:** `.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md` §6 (touch targets ≥44pt)
- **Theme rule:** `.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md` §6 (all colors via `useSemanticTheme()`)
- **TestID rule:** `.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md` §6 (testID `discovery-suggestion-pill-{routeId}`)
- **UC-DISC-09:** Curated-route suggestion cards over the plan input, visually distinct from generic planning prompts

---

## 9. Blocking Dependencies

This spec **blocks:**

- **DISC-016** — "tapping suggestion card plots route" (implementer reads this spec for exact token props)
- **DISC-017** — "curated vs generic suggestion cards" (implementer reads this spec for chip variant style)

---

## Document Metadata

- **Generated by:** DESIGN-S01-001 task (frontend-designer agent)
- **Verification status:** Pending human gate review at sprint completion
- **Token system version:** Current (as of 2026-06-16)
- **Implementation reference:** `components/chat/chat-input.tsx` (lines 75-150)