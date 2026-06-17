# Suggestion Card Visual Spec

**Task:** DESIGN-S01-001  
**Component:** `SuggestionChips` in `components/chat/chat-input.tsx`  
**Scope:** Current-state audit, token gap analysis, chip variant spec, visibility rules

---

## 1. Current State Audit

**Component Location:** `components/chat/chat-input.tsx` (lines 100-149, 268)

### Current Implementation Summary

The `SuggestionChips` component renders horizontally-scrollable suggestion pills. Each pill is a `TouchableOpacity` with conditional styling based on whether it's a "curated" suggestion (has a `routeId`) or a generic planning prompt.

**Curated Chip Styles (lines 108-117):**
```typescript
{
  borderWidth: 1,
  borderColor: semantic.color.border.default,
  borderRadius: semantic.radius.md,
  minHeight: 44, // §6 constitution minTouchTarget
  backgroundColor: semantic.color.surface.default,
  paddingHorizontal: semantic.space.md,
  paddingVertical: semantic.space.sm,
}
```

**Icon Rendering (lines 126-131):**
```typescript
{isCurated && (
  <Icon
    source="road-variant"
    size={16}
    color={semantic.color.accent?.default ?? '#EE7C2B'}
  />
)}
```

**Label Styles (lines 134-141):**
```typescript
style={[
  semantic.type.body.sm,
  {
    color: semantic.color.onSurface.default,
    fontWeight: '500',
    fontSize: 11.5,
  },
]}
```

**Visibility Condition (line 268):**
```typescript
{isIdle && !hasActiveRoute && suggestions.length > 0 && !isPlanning && !chatMode && (
```

### Findings

**Correct Token Usage:**
- `semantic.radius.md` — border radius correctly sourced (10pt)
- `semantic.space.md` — horizontal padding correctly sourced (12pt)
- `semantic.space.sm` — vertical padding correctly sourced (8pt)
- `semantic.type.body.sm` — typography base correctly sourced (fontSize 11, lineHeight 16, fontWeight 400)
- `semantic.color.onSurface.default` — label text color correctly sourced
- TestID pattern `discovery-suggestion-pill-{routeId}` is correctly applied (line 105)

**Gaps Identified:**
1. **Background uses wrong token** — `semantic.color.surface.default` is an opaque surface, not glass
2. **Border uses wrong token** — `semantic.color.border.default` is for standard dividers, not glass borders
3. **Icon color has unnecessary fallback** — `semantic.color.accent?.default ?? '#EE7C2B'` implies uncertainty about token availability
4. **No elevation applied** — curated chips lack shadow/elevation treatment
5. **Magic number for minHeight** — comment references §6 constitution but doesn't cite the token path

---

## 2. Token Gap Table

| Location | Current Value | Gap Type | Required Token Path |
|----------|---------------|----------|---------------------|
| `chat-input.tsx:111` | `borderColor: semantic.color.border.default` | Wrong token | `semantic.color.border.glass` (light: `rgba(255,255,255,0.55)`, dark: `rgba(242,238,232,0.22)`) |
| `chat-input.tsx:114` | `backgroundColor: semantic.color.surface.default` | Wrong token | `semantic.color.surface.glass` (light: `rgba(253,251,248,0.72)`, dark: `rgba(45,34,24,0.72)`) |
| `chat-input.tsx:130` | `color={semantic.color.accent?.default ?? '#EE7C2B'}` | Unnecessary fallback | `semantic.color.accent.default` (stable in both light/dark: `#EE7C2B`) |
| `chat-input.tsx:113` | `minHeight: 44` with comment | Magic number | `semantic.control.minTouchTarget` (value: 44pt) |
| N/A | (No elevation) | Missing style | `semantic.elevation[2]` (shadowOpacity 0.21, shadowRadius 6, elevation 2) |

### Token Cross-References

**Glass Background** (`color.surface.glass`):
- Defined in `tokens/semantic/colors.tokens.json` lines 26-30
- Light: `rgba(253,251,248,0.72)` — 72% alpha on paper-50
- Dark: `rgba(45,34,24,0.72)` — 72% alpha on ink-700

