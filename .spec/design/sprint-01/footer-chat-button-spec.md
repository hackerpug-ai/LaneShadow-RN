# Footer Chat Button Distinction Spec

**Component:** `chat-input-chat-view-button` (chat-view toggle in footer)
**File:** `components/chat/chat-input.tsx` (lines 372-403)
**Purpose:** Navigation affordance that opens the full chat transcript view
**Sprint:** sprint-01-discovery-on-the-route-plan-view

## Required Spec

| Property | Required Value | Token Path | Justification |
|----------|----------------|------------|---------------|
| **testID** | `chat-input-chat-view-button` | N/A | E2E testability; matches live code (line 391) |
| **Purpose** | Navigation affordance: opens full chat transcript view | N/A | Categorically different from send action (submit/forward) |
| **Icon (inactive)** | `chat-outline` (Material Design) | N/A | Navigation/mode icon — signals "go to chat mode" |
| **Icon (active)** | `map-outline` (Material Design) | N/A | Signals "return to map" — closing chat transcript |
| **Icon size** | 20pt | `semantic.iconSize.medium` | Standard icon size; sufficient visual clarity |
| **Button size** | 48 × 48pt | N/A | Circular; must exceed `semantic.control.minTouchTarget` (44) |
| **Border radius** | 24pt (circular) | `chatViewBtnSize / 2` | Equivalent to `semantic.radius.full` at this size |
| **Background (inactive)** | Translucent glass surface | `semantic.color.surface.default` | Button sits over map; glass-morphic |
| **Background (active)** | Copper (active state) | `semantic.color.primary.default` (#EE7C2B) | Indicates chat mode is active |
| **Border (inactive)** | Default border | `semantic.color.border.default` | Glass panel outline |
| **Border (active)** | Copper border | `semantic.color.primary.default` (#EE7C2B) | Matches background for solid appearance |
| **Icon color (inactive)** | Muted on-surface | `semantic.color.onSurface.muted` | Low-contrast for inactive state |
| **Icon color (active)** | On-primary | `semantic.color.onPrimary.default` | High contrast on copper background |
| **Elevation** | Tier 2 | `semantic.elevation[2]` | Overlay elevation for floating button |
| **Border width** | 1pt | N/A | Standard border for glass-morphic panels |

## Icon Distinction Rationale

### Send Button (`chat-input-send-button`)
- **Icon:** `arrow-right` (line 362)
- **Purpose:** Submit/forward the message
- **Semantics:** Action-oriented — "send what I typed"
- **Mental model:** Transactional — moves content from user to system

### Chat-View Button (`chat-input-chat-view-button`)
- **Icon (inactive):** `chat-outline` (line 398)
- **Icon (active):** `map-outline` (line 398)
- **Purpose:** Navigate between modes (map ↔ chat transcript)
- **Semantics:** Mode-oriented — "switch context"
- **Mental model:** Navigation — changes the view, not the content

### Why This Distinction Matters for One-Handed UX

1. **Semantic clarity:** Different icon shapes communicate different affordances
   - Arrow shapes imply direction/progression (send)
   - Outline icons (chat/map) imply locations/modes (navigation)
   - Users can scan and distinguish without reading labels

2. **Prevent accidental actions:** One-handed thumb usage makes buttons near each other error-prone
   - Arrow-right could be misread as "go forward" rather than "send message"
   - Chat/map icons clearly signal "mode switch" vs "submit"

3. **Visual hierarchy:** Both buttons are in the footer, but serve different purposes
   - Send button: Inline with input, transactional
   - Chat-view button: Standalone, outside field, modal in nature
   - Distinct icons reinforce this separation

## Compliance Audit

| Property | Required spec | Current code (file:line) | Verdict | Notes |
|----------|---------------|--------------------------|---------|-------|
| **testID** | `chat-input-chat-view-button` | `components/chat/chat-input.tsx:391` | ✅ PASS | Matches required testID |
| **Icon (inactive)** | `chat-outline` | `components/chat/chat-input.tsx:398` | ✅ PASS | Correct Material Design icon |
| **Icon (active)** | `map-outline` | `components/chat/chat-input.tsx:398` | ✅ PASS | Correct active-state icon |
| **Icon distinction** | Different from send (`arrow-right`) | Send: `components/chat/chat-input.tsx:362` | ✅ PASS | `arrow-right` ≠ `chat-outline`/`map-outline` — categorically distinct |
| **Button size** | 48 × 48pt (≥44pt) | `components/chat/chat-input.tsx:242` defines `chatViewBtnSize = 48` | ⚠️ GAP | Value correct (48 ≥ 44), but uses magic number `48` instead of token |
| **Touch target compliance** | ≥ `semantic.control.minTouchTarget` (44pt) | `tokens/semantic/semantic.tokens.json:1444` | ✅ PASS | 48 ≥ 44 — meets minimum touch target |
| **Border radius** | Circular (24pt) | `components/chat/chat-input.tsx:381` (`borderRadius: chatViewBtnSize / 2`) | ⚠️ GAP | Calculation correct, but uses magic number division instead of token |
| **Background (inactive)** | `semantic.color.surface.default` | `components/chat/chat-input.tsx:384` | ✅ PASS | Uses correct token |
| **Background (active)** | `semantic.color.primary.default` | `components/chat/chat-input.tsx:383` | ✅ PASS | Uses correct token (no hardcoded hex) |
| **Border (inactive)** | `semantic.color.border.default` | `components/chat/chat-input.tsx:387` | ✅ PASS | Uses correct token |
| **Border (active)** | `semantic.color.primary.default` | `components/chat/chat-input.tsx:386` | ✅ PASS | Uses correct token |
| **Icon color (inactive)** | `semantic.color.onSurface.muted` | `components/chat/chat-input.tsx:400` | ✅ PASS | Uses correct token |
| **Icon color (active)** | `semantic.color.onPrimary.default` | `components/chat/chat-input.tsx:400` | ✅ PASS | Uses correct token |
| **Elevation** | `semantic.elevation[2]` | `components/chat/chat-input.tsx:388-390` | ✅ PASS | Spreads elevation token correctly |
| **Border width** | 1pt | Implicit from glass panel style | ℹ️ INFO | Inherits from `styles.chatViewButton` — acceptable |
| **Icon size** | 20pt (semantic.iconSize.medium) | `components/chat/chat-input.tsx:399` (`size={iconSize + 2}`) | ⚠️ GAP | `iconSize = 18` (line 243); `iconSize + 2 = 20`; value correct but uses magic number |

## Gap Summary

| Property | Status | Gap Description | Suggested Fix |
|----------|--------|-----------------|---------------|
| **Button size** | ⚠️ GAP | Magic number `chatViewBtnSize = 48` (line 242) instead of token reference | Use `Math.max(semantic.control.minTouchTarget, 48)` or add dedicated `semantic.size.large` (48pt) token for Copper Navigator alignment |
| **Border radius** | ⚠️ GAP | Calculation `borderRadius: chatViewBtnSize / 2` uses magic number division | Use `semantic.radius.full` (9999) directly, which renders as circular at this size |
| **Icon size** | ⚠️ GAP | Magic number `iconSize = 18` (line 243); `size={iconSize + 2}` adds magic number offset | Replace with `semantic.iconSize.medium` (20) directly |
| **Border width** | ℹ️ INFO | Not explicitly set — inferred from StyleSheet | Consider explicit `borderWidth: 1` in inline style for clarity |

### Overall Verdict

**Core Functionality:** ✅ PASS — All critical properties (icon distinction, active state colors, token usage, touch target size) are correctly implemented.

**Code Quality:** ⚠️ MINOR GAPS — Three magic-number issues (button size, icon size, border radius) that should be replaced with token references for maintainability and Copper Navigator alignment.

**No Blocking Issues:** The implementation is functionally correct and passes all user-facing acceptance criteria. The gaps are minor code-quality improvements that can be addressed in a follow-up task without affecting the sprint gate.

## Verification Commands

```bash
# AC-1: Spec exists with three sections
test -s .spec/design/sprint-01/footer-chat-button-spec.md && echo "PASS: Spec exists"

# AC-2: Icon distinction evaluated
grep -q 'chat-outline' .spec/design/sprint-01/footer-chat-button-spec.md && echo "PASS: chat-outline present"
grep -q 'arrow-right' .spec/design/sprint-01/footer-chat-button-spec.md && echo "PASS: arrow-right present"

# AC-3: Active state uses semantic.token (no hex)
grep -q 'semantic.color.primary.default' .spec/design/sprint-01/footer-chat-button-spec.md && echo "PASS: Token reference present"

# AC-4: Touch target compliance
grep -q 'minTouchTarget' .spec/design/sprint-01/footer-chat-button-spec.md && echo "PASS: minTouchTarget referenced"

# AC-5: Tokens validate
pnpm tokens:validate

# Gate 4: Scope compliance (only spec file modified)
git diff --name-only | grep -v '.spec/design/sprint-01/footer-chat-button-spec.md' | wc -l | xargs -I{} test {} -eq 0 && echo "SCOPE_CLEAN"
```

## References

- **Implementation:** `components/chat/chat-input.tsx` (lines 240-245 for variables; 372-403 for chat-view button; 341-369 for send button)
- **Tokens:** `tokens/semantic/semantic.tokens.json` (minTouchTarget at line 1444; iconSize.medium at line 1476-1478; elevation[2] at line 864-876)
- **TestID registry:** `.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md` (line 56: testID `chat-input-chat-view-button`)
- **Use case:** `.spec/prds/mvp/05-uc-disc.md` (lines 101-112: UC-DISC-11 — distinct navigation affordance)

## Sprint Gate Verification

**Gate step 8:** Tap the footer button to the right of the input.

**Expected behavior:**
1. ✅ Button icon is clearly different from send button (`chat-outline` vs `arrow-right`)
2. ✅ Tapping opens full chat view
3. ✅ Active state shows copper background (`semantic.color.primary.default`)
4. ✅ Touch target feels large enough for one-handed use (48pt ≥ 44pt minimum)

**Verification method:** On real iOS device against live Convex dev deployment.