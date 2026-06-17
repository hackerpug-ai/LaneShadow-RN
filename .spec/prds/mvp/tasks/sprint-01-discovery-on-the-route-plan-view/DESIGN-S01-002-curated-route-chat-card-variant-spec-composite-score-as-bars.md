# DESIGN-S01-002: Curated-route chat-card variant spec (composite score as %/bars on 0–1; distinct from planned-trip routing card)

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** DESIGN · **Status:** ✅ Completed · **Priority:** P1 · **Effort:** S · **Estimate:** 75 min  
**Agent:** frontend-designer  
**Proposed By:** frontend-designer  
**Agent rationale:** frontend-designer owns visual spec and audit; the score-rendering contract and variant differentiation table are the primary design decisions that prevent the 0% / raw-decimal bug from propagating into the DISC-020 implementation.  

## Outcome

A written layout spec and `variant='curated'` prop plan exists at `.spec/design/sprint-01/curated-route-chat-card-spec.md`, naming exact token paths and the score-rendering formula, verifiable by `pnpm tokens:validate` and on-device inspection at the sprint gate.

## Specification

- **deliverable**: `.spec/design/sprint-01/curated-route-chat-card-spec.md` — a structured spec with five sections: (1) Score rendering contract; (2) Layout spec for the `curated` variant; (3) Visual differentiation table vs the existing `full` variant of `RouteAttachmentCard`; (4) `variant='curated'` prop plan (new prop or new component decision); (5) Token path table.
- **score_rendering_contract**: {'formula': "Math.round(score * 100) + '%' where score is the 0–1 float from `useCuratedDiscovery` / the agent curated-discovery tool", 'composite_display': 'Large percentage badge using `semantic.type.title.lg` (fontSize 17, fontWeight 600) in `semantic.color.primary.default` (#EE7C2B copper)', 'bar_rendering': "Each dimension score rendered as a `ScoreDimensionBar` (as specified in 10-design-system.md §2): track `semantic.color.surface.inset`, fill `semantic.color.primary.default`, height `semantic.space.xs × 2 = 8dp`, value `Math.round(score*100)+'%'` via `semantic.type.label.sm` + JetBrains Mono (instrument font)", 'forbidden_displays': ["raw 0–1 float (e.g. '0.73')", "raw 0–100 integer (e.g. '73')", '0% when score is non-zero (score-field mapping bug — see DATA-008b)']}
- **curated_card_layout_spec**: {'row_1_route_name': 'Route name as `semantic.type.title.lg` (17/600), color `semantic.color.onSurface.default` — NOT the `{startLabel} → {endLabel}` format', 'row_2_mileage_archetype': "Mileage in miles (`${Math.round(distanceMi)}mi`) + archetype badge (existing `Badge` component, variant='secondary') in a `flexDirection: row, gap: semantic.space.sm` layout", 'row_3_composite_score': "Composite score as `Math.round(compositeScore*100)+'%'` displayed prominently; optionally followed by 2–3 dimension score bars (curvature, scenic, technical) using `ScoreDimensionBar`", 'background': "variant='full'-style card background: `semantic.color.surfaceVariant.default`, borderRadius `semantic.radius.md`, `semantic.elevation[2]`", 'padding': 'paddingHorizontal: `semantic.space.md` (12pt), paddingVertical: `semantic.space.md` (12pt)', 'touch_target': 'full card is tappable; height must reach `semantic.control.minTouchTarget` (44pt) minimum via natural content or explicit minHeight', 'testID': "testID='route-attachment-card' (reuse existing testID per 07-ui-infrastructure.md §6)"}
- **visual_differentiation_table**: {'description': "The spec must include a side-by-side table: column 1 = 'Planned-trip `full` variant (RouteAttachmentCard)', column 2 = 'Curated `curated` variant'. Key differentiators: start→end labels (present/absent), score bars (absent/present), archetype badge (absent/present), route name prominence (secondary/primary)."}
- **prop_plan**: {'recommendation': "Add `variant='curated'` to `RouteAttachmentCardProps` alongside the existing `'compact' | 'full'`. This avoids a new component file and keeps the tap→map loop machinery intact. Alternatively, a new `CuratedRouteCard` component is acceptable if the implementer (DISC-020) determines the conditional branching inside `RouteAttachmentCard` would become too complex. The spec must document both options and state the preference.", 'new_props_if_extending': ["variant: 'compact' | 'full' | 'curated'", 'curatedRoute?: { name: string; distanceMi: number; archetype: RouteArchetype; compositeScore: number; curvatureScore?: number; scenicScore?: number; technicalScore?: number }']}

## Critical Constraints

