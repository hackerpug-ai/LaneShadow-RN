---
stability: RESEARCH_FINDING
last_validated: 2026-04-14
research_scope: waypoint-ontology-validation
parent_doc: 03-findings.md
applies_to: .spec/PRODUCT-STRATEGY.md Pillar 1 "Discovery spans routes AND waypoints"
---

# Taxonomy Revision Recommendations

## Verdict

**Keep the 4-category ontology as-is (Pause / Wander / Taste / Gather).** Both research gates passed (see `03-findings.md`). No structural changes needed.

Three minor refinements below. None invalidate existing strategy text — all are clarifications that make the ontology more robust against ambiguous cases we saw in the data.

## Refinement 1 — Broaden the *interpretation* of Wander

**Current strategy text** (`PRODUCT-STRATEGY.md` Pillar 1):

> **Wander** — "Is this worth parking the bike and walking around?" — Historic sites, ghost towns, lighthouses, fire lookouts, covered bridges, weird Americana, small museums

**Issue surfaced**: The examples list reads narrower than what riders actually categorize here. Worker 2 found touring riders heavily use Wander for interpretive signage, trail-walks to waterfalls, cliff-dwelling pueblos (Bandelier, Walnut Canyon), and historic town districts (Madison IN, Gallipolis OH, Red Wing MN). Worker 3 found BARF riders mention walkable scenic stops (Sweetwater, hot springs, Delicate Arch short walks). Worker 5 found editorial writers cluster any 10-30 minute walking stop as the same thing, regardless of subject (history, geology, nature, culture).

**Proposed revision** (minor — one sentence added to strategy doc):

> **Wander** — "Is this worth parking the bike and walking around?" — Historic sites, ghost towns, lighthouses, fire lookouts, covered bridges, weird Americana, small museums, historic town districts, interpretive-sign clusters, walkable scenic features (short-hike waterfalls, cliff dwellings, formations). *The unifying trait is effort ≈ park + duration 10-30 min + some payoff beyond "look and go."*

**Action**: small edit to the Wander row in the PRODUCT-STRATEGY Pillar 1 table. Does NOT change the category itself or any downstream data model / sourcing strategy.

## Refinement 2 — Add an optional attribute, don't add a category

Three hybrid cases appeared in the data that are tempting to categorize as new top-level entries:

| Hybrid | Examples | Right answer |
|---|---|---|
| Biker-friendly establishment | Dave's 209 "the Rattler," Louie's Place Saloon, Two Wheels of Suches | `category = taste` OR `category = gather`, **plus** a new optional attribute `biker_friendly: bool` |
| Hot springs / immersive experience | Benton Hot Springs, Saline Valley, Warm Springs Valley | `category = wander`, `effort = park` or `side_trip`, **plus** optional tag `immersive` |
| Moto museums | National Motorcycle Museum (IA), National Military Vehicle Museum (Dubois, WY), Glenn Curtiss Museum (NY) | `category = gather` if motorcycle-specific; `category = wander` if general-history |

**The pattern**: when a waypoint feels like it spans two categories, the fix is a secondary attribute on the row, not a new category. Categories stay 4. The data model absorbs the nuance.

**Proposed schema addition** (minor, not a blocker):

```
// Every waypoint row, cross-cutting attributes
tags: string[] = []  // free-form: "biker_friendly", "immersive", "moto_specific", ...
```

Tags are not an enum. They grow organically as the pipeline finds patterns. The Haiku extraction schema (future PRD work) can emit tags alongside category at the same cost.

**Impact**: minimal — adds one optional array field to the forthcoming `curated_waypoints` schema. Does NOT block PRD drafting.

## Refinement 3 — Preserve the Gather deferral

The research confirms what was already suspected: **Gather is the lowest-volume category at launch** (~10% of mentions, lowest in editorial at 8%). Not because it doesn't matter to riders — it does, very much, in cruiser forums especially — but because:

1. Gather waypoints require **community density signal** to source well. "This is where riders hang out" is knowledge that lives in forum posts, event calendars, and word of mouth — not in structured databases like HMDB or OSM.
2. At launch, we don't have users to generate that density signal.
3. A Gather catalog built from cold sources (e.g., "ADVRider mentioned this place 3 times") risks being stale, thin, or wrong.

**Decision from `PRODUCT-STRATEGY.md` Phase 0.5 remains correct**: ship Pause + Wander + Taste in Phase 0.5. Defer Gather to Phase 1.

**What makes Phase 1 Gather feasible**: by month 5-6, we'll have (a) usage data from early adopters, (b) community routes from the UC-RIDER pipeline in `curation-hardening`, (c) optionally, user-submitted "this is my local rider hangout" reports. All three signals can be combined to score Gather waypoints with enough confidence to avoid the stale-cold-catalog problem.

**No strategy edit required**. Phase 0.5 text already specifies the 3-of-4 sequencing.

## Attributes validated (no change)

The two orthogonal attributes from the strategy doc (`effort` and `trigger_score`) were implicitly validated by the research:

- **`effort`** maps cleanly to rider language: `pullover` → "pull off / pulled over at"; `park` → "parked the bike and walked"; `side_trip` → "worth the detour / we took a detour to see"
- **`trigger_score`** is visible in natural rider prioritization: "must see," "crown jewel," "highlight of the trip" = high trigger score; "on the way" / "since we were there" = low trigger score

No refinement needed for either attribute.

## Deliberately excluded categories — still correct

All four exclusions from `PRODUCT-STRATEGY.md` are reinforced by the data:

- **Refuel** (gas stops) — 0 instances of riders recommending a gas stop as a waypoint of delight. Gas is mentioned in logistics ("every 50-100 miles there's a town"), never as a destination. Correct exclusion.
- **Lodging** — occasional mentions (BARF: Wildflower Boutique as part of the Point Arena experience; touring riders naming specific motels), but never as the *primary reason to ride*. Correct exclusion; belongs in future touring features, not Phase 0.5 day-ride discovery.
- **Hazards** — riders warn each other about gravel sections, construction, aggressive wildlife, but these fit route metadata (warnings on a route card), not waypoints of delight. Correct exclusion.
- **Chain businesses** — near-zero contamination. When chains appear, they're functional/utility only. Deterministic blocklist is the right defense and won't feel restrictive to users, because riders already behave this way. Correct exclusion.

## Summary of recommended edits

Only one **strategy-doc** edit is recommended, and it's minor:

1. **`PRODUCT-STRATEGY.md`** Pillar 1 → Wander row in the table → add "historic town districts, interpretive-sign clusters, walkable scenic features" to the examples and append the unifying-trait sentence about effort + duration + payoff.

All other refinements are **PRD-level** (the forthcoming `.spec/prds/waypoints/`), not strategy-level:

- Add `tags: string[]` as an optional attribute on `curated_waypoints` for biker_friendly / immersive / moto_specific hybrid cases.
- Phase 0.5 task sequence stays as-specified: ship 3 of 4 categories.

## Next step

Proceed to PRD drafting in `.spec/prds/waypoints/`. The research is closed out. A follow-up adversarial check (via `research-devils-advocate` subagent) is optional but likely low-yield given the multi-source convergence.
