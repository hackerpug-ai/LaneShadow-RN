# DESIGN-S01-001: Suggestion Card Visual Audit

**Task Type:** DESIGN (audit/verify against current implementation)
**Execution Date:** 2026-06-16
**Auditor:** frontend-designer agent
**Implementation File:** `components/chat/chat-input.tsx`
**Worktree:** `.claude/worktrees/design-s01/`

---

## Audit Summary

**Status:** ✅ **GAPS IDENTIFIED — SPEC READY FOR IMPLEMENTATION**

The audit found **5 token gaps** and **1 decision point** in the current `SuggestionChips` implementation that need to be addressed by DISC-016/DISC-017 implementers. The visibility rule is already correct.

### Critical Findings

| Priority | Gap | Impact |
|----------|-----|--------|
| **P0** | Background uses `surface.default` instead of `surface.glass` | Glassmorphic effect broken |
| **P0** | Border uses `border.default` instead of `border.glass` | No translucent edge on overlay |
| **P1** | Icon color has unnecessary `?? '#EE7C2B'` fallback | Legacy pattern, token is stable |
| **P1** | `minHeight: 44` is a magic number | Should reference `minTouchTarget` token |
| **P2** | No elevation applied to curated chips | Missing depth on glassmorphic element |
| **Decision** | Scroll container scrim needed? | Recommend individual chip backgrounds only |

---

## Detailed Audit Findings

### 1. Background Color Gap (Line 114)

**Current:**
```tsx
backgroundColor: semantic.color.surface.default
```

**Expected:**
```tsx
backgroundColor: semantic.color.surface.glass
```

**Gap Type:** wrong-token

**Token Reference:**
- `tokens/semantic/colors.tokens.json` (lines 26-30)
- Light: `rgba(253,251,248,0.72)` — 72% alpha paper-50
- Dark: `rgba(45,34,24,0.72)` — 72% alpha ink-700

**Why This Matters:**
The `surface.glass` token provides the **canonical glassmorphic surface** per the design system rule (`.spec/prds/mvp/09-technical-requirements/10-design-system.md` §1). Using `surface.default` (which is opaque `#F8F7F6` light / `#221810` dark) breaks the glassmorphic effect on the map overlay.

---

### 2. Border Color Gap (Line 111)

**Current:**
```tsx
borderColor: semantic.color.border.default
```

**Expected:**
```tsx
borderColor: semantic.color.border.glass
```

**Gap Type:** wrong-token

**Token Reference:**
- `tokens/semantic/colors.tokens.json` (lines 256-260)
- Light: `rgba(255,255,255,0.55)` — elevated translucent edge
- Dark: `rgba(242,238,232,0.22)` — reduced alpha for dark mode

**Why This Matters:**
The `border.glass` token is specifically designed for glassmorphic elements on overlays. It uses a white-alpha edge in light mode to create the "frosted glass" effect, while `border.default` uses a solid color that doesn't blend correctly with semi-transparent backgrounds.

---

### 3. Icon Color Fallback Gap (Line 130)

**Current:**
```tsx
color={semantic.color.accent?.default ?? '#EE7C2B'}
```

**Expected:**
```tsx
color={semantic.color.accent.default}
```

**Gap Type:** unnecessary-fallback

**Token Reference:**
- `tokens/semantic/semantic.tokens.json` (lines 137-150, 399-412)
- Light: `#EE7C2B` (copper-500)
- Dark: `#EE7C2B` (unchanged)

**Why This Matters:**
The `?? '#EE7C2B'` fallback is unnecessary because `semantic.color.accent.default` is **stable and defined** in both light and dark themes. The fallback pattern suggests the token might be undefined, which is not the case. This creates confusion about token stability and adds unnecessary code.

---

### 4. Magic Number Gap (Line 113)

**Current:**
```tsx
minHeight: 44
```

**Expected:**
```tsx
minHeight: semantic.control.minTouchTarget
```

**Gap Type:** magic-number

**Token Reference:**
- `tokens/semantic/semantic.tokens.json` (lines 1439-1448, 1551-1556)
- Value: `44` pt

**Why This Matters:**
While the magic number `44` happens to be correct (it matches the token value), it violates the design system rule that **all dimensions must reference tokens**. This prevents future updates to touch target requirements from being applied automatically.

---

### 5. Elevation Gap (Lines 110-122)

**Current:**
```tsx
style={[
  styles.chip,
  isCurated ? {
    borderWidth: 1,
    borderColor: semantic.color.border.default,
    borderRadius: semantic.radius.md,
    minHeight: 44,
    backgroundColor: semantic.color.surface.default,
    paddingHorizontal: semantic.space.md,
    paddingVertical: semantic.space.sm,
  } : {}
]}
```

**Expected:**
```tsx
style={[
  styles.chip,
  isCurated ? {
    borderWidth: 1,
    borderColor: semantic.color.border.glass,
    borderRadius: semantic.radius.md,
    minHeight: semantic.control.minTouchTarget,
    backgroundColor: semantic.color.surface.glass,
    paddingHorizontal: semantic.space.md,
    paddingVertical: semantic.space.sm,
    ...semantic.elevation[2],  // ✅ ADD THIS
  } : {}
]}
```

**Gap Type:** missing-token