- NEVER specify score as a 0–100 integer or a 0–1 decimal in display — the ONLY valid display form is `Math.round(score * 100) + '%'` (e.g. score=0.73 → '73%'). The spec must name this formula explicitly and flag any display of raw 0–1 or 0–100 integers as a bug.
- NEVER show start→end leg labels on the curated card — the card shows route name, mileage, and archetype badge; the `{startLabel} → {endLabel}` row from `RouteAttachmentCard` is a planned-trip pattern and must NOT appear on the curated variant.
- NEVER specify a hardcoded hex for any color property — every color must be a token path from `tokens/semantic/semantic.tokens.json` or `tokens/semantic/colors.tokens.json`.
- Spec is a WRITE to `.spec/design/sprint-01/curated-route-chat-card-spec.md` ONLY — do NOT modify `route-attachment-card.tsx` or any app source.
- Scores arrive on the 0–1 scale from `useCuratedDiscovery` and must be carried through unmodified to the rendering formula — the spec must note this and prohibit rescaling in the hook or store.

## Acceptance Criteria

### AC-1: Spec document exists with all five required sections
*(PRIMARY)*
- **GIVEN** The sprint gate reviewer opens `.spec/design/sprint-01/curated-route-chat-card-spec.md`
- **WHEN** They inspect the document structure
- **THEN** Five headed sections present: Score Rendering Contract, Layout Spec, Visual Differentiation Table, Prop Plan, Token Path Table — all non-empty
- **Test tier:** `e2e` · **Service:** human-gate + file artifact
- **Verify:** `test -s .spec/design/sprint-01/curated-route-chat-card-spec.md && echo PASS`
- **Scenario** (start `?`):
  - must observe: F; o; r; m; u; l; a;  ; `; M; a; t; h; .; r; o; u; n; d; (; s; c; o; r; e;  ; *;  ; 1; 0; 0; );  ; +;  ; '; %; '; `;  ; i; n;  ; S; c; o; r; e;  ; R; e; n; d; e; r; i; n; g;  ; C; o; n; t; r; a; c; t;  ; s; e; c; t; i; o; n; ;;  ; f; i; v; e;  ; s; e; c; t; i; o; n;  ; h; e; a; d; e; r; s;  ; p; r; e; s; e; n; t
  - must NOT observe: F; o; r; m; u; l; a;  ; s; t; a; t; e; d;  ; a; s;  ; `; s; c; o; r; e;  ; *;  ; 1; 0; 0; `;  ; (; i; n; t; e; g; e; r; );  ; O; R;  ; `; s; c; o; r; e; .; t; o; F; i; x; e; d; (; 2; ); `;  ; (; d; e; c; i; m; a; l; );  ; O; R;  ; f; i; l; e;  ; n; o; t;  ; f; o; u; n; d
  - negative control (would fail if): would fail if spec doc is absent, any section missing, or score formula is stated incorrectly

### AC-2: Score rendering formula is `Math.round(score * 100) + '%'` — explicitly named and the only valid form
- **GIVEN** The Score Rendering Contract section of the spec
- **WHEN** The formula is read
- **THEN** The formula matches `Math.round(score * 100) + '%'` exactly; the spec flags raw decimal and raw integer displays as bugs; the spec notes score must arrive as 0–1 float from the hook
- **Test tier:** `e2e` · **Service:** human-gate
- **Verify:** `test -s .spec/design/sprint-01/curated-route-chat-card-spec.md && echo PASS`

### AC-3: Visual differentiation table explicitly lists start→end labels as ABSENT on curated variant
- **GIVEN** The Visual Differentiation Table section
- **WHEN** The 'start→end labels' row is read
- **THEN** The curated variant column reads 'ABSENT' or equivalent negative; the planned-trip column reads 'PRESENT'
- **Test tier:** `e2e` · **Service:** human-gate
- **Verify:** `test -s .spec/design/sprint-01/curated-route-chat-card-spec.md && echo PASS`

### AC-4: Token path table covers all color and typography properties — no hardcoded hex
- **GIVEN** The Token Path Table section
- **WHEN** Every color and typography property row is inspected
- **THEN** Zero raw hex values appear in the 'Token path' column; all paths resolve to tokens defined in `tokens/semantic/`
- **Test tier:** `e2e` · **Service:** human-gate + pnpm tokens:validate
- **Verify:** `test -s .spec/design/sprint-01/curated-route-chat-card-spec.md && echo PASS`