**Glass Border** (`color.border.glass`):
- Defined in `tokens/semantic/colors.tokens.json` lines 256-260
- Light: `rgba(255,255,255,0.55)` — elevated translucent edge
- Dark: `rgba(242,238,232,0.22)` — reduced-alpha border for dark mode

**Accent Color** (`color.accent.default`):
- Defined in `tokens/semantic/semantic.tokens.json` lines 137-150 (light) and 399-412 (dark)
- Copper-500 (`#EE7C2B`) — unchanged across light/dark themes
- The `?? '#EE7C2B'` fallback is unnecessary; token is stable in both theme files

**Touch Target** (`control.minTouchTarget`):
- Defined in `tokens/semantic/semantic.tokens.json` lines 1444-1447
- Value: 44pt — mobile accessibility baseline

**Elevation** (`elevation[2]`):
- Defined in `tokens/semantic/semantic.tokens.json` lines 873-900 (light) and 1071-1098 (dark)
- shadowOpacity: 0.21, shadowRadius: 6, elevation: 2
- Appropriate for elevated interactive elements over map

---

## 3. Chip Variant Spec (Curated Pill)

### Target Visual Treatment

The curated suggestion pill should be a glassmorphic "chip" with:
- Translucent scrim background (72% alpha)
- Subtle glass border
- Copper road icon as visual cue
- Rounded corners and elevation to stand out from map

### Required Props

```typescript
interface CuratedPill {
  label: string;
  routeId: string;
  // onSelectRoute is wired at parent level (line 103 of chat-input.tsx)
}
```

### Style Specification

| Property | Token Path | Resolved Value | Notes |
|----------|------------|----------------|-------|
| **Background** | `semantic.color.surface.glass` | Light: `rgba(253,251,248,0.72)`, Dark: `rgba(45,34,24,0.72)` | 72% alpha scrim for glass effect |
| **Border Width** | `semantic.borderWidth.thin` | 1pt | Standard chip border |
| **Border Color** | `semantic.color.border.glass` | Light: `rgba(255,255,255,0.55)`, Dark: `rgba(242,238,232,0.22)` | Elevated translucent edge |
| **Border Radius** | `semantic.radius.md` | 10pt | Standard rounded chip corners |
| **Padding Horizontal** | `semantic.space.md` | 12pt | Horizontal internal spacing |
| **Padding Vertical** | `semantic.space.sm` | 8pt | Vertical internal spacing |
| **Min Height** | `semantic.control.minTouchTarget` | 44pt | Mobile accessibility floor |
| **Icon** | `semantic.color.accent.default` | `#EE7C2B` (copper-500) | Road-variant icon, 16pt size |
| **Label Typography** | `semantic.type.body.sm` | fontSize 11, lineHeight 16, fontWeight 400 | Base typography spec |
| **Label Color** | `semantic.color.onSurface.default` | Light: `#1E1A16`, Dark: `#F2EEE8` | Primary text on surface |
| **Label Font Weight Override** | Inline `'500'` | 500 | Acceptable for improved chip readability |
| **Label Font Size Override** | Inline `11.5` | 11.5pt | Optional override (current code uses this) |
| **Elevation** | `semantic.elevation[2]` | shadowOpacity 0.21, shadowRadius 6, elevation 2 | Subtle elevation over map |

### Icon Specification

```typescript
<Icon
  source="road-variant"
  size={16}
  color={semantic.color.accent.default}
/>
```

**Note:** Remove the `?? '#EE7C2B'` fallback pattern. `semantic.color.accent.default` is defined in both light and dark theme files as `#EE7C2B`; the fallback is unnecessary.

### TestID Pattern

- **Pattern:** `discovery-suggestion-pill-{routeId}`
- **Current Status:** Correctly implemented at line 105 of `chat-input.tsx`
- **Action:** No change required

### Container Scrim Consideration

