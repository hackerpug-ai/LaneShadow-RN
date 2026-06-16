# DESIGN-S01-001: Suggestion-card visual spec/audit (chip variant: copper accent, road icon, surface.glass scrim @ 72%, ≥44pt, hidden when route shown)

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** DESIGN · **Status:** Backlog · **Priority:** P1 · **Effort:** S · **Estimate:** 60 min  
**Agent:** frontend-designer  
**Proposed By:** frontend-designer  
**Agent rationale:** frontend-designer owns all visual spec and audit work; this task produces no app source — it produces a spec document that the react-native-ui-implementer (DISC-016/DISC-017) reads as a contract.  

## Outcome

A written spec-diff exists at `.spec/design/sprint-01/suggestion-card-spec.md` naming exact token paths for every gap vs the current `SuggestionChips` implementation in `chat-input.tsx`, verifiable by `pnpm tokens:validate` and on-device inspection at the sprint gate.

## Specification

- **deliverable**: `.spec/design/sprint-01/suggestion-card-spec.md` — a structured diff document with four sections: (1) Current state audit of `SuggestionChips` in `components/chat/chat-input.tsx`; (2) Token gap table listing every property that currently uses a hardcoded value with its required token replacement; (3) Exact prop/style spec for the curated-pill chip variant; (4) Visibility rule spec (gating condition).
- **chip_variant_spec**: {'background': 'semantic.color.surface.glass (light: rgba(253,251,248,0.72); dark: rgba(45,34,24,0.72)) — NOT raw hex+opacity', 'border': 'borderWidth: semantic.borderWidth.thin (1pt); borderColor: semantic.color.border.glass (light: rgba(255,255,255,0.55); dark: rgba(242,238,232,0.22))', 'border_radius': 'semantic.radius.md (10pt)', 'padding_horizontal': 'semantic.space.md (12pt)', 'padding_vertical': 'semantic.space.sm (8pt)', 'min_height': 'semantic.control.minTouchTarget (44pt) — current code correctly sets minHeight: 44 but sources it from a magic number; spec requires referencing the token', 'icon': "react-native-paper `Icon` source='road-variant' size=16 color=semantic.color.accent.default (#EE7C2B) — NOT the fallback `?? '#EE7C2B'` pattern; spec must require the token path directly", 'label_text': "semantic.type.body.sm (fontSize 11, lineHeight 16, fontWeight 400); color: semantic.color.onSurface.default; fontWeight override to '500' is acceptable for readability", 'elevation': 'semantic.elevation[2] (shadowOpacity 0.21, shadowRadius 6, elevation 2)'}
- **current_gaps_to_audit**: ['Line 110-116 in chat-input.tsx: `borderColor: semantic.color.border.default` — should be `semantic.color.border.glass` for a glassmorphic chip on the map overlay', 'Line 110-116: `backgroundColor: semantic.color.surface.default` — should be `semantic.color.surface.glass` (the 72% alpha token, not the opaque surface.default)', "Line 127-130: `semantic.color.accent?.default ?? '#EE7C2B'` — the `??` fallback is a gap; accent.default is defined in both light and dark in semantic.tokens.json; the spec must note the guard is unnecessary and the token path is stable", 'No elevation applied to the curated chip — should use semantic.elevation[2]', 'The `SuggestionChips` scroll container has no `surface.glass` scrim behind it as a group — spec must note whether a wrapping scrim View is needed or whether individual chip backgrounds suffice']
- **visibility_rule_spec**: Chips render only when: (a) `isIdle === true` (phase === 'IDLE'), AND (b) `hasActiveRoute === false` (no `agentActiveOption`), AND (c) `suggestions.length > 0`, AND (d) `!isPlanning`, AND (e) `!chatMode`. The current conditional at line 268 of chat-input.tsx matches this rule. The spec must confirm the condition is correct and note that `hasActiveRoute` is derived from `!!agentActiveOption` in `index.tsx` (line 257).
- **spec_section_for_building_agent**: The spec must include a 'For DISC-016/DISC-017 implementer' callout section listing: (1) exact prop shape `CuratedPill = { label: string; routeId: string }`, (2) required token substitutions as a find/replace table, (3) testID pattern `discovery-suggestion-pill-{routeId}` (already in code at line 105, confirm), (4) `onSelectRoute` prop already wired at line 103.

## Critical Constraints

- NEVER name a hardcoded hex color in the spec — every color reference MUST be a token path (e.g. `semantic.color.accent.default`, `semantic.color.surface.glass`). Any gap where the current code uses a raw hex is the gap the spec must name and flag.
- NEVER recommend inline `backgroundColor: 'rgba(..., 0.72)'` for the scrim — the spec MUST reference `surface.glass` (already defined in `tokens/semantic/colors.tokens.json` as `rgba(253,251,248,0.72)` / `rgba(45,34,24,0.72)`) and note the existing `CC` hex-alpha pattern in `route-attachment-card.tsx` as a known legacy anti-pattern NOT to replicate.
- NEVER specify a touch target below 44pt — `semantic.control.minTouchTarget` (44) is the floor; the spec must cite this token.
- Spec is a WRITE to `.spec/design/sprint-01/suggestion-card-spec.md` ONLY — do NOT modify `chat-input.tsx` or any app source file.
- Score rendering is out of scope for this task — that is DESIGN-S01-002.

## Acceptance Criteria

### AC-1: Spec document exists at canonical path with all four required sections
*(PRIMARY)*
- **GIVEN** The sprint gate reviewer opens `.spec/design/sprint-01/suggestion-card-spec.md`
- **WHEN** They verify the document was produced by this task
- **THEN** The document contains: (1) current-state audit, (2) token gap table, (3) chip variant prop/style spec, (4) visibility rule spec — all four sections present and non-empty
- **Test tier:** `e2e` · **Service:** human-gate (sprint gate reviewer + file artifact)
- **Verify:** `test -s .spec/design/sprint-01/suggestion-card-spec.md && echo PASS`
- **Scenario** (start `?`):
  - must observe: F; o; u; r;  ; h; e; a; d; e; d;  ; s; e; c; t; i; o; n; s; :;  ; '; C; u; r; r; e; n; t;  ; S; t; a; t; e;  ; A; u; d; i; t; '; ,;  ; '; T; o; k; e; n;  ; G; a; p;  ; T; a; b; l; e; '; ,;  ; '; C; h; i; p;  ; V; a; r; i; a; n; t;  ; S; p; e; c; '; ,;  ; '; V; i; s; i; b; i; l; i; t; y;  ; R; u; l; e;  ; S; p; e; c; '
  - must NOT observe: F; i; l; e;  ; n; o; t;  ; f; o; u; n; d;  ; O; R;  ; a; n; y;  ; s; e; c; t; i; o; n;  ; m; i; s; s; i; n; g;  ; O; R;  ; a; n; y;  ; r; a; w;  ; h; e; x;  ; c; o; l; o; r;  ; n; o; t;  ; c; r; o; s; s; -; r; e; f; e; r; e; n; c; e; d;  ; t; o;  ; a;  ; t; o; k; e; n;  ; p; a; t; h
  - negative control (would fail if): would fail if the spec doc does not exist at the path, or any of the four sections is absent

### AC-2: Token gap table names exact token paths — no hardcoded hex values
- **GIVEN** The spec doc token gap table is inspected
- **WHEN** Each gap row is checked for its 'Required token' column
- **THEN** Every 'Required token' cell references a dot-path to a token defined in `tokens/semantic/colors.tokens.json` or `tokens/semantic/semantic.tokens.json` — zero raw hex strings appear in the 'Required token' column
- **Test tier:** `e2e` · **Service:** human-gate + pnpm tokens:validate
- **Verify:** `test -s .spec/design/sprint-01/suggestion-card-spec.md && echo PASS`

### AC-3: surface.glass token is explicitly named for the chip background (not raw rgba)
- **GIVEN** The chip variant spec section in the document
- **WHEN** The background property spec is read
- **THEN** The spec reads `semantic.color.surface.glass` (or `color.surface.glass`) and cross-references `tokens/semantic/colors.tokens.json` — the spec does NOT say `rgba(253,251,248,0.72)` as a standalone value without the token alias
- **Test tier:** `e2e` · **Service:** human-gate
- **Verify:** `test -s .spec/design/sprint-01/suggestion-card-spec.md && echo PASS`

### AC-4: Touch target ≥44pt is cited via semantic.control.minTouchTarget token
- **GIVEN** The chip variant spec section
- **WHEN** The minHeight / touch target field is read
- **THEN** The spec references `semantic.control.minTouchTarget` (value 44) — NOT the magic number `44` alone
- **Test tier:** `e2e` · **Service:** human-gate
- **Verify:** `test -s .spec/design/sprint-01/suggestion-card-spec.md && echo PASS`

