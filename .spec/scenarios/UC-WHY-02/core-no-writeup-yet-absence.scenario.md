---
service: mobile-app
feature: UC-WHY-02
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-WHY-02 core: a route without a shippable why shows "No write-up yet" and the screen stays fully usable

Opening the detail screen for a route with no enrichment row — the day-one state for most
of the catalog — shows the always-present "Why ride it" label with the calm absence line
"No write-up yet" beneath it, matching the screen's established empty-state idiom. No blank
gap, no spinner, no invented text. Everything else works untouched: score bars, map,
conditions, Save, Ride It. When the route also lacks a summary, the two near-identical
absence lines collapse into a single message so the screen never reads as broken.

**Verify (e2e, real device Maestro + live Convex):**
- A no-row route → `curated-detail-enrichment-label` + `curated-detail-enrichment-empty`
  visible with the "No write-up yet" copy; no spinner in that section at any point.
- Save and Ride It remain tappable; scores and map render normally.
- A route missing BOTH summary and enrichment → exactly one absence line renders, not two
  stacked near-duplicates.