### AC-5: On-device: curated chat cards show real non-zero composite score as % at sprint gate
- **GIVEN** DISC-020 is merged; user types 'twisties near Asheville' on real device
- **WHEN** Chat cards appear in transcript
- **THEN** Each curated route card shows `Math.round(score*100)+'%'` (e.g. '73%') — never '0%', never '0.73', never raw integer; score bars visible; no start→end label row
- **Test tier:** `e2e` · **Service:** real iOS device against live Convex dev
- **Verify:** `test -s .spec/design/sprint-01/curated-route-chat-card-spec.md && echo PASS`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | `.spec/design/sprint-01/curated-route-chat-card-spec.md` exists and is non-empty | AC-1 | `test -s .spec/design/sprint-01/curated-route-chat-card-spec.md && echo PASS` |
| TC-2 | Spec file contains the exact formula string `Math.round(score * 100)` | AC-2 | `grep -q 'Math.round(score \* 100)' .spec/design/sprint-01/curated-route-chat-card-spec.md && echo PASS` |
| TC-3 | `pnpm tokens:validate` exits 0 | AC-4 | `pnpm tokens:validate` |
| TC-4 | Spec file contains 'ABSENT' in context of start→end differentiation | AC-3 | `grep -qi 'absent' .spec/design/sprint-01/curated-route-chat-card-spec.md && echo PASS` |

## Reading List

- `components/chat/route-attachment-card.tsx` (72-165) — Existing `full` variant layout — the baseline the curated variant differentiates from; start→end row at lines 189-230 is the pattern that must NOT appear on curated
- `.spec/prds/mvp/09-technical-requirements/10-design-system.md` (38-58) — §2 ScoreDimensionBar spec — the score bar primitive the curated card uses
- `.spec/prds/mvp/05-uc-disc.md` (89-96) — UC-DISC-10 AC: 'System carries composite scores through chat-driven results on the raw 0-1 scale, rendered as bars or percent and never as a raw 0-100 number'
- `tokens/semantic/semantic.tokens.json` (1-50) — semantic.color.primary.default (copper), semantic.color.surface.inset (score bar track)
- `.spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view/SPRINT.md` (51-58) — DISC-020 task scope — what the implementer that reads this spec will build

## Guardrails

- WRITE-ALLOWED: `.spec/design/sprint-01/curated-route-chat-card-spec.md (NEW) — the deliverable spec document`
- WRITE-PROHIBITED: components/chat/route-attachment-card.tsx — implementation owned by DISC-020
- WRITE-PROHIBITED: tokens/** — read-only
- WRITE-PROHIBITED: Any file not in write_allowed

## Design

- ref: .spec/prds/mvp/09-technical-requirements/10-design-system.md §1 (score bar fill token), §2 (ScoreDimensionBar spec)
- ref: .spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md §1 (RouteAttachmentCard reuse, card→map loop)
- ref: tokens/semantic/semantic.tokens.json (semantic.color.primary.default, semantic.color.surface.inset, semantic.type.title.lg, semantic.type.label.sm, semantic.color.surfaceVariant.default, semantic.radius.md, semantic.elevation, semantic.space)
- ref: components/chat/route-attachment-card.tsx (existing full variant — the baseline for the differentiation table)

## Verification Gates

| Gate | Command |
|------|---------|
| gate_1_spec_exists | `test -s .spec/design/sprint-01/curated-route-chat-card-spec.md && echo PASS` |
| gate_2_formula_present | `grep -q 'Math.round(score' .spec/design/sprint-01/curated-route-chat-card-spec.md && echo PASS` |
| gate_3_tokens_validate | `pnpm tokens:validate` |
| gate_4_type_check | `pnpm type-check` |
| gate_5_scope_compliance | `git diff --name-only | grep -v '.spec/design/sprint-01/curated-route-chat-card-spec.md' | wc -l | xargs -I{} test {} -eq 0 && echo SCOPE_CLEAN` |
| gate_6_human | `Sprint gate step 5 on real iOS device — curated chat cards show non-zero % score; no start→end label row visible` |

## Coding Standards

- Spec uses Markdown with explicit section headers matching the five required sections
- Score formula must appear verbatim as `Math.round(score * 100) + '%'` in the Score Rendering Contract section
- Visual differentiation table uses | Column | Planned-trip `full` | Curated `curated` | format
- Token path table has columns: Property, Token path, Resolved value (light), Resolved value (dark)

## Dependencies

- Depends on: None
- Blocks: DISC-020 (curated chat-card render + card→map loop) — implementer reads this spec
- Parallel: DESIGN-S01-001, DESIGN-S01-003, DESIGN-S01-004, DATA-008b

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {},
  "requirements": [
    "UC-DISC-10: System carries composite scores through chat-driven results on the raw 0-1 scale, rendered as bars or percent and never as a raw 0-100 number",
    "10-design-system.md \u00a72: ScoreDimensionBar renders score as `Math.round(score * 100)+'%'`; fill `semantic.color.primary.default`; track `semantic.color.surface.inset`",
    "10-design-system.md \u00a71: Score bar fill `semantic.color.primary.default` (#EE7C2B copper-500)",
    "07-ui-infrastructure.md \u00a71: RouteAttachmentCard is REUSE \u2014 curated results ride the existing card\u2192map\u2192tap-back loop",
    "07-ui-infrastructure.md \u00a76: testID `route-attachment-card` on curated variant cards"
  ]
}
-->
