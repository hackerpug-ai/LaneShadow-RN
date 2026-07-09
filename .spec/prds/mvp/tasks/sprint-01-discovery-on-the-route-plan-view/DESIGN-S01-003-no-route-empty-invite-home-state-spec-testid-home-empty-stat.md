# DESIGN-S01-003: No-route empty/invite home-state spec (testID home-empty-state): discovery-invite copy + empty-catalog messaging over surface.glass scrim @ 72%

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** DESIGN · **Status:** ✅ Completed · **Priority:** P1 · **Effort:** XS · **Estimate:** 45 min  
**Agent:** frontend-designer  
**Proposed By:** frontend-designer  
**Agent rationale:** frontend-designer owns the copy, zIndex, and token decisions for the empty-state overlay; the zIndex-below-ChatInput rule is a design architecture decision (not just styling) that the implementer must follow.  

## Outcome

A written spec exists at `.spec/design/sprint-01/home-empty-state-spec.md` defining the no-route empty/invite overlay (testID `home-empty-state`), with exact token paths, copy strings, zIndex rule, and gating condition, verifiable by `pnpm tokens:validate` and on-device inspection at the sprint gate.

## Specification

- **deliverable**: `.spec/design/sprint-01/home-empty-state-spec.md` — a structured spec with four sections: (1) Gating condition; (2) Copy strings and typography; (3) Layout and visual spec; (4) zIndex and interaction model.
- **gating_condition**: {'show_when': 'hasActiveRoute === false AND transcriptMessages.length === 0', 'hasActiveRoute_source': 'derived from `!!agentActiveOption` in `index.tsx` line 257 — already available as a prop to ChatInput', 'transcriptMessages_source': 'rawTranscriptMessages filtered array from `useQuery(api.db.sessionMessages.list, ...)` in index.tsx', 'testID': 'NOT REQUIRED — per founder decision (2026-07-09), the discovery-invite is implemented as the INPUT PLACEHOLDER text "Plan a ride…" in the chat-input, NOT as a separate home-empty-state overlay. This spec documents the historical design intent but does NOT require a home-empty-state testID or overlay component to be shipped.'}
- **copy_strings**: {'discovery_invite_line': "'Discover roads near you' — HISTORICAL ONLY; the shipped implementation uses INPUT PLACEHOLDER 'Plan a ride…' instead per founder decision (2026-07-09)", 'discovery_invite_typography': "semantic.type.body.md (fontSize 12, lineHeight 18, fontWeight 400) + fontStyle: 'italic' — HISTORICAL ONLY", 'discovery_invite_color': 'semantic.color.onSurface.muted — HISTORICAL ONLY', 'empty_catalog_line': "'No routes near you yet' — HISTORICAL ONLY", 'empty_catalog_condition': 'shown only when `useCuratedDiscovery` returns `isEmpty === true` (routes === []); hidden during loading (`isLoading === true`) and hidden when routes exist — HISTORICAL ONLY', 'empty_catalog_typography': 'semantic.type.body.sm (fontSize 11, lineHeight 16, fontWeight 400) — HISTORICAL ONLY', 'empty_catalog_color': 'semantic.color.onSurface.muted — HISTORICAL ONLY', 'shipped_implementation': 'Per founder decision (2026-07-09), the discovery-invite is implemented as the INPUT PLACEHOLDER "Plan a ride…" in components/chat/chat-input.tsx, NOT as a home-empty-state overlay. The placeholder text satisfies the invite requirement WITHOUT a separate overlay component or testID.'}
- **layout_and_visual**: {'container_background': 'semantic.color.surface.glass (light: rgba(253,251,248,0.72), dark: rgba(45,34,24,0.72)) — NOT surface.overlay (92% alpha)', 'container_border_radius': 'semantic.radius.lg (14pt)', 'container_padding': 'paddingHorizontal: semantic.space.xl (24pt), paddingVertical: semantic.space.lg (16pt)', 'container_elevation': 'semantic.elevation[2]', 'positioning': "absolute, bottom positioned above ChatInput; `bottom` value = ChatInput height (approximately 90pt including suggestion chips) + semantic.space.md (12pt) margin; OR `marginBottom` from ChatInput using the component's own bottomOffset prop", 'alignment': "centered horizontally via `alignSelf: 'center'` or `left: 0, right: 0` with `alignItems: 'center'`", 'text_alignment': 'center'}
- **zindex_and_interaction**: {'zIndex': 10, 'rationale': 'ChatInput is at zIndex: 20 in chat-input.tsx StyleSheet line ~418; the empty-state must be below ChatInput so it does not intercept pill tap events; suggestion chips (testID `chat-input-suggestion-chips`) must remain tappable', 'pointer_events': "The overlay View should have `pointerEvents='none'` since it is purely informational and must not block taps on the suggestion chips area"}

