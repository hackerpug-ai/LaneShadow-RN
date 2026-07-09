# DESIGN-S01-006: On-route map TAG/label spec (tappable polyline tag replacing the floating button)

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** DESIGN · **Status:** ⬜ Backlog · **Priority:** P1 · **Effort:** M · **Estimate:** 60 min
**Agent:** frontend-designer · **Reviewer:** react-native-ui-reviewer
**Proposed By:** frontend-designer
**Agent rationale:** frontend-designer owns visual + map-affordance spec; this writes a contract doc (no app source) the react-native-ui-implementer (RUX-004) reads to place a small tappable TAG on the route polyline instead of a floating button. The tag follows the proven `SearchResultMarker` MarkerView + Pressable + token pattern rather than inventing a floating overlay button.

> **Remedial — Sprint 1 testing feedback (item 7, /frontend-design):** "can we label the routes with a tag or something rather than having a floating button? when tapped can we show the route details?"

## Outcome

A written spec — `.spec/design/sprint-01/on-route-tag-spec.md` — for a small tappable TAG anchored on the route polyline showing archetype + distance (e.g. `Scenic · 78mi`) that opens route details on tap, replacing the floating button: MarkerView anchoring on the line, token-based pill styling, selected/unselected states, ≥44pt hit area, and the `route-tag-{routeId}` testID.

## Specification