**Token Reference:**
- `tokens/semantic/semantic.tokens.json` (lines 873-900, 1071-1098)
- shadowColor: `#000000`
- shadowOffset: `{ width: 0, height: 2 }`
- shadowOpacity: `0.21`
- shadowRadius: `6`
- elevation: `2`

**Why This Matters:**
Glassmorphic elements on overlays need elevation to create depth and separation from the map content. Without elevation, the chips appear "flat" on top of the map, reducing their visual hierarchy and tappability perception.

---

### 6. Scroll Container Scrum — Decision Required

**Question:** Does the `SuggestionChips` scroll container need a wrapping `surface.glass` scrim View behind it as a group?

**Current Implementation:**
The `ScrollView` at line 87 has no background scrim. Individual chips have their own `surface.glass` backgrounds (after gap #1 is fixed).

**Options:**

1. **Individual chip backgrounds only** — current approach after fixing gaps.
   - Pros: Each chip is self-contained, matches chip-pill pattern.
   - Cons: Gaps between chips show the map directly.

2. **Wrapping scrim View** — add a parent View with `backgroundColor: semantic.color.surface.glass`.
   - Pros: Continuous glass strip across all chips.
   - Cons: Requires extra DOM node, may blur map content uniformly.

**Recommendation:** **Option 1 (individual chip backgrounds only)**

**Rationale:**
- Current implementation already uses individual chip backgrounds.
- Chip-pill pattern typically uses self-contained backgrounds.
- Gaps between chips showing the map are acceptable — they create separation.
- Adding a wrapping scrim would require structural changes beyond the scope of this audit.

**Implementation note:** This decision should be confirmed by the frontend-designer during the DISC-016/DISC-017 implementation phase. If wrapping scrim is preferred, it requires wrapping the `ScrollView` in a `View` with `style={{ backgroundColor: semantic.color.surface.glass }}`.

---

## Correctness Verification

### ✅ Correct Implementations

The following aspects of the current implementation are **already correct**:

1. **Border radius:** Uses `semantic.radius.md` (value: 10pt) ✅
2. **Padding:** Uses `semantic.space.md` (horizontal) and `semantic.space.sm` (vertical) ✅
3. **Icon source:** Uses `road-variant` (react-native-paper) ✅
4. **Icon size:** Uses `16` (which matches `semantic.iconSize.small`) ✅
5. **Label text:** Uses `semantic.type.body.sm` ✅
6. **Label color:** Uses `semantic.color.onSurface.default` ✅
7. **Font weight override:** Uses `'500'` for readability (acceptable per spec) ✅
8. **TestID pattern:** Uses `discovery-suggestion-pill-{routeId}` ✅
9. **onSelectRoute prop:** Wired correctly at line 103 ✅
10. **Visibility rule:** Correct at line 268 ✅

---

## Visibility Rule Verification

**Current code at `chat-input.tsx:268`:**

```tsx
{isIdle && !hasActiveRoute && suggestions.length > 0 && !isPlanning && !chatMode && (
  <SuggestionChips ... />
)}
```

**Spec requirement:** Chips render when:
1. `isIdle === true` (phase === 'IDLE') ✅
2. `hasActiveRoute === false` ✅
3. `suggestions.length > 0` ✅
4. `!isPlanning` ✅
5. `!chatMode` ✅

**`hasActiveRoute` derivation** (from `app/(app)/(tabs)/index.tsx:257`):

```tsx
const hasActiveRoute = !!agentActiveOption
```

When a route is selected and shown on the map, `agentActiveOption` is truthy, so `hasActiveRoute` becomes `true`, and suggestion chips are hidden. This matches the spec requirement.

**Status:** ✅ **VERIFIED CORRECT** — no changes needed.

---

## Anti-Pattern Identified (For Future Reference)

**Legacy hex-alpha pattern** — do NOT replicate from `route-attachment-card.tsx`:

```tsx
// ❌ BAD — legacy anti-pattern
backgroundColor: 'rgba(18, 18, 18, 0xCC)'  // 80% alpha using hex component
```

```tsx
// ✅ GOOD — use predefined alpha token
backgroundColor: semantic.color.surface.glass
```

The `surface.glass` token already defines the correct 72% alpha values for both light and dark themes. Always reference tokens, never inline `rgba()` with opacity components.

---

## Audit Artifacts

1. **Spec document:** `.spec/design/sprint-01/suggestion-card-spec.md` — full specification for implementers
2. **This audit:** `.tmp/DESIGN-S01-001/suggestion-card-audit.md` — findings and gap analysis
3. **Worktree:** `.claude/worktrees/design-s01/` — audit performed on isolated worktree

---

## Next Steps

1. ✅ **Audit complete** — gaps documented in spec
2. ⏭️ **DISC-016/DISC-017** — implementers read spec and apply token substitutions
3. ⏭️ **Human gate** — verify on-device at sprint step 2
4. ⏭️ **Close task** — mark DESIGN-S01-001 complete

---

## Commit Metadata

- **Commit message:** `DESIGN-S01-001: audit suggestion card visual spec against implementation`
- **Files committed:**
  - `.spec/design/sprint-01/suggestion-card-spec.md` (NEW)
  - `.tmp/DESIGN-S01-001/suggestion-card-audit.md` (NEW)
- **Worktree:** `.claude/worktrees/design-s01/` (committed to main)