## Critical Constraints

- NEVER specify `zIndex` higher than the `ChatInput` component (which uses `zIndex: 20` in StyleSheet) — the empty-state overlay MUST render below the ChatInput so suggestion pill taps pass through; spec must explicitly state `zIndex: 10` or lower and explain why.
- NEVER use hardcoded hex for any color — every color must reference a token path; discovery-invite copy color is `semantic.color.onSurface.muted` with italic style.
- NEVER show the empty-state overlay when (a) a route IS on the map or (b) transcript messages exist — the gating condition must be a two-clause AND: `!hasActiveRoute AND transcriptMessages.length === 0`.
- Spec is a WRITE to `.spec/design/sprint-01/home-empty-state-spec.md` ONLY — do NOT modify `index.tsx` or any app source.
- The overlay uses `surface.glass` (72% alpha token) as its background — NOT the `surface.overlay` (92% alpha) token.

## Acceptance Criteria

### AC-1: Spec document exists with all four required sections
*(PRIMARY)*
- **GIVEN** The sprint gate reviewer opens `.spec/design/sprint-01/home-empty-state-spec.md`
- **WHEN** They inspect the document
- **THEN** Four headed sections present: Gating Condition, Copy Strings and Typography, Layout and Visual Spec, zIndex and Interaction Model — all non-empty
- **Test tier:** `e2e` · **Service:** human-gate + file artifact
- **Verify:** `test -s .spec/design/sprint-01/home-empty-state-spec.md && echo PASS`
- **Scenario** (start `?`):
  - must observe: A; l; l;  ; f; o; u; r;  ; s; e; c; t; i; o; n;  ; h; e; a; d; e; r; s;  ; a; n; d;  ; t; h; e;  ; g; a; t; i; n; g;  ; c; o; n; d; i; t; i; o; n;  ; `; !; h; a; s; A; c; t; i; v; e; R; o; u; t; e;  ; A; N; D;  ; t; r; a; n; s; c; r; i; p; t; M; e; s; s; a; g; e; s; .; l; e; n; g; t; h;  ; =; =; =;  ; 0; `
  - must NOT observe: F; i; l; e;  ; n; o; t;  ; f; o; u; n; d;  ; O; R;  ; z; I; n; d; e; x;  ; ≥;  ; 2; 0;  ; s; p; e; c; i; f; i; e; d;  ; f; o; r;  ; t; h; e;  ; o; v; e; r; l; a; y
  - negative control (would fail if): would fail if spec doc is absent or any section is missing

### AC-2: zIndex < 20 explicitly stated with ChatInput zIndex rationale
- **GIVEN** The zIndex and Interaction Model section
- **WHEN** The zIndex value and rationale are read
- **THEN** Spec specifies zIndex ≤ 10 for the empty-state overlay AND explicitly references ChatInput's zIndex: 20 as the reason
- **Test tier:** `e2e` · **Service:** human-gate
- **Verify:** `test -s .spec/design/sprint-01/home-empty-state-spec.md && echo PASS`

### AC-3: surface.glass token named for overlay background (not surface.overlay)
- **GIVEN** The Layout and Visual Spec section
- **WHEN** The container background property is read
- **THEN** Spec references `semantic.color.surface.glass` (or `color.surface.glass`) with the note '72% alpha' — NOT `surface.overlay` (92% alpha)
- **Test tier:** `e2e` · **Service:** human-gate
- **Verify:** `test -s .spec/design/sprint-01/home-empty-state-spec.md && echo PASS`

### AC-4: Discovery-invite copy is 'Discover roads near you' with italic + muted token
- **GIVEN** The Copy Strings and Typography section
- **WHEN** The discovery invite copy is read
- **THEN** Copy is exactly 'Discover roads near you'; typography is `semantic.type.body.md` + `fontStyle: italic`; color is `semantic.color.onSurface.muted`
- **Test tier:** `e2e` · **Service:** human-gate
- **Verify:** `test -s .spec/design/sprint-01/home-empty-state-spec.md && echo PASS`

