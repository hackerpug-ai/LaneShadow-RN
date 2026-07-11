---
stability: CONSTITUTION
last_validated: 2026-07-11
prd_version: 3.1.0
---

# Routing & Views

## Principle

Route-vs-state discriminator: a new route ONLY at a product seam (whole frame composition
changes). Geometry Completion adds **content states to two existing views** — the discovery
slot on the Route Plan View home, and a caption leaf on Curated Route Detail. Neither frame
changes. **Zero new routes.**

Sequencing note: this delta is expressed against the MVP route map baseline
(`prds/mvp/09-technical-requirements/09-routing.md` v3.0.0). Per ratified decision 4 this PRD
ships *before* the enrichment R-leg, so enrichment's `10-routing.md` delta layers on top of
this one.

## Route map delta (against the MVP route map)

| Route | Path | Kind | States (delta) | Primary UCs (delta) | Enter when |
|---|---|---|---|---|---|
| Route Plan View (HOME) | `app/(app)/(tabs)/index.tsx` | tab screen (default landing, existing) | **+`gated-results`** (rider-ready-only pills/pins/carousel/chat-cards — content-only), **+`thin-region-absence`** (honest empty + labeled fallback-to-national, replacing the silent substitution + fabricated `0mi` label) | +UC-SURF-02, +UC-SURF-03, +UC-SURF-04 | unchanged (app launch / default landing) |
| Curated Route Detail | `app/(app)/curated-route/[id].tsx` | pushed stack route (existing) | **+`provenance-caption`** (variants keyed off `geometryProvenance`; visible for `ai_reconstructed`/`name_routed` only), `geometry-absent` reuses the existing DESIGN-003 "Approximate location" state | +UC-SURF-05, +UC-SURF-06 | unchanged (map pin tap / saved-bookmark reopen / deep link — chat cards verified NOT to navigate here) |
| Saved Route Detail | `app/(app)/saved-route/[id].tsx` | pushed stack route (existing) | unchanged | +UC-SURF-06 (reachability guarantee only) | unchanged (tap a row in Saved Routes) |

## Route Delta — v1.0.0

| Route | NEW/CHANGED/DELETED | Detail | Discriminator rationale |
|---|---|---|---|
| Route Plan View (HOME) | **CHANGED** | Discovery pills/pins/carousel/chat-cards gate to rider-ready content; pill row + agent chat gain honest thin-region copy (labeled fallback, no fabricated distances) | Not a seam — same frame (map + docked chat input); this is the pre-existing suggestion-slot state from the MVP route map; only its data and copy change |
| Curated Route Detail | **CHANGED** | Gains a provenance-caption content leaf; existing "Approximate location" state reused unchanged as honest absence | Not a seam — a content state of the existing detail view, exactly mirroring how the enrichment sibling added `enriched`/`enrichment-absent` to this SAME route and how `hasSummary` already governs sections here |
| Saved Route Detail | UNCHANGED | Listed for completeness — its curated-bookmark redirect is the audited gate-bypass path the reachability guarantee protects | — |

## Anti-proliferation check

`gated-results` / `thin-region-absence` / `provenance-caption` / `geometry-absent` differ
only by content within two existing frames → **STATES, not routes**. No overlay, no
navigation change, no new screen. Browse-by-state UI does not exist in the live app (deleted
in MVP v3.0.0) — the query-level gate covers conversational reach; no third surface exists.
Operator surfaces (REVIEW queue, couch sample, coverage report) are `npx convex run` / driver
artifacts — deliberately NOT app routes, mirroring the enrichment trust-boundary precedent.

## UI-facing UC coverage

- UC-SURF-02 → Route Plan View (HOME) / `gated-results` (agent tool path)
- UC-SURF-03 → Route Plan View (HOME) / `gated-results` (browse/carousel path)
- UC-SURF-04 → Route Plan View (HOME) / `thin-region-absence`
- UC-SURF-05 → Curated Route Detail / `provenance-caption`
- UC-SURF-06 → Curated Route Detail / `geometry-absent` + Saved Route Detail redirect
- UC-AGT-03 → Route Plan View (HOME) / `clarifying-question` (a chat-content state)
- UC-AGT-04 → Route Plan View (HOME) / `grounded-results` (distance-bearing chat replies + thin-coverage candor + volunteered weather verdicts). **Render surface (v3.1.0):** the weather go/no-go verdict and the clarifying-question turn render as **agent prose in the existing `session_messages` text bubble** — NOT a new weather card; route options remain attachment cards.
- UC-AGT-06 → Route Plan View (HOME) / `grounded-results` (≤3-option default, comfort labels, **save-close** — content shaping of the same chat state; reuses the existing **Save** card affordance). **Share-to-link is DEFERRED (v3.1.0):** no share affordance exists in the app and none is built here; the close is Save-to-library only.
- UC-AGT-01/02/05 are conversation-engine/operator-facing — no new routes or visual states beyond the chat content itself
- UC-SURF-01 and all HYG/REC/VER UCs are backend/operator-facing — no app routes (by design)

## Route Delta — v2.0.0 (AGT)

| Route | NEW/CHANGED/DELETED | Detail | Discriminator rationale |
|---|---|---|---|
| Route Plan View (HOME) | **CHANGED** | Chat conversation gains `clarifying-question` and `grounded-results` (distances + thin-coverage candor) content states; rendered through the existing message/card components — no new components, no navigation change | Not a seam — chat message content within the same frame, exactly like the existing suggestion/absence states; the agent rebuild changes what the surface says, not where conversation happens |

## Route Delta — v3.0.0 (persona pass)

| Route | NEW/CHANGED/DELETED | Detail | Discriminator rationale |
|---|---|---|---|
| Route Plan View (HOME) | **CHANGED** | `grounded-results` content enriched: volunteered weather verdicts on dated requests, ≤3-option default with depth-on-request, honest comfort labels, waypoint-anchored answers, save-close via the existing Save card action | Not a seam — reply-content shaping of the existing chat state; zero new components or navigation |

## Route Delta — v3.1.0 (red-hat remediation)

| Route | NEW/CHANGED/DELETED | Detail | Discriminator rationale |
|---|---|---|---|
| Route Plan View (HOME) | **CHANGED** | Render-surface pinned: weather verdict + clarifying-question render as **prose in the `session_messages` text bubble**, not new cards. `grounded-results` close is **Save-only** — the "share via existing save/share card affordances" claim was wrong (no share affordance exists; planned routes have no deep-link target), so share-to-link is descoped to a future PRD. Note: "the carousel" for curated discovery denotes the **pill + map-pin** surfaces, not the home carousel (which renders planned/agent options); and `CuratedRouteCard` renders `/100` while the extended discovery gate asserts `%` — a card-format fix rides the F-leg polish | Not a seam — reply-content shaping + copy corrections within the same frame; no new components or navigation |
