# Suggestion Card Visual Spec

**Task:** DESIGN-S01-001
**Sprint:** sprint-01
**Status:** Draft

## 1. Current State Audit

The `SuggestionChips` component in `components/chat/chat-input.tsx` (lines 95-148) renders curated suggestion pills with the following current implementation:

### Current Implementation (lines 110-117)
```typescript
borderWidth: 1,
borderColor: semantic.color.border.default,        // ❌ Gap 1
borderRadius: semantic.radius.md,
minHeight: 44,                                      // ❌ Gap 2: Magic number
backgroundColor: semantic.color.surface.default,    // ❌ Gap 3
paddingHorizontal: semantic.space.md,
paddingVertical: semantic.space.sm,
```

### Current Icon Implementation (lines 127-131)
```typescript
<Icon
  source="road-variant"
  size={16}
  color={semantic.color.accent?.default ?? '#EE7C2B'}  // ❌ Gap 4: Unnecessary fallback
/>
```

### Gap Summary
- **Gap 1:** Uses `border.default` instead of `border.glass` for glassmorphic overlay
- **Gap 2:** Touch target `minHeight: 44` is a magic number; should cite `semantic.control.minTouchTarget`
- **Gap 3:** Background uses `surface.default` instead of `surface.glass` (72% alpha token)
- **Gap 4:** Unnecessary fallback `?? '#EE7C2B'` — `accent.default` is stable in both light/dark themes
- **Gap 5:** No elevation applied; should use `semantic.elevation[2]`
- **Gap 6:** Scroll container lacks `surface.glass` scrim background as a group

## 2. Token Gap Table

| Location | Current Value | Gap Type | Required Token Path |
|----------|---------------|----------|---------------------|
| chat-input.tsx:111 | `borderColor: semantic.color.border.default` | wrong-token | `semantic.color.border.glass` |
| chat-input.tsx:114 | `backgroundColor: semantic.color.surface.default` | wrong-token | `semantic.color.surface.glass` |
| chat-input.tsx:113 | `minHeight: 44` | magic-number | `semantic.control.minTouchTarget` |
| chat-input.tsx:130 | `color={semantic.color.accent?.default ?? '#EE7C2B'}` | unnecessary-fallback | `semantic.color.accent.default` |
| Lines 110-117 | No elevation | missing-token | `semantic.elevation[2]` |
| Line 111 | `borderWidth: 1` | magic-number | `semantic.borderWidth.thin` |

## 3. Chip Variant Spec

### Curated Pill Style Properties

| Property | Token Path | Resolved (Light) | Resolved (Dark) |
|----------|------------|------------------|-----------------|
| Background | `semantic.color.surface.glass` | rgba(253,251,248,0.72) | rgba(45,34,24,0.72) |
| Border Color | `semantic.color.border.glass` | rgba(255,255,255,0.55) | rgba(242,238,232,0.22) |
| Border Width | `semantic.borderWidth.thin` | 1pt | 1pt |
| Border Radius | `semantic.radius.md` | 10pt | 10pt |
| Padding Horizontal | `semantic.space.md` | 12pt | 12pt |
| Padding Vertical | `semantic.space.sm` | 8pt | 8pt |
| Min Height | `semantic.control.minTouchTarget` | 44pt | 44pt |
| Elevation | `semantic.elevation[2]` | shadowOpacity 0.21, shadowRadius 6, elevation 2 | shadowOpacity 0.21, shadowRadius 6, elevation 2 |

### Icon Properties

| Property | Value | Token Path | Resolved |
|----------|-------|------------|----------|
| Source | `"road-variant"` | — | react-native-paper Material Design icon |
| Size | 16 | `semantic.iconSize.small` | 16pt |
| Color | — | `semantic.color.accent.default` | #EE7C2B (copper-500) |

### Label Typography

| Property | Token Path | Resolved |
|----------|------------|----------|
| Font Family | — | System default |
| Font Size | `semantic.type.body.sm.fontSize` | 11pt |
| Line Height | `semantic.type.body.sm.lineHeight` | 16pt |
| Font Weight | `semantic.type.body.sm.fontWeight` | 400 (override to 500 for readability) |
| Color | `semantic.color.onSurface.default` | #1E1A16 (light) / #F2EEE8 (dark) |

## 4. Visibility Rule Spec

### Gating Condition

The curated suggestion chips render **only when ALL** of the following conditions are met:

1. `isIdle === true` (phase === `'IDLE'`)
2. `hasActiveRoute === false` (no `agentActiveOption` on map)
3. `suggestions.length > 0` (curated pills available)
4. `!isPlanning` (assistant not currently running)
5. `!chatMode` (transcript not visible)

### Implementation Reference

- **Location:** `chat-input.tsx` line 268
- **`hasActiveRoute` Source:** Derived from `!!agentActiveOption` in `app/(app)/(tabs)/index.tsx` line 257
- **Current Conditional:** Matches the above rule (confirmed)

## For DISC-016/DISC-017 Implementer

### Prop Shape
```typescript
type CuratedPill = {
  label: string
  routeId: string
}
```

### Token Substitution Table (Find/Replace)

| Find | Replace |
|------|---------|
| `borderColor: semantic.color.border.default` | `borderColor: semantic.color.border.glass` |
| `backgroundColor: semantic.color.surface.default` | `backgroundColor: semantic.color.surface.glass` |
| `minHeight: 44` | `minHeight: semantic.control.minTouchTarget` |
| `color={semantic.color.accent?.default ?? '#EE7C2B'}` | `color={semantic.color.accent.default}` |
| `borderWidth: 1` | `borderWidth: semantic.borderWidth.thin` |
| (add to chip style object) | `...semantic.elevation[2]` |

### TestID Pattern
- Existing: `testID={routeId ? \`discovery-suggestion-pill-${routeId}\` : undefined}` (line 105)
- **Status:** ✅ PASS — testID pattern already correct

### Prop Wiring
- `onSelectRoute` prop already wired at line 103
- **Status:** ✅ PASS — callback already connected

### Scrum Consideration
The `SuggestionChips` scroll container may need a wrapping scrim View with `semantic.color.surface.glass` background for visual cohesion. Implementer should evaluate whether individual chip backgrounds suffice or if a group scrim is needed for the scrolling area.

---

**Token Authority References:**
- `tokens/semantic/colors.tokens.json` (lines 26-30): `color.surface.glass` (72% alpha)
- `tokens/semantic/colors.tokens.json` (lines 256-260): `color.border.glass`
- `tokens/semantic/semantic.tokens.json` (lines 137-150): `semantic.color.accent.default` (#EE7C2B)
- `tokens/semantic/semantic.tokens.json` (lines 573-575): `semantic.radius.md` (10pt)
- `tokens/semantic/semantic.tokens.json` (lines 1421-1428): `semantic.borderWidth.thin` (1pt)
- `tokens/semantic/semantic.tokens.json` (lines 1444-1447): `semantic.control.minTouchTarget` (44pt)
- `tokens/semantic/semantic.tokens.json` (lines 873-900): `semantic.elevation[2]` (shadowOpacity 0.21, shadowRadius 6, elevation 2)
- `tokens/semantic/semantic.tokens.json` (lines 639-651): `semantic.type.body.sm` (fontSize 11, lineHeight 16, fontWeight 400)
- `tokens/semantic/semantic.tokens.json` (lines 1474-1477): `semantic.iconSize.small` (16pt)