### AC-5: On-device: input placeholder shows discovery-invite — sprint gate
- **GIVEN** DISC-017 is merged; real device, no route on map
- **WHEN** Sprint gate step 2 is executed
- **THEN** The chat-input shows the placeholder "Plan a ride…" (NOT "Plan a scenic ride" or "Find coffee nearby"); this satisfies the discovery-invite requirement WITHOUT a home-empty-state overlay
- **Test tier:** `e2e` · **Service:** real iOS device against live Convex dev
- **Verify:** `test -s .spec/design/sprint-01/home-empty-state-spec.md && echo PASS`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | `.spec/design/sprint-01/home-empty-state-spec.md` exists and is non-empty | AC-1 | `test -s .spec/design/sprint-01/home-empty-state-spec.md && echo PASS` |
| TC-2 | Spec file contains 'zIndex' reference with value ≤ 10 context | AC-2 | `grep -q 'zIndex' .spec/design/sprint-01/home-empty-state-spec.md && echo PASS` |
| TC-3 | Spec file references 'surface.glass' token | AC-3 | `grep -q 'surface.glass' .spec/design/sprint-01/home-empty-state-spec.md && echo PASS` |
| TC-4 | Spec file documents shipped input placeholder 'Plan a ride…' as discovery-invite implementation | AC-4 / AC-5 | `grep -q 'Plan a ride' .spec/design/sprint-01/home-empty-state-spec.md && echo PASS` |
| TC-5 | `pnpm tokens:validate` exits 0 | AC-3 | `pnpm tokens:validate` |

## Reading List

- `components/chat/chat-input.tsx` (410-420) — StyleSheet.container with `zIndex: 20` — the value the empty-state must NOT meet or exceed
- `app/(app)/(tabs)/index.tsx` (257-264) — hasActiveRoute derivation (`!!agentActiveOption`) and curatedPills construction — the gating signals the overlay reads
- `tokens/semantic/colors.tokens.json` (26-43) — color.surface.glass (72% alpha) vs color.surface.overlay (92% alpha) — the distinction the spec must make explicit
- `.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md` (55-60) — §6 testID `home-empty-state` in the testID registry
- `.spec/prds/mvp/05-uc-disc.md` (64-76) — UC-DISC-09 ACs — the gating rule 'hides whenever a route is displayed, re-shows when cleared'

## Guardrails

