# DESIGN-S01-005: Route carousel + single route-summary-card-above-input visual & interaction spec

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** DESIGN · **Status:** ⬜ Backlog · **Priority:** P1 · **Effort:** M · **Estimate:** 75 min
**Agent:** frontend-designer · **Reviewer:** design-reviewer
**Proposed By:** frontend-designer
**Agent rationale:** frontend-designer owns all visual + interaction spec/audit work; this task produces NO app source — it writes a contract doc the react-native-ui-implementer (RUX-001/RUX-002) reads for exact token props, arrow affordances, paging semantics, and testIDs. The carousel replaces the meaningless bottom RouteAttachmentCard stack at `index.tsx:1376-1412` with a single summary card flanked by ‹ › arrows directly above the chat input.

> **Remedial — Sprint 1 testing feedback (item 1):** "route buttons tell me nothing … instead of a layer of buttons can we list the route title card above the input with carousel arrows to page to the next route" — shaped as `‹ ROUTE DETAILS ›` over `| INPUT FIELD |`. (Image #1)

## Outcome

A written spec — `.spec/design/sprint-01/route-carousel-card-spec.md` — that fully specifies a single route-summary card centered above the chat input flanked by left/right carousel arrows, showing ONE route at a time, with token-based styling, disabled/end + single-route-hidden arrow states, tap→details behavior, ≥44pt targets, and a stable testID set — so RUX-001/RUX-002 can implement it from the contract alone.

## Specification

Today `index.tsx:1376-1412` renders a ScrollView stack of compact `RouteAttachmentCard`s (one per efficiency variant) — "buttons that tell me nothing." The spec replaces this with a SINGLE route-summary card directly ABOVE the chat input, flanked by a left ‹ and right › arrow — conceptual layout `‹  ROUTE DETAILS  ›` over `| INPUT FIELD |`. The card reuses the existing `RouteAttachmentCard variant='compact'` body on a `surface.glass` scrim. Arrows page prev/next through the DISTINCT-route list (dedupe efficiency variants of the same route). The spec names exact token paths, arrow affordance + disabled/end + single-route-hidden + hidden-when-no-route states, tap→RouteDetailsSheet behavior, ≥44pt targets, and the testIDs `route-summary-card`, `route-carousel-prev-arrow`, `route-carousel-next-arrow` (shipped in components/map/route-summary-carousel.tsx).

## Critical Constraints

- **MUST** spec ONE route-summary card visible at a time, centered ABOVE the chat input, flanked by a left ‹ and right › arrow; reuse the existing `RouteAttachmentCard variant='compact'` body as the card surface (do NOT invent a second card component).
- **MUST** give every color/space/radius/type value as a `useSemanticTheme()` token path (e.g. `semantic.color.surface.glass`, `semantic.space.md`, `semantic.radius.md`, `semantic.type.body.sm`) with the resolved value in parentheses — never a bare hex or magic number.
- **MUST** cite `semantic.control.minTouchTarget` (44) as the touch-target floor for both arrow buttons and the card.
- **MUST** spec the disabled/hidden arrow rule precisely: left arrow disabled/hidden at the first route, right arrow disabled/hidden at the last route, BOTH arrows hidden when `distinctRoutes.length <= 1`, and the whole carousel hidden when `!hasActiveRoute`.
- **NEVER** spec a redesign or a new design system — ship the current RN look using the existing RouteAttachmentCard compact body, Badge, Button, IconSymbol chevrons.
- **NEVER** render more than one route card at once (the meaningless bottom stack is the thing being removed), and never write to app source — the deliverable is a spec doc only.
- **STRICTLY**: arrows page between DISTINCT routes only (dedupe variants of the same route); tapping the card opens route details (RouteDetailsSheet) and does NOT send a chat message; every interactive element carries a stable testID (`route-summary-card`, `route-carousel-prev-arrow`, `route-carousel-next-arrow`) — these are already shipped in components/map/route-summary-carousel.tsx and MUST NOT be changed.

## Acceptance Criteria

### AC-1: Card-above-input + flanking-arrows layout spec'd with token positioning
- **GIVEN** a reviewer opens `route-carousel-card-spec.md`
- **WHEN** they read the layout section
- **THEN** it describes ONE card centered above the chat input with flanking left/right arrows, and every spacing/inset value is a `semantic.space.*` token path with the resolved value in parentheses (no bare pixel numbers)
- **Verify:** `test -s .spec/design/sprint-01/route-carousel-card-spec.md && grep -q 'semantic.space' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS`

### AC-2: Arrow disabled-at-ends + hidden-when-single-route + hidden-when-no-route states spec'd
- **GIVEN** the arrow affordance + paging section
- **WHEN** the reviewer reads the arrow state rules
- **THEN** the spec states left disabled/hidden at the first distinct route, right disabled/hidden at the last, both hidden when `distinctRoutes.length <= 1`, and the carousel hidden when `!hasActiveRoute` — each tied to a named condition
- **Verify:** `grep -Eq 'distinctRoutes|hasActiveRoute' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS`

### AC-3: Card surface + arrows cite surface.glass and ≥44pt minTouchTarget
- **GIVEN** the card-surface + arrow-button sections
- **WHEN** the reviewer reads the background and touch-target specs
- **THEN** the card scrim is `semantic.color.surface.glass` (not raw rgba) and both arrows + card cite `semantic.control.minTouchTarget` (44)
- **Verify:** `grep -q 'surface.glass' .spec/design/sprint-01/route-carousel-card-spec.md && grep -q 'minTouchTarget' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS`

### AC-4: Tap→details behavior + full testID set spec'd
- **GIVEN** the interaction + testID section
- **WHEN** the reviewer checks the card tap behavior and testIDs
- **THEN** the spec states tapping the card opens RouteDetailsSheet (no chat message), and names all three testIDs `route-summary-card`, `route-carousel-prev-arrow`, `route-carousel-next-arrow` (these are the canonical IDs shipped in components/map/route-summary-carousel.tsx)
- **Verify:** `grep -q 'route-summary-card' … && grep -q 'route-carousel-prev-arrow' … && grep -q 'route-carousel-next-arrow' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS`

### AC-5: On-device: carousel renders with canonical testIDs at sprint gate
- **GIVEN** RUX-001 is merged; real device with active route
- **WHEN** Sprint gate step executes or `.maestro/rux-001` flow runs
- **THEN** The carousel shows one card with testID `route-summary-card` and flanking arrows with `route-carousel-prev-arrow`/`route-carousel-next-arrow` (canonical IDs shipped in components/map/route-summary-carousel.tsx)
- **Test tier:** `e2e` · **Service:** real iOS/Android device against live Convex dev (verified via `.maestro/rux-001` flow)
- **Verify:** `test -s .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | `.spec/design/sprint-01/route-carousel-card-spec.md` exists and is non-empty. | AC-1 | `test -s .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS` |
| TC-2 | Spec references the disabled/hidden arrow conditions (`distinctRoutes` / `hasActiveRoute`). | AC-2 | `grep -Eq 'distinctRoutes|hasActiveRoute' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS` |
| TC-3 | Spec names `surface.glass` and `minTouchTarget` tokens. | AC-3 | `grep -q 'surface.glass' … && grep -q 'minTouchTarget' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS` |
| TC-4 | Spec lists all three carousel testIDs (canonical: route-summary-card, route-carousel-prev-arrow, route-carousel-next-arrow). | AC-4 | `grep -q 'route-carousel-next-arrow' … && grep -q 'route-carousel-prev-arrow' … && grep -q 'route-summary-card' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS` |
| TC-5 | `.maestro/rux-001` flow exists and passes (real-device proof). | AC-5 | `test -s .maestro/rux-001.yaml && echo PASS` |
| TC-6 | `pnpm tokens:validate` exits 0 (no token schema regression). | AC-3 | `pnpm tokens:validate` |

## Reading List

- `app/(app)/(tabs)/index.tsx` (1374-1412) — current bottom RouteAttachmentCard stack (one card per efficiency variant) being replaced
- `components/ui/route-attachment-card.tsx` (83-170) — compact variant body to reuse; note legacy `${color}15/20` hex-alpha (91-110) NOT to replicate on the new glass scrim
- `components/ui/icon-symbol.tsx` (1-40) — IconSymbol for the ‹ › chevron arrows
- `.spec/prds/mvp/09-technical-requirements/10-design-system.md` (13-34) — §1 token rules + `surface.glass` overlay rule
- `.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md` (55-60) — §6 ≥44pt targets, useSemanticTheme(), testID registry

## Guardrails

**WRITE-ALLOWED:** `.spec/design/sprint-01/route-carousel-card-spec.md`
**WRITE-PROHIBITED:** `app/(app)/(tabs)/index.tsx`, `components/ui/route-attachment-card.tsx`, `components/sheets/route-details-sheet.tsx`, `tokens/**`, any file not in WRITE-ALLOWED

## Design

- **Pattern:** Single-item carousel (one card visible, prev/next paging) over a fixed input — reuses the compact RouteAttachmentCard body on a `surface.glass` scrim.
- **Pattern source:** `components/ui/route-attachment-card.tsx` (compact body) + `components/map/search-result-marker.tsx` (Pressable + haptics affordance convention)
- **Anti-pattern:** A vertical stack of one compact card per efficiency variant (`index.tsx:1376-1412`) — "buttons that tell me nothing"; or inventing a second route-card component instead of reusing the compact body.
- **Interaction notes:** Layout `‹ ROUTE DETAILS ›` over `| INPUT FIELD |`; page swaps the single visible card to the prev/next DISTINCT route; left disabled at index 0, right at last index; both arrows hidden when one distinct route; whole carousel hidden when `!hasActiveRoute`; tap card → RouteDetailsSheet (no chat message).

## Verification Gates

| Gate | Command |
|------|---------|
| gate_1_spec_exists | `test -s .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS` |
| gate_2_tokens_validate | `pnpm tokens:validate` |
| gate_3_component_snapshot | `pnpm test components/map/route-summary-carousel.test.tsx` (RUX-001/RUX-002 built component renders one card + prev/next arrows; arrows disabled at ends) |
| gate_4_lint | `pnpm exec biome check .spec/design/sprint-01/route-carousel-card-spec.md` |
| gate_5_scope | `git diff --name-only ⊆ {route-carousel-card-spec.md}` |

## Coding Standards

- All token references use dot-notation (e.g. `semantic.color.surface.glass`) with resolved value in parentheses.
- Spacing/positioning values are `semantic.space.*` token paths — no bare pixel numbers.
- Touch targets cite `semantic.control.minTouchTarget` (44) — never the magic number 44 alone.
- Reuse RouteAttachmentCard compact body, Badge, Button, IconSymbol — no net-new card component; no new design system.
- Spec is read-only against the token system — no token JSON edits.

## Dependencies

- Depends on: (none)
- Blocks: RUX-001, RUX-002

## Notes

Modular-design flag: `index.tsx:1376-1412` renders a per-variant compact-card stack (Rule-of-2 duplication of the same compact card N times) — the carousel collapses it to one reused RouteAttachmentCard compact body. Legacy `${color}15/20` hex-alpha in route-attachment-card.tsx (91-110) is MVP-acceptable per 10-design-system.md §1 but the new glass scrim MUST use `surface.glass`. Carousel arrows are net-new Pressable + IconSymbol chevrons (no pager primitive exists in the kit).

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "spec_audit_state": {
      "description": "The spec document exists at .spec/design/sprint-01/route-carousel-card-spec.md and the carousel implementation at components/map/route-summary-carousel.tsx with canonical testIDs is available",
      "seed_method": "existing_codebase",
      "records": [
        "components/map/route-summary-carousel.tsx ships with testIDs route-summary-card, route-carousel-prev-arrow, route-carousel-next-arrow",
        "components/ui/route-attachment-card.tsx compact variant body to reuse",
        "tokens/semantic/semantic.tokens.json defines space, surface.glass, control.minTouchTarget, radius.md tokens"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a reviewer opens route-carousel-card-spec.md WHEN they read the layout section THEN it describes ONE card centered above the chat input with flanking left/right arrows, and every spacing/inset value is a semantic.space.* token path with the resolved value in parentheses (no bare pixel numbers)",
      "verify": "test -s .spec/design/sprint-01/route-carousel-card-spec.md && grep -q 'semantic.space' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "spec_audit_state",
        "tier": "e2e",
        "test_tier": "e2e",
        "verification_service": "human-gate (sprint gate reviewer)"
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": ".spec/design/sprint-01/route-carousel-card-spec.md exists and is non-empty",
      "verify": "test -s .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the arrow affordance + paging section WHEN the reviewer reads the arrow state rules THEN the spec states left disabled/hidden at the first distinct route, right disabled/hidden at the last, both hidden when distinctRoutes.length <= 1, and the carousel hidden when !hasActiveRoute — each tied to a named condition",
      "verify": "grep -Eq 'distinctRoutes|hasActiveRoute' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "spec_audit_state",
        "tier": "e2e",
        "test_tier": "e2e",
        "verification_service": "human-gate (sprint gate reviewer)"
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Spec references the disabled/hidden arrow conditions (distinctRoutes / hasActiveRoute)",
      "verify": "grep -Eq 'distinctRoutes|hasActiveRoute' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the card-surface + arrow-button sections WHEN the reviewer reads the background and touch-target specs THEN the card scrim is semantic.color.surface.glass (not raw rgba) and both arrows + card cite semantic.control.minTouchTarget (44)",
      "verify": "grep -q 'surface.glass' .spec/design/sprint-01/route-carousel-card-spec.md && grep -q 'minTouchTarget' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "spec_audit_state",
        "tier": "e2e",
        "test_tier": "e2e",
        "verification_service": "human-gate (sprint gate reviewer)"
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Spec names surface.glass and minTouchTarget tokens",
      "verify": "grep -q 'surface.glass' .spec/design/sprint-01/route-carousel-card-spec.md && grep -q 'minTouchTarget' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the interaction + testID section WHEN the reviewer checks the card tap behavior and testIDs THEN the spec states tapping the card opens RouteDetailsSheet (no chat message), and names all three testIDs route-summary-card, route-carousel-prev-arrow, route-carousel-next-arrow (these are the canonical IDs shipped in components/map/route-summary-carousel.tsx)",
      "verify": "grep -q 'route-summary-card' .spec/design/sprint-01/route-carousel-card-spec.md && grep -q 'route-carousel-prev-arrow' .spec/design/sprint-01/route-carousel-card-spec.md && grep -q 'route-carousel-next-arrow' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "spec_audit_state",
        "tier": "e2e",
        "test_tier": "e2e",
        "verification_service": "human-gate (sprint gate reviewer)"
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Spec lists all three carousel testIDs (canonical: route-summary-card, route-carousel-prev-arrow, route-carousel-next-arrow)",
      "verify": "grep -q 'route-summary-card' .spec/design/sprint-01/route-carousel-card-spec.md && grep -q 'route-carousel-prev-arrow' .spec/design/sprint-01/route-carousel-card-spec.md && grep -q 'route-carousel-next-arrow' .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN RUX-001 is merged; real device with active route WHEN sprint gate step executes or .maestro/rux-001 flow runs THEN the carousel shows one card with testID route-summary-card and flanking arrows with route-carousel-prev-arrow/route-carousel-next-arrow (canonical IDs shipped in components/map/route-summary-carousel.tsx)",
      "verify": "test -s .spec/design/sprint-01/route-carousel-card-spec.md && echo PASS",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "spec_audit_state",
        "tier": "e2e",
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device against live Convex dev (verified via .maestro/rux-001 flow)"
      }
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": ".maestro/rux-001 flow exists and passes (real-device proof)",
      "verify": "test -s .maestro/rux-001.yaml && echo PASS",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "pnpm tokens:validate exits 0 (no token schema regression)",
      "verify": "pnpm tokens:validate",
      "maps_to_ac": "AC-3"
    }
  ]
}
-->
