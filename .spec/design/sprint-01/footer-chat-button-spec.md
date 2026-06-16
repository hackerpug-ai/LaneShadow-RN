# Footer Chat Button Spec

**Task:** DESIGN-S01-004
**Sprint:** sprint-01
**Status:** Draft

## 1. Required Spec

| Property | Required Spec | Token Path | Resolved (Light) | Resolved (Dark) |
|----------|---------------|------------|------------------|-----------------|
| testID | `chat-input-chat-view-button` | — | — | — |
| Purpose | Navigation affordance: opens/closes full chat transcript view | — | — | — |
| Icon (inactive) | `chat-outline` | — | react-native-paper Material Design | — |
| Icon (active) | `map-outline` | — | react-native-paper Material Design | — |
| Icon size | 20 | `semantic.iconSize.medium` | 20pt | 20pt |
| Button size | 48 × 48pt | — | — | — |
| Border radius | 24pt (circular) | `semantic.radius.full` | 9999 (full) | 9999 (full) |
| Background (inactive) | `semantic.color.surface.default` | — | #F8F7F6 | #221810 |
| Background (active) | `semantic.color.primary.default` | — | #EE7C2B | #EE7C2B |
| Border color (inactive) | `semantic.color.border.default` | — | #E5DED9 | rgba(242,238,232,0.12) |
| Border color (active) | `semantic.color.primary.default` | — | #EE7C2B | #EE7C2B |
| Icon color (inactive) | `semantic.color.onSurface.muted` | — | #9CA3AF | #9CA3AF |
| Icon color (active) | `semantic.color.onPrimary.default` | — | #FFFFFF | #FFFFFF |
| Elevation | `semantic.elevation[2]` | — | shadowOpacity 0.21, shadowRadius 6, elevation 2 | shadowOpacity 0.21, shadowRadius 6, elevation 2 |
| Border width | 1 | `semantic.borderWidth.thin` | 1pt | 1pt |

### Icon Distinction Rationale

| Button | Icon | Meaning | Why Different |
|--------|------|---------|---------------|
| Send button | `arrow-right` | Submit/forward | Implies action completion |
| Chat-view button (inactive) | `chat-outline` | Navigate to mode | Implies view switch |
| Chat-view button (active) | `map-outline` | Return to map | Implies exit from chat view |

**Accessibility Rule:** Icons are categorically different affordances for one-handed UX:
- Arrow-right: "Submit this message"
- Chat/map-outline: "Switch between chat and map modes"

### Touch Target Validation

| Property | Current | Minimum | Pass/Fail |
|----------|---------|---------|-----------|
| chatViewBtnSize | 48pt | `semantic.control.minTouchTarget` (44pt) | ✅ PASS (48 ≥ 44) |

## 2. Compliance Audit of Current Implementation

### Audit Table

| Property | Required Spec | Current Code (file:line) | Verdict | Fix |
|----------|---------------|--------------------------|---------|-----|
| testID | `chat-input-chat-view-button` | `chat-input.tsx:392` | ✅ PASS | — |
| Icon (inactive) | `chat-outline` | `chat-input.tsx:398` `source={chatMode ? 'map-outline' : 'chat-outline'}` | ✅ PASS | — |
| Icon (active) | `map-outline` | `chat-input.tsx:398` `source={chatMode ? 'map-outline' : 'chat-outline'}` | ✅ PASS | — |
| Icon size | `semantic.iconSize.medium` (20) | `chat-input.tsx:399` `size={iconSize + 2}` (value=20) | ⚠️ GAP | Use `semantic.iconSize.medium` instead of magic number `iconSize + 2` |
| Button size | 48 × 48pt | `chat-input.tsx:379-380` `width: chatViewBtnSize, height: chatViewBtnSize` (value=48) | ✅ PASS | — |
| Border radius | 24pt (circular) | `chat-input.tsx:381` `borderRadius: chatViewBtnSize / 2` (value=24) | ✅ PASS | — |
| Background (inactive) | `semantic.color.surface.default` | `chat-input.tsx:384` `semantic.color.surface.default` | ✅ PASS | — |
| Background (active) | `semantic.color.primary.default` | `chat-input.tsx:383` `semantic.color.primary.default` | ✅ PASS | — |
| Border color (inactive) | `semantic.color.border.default` | `chat-input.tsx:387` `semantic.color.border.default` | ✅ PASS | — |
| Border color (active) | `semantic.color.primary.default` | `chat-input.tsx:386` `semantic.color.primary.default` | ✅ PASS | — |
| Icon color (inactive) | `semantic.color.onSurface.muted` | `chat-input.tsx:400` `semantic.color.onSurface.muted` | ✅ PASS | — |
| Icon color (active) | `semantic.color.onPrimary.default` | `chat-input.tsx:400` `semantic.color.onPrimary.default` | ✅ PASS | — |
| Elevation | `semantic.elevation[2]` | `chat-input.tsx:388` `...semantic.elevation[2]` | ✅ PASS | — |
| Border width | 1 | `chat-input.tsx:447` `borderWidth: 1` (StyleSheet) | ⚠️ GAP | Use `semantic.borderWidth.thin` instead of magic number |
| Button size reference | `semantic.control.minTouchTarget` (44) | `chat-input.tsx:243` `const chatViewBtnSize = 48` | ⚠️ GAP | Use token or `Math.max(semantic.control.minTouchTarget, 48)` |