- WRITE-ALLOWED: `.spec/design/sprint-01/home-empty-state-spec.md (NEW) — the deliverable spec document`
- WRITE-PROHIBITED: app/(app)/(tabs)/index.tsx — implementation owned by DISC-017
- WRITE-PROHIBITED: components/chat/chat-input.tsx — out of scope
- WRITE-PROHIBITED: tokens/** — read-only
- WRITE-PROHIBITED: Any file not in write_allowed

## Design

- ref: .spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md §6 (testID `home-empty-state`, touch targets, theming)
- ref: .spec/prds/mvp/09-technical-requirements/10-design-system.md §1 (surface.glass rule)
- ref: tokens/semantic/colors.tokens.json (color.surface.glass at 72% alpha, color.surface.overlay at 92% alpha — must use glass not overlay)
- ref: tokens/semantic/semantic.tokens.json (semantic.color.onSurface.muted, semantic.type.body.md, semantic.type.body.sm, semantic.radius.lg, semantic.space.xl, semantic.elevation)
- ref: components/chat/chat-input.tsx StyleSheet line ~418 (zIndex: 20 for the ChatInput container)

## Verification Gates

| Gate | Command |
|------|---------|
| gate_1_spec_exists | `test -s .spec/design/sprint-01/home-empty-state-spec.md && echo PASS` |
| gate_2_tokens_validate | `pnpm tokens:validate` |
| gate_3_type_check | `pnpm type-check` |
| gate_4_scope_compliance | `git diff --name-only | grep -v '.spec/design/sprint-01/home-empty-state-spec.md' | wc -l | xargs -I{} test {} -eq 0 && echo SCOPE_CLEAN` |
| gate_5_human | `Sprint gate step 2 on real iOS device — `home-empty-state` visible when no route on map; tapping suggestion pill card hides it; overlay does not intercept pill taps` |

## Coding Standards

- Spec uses Markdown with four explicit section headers
- Copy strings appear verbatim in quotes so DISC-017 implementer can copy them
- zIndex rationale must cite the specific ChatInput StyleSheet zIndex value (20) from chat-input.tsx
- Two-variant copy (discovery-invite vs empty-catalog) must be clearly separated with the isEmpty gating condition for each

## Dependencies

- Depends on: None
- Blocks: DISC-017 (suggestion slot shows curated cards, not generic IDLE_SUGGESTIONS) — the empty-state overlay and copy strings are part of this task's scope
- Parallel: DESIGN-S01-001, DESIGN-S01-002, DESIGN-S01-004, DISC-002

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "spec_audit_state": {
      "description": "The spec document exists at .spec/design/sprint-01/home-empty-state-spec.md documenting the no-route empty/invite overlay design, though per founder decision (2026-07-09) the shipped implementation uses input placeholder 'Plan a ride\u2026' instead of a separate overlay",
      "seed_method": "existing_codebase",
      "records": [
        "components/chat/chat-input.tsx StyleSheet with zIndex: 20 for ChatInput",
        "tokens/semantic/colors.tokens.json defines surface.glass (72% alpha) vs surface.overlay (92% alpha)",
        "app/(app)/(tabs)/index.tsx hasActiveRoute derived from !!agentActiveOption at line 257"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the sprint gate reviewer opens .spec/design/sprint-01/home-empty-state-spec.md WHEN they inspect the document THEN four headed sections present: Gating Condition, Copy Strings and Typography, Layout and Visual Spec, zIndex and Interaction Model \u2014 all non-empty",
      "verify": "test -s .spec/design/sprint-01/home-empty-state-spec.md && echo PASS",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "spec_audit_state",
        "tier": "e2e",
        "test_tier": "e2e",
        "verification_service": "human-gate + file artifact"
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": ".spec/design/sprint-01/home-empty-state-spec.md exists and is non-empty",
      "verify": "test -s .spec/design/sprint-01/home-empty-state-spec.md && echo PASS",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the zIndex and Interaction Model section WHEN the zIndex value and rationale are read THEN spec specifies zIndex \u2264 10 for the empty-state overlay AND explicitly references ChatInput's zIndex: 20 as the reason",
      "verify": "test -s .spec/design/sprint-01/home-empty-state-spec.md && echo PASS",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "spec_audit_state",
        "tier": "e2e",
        "test_tier": "e2e",
        "verification_service": "human-gate"
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Spec file contains 'zIndex' reference with value \u2264 10 context",
      "verify": "grep -q 'zIndex' .spec/design/sprint-01/home-empty-state-spec.md && echo PASS",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the Layout and Visual Spec section WHEN the container background property is read THEN spec references semantic.color.surface.glass (or color.surface.glass) with the note '72% alpha' \u2014 NOT surface.overlay (92% alpha)",
      "verify": "test -s .spec/design/sprint-01/home-empty-state-spec.md && echo PASS",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "spec_audit_state",
        "tier": "e2e",
        "test_tier": "e2e",
        "verification_service": "human-gate"
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Spec file references 'surface.glass' token",
      "verify": "grep -q 'surface.glass' .spec/design/sprint-01/home-empty-state-spec.md && echo PASS",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the Copy Strings and Typography section WHEN the discovery invite copy is read THEN copy is exactly 'Discover roads near you'; typography is semantic.type.body.md + fontStyle: italic; color is semantic.color.onSurface.muted (historical; shipped implementation uses input placeholder)",
      "verify": "test -s .spec/design/sprint-01/home-empty-state-spec.md && echo PASS",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "spec_audit_state",
        "tier": "e2e",
        "test_tier": "e2e",
        "verification_service": "human-gate"
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Spec file documents shipped input placeholder 'Plan a ride\u2026' as discovery-invite implementation",
      "verify": "grep -q 'Plan a ride' .spec/design/sprint-01/home-empty-state-spec.md && echo PASS",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN DISC-017 is merged; real device, no route on map WHEN sprint gate step 2 is executed THEN the chat-input shows the placeholder 'Plan a ride\u2026' (NOT 'Plan a scenic ride' or 'Find coffee nearby'); this satisfies the discovery-invite requirement WITHOUT a home-empty-state overlay",
      "verify": "test -s .spec/design/sprint-01/home-empty-state-spec.md && echo PASS",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "spec_audit_state",
        "tier": "e2e",
        "test_tier": "e2e",
        "verification_service": "real iOS device against live Convex dev"
      }
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "On-device: input placeholder shows discovery-invite \u2014 sprint gate",
      "verify": "Sprint gate step 2 on real iOS device \u2014 chat-input shows 'Plan a ride\u2026' placeholder",
      "maps_to_ac": "AC-5"
    }
  ]
}
-->
