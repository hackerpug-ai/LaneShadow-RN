---
stability: CONSTITUTION
last_validated: 2026-07-11
prd_version: 3.1.0
---

# UI Infrastructure

The UI surface of this PRD is deliberately small: gating is a data-contract change; the new
pixels are one caption leaf, one label chip, and honest empty copy. **Verified against the
live app** (paths cited by the planning team).

## Reuse (no new components)

- **Existing pill chip + non-tappable string-chip branch** (`components/chat/chat-input.tsx`,
  `SuggestionChips`) — the honest-empty message and the fallback-to-national label reuse the
  existing non-tappable branch; gated results reuse the existing tappable pill unchanged.
- **DESIGN-003 "Approximate location" state** (`app/(app)/curated-route/[id].tsx`,
  testID `curated-detail-approximate-badge`) — reused verbatim as the `geometry-absent`
  honest state for saved/deep-linked un-recovered routes. No new state, no new component.
- **Map renderer** (`components/map/route-polyline.tsx` + `route-polyline-component.tsx`) —
  zero changes: already decodes `polyline`/`multipolyline` side-table geometry into one
  `ShapeSource`+`LineLayer` per segment (DATA-011-C work). Output format is unchanged by this
  PRD.
- **Design tokens** — `semantic.type.label.sm`, `semantic.color.onSurface.muted`/`.subtle`,
  `semantic.space.*`; all already in use on the target files. Caption mirrors the enrichment
  sibling's provenance treatment (plain `Text`, muted, non-interactive).
- **Explicitly rejected reuse**: `components/ui/empty-state.tsx` is a full-container
  icon+headline+CTA component — a modularity mismatch for inline pill-row absence; do not
  reach for it. `Badge variant="warning"` exists on the detail screen's component and must
  NOT be used for the provenance caption (trust framing, not alert framing).

## Genuinely new (both inline per the Rule of 2 — single consumer each)

1. **Provenance caption leaf** inside the detail body: conditional `Text` keyed off
   `geometryProvenance`; renders ONLY for `ai_reconstructed` ("Route line reconstructed from
   the ride description") and `name_routed` ("Route line generated from the road name");
   silent for `scraped_promoted` and pre-provenance rows. **Dependency (cross-link):**
   `getCuratedRouteDetail` must project `geometryProvenance` (owned by 04-api-design) — the
   detail screen consumes `FunctionReturnType<typeof getCuratedRouteDetail>` via
   `hooks/use-curated-route-detail.ts`, so the query extension must land before/with the UI
   leaf or it renders nothing.
2. **Fallback-to-national label chip** + `fellBackToBest: boolean` **returned** from
   `useCuratedDiscovery`. *Verified (v3.1.0 correction):* the flag is **computed** at
   `hooks/use-curated-discovery.ts:83` but is **not in the return object** (`:198-202`), and its
   current meaning (nearest→best on location-fail/empty) is **NOT** "zero rider-ready nearby →
   national" — both the exposure and the semantics must be fixed. Leading non-tappable chip
   "No routes nearby — here's our top-rated". Plus the distance-suffix fix **at its real site**:
   the fabricated `0mi` is built at the pill-label call site `app/(app)/(tabs)/index.tsx:350`
   (`Math.round(r.distanceMi ?? 0)` + "mi"), with a second `?? 0` at `:505` — omit the `· Xmi`
   suffix when `distanceMi` is null *there* (NOT in `chat-input`, which renders
   `suggestion.label` verbatim).

## Copy drafts (rider-facing)

| Context | Copy |
|---|---|
| Pill row, true empty | "No routes near you yet" (chat input directly beneath is the next step) |
| Pill row, fallback label | "No routes nearby — here's our top-rated" |
| Agent chat, no rider-ready matches | "I found some {searchQuery} routes {location}, but none have a rider-ready map yet. Try a different search or check back soon." |
| Detail caption, `ai_reconstructed` | "Route line reconstructed from the ride description" |
| Detail caption, `name_routed` | "Route line generated from the road name" |

## Accessibility + testIDs

- `accessibilityLiveRegion="polite"` on pill-row content swaps (absence/fallback replacing
  results) — the pattern exists in `routing-card.tsx` but the pill row's non-tappable branch
  (`chat-input.tsx:101-127`) has **none today**, so this is additive work on that container,
  not a free inherit.
- Tappable affordances keep `semantic.control.minTouchTarget` (44 pt), matching existing
  pills.
- testIDs follow existing conventions: `curated-detail-provenance` (new leaf);
  `geometry-absent` reuses `curated-detail-approximate-badge` (same node);
  `discovery-suggestion-empty`, `discovery-suggestion-fallback-label` (pill row, mirroring
  `discovery-suggestion-pill-{routeId}`).

## Libraries

`react-native-paper` (existing) supplies `Text`; `@rnmapbox/maps` (existing) is the map
engine. **No new libraries.**

## Corrected stale claims

`curated-route/[id].tsx`'s doc comment says detail is reached by "chat card or map pin" —
verified false for chat cards (they select + fit camera, never navigate). Real paths: map-pin
tap, saved-route redirect, deep link. Sprint planning must not assume a chat-card→detail
navigation exists; two more in-code comments still assert the dead path (`index.tsx:478-481`
and `:1568-1569`).

**Maestro `curated-route-detail.yaml` AC-1 is stale (blocks T-SURF-016/017):** it taps
`curated-chat-card-cherohala-skyway` → detail, but that testID does not exist and no chat card
navigates. The provenance-caption flow must hang off the **deep-link** entry
(`openLink: laneshadow:///curated-route/{id}`) or the **map-pin** entry, not AC-1. New testID
`curated-detail-provenance` is kept distinct from the pre-existing saved-route
`route-detail-provenance`.

**Share affordance does not exist (v3.1.0):** UC-AGT-06's close is **Save-to-library only** —
an exhaustive grep found no share affordance anywhere, and planned multi-leg routes have no
deep-link target. Building a share leaf (on the curated `laneshadow:///curated-route/{id}` deep
link) is DEFERRED to a future PRD; no share UI is specced here.