### Icon Distinction Audit

| Property | Required | Current | Verdict |
|----------|----------|---------|---------|
| Send button icon | `arrow-right` | `chat-input.tsx:362` `source="arrow-right"` | ✅ PASS |
| Chat-view button icon (inactive) | `chat-outline` | `chat-input.tsx:398` `source={chatMode ? 'map-outline' : 'chat-outline'}` | ✅ PASS |
| Chat-view button icon (active) | `map-outline` | `chat-input.tsx:398` `source={chatMode ? 'map-outline' : 'chat-outline'}` | ✅ PASS |

**Verdict:** Icons are categorically different affordances — PASS.

### Size/Touch Target Audit

| Property | Current | Token Comparison | Verdict |
|----------|---------|------------------|---------|
| chatViewBtnSize | 48 (line 243) | `semantic.control.minTouchTarget` = 44 (line 1444-1447) | ✅ PASS (48 ≥ 44) |

### Active State Audit

| Property | Current | Required | Verdict |
|----------|---------|----------|---------|
| Active background | `chat-input.tsx:383` `chatMode ? semantic.color.primary.default : semantic.color.surface.default` | `semantic.color.primary.default` | ✅ PASS |

## 3. Gap Summary

| Gap ID | Property | Current (file:line) | Issue | Fix Recommendation |
|--------|----------|---------------------|-------|---------------------|
| GAP-1 | Icon size | `chat-input.tsx:399` `size={iconSize + 2}` | Magic number `iconSize + 2` (value=20) | Replace with `semantic.iconSize.medium` |
| GAP-2 | Border width | `chat-input.tsx:447` `borderWidth: 1` | Magic number | Replace with `semantic.borderWidth.thin` |
| GAP-3 | Button size reference | `chat-input.tsx:243` `const chatViewBtnSize = 48` | Magic number | Use `Math.max(semantic.control.minTouchTarget, 48)` or dedicated `semantic.size.large` (48pt) token for future Copper Navigator alignment |

### PASS/Fail Summary

| Category | Total | PASS | GAP |
|----------|-------|------|-----|
| Icon properties | 3 | 3 | 0 |
| Size/touch target | 2 | 2 | 0 |
| Color properties | 6 | 6 | 0 |
| Elevation | 1 | 1 | 0 |
| Border properties | 2 | 1 | 1 |
| Token references | 2 | 0 | 2 |
| **TOTAL** | **16** | **13** | **3** |

### Overall Verdict
**STATUS:** 13/16 PASS — Minor token reference gaps (non-blocking for sprint gate)

**Priority for DISC-018:** Low — gaps are token-reference only, no visual or functional issues.

---

**Token Authority References:**
- `tokens/semantic/semantic.tokens.json` (lines 1476-1479): `semantic.iconSize.medium` (20pt)
- `tokens/semantic/semantic.tokens.json` (lines 588-591): `semantic.radius.full` (9999 — circular at this size)
- `tokens/semantic/semantic.tokens.json` (lines 59-64): `semantic.color.surface.default`
- `tokens/semantic/semantic.tokens.json` (lines 137-150): `semantic.color.primary.default` (#EE7C2B)
- `tokens/semantic/semantic.tokens.json` (lines 107-112): `semantic.color.border.default`
- `tokens/semantic/semantic.tokens.json` (lines 53-57): `semantic.color.onSurface.muted`
- `tokens/semantic/semantic.tokens.json` (lines 83-88): `semantic.color.onPrimary.default` (#FFFFFF)
- `tokens/semantic/semantic.tokens.json` (lines 1444-1447): `semantic.control.minTouchTarget` (44pt)
- `tokens/semantic/semantic.tokens.json` (lines 1520-1523): `semantic.size.large` (48pt)
- `tokens/semantic/semantic.tokens.json` (lines 1421-1428): `semantic.borderWidth.thin` (1pt)
- `tokens/semantic/semantic.tokens.json` (lines 873-900): `semantic.elevation[2]`