### AC-5: On-device visual passes at sprint human gate
- **GIVEN** DISC-016 and DISC-017 are merged and the app runs on a real device
- **WHEN** Sprint gate step 2 is executed (no route on map, curated suggestion cards visible)
- **THEN** Suggestion cards show copper road-variant icon, glass-scrim background, and distinct visual treatment vs generic planning prompts — reviewer can confirm spec was implemented correctly
- **Test tier:** `e2e` · **Service:** real iOS device against live Convex dev
- **Verify:** `test -s .spec/design/sprint-01/suggestion-card-spec.md && echo PASS`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | `.spec/design/sprint-01/suggestion-card-spec.md` exists and is non-empty | AC-1 | `test -s .spec/design/sprint-01/suggestion-card-spec.md && echo PASS` |
| TC-2 | `pnpm tokens:validate` exits 0 (no token schema regressions introduced by spec work) | AC-2 | `pnpm tokens:validate` |
| TC-3 | Spec file contains the string 'surface.glass' (token alias present) | AC-3 | `grep -q 'surface.glass' .spec/design/sprint-01/suggestion-card-spec.md && echo PASS` |
| TC-4 | Spec file contains 'minTouchTarget' or 'control.minTouchTarget' (44pt token citation) | AC-4 | `grep -q 'minTouchTarget' .spec/design/sprint-01/suggestion-card-spec.md && echo PASS` |

## Reading List

- `components/chat/chat-input.tsx` (75-150) — SuggestionChips component — the primary subject of the audit; lines 95-148 are the per-chip render loop with current style props
- `tokens/semantic/colors.tokens.json` (26-35) — color.surface.glass definition (the 72% alpha token the spec must require)
- `tokens/semantic/semantic.tokens.json` (137-150) — semantic.color.accent.default (copper-500 #EE7C2B) — the required icon color token
- `.spec/prds/mvp/09-technical-requirements/10-design-system.md` (1-35) — §1 design token rules for MVP screens — the glassmorphic overlay rule
- `.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md` (55-60) — §6 mobile patterns — touch targets ≥44pt, theming rule, testID registry

## Guardrails

- WRITE-ALLOWED: `.spec/design/sprint-01/suggestion-card-spec.md (NEW) — the deliverable spec document`
- WRITE-PROHIBITED: components/chat/chat-input.tsx — implementation is owned by DISC-016/DISC-017
- WRITE-PROHIBITED: app/(app)/(tabs)/index.tsx — out of scope
- WRITE-PROHIBITED: tokens/** — no token modifications; spec only reads and references tokens
- WRITE-PROHIBITED: Any file not in write_allowed

## Design

- ref: .spec/prds/mvp/09-technical-requirements/10-design-system.md §1 (glassmorphic overlay rule)
- ref: .spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md §6 (mobile patterns: touch targets, theming, testIDs)
- ref: tokens/semantic/colors.tokens.json (color.surface.glass, color.border.glass, color.signal.default)
- ref: tokens/semantic/semantic.tokens.json (semantic.color.accent.default, semantic.color.surface, semantic.control.minTouchTarget, semantic.radius.md, semantic.borderWidth.thin, semantic.elevation)

## Verification Gates

| Gate | Command |
|------|---------|
| gate_1_spec_exists | `test -s .spec/design/sprint-01/suggestion-card-spec.md && echo PASS` |
| gate_2_tokens_validate | `pnpm tokens:validate` |
| gate_3_type_check | `pnpm type-check` |
| gate_4_lint | `pnpm exec biome check .spec/design/sprint-01/suggestion-card-spec.md` |
| gate_5_scope_compliance | `git diff --name-only | grep -v '.spec/design/sprint-01/suggestion-card-spec.md' | wc -l | xargs -I{} test {} -eq 0 && echo SCOPE_CLEAN` |
| gate_6_human | `Sprint gate step 2 on real iOS device — curated suggestion cards visible with copper accent + road icon when no route on map` |

## Coding Standards

- Spec document uses Markdown with explicit section headers matching the four required sections
- All token references use dot-notation path (e.g. `semantic.color.accent.default`) with resolved value in parentheses for clarity
- Gap table has columns: Location (file:line), Current value, Gap type (hardcoded-hex / magic-number / wrong-token), Required token path
- Do not introduce new token files or modify existing token JSON — the spec is read-only against the token system

## Dependencies

- Depends on: None
- Blocks: DISC-016 (tapping suggestion card plots route) — implementer reads this spec for exact token props, DISC-017 (curated vs generic suggestion cards) — implementer reads this spec for chip variant style
- Parallel: DESIGN-S01-002, DESIGN-S01-003, DESIGN-S01-004, DATA-001, DATA-002

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {},
  "requirements": [
    "UC-DISC-09: curated-route suggestion cards over the plan input, visually distinct from generic planning prompts",
    "10-design-system.md \u00a71: glassmorphic overlays use `surface.glass` (rgba @ 72% alpha per colors.tokens.json) \u2014 not raw hex+inline opacity",
    "07-ui-infrastructure.md \u00a76: touch targets \u2265 44pt",
    "07-ui-infrastructure.md \u00a76: all colors via `useSemanticTheme()` \u2014 no hardcoded hex",
    "07-ui-infrastructure.md \u00a76: testID `discovery-suggestion-pill-{routeId}` on each curated card"
  ]
}
-->