There is no on-map route tag today; `components/map/search-result-marker.tsx` is the proven Mapbox `MarkerView` + `Pressable` + `useSemanticTheme()` + `expo-haptics` pattern. The spec defines a small tappable TAG anchored at a coordinate ON the route polyline (e.g. the route midpoint) showing `{archetype} · {distance}` (e.g. `Scenic · 78mi`), styled with `surface.glass` pill scrim + `semantic.color.primary.default` (#EE7C2B copper) accent, with distinct unselected vs selected states (glass scrim + copper text → copper fill + onPrimary text), a ≥44pt hit area via `semantic.control.minTouchTarget`, haptics on press, and tap → RouteDetailsSheet (no chat). testID `route-tag-{routeId}` (mirrors `search-result-marker-{id}`).

## Critical Constraints

- **MUST** spec a small, TAPPABLE TAG anchored ON the route polyline (e.g. archetype + distance `Scenic · 78mi`) — NOT a floating button; follow the existing `SearchResultMarker` pattern (Mapbox `MarkerView` at a coordinate + `Pressable` + `useSemanticTheme()` + `expo-haptics` light impact).
- **MUST** give every color/space/radius/type value as a `useSemanticTheme()` token path with resolved value in parentheses — pill background `semantic.color.surface.glass`, copper accent `semantic.color.primary.default` (#EE7C2B), label `semantic.type.label.sm`, radius `semantic.radius.*`.
- **MUST** spec the anchoring precisely: anchor at a coordinate ON the polyline (route midpoint/stable along-line point) with a MarkerView anchor offset so the pill rides the line without occluding the geometry.
- **MUST** spec selected vs unselected states and cite `semantic.control.minTouchTarget` (44) as the touch-target floor.
- **NEVER** spec a floating button (the feedback explicitly replaces it), never use raw hex/rgba (flag SearchResultMarker's `${infoColor}26` hex-alpha as legacy; new pill scrim uses `surface.glass`), never spec a touch target below 44pt, never write to app source.
- **STRICTLY**: tapping the tag opens RouteDetailsSheet (no chat message); the tag carries a stable testID `route-tag-{routeId}`.

## Acceptance Criteria

### AC-1: Tag spec'd as an on-polyline MarkerView tag (not a floating button)
- **GIVEN** a reviewer opens `on-route-tag-spec.md`
- **WHEN** they read the anchoring section
- **THEN** it anchors the tag at a coordinate ON the polyline via Mapbox `MarkerView` (mirroring SearchResultMarker) with a stated anchor offset, and explicitly states it replaces the floating button — no floating/screen-fixed button
- **Verify:** `grep -q 'MarkerView' … && grep -Eqi 'polyline|on the route|along the line|midpoint' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS`

### AC-2: Label content spec'd as archetype · distance with normalized copy
- **GIVEN** the label content section
- **WHEN** the reviewer checks the tag text
- **THEN** the label is `{archetype} · {distance}` (e.g. `Scenic · 78mi`) drawn from the UI archetype enum (10-design-system.md §4) and styled `semantic.type.label.sm`
- **Verify:** `grep -Eqi 'archetype' … && grep -q 'semantic.type.label' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS`

### AC-3: surface.glass pill + copper accent + ≥44pt hit area token-cited
- **GIVEN** the token + styling section
- **WHEN** the reviewer reads pill background, accent, and touch-target specs
- **THEN** the pill scrim is `semantic.color.surface.glass`, the accent is `semantic.color.primary.default` (#EE7C2B), and the Pressable hit area cites `semantic.control.minTouchTarget` (44) — no raw hex/rgba
- **Verify:** `grep -q 'surface.glass' … && grep -q 'primary.default' … && grep -q 'minTouchTarget' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS`

### AC-4: Selected/unselected states + tap→details + route-specific testID spec'd
- **GIVEN** the state + interaction section
- **WHEN** the reviewer checks selected/unselected treatment, tap behavior, and testID
- **THEN** it defines distinct unselected vs selected visuals (glass scrim + copper text → copper fill + onPrimary text), tapping opens RouteDetailsSheet (no chat), and names the route-specific testID `route-tag-{routeId}` (e.g. `route-tag-abc123`) — this is already shipped in components/map/route-tag.tsx and MUST be preserved
- **Verify:** `grep -Eqi 'selected' … && grep -q 'route-tag-{routeId}' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS`

### AC-5: On-device: route tag renders with route-specific testID at sprint gate
- **GIVEN** RUX-004 is merged; real device with active route
- **WHEN** Sprint gate step executes or `.maestro/rux-004` flow runs
- **THEN** The route tag appears on the polyline with testID `route-tag-{routeId}` (route-specific, e.g. `route-tag-abc123`) as shipped in components/map/route-tag.tsx
- **Test tier:** `e2e` · **Service:** real iOS/Android device against live Convex dev (verified via `.maestro/rux-004` flow)
- **Verify:** `test -s .spec/design/sprint-01/on-route-tag-spec.md && echo PASS`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | `.spec/design/sprint-01/on-route-tag-spec.md` exists and is non-empty. | AC-1 | `test -s .spec/design/sprint-01/on-route-tag-spec.md && echo PASS` |
| TC-2 | Spec names `MarkerView` and an on-polyline anchor (not a floating button). | AC-1 | `grep -q 'MarkerView' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS` |
| TC-3 | Spec names `surface.glass`, `primary.default`, and `minTouchTarget` tokens. | AC-3 | `grep -q 'surface.glass' … && grep -q 'primary.default' … && grep -q 'minTouchTarget' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS` |
| TC-4 | Spec names the route-specific `route-tag-{routeId}` testID pattern (shipped in components/map/route-tag.tsx). | AC-4 | `grep -q 'route-tag-{routeId}' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS` |
| TC-5 | `.maestro/rux-004` flow exists and passes (real-device proof). | AC-5 | `test -s .maestro/rux-004-route-tag.yaml && echo PASS` |
| TC-6 | `pnpm tokens:validate` exits 0. | AC-3 | `pnpm tokens:validate` |

## Reading List

- `components/map/search-result-marker.tsx` (50-141) — the MarkerView + Pressable + Svg + haptics + selected-scale pattern the tag mirrors; note `${infoColor}26` hex-alpha (107) is legacy — new pill uses `surface.glass`
- `.spec/prds/mvp/09-technical-requirements/10-design-system.md` (62-88) — §3 (plan view uses MapboxMapView) + §4 (UI archetype enum for the label)
- `.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md` (55-60) — §6 ≥44pt, testID registry, theming

## Guardrails

**WRITE-ALLOWED:** `.spec/design/sprint-01/on-route-tag-spec.md`
**WRITE-PROHIBITED:** `components/map/search-result-marker.tsx`, `app/(app)/(tabs)/index.tsx`, `tokens/**`, any file not in WRITE-ALLOWED

## Design

- **Pattern:** On-polyline Mapbox `MarkerView` tag (pill) with `Pressable` + haptics + selected/unselected states.
- **Pattern source:** `components/map/search-result-marker.tsx`
- **Anti-pattern:** A floating/screen-fixed button overlaying the map (the explicit thing being replaced); or raw-hex pill styling instead of `surface.glass`.
- **Interaction notes:** anchor at a stable coordinate on the polyline (e.g. midpoint) via MarkerView with an anchor offset; press → haptics light → RouteDetailsSheet (no chat); unselected = glass scrim + copper text, selected = copper fill + onPrimary text; visible pill may be compact but the Pressable hit area meets the 44pt floor.

## Verification Gates

| Gate | Command |
|------|---------|
| gate_1_spec_exists | `test -s .spec/design/sprint-01/on-route-tag-spec.md && echo PASS` |
| gate_2_tokens_validate | `pnpm tokens:validate` |
| gate_3_component_snapshot | `pnpm test components/map/route-tag.test.tsx` (RUX-004 built tag renders `Scenic · 78mi`, selected vs unselected differ, `route-tag-{routeId}` present) |
| gate_4_lint | `pnpm exec biome check .spec/design/sprint-01/on-route-tag-spec.md` |
| gate_5_scope | `git diff --name-only ⊆ {on-route-tag-spec.md}` |

## Coding Standards

- All token references use dot-notation with resolved value in parentheses.
- Pill scrim uses `semantic.color.surface.glass`; accent uses `semantic.color.primary.default` — no raw hex/rgba.
- Hit area cites `semantic.control.minTouchTarget` (44) — never the magic number alone.
- Mirror SearchResultMarker's MarkerView + Pressable + haptics structure; do not invent a floating button.
- Spec is read-only against the token system — no token JSON edits.

## Dependencies

- Depends on: (none)
- Blocks: RUX-004

## Notes

Modular-design flag: SearchResultMarker is the proven on-map tappable affordance (MarkerView + Pressable + haptics + selected-scale) — the on-route tag reuses this structure rather than introducing a floating button, keeping a single map-marker interaction convention. Legacy `${infoColor}26` hex-alpha in SearchResultMarker (107) is MVP-acceptable but the new pill scrim must use `surface.glass`.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "spec_audit_state": {
      "description": "The spec document exists at .spec/design/sprint-01/on-route-tag-spec.md and the route-tag implementation at components/map/route-tag.tsx with route-specific testID is available",
      "seed_method": "existing_codebase",
      "records": [
        "components/map/route-tag.tsx ships with testID route-tag-{routeId} pattern",
        "components/map/search-result-marker.tsx provides MarkerView + Pressable + haptics + selected-scale pattern to mirror",
        "tokens/semantic/semantic.tokens.json defines surface.glass, primary.default, type.label.sm, radius, control.minTouchTarget tokens"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a reviewer opens on-route-tag-spec.md WHEN they read the anchoring section THEN it anchors the tag at a coordinate ON the polyline via Mapbox MarkerView (mirroring SearchResultMarker) with a stated anchor offset, and explicitly states it replaces the floating button — no floating/screen-fixed button",
      "verify": "grep -q 'MarkerView' .spec/design/sprint-01/on-route-tag-spec.md && grep -Eqi 'polyline|on the route|along the line|midpoint' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS",
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
      "description": ".spec/design/sprint-01/on-route-tag-spec.md exists and is non-empty",
      "verify": "test -s .spec/design/sprint-01/on-route-tag-spec.md && echo PASS",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Spec names 'MarkerView' and an on-polyline anchor (not a floating button)",
      "verify": "grep -q 'MarkerView' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the label content section WHEN the reviewer checks the tag text THEN the label is {archetype} · {distance} (e.g. 'Scenic · 78mi') drawn from the UI archetype enum (10-design-system.md §4) and styled semantic.type.label.sm",
      "verify": "grep -Eqi 'archetype' .spec/design/sprint-01/on-route-tag-spec.md && grep -q 'semantic.type.label' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS",
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
      "description": "Spec names surface.glass, primary.default, and minTouchTarget tokens",
      "verify": "grep -q 'surface.glass' .spec/design/sprint-01/on-route-tag-spec.md && grep -q 'primary.default' .spec/design/sprint-01/on-route-tag-spec.md && grep -q 'minTouchTarget' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the token + styling section WHEN the reviewer reads pill background, accent, and touch-target specs THEN the pill scrim is semantic.color.surface.glass, the accent is semantic.color.primary.default (#EE7C2B), and the Pressable hit area cites semantic.control.minTouchTarget (44) — no raw hex/rgba",
      "verify": "grep -q 'surface.glass' .spec/design/sprint-01/on-route-tag-spec.md && grep -q 'primary.default' .spec/design/sprint-01/on-route-tag-spec.md && grep -q 'minTouchTarget' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "spec_audit_state",
        "tier": "e2e",
        "test_tier": "e2e",
        "verification_service": "human-gate (sprint gate reviewer)"
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the state + interaction section WHEN the reviewer checks selected/unselected treatment, tap behavior, and testID THEN it defines distinct unselected vs selected visuals (glass scrim + copper text → copper fill + onPrimary text), tapping opens RouteDetailsSheet (no chat), and names the route-specific testID route-tag-{routeId} (e.g. route-tag-abc123) — this is already shipped in components/map/route-tag.tsx and MUST be preserved",
      "verify": "grep -Eqi 'selected' .spec/design/sprint-01/on-route-tag-spec.md && grep -q 'route-tag-{routeId}' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS",
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
      "description": "Spec names the route-specific 'route-tag-{routeId}' testID pattern (shipped in components/map/route-tag.tsx)",
      "verify": "grep -q 'route-tag-{routeId}' .spec/design/sprint-01/on-route-tag-spec.md && echo PASS",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN RUX-004 is merged; real device with active route WHEN sprint gate step executes or .maestro/rux-004 flow runs THEN the route tag appears on the polyline with testID route-tag-{routeId} (route-specific, e.g. route-tag-abc123) as shipped in components/map/route-tag.tsx",
      "verify": "test -s .spec/design/sprint-01/on-route-tag-spec.md && echo PASS",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "spec_audit_state",
        "tier": "e2e",
        "test_tier": "e2e",
        "verification_service": "real iOS/Android device against live Convex dev (verified via .maestro/rux-004 flow)"
      }
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": ".maestro/rux-004 flow exists and passes (real-device proof)",
      "verify": "test -s .maestro/rux-004-route-tag.yaml && echo PASS",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "pnpm tokens:validate exits 0",
      "verify": "pnpm tokens:validate",
      "maps_to_ac": "AC-3"
    }
  ]
}
-->