The spec does NOT require a wrapping `surface.glass` scrim behind the `ScrollView` container. Individual chip backgrounds (`surface.glass`) provide sufficient visual cohesion. If group-level scrim becomes necessary for other visual reasons, that's a future design decision (out of scope for this spec).

---

## 4. Visibility Rule Spec

### Gating Condition

Chips render **only** when all of the following conditions are true:

```typescript
isIdle === true          // Phase is 'IDLE' (no active planning)
  && hasActiveRoute === false // No route currently plotted on map (derived from !!agentActiveOption)
  && suggestions.length > 0   // At least one suggestion available
  && !isPlanning              // Not in planning mode
  && !chatMode                // Not in chat mode
```

### Current Implementation Status

**Correctness:** The conditional at line 268 of `chat-input.tsx` matches the required visibility rule exactly.

```typescript
{isIdle && !hasActiveRoute && suggestions.length > 0 && !isPlanning && !chatMode && (
  <SuggestionChips ... />
)}
```

**Derivation Note:** `hasActiveRoute` is derived from `!!agentActiveOption` in `app/(app)/(tabs)/index.tsx` (line 257). This is a correct pattern — the child component receives a boolean flag rather than the raw agent state.

### Visibility States

| State | Chips Visible? | Reason |
|-------|----------------|--------|
| Idle, no route, suggestions exist | ✅ Yes | All conditions met |
| Planning in progress | ❌ No | `isPlanning` is true |
| Route active on map | ❌ No | `hasActiveRoute` is true |
| Chat mode active | ❌ No | `chatMode` is true |
| No suggestions available | ❌ No | `suggestions.length === 0` |

---

## For DISC-016 / DISC-017 Implementer

### Exact Prop Shape

```typescript
interface CuratedPill {
  label: string;
  routeId: string;
}
```

### Required Token Substitutions (Find/Replace Table)

| Find | Replace With |
|------|--------------|
| `borderColor: semantic.color.border.default` | `borderColor: semantic.color.border.glass` |
| `backgroundColor: semantic.color.surface.default` | `backgroundColor: semantic.color.surface.glass` |
| `color={semantic.color.accent?.default ?? '#EE7C2B'}` | `color={semantic.color.accent.default}` |
| `minHeight: 44, // §6 constitution minTouchTarget` | `minHeight: semantic.control.minTouchTarget,` |
| (No elevation) | Add elevation props: `shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.21, shadowRadius: 6, elevation: 2` |

### Implementation Checklist

- [ ] Replace `border.default` with `border.glass` for chip border
- [ ] Replace `surface.default` with `surface.glass` for chip background
- [ ] Remove `?? '#EE7C2B'` fallback from icon color, use `semantic.color.accent.default` directly
- [ ] Replace magic number `44` with `semantic.control.minTouchTarget`
- [ ] Apply `semantic.elevation[2]` to curated chips (shadowOpacity 0.21, shadowRadius 6, elevation 2)
- [ ] Verify testID pattern `discovery-suggestion-pill-{routeId}` is preserved (already correct)
- [ ] Confirm visibility condition remains unchanged (already correct)

### Anti-Patterns to Avoid

1. **Do NOT** use inline `rgba(..., 0.72)` for the scrim background — use `semantic.color.surface.glass` instead
2. **Do NOT** use the `CC` hex-alpha pattern seen in `route-attachment-card.tsx` — that's a legacy anti-pattern
3. **Do NOT** keep the `??` fallback for `accent.default` — the token is stable in both light and dark
4. **Do NOT** use magic number `44` for minHeight — cite `semantic.control.minTouchTarget`
5. **Do NOT** specify a touch target below 44pt — this violates mobile accessibility standards

### Verification Steps

After implementing changes:
1. Run `pnpm tokens:validate` to confirm all token paths are valid
2. Test on a real device with light and dark themes
3. Verify chips appear translucent (glassmorphic) over the map
4. Verify copper road icon renders correctly
5. Verify chips are hidden when a route is plotted on the map
6. Verify touch targets meet 44pt minimum