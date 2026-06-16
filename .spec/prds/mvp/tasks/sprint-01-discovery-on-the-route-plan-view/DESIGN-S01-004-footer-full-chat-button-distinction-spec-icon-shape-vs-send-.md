# DESIGN-S01-004: Footer full-chat button distinction spec: icon/shape vs send, ≥44pt, active-state token, compliance audit of chat-input-chat-view-button

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** DESIGN · **Status:** Backlog · **Priority:** P2 · **Effort:** XS · **Estimate:** 30 min  
**Agent:** frontend-designer  
**Proposed By:** frontend-designer  
**Agent rationale:** frontend-designer produces compliance audits against live code; DISC-018's implementer reads this audit and only needs to fix the flagged gaps (expected: minor magic-number issues) rather than design from scratch.  

## Outcome

A written compliance audit and spec exists at `.spec/design/sprint-01/footer-chat-button-spec.md` for the `chat-input-chat-view-button`, confirming or correcting its icon shape, size, active-state token, and border/elevation against the spec — verifiable by `pnpm tokens:validate` and on-device sprint gate.

## Specification

- **deliverable**: `.spec/design/sprint-01/footer-chat-button-spec.md` — a structured compliance audit + spec with three sections: (1) Required spec for the full-chat button; (2) Compliance audit of current implementation (chat-input.tsx lines 373-403); (3) Gap summary (PASS/FAIL per property).
- **required_spec**: {'testID': 'chat-input-chat-view-button (already in code at line 392 — confirm)', 'purpose': 'Navigation affordance: opens the full chat transcript view; categorically different from the send action', 'icon_when_inactive': "'chat-outline' (react-native-paper Material Design icon) — navigation/mode icon, NOT 'arrow-right' (which is the send icon)", 'icon_when_active': "'map-outline' — signals 'return to map', i.e. closing the chat transcript", 'icon_size': 20, 'button_size': '48 × 48pt (chatViewBtnSize = 48 in current code) — must be cited against semantic.control.minTouchTarget (44); 48 ≥ 44 → PASS', 'border_radius': 'chatViewBtnSize / 2 = 24pt → circular; equivalent to semantic.radius.full (9999) at this size', 'background_inactive': 'semantic.color.surface.default — translucent glass surface (the button sits over the map); current code uses `semantic.color.surface.default` at line 384', 'background_active': 'semantic.color.primary.default (#EE7C2B copper) — current code line 383 uses this token; PASS', 'border_color_inactive': 'semantic.color.border.default — current code line 387 uses this token; PASS', 'border_color_active': 'semantic.color.primary.default — current code line 386 uses this token; PASS', 'icon_color_inactive': 'semantic.color.onSurface.muted — current code line 401 uses this token; PASS', 'icon_color_active': 'semantic.color.onPrimary.default — current code line 400 uses this token; PASS', 'elevation': 'semantic.elevation[2] — current code line 388-390 applies `...semantic.elevation[2]`; PASS', 'border_width': 1}
- **compliance_audit_instructions**: {'evaluate_each_property': 'For each property in the Required Spec, locate the implementing line in `chat-input.tsx` (lines 373-403 for the chat-view button), compare to spec, and emit PASS or FAIL with the line number.', 'icon_distinction_audit': "The send button uses `Icon source='arrow-right'` (line 362); the chat-view button uses `Icon source={chatMode ? 'map-outline' : 'chat-outline'}` (line 397-399). These are categorically different — PASS. Spec must confirm this distinction is sufficient for one-handed UX and document why: arrow-right implies 'submit/forward', map/chat-outline implies 'navigate to mode'.", 'size_audit': 'chatViewBtnSize = 48 (line 243); `semantic.control.minTouchTarget = 44`; 48 ≥ 44 → PASS.', 'active_state_audit': 'Line 383: `chatMode ? semantic.color.primary.default : semantic.color.surface.default` → active background is copper → PASS.'}
- **expected_gaps**: ['The spec should identify: the `chatViewBtnSize` variable uses a magic number `48` rather than a token; recommend `Math.max(semantic.control.minTouchTarget, 48)` or a dedicated `semantic.size.large` (48pt) token reference for future Copper Navigator alignment', 'The icon size uses magic number `iconSize + 2 = 20` (line 243, 398) rather than `semantic.iconSize.medium` (20) — flag as a gap even though the value is correct, because the token path should be used']

## Critical Constraints

- NEVER specify that the full-chat button and the send button share the same icon — they must be visually distinct affordances; the spec must name different icons for each and explain why the distinction matters for one-handed UX.
- NEVER specify a touch target below 44pt — `semantic.control.minTouchTarget` (44) is the floor; the current `chatViewBtnSize = 48` already passes but must be cited via the token.
- NEVER specify the active-state background as a hardcoded hex — active state MUST use `semantic.color.primary.default` (#EE7C2B copper); the current code at line 385 uses this token correctly; the spec must confirm it.
- Spec is a WRITE to `.spec/design/sprint-01/footer-chat-button-spec.md` ONLY — do NOT modify `chat-input.tsx` or any app source.
- The compliance audit must cite specific line numbers from `chat-input.tsx` for each property it evaluates.

## Acceptance Criteria

### AC-1: Spec document exists with all three required sections
*(PRIMARY)*
- **GIVEN** The sprint gate reviewer opens `.spec/design/sprint-01/footer-chat-button-spec.md`
- **WHEN** They inspect the document
- **THEN** Three headed sections present: Required Spec, Compliance Audit, Gap Summary — all non-empty; Gap Summary has a PASS/FAIL row for each audited property
- **Test tier:** `e2e` · **Service:** human-gate + file artifact
- **Verify:** `test -s .spec/design/sprint-01/footer-chat-button-spec.md && echo PASS`
- **Scenario** (start `?`):
  - must observe: T; h; r; e; e;  ; s; e; c; t; i; o; n;  ; h; e; a; d; e; r; s; ;;  ; P; A; S; S; /; F; A; I; L;  ; t; a; b; l; e;  ; w; i; t; h;  ; ≥;  ; 8;  ; p; r; o; p; e; r; t; y;  ; r; o; w; s; ;;  ; i; c; o; n;  ; d; i; s; t; i; n; c; t; i; o; n;  ; r; o; w
  - must NOT observe: F; i; l; e;  ; n; o; t;  ; f; o; u; n; d;  ; O; R;  ; g; a; p;  ; s; u; m; m; a; r; y;  ; a; b; s; e; n; t;  ; O; R;  ; a; c; t; i; v; e;  ; b; a; c; k; g; r; o; u; n; d;  ; s; p; e; c; i; f; i; e; d;  ; a; s;  ; a;  ; h; a; r; d; c; o; d; e; d;  ; h; e; x
  - negative control (would fail if): would fail if spec doc is absent, gap summary is missing, or icon distinction is not evaluated

### AC-2: Icon distinction is explicitly evaluated: send='arrow-right' vs chat-view='chat-outline'/'map-outline'
- **GIVEN** The compliance audit section
- **WHEN** The icon distinction row is read
- **THEN** Spec names 'arrow-right' as the send icon, 'chat-outline' (inactive) and 'map-outline' (active) as the chat-view button icons, and marks the distinction PASS
- **Test tier:** `e2e` · **Service:** human-gate
- **Verify:** `test -s .spec/design/sprint-01/footer-chat-button-spec.md && echo PASS`

### AC-3: Active-state background confirmed as semantic.color.primary.default — no hardcoded hex
- **GIVEN** The compliance audit active-state background row
- **WHEN** The token reference and PASS/FAIL verdict are read
- **THEN** Spec cites `semantic.color.primary.default` at `chat-input.tsx` line 383 and marks PASS; the raw hex '#EE7C2B' does NOT appear as the specified value in the Gap Summary 'Required token' column
- **Test tier:** `e2e` · **Service:** human-gate
- **Verify:** `test -s .spec/design/sprint-01/footer-chat-button-spec.md && echo PASS`

### AC-4: Touch target ≥44pt confirmed via semantic.control.minTouchTarget comparison
- **GIVEN** The compliance audit size/touch target row
- **WHEN** The audit verdict is read
- **THEN** Spec compares chatViewBtnSize (48) to semantic.control.minTouchTarget (44) and marks PASS; magic-number '48' is flagged as a minor gap
- **Test tier:** `e2e` · **Service:** human-gate
- **Verify:** `test -s .spec/design/sprint-01/footer-chat-button-spec.md && echo PASS`

### AC-5: On-device: full-chat button visually distinct from send at sprint gate
- **GIVEN** DISC-018 is merged; real device
- **WHEN** Sprint gate step 8 is executed (tap footer button to right of input)
- **THEN** The `chat-input-chat-view-button` icon is clearly different from the `chat-input-send-button` icon; tapping it opens the full chat view; active state shows copper background
- **Test tier:** `e2e` · **Service:** real iOS device against live Convex dev
- **Verify:** `test -s .spec/design/sprint-01/footer-chat-button-spec.md && echo PASS`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | `.spec/design/sprint-01/footer-chat-button-spec.md` exists and is non-empty | AC-1 | `test -s .spec/design/sprint-01/footer-chat-button-spec.md && echo PASS` |
| TC-2 | Spec file contains 'chat-outline' icon reference (icon distinction audit) | AC-2 | `grep -q 'chat-outline' .spec/design/sprint-01/footer-chat-button-spec.md && echo PASS` |
| TC-3 | Spec file contains 'semantic.color.primary.default' in context of active state | AC-3 | `grep -q 'primary.default' .spec/design/sprint-01/footer-chat-button-spec.md && echo PASS` |
| TC-4 | Spec file contains 'minTouchTarget' reference | AC-4 | `grep -q 'minTouchTarget' .spec/design/sprint-01/footer-chat-button-spec.md && echo PASS` |
| TC-5 | `pnpm tokens:validate` exits 0 | AC-3 | `pnpm tokens:validate` |

## Reading List

- `components/chat/chat-input.tsx` (372-408) — The chat-view toggle button (lines 373-403) — the primary subject of the compliance audit; send button for icon comparison at lines 341-369
- `components/chat/chat-input.tsx` (240-245) — chatViewBtnSize (48) and iconSize (18) variable definitions — the magic numbers to evaluate against tokens
- `tokens/semantic/semantic.tokens.json` (529-560) — semantic.control.minTouchTarget (44) and semantic.iconSize.medium (20) — the token values for the audit comparison
- `.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md` (55-60) — §6 testID `chat-input-chat-view-button` in the registry and the touch-target rule
- `.spec/prds/mvp/05-uc-disc.md` (101-113) — UC-DISC-11 ACs: 'renders the full-chat button as a navigation affordance distinct from the chat send action'

## Guardrails

- WRITE-ALLOWED: `.spec/design/sprint-01/footer-chat-button-spec.md (NEW) — the deliverable spec/audit document`
- WRITE-PROHIBITED: components/chat/chat-input.tsx — implementation owned by DISC-018
- WRITE-PROHIBITED: tokens/** — read-only
- WRITE-PROHIBITED: Any file not in write_allowed

## Design

- ref: .spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md §6 (testID `chat-input-chat-view-button`, touch targets, theming)
- ref: tokens/semantic/semantic.tokens.json (semantic.color.primary.default, semantic.color.surface.default, semantic.color.border.default, semantic.color.onPrimary.default, semantic.color.onSurface.muted, semantic.control.minTouchTarget, semantic.iconSize.medium, semantic.elevation)
- ref: components/chat/chat-input.tsx lines 372-404 (the chat-view toggle button implementation — primary subject of the audit)

## Verification Gates

| Gate | Command |
|------|---------|
| gate_1_spec_exists | `test -s .spec/design/sprint-01/footer-chat-button-spec.md && echo PASS` |
| gate_2_tokens_validate | `pnpm tokens:validate` |
| gate_3_type_check | `pnpm type-check` |
| gate_4_scope_compliance | `git diff --name-only | grep -v '.spec/design/sprint-01/footer-chat-button-spec.md' | wc -l | xargs -I{} test {} -eq 0 && echo SCOPE_CLEAN` |
| gate_5_human | `Sprint gate step 8 on real iOS device — full-chat button visually distinct from send; copper active state visible when chat mode is on` |

## Coding Standards

- Audit document uses a PASS/FAIL table with columns: Property, Required spec, Current code (file:line), Verdict
- Every PASS verdict must cite a specific line number from chat-input.tsx
- Every FAIL or gap verdict must include an actionable 'Fix' column entry
- No raw hex values in the 'Required spec' column — token paths only

## Dependencies

- Depends on: None
- Blocks: DISC-018 (footer full-chat button + suggestion-card visibility) — implementer reads this audit for any gaps to fix
- Parallel: DESIGN-S01-001, DESIGN-S01-002, DESIGN-S01-003

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {},
  "requirements": [
    "UC-DISC-11: System renders the full-chat button as a navigation affordance distinct from the chat send action",
    "UC-DISC-11: Rider can open the full chat view from a button to the right of the chat input in the bottom footer",
    "07-ui-infrastructure.md \u00a76: testID `chat-input-chat-view-button`",
    "07-ui-infrastructure.md \u00a76: touch targets \u2265 44pt",
    "07-ui-infrastructure.md \u00a76: all colors via `useSemanticTheme()` \u2014 no hardcoded hex"
  ]
}
-->
