# Epic 11: Mobile UI — New Field Display

**Sequence:** 11 / 12
**Priority:** P1
**Status:** Backlog
**Estimated Effort:** 345 minutes (~6 hours)

---

## Overview

Surface the new pipeline data fields in the existing React Native mobile app: surface type badges on route cards, a surface-type filter chip row in the discovery filter bar, expanded route details sheet with description / best months / community signals, and a lean sync schema extension for the three display-critical fields (surface, qualityTier, bestMonths). All new fields are optional — routes without them render exactly as they do today.

**Theme:** Open the mobile app, see the new data (surface badges, community signals, best months). Routes without new fields look unchanged. Zero regression.

**PRD Reference:** [S9 Mobile Compatibility](../../09-technical-requirements.md)

---

## Human Test Steps

After all 4 tasks are complete, a user should be able to:

1. **Open discovery screen** — Launch Expo dev server (`npx expo start`), open on device/simulator. Verify existing routes render exactly as before (no visual regression).
2. **See surface type badges on route cards** — Scroll to a route with `surface='gravel'` (USFS MVUM or BDR route from Epic 5). Verify a gravel-icon chip appears below the archetype row. Verify paved routes show no surface badge (paved is the default, no noise).
3. **Tap surface filter chip** — Verify a second row of filter chips appears above/below the archetype filter row with options: All, Paved, Gravel, Dirt, Mixed. Tap "Gravel" — verify only gravel routes remain visible on map and list. Deselect and verify full list returns.
4. **Verify filter hidden when no surface data** — Navigate to a region with only paved routes. Verify the surface filter row is hidden (no empty UI element).
5. **Verify minimal quality tier badge** — Find a route with `qualityTier='minimal'`. Verify a subtle "Limited data" warning badge appears at reduced opacity. Verify premium routes show no badge (expected quality = invisible).
6. **Open route details sheet** — Tap a Rider Mag route (rich data: description, rating, sourceCount, mentionFrequency, bestMonths, weatherSuitability). Verify the route details sheet shows:
   - Description (from pipeline, replacing the AI rationale slot)
   - Community rating as a StatRow
   - "Community Signals" section with `sourceCount` ≥ 2 and `mentionFrequency > 0`
   - "Best Months" row with month pills (Apr, May, Oct, etc.)
   - "Weather suitability" as a percentage StatRow
7. **Verify conditional rendering** — Open a route with all new fields undefined. Verify no empty sections, no "No description" placeholders, no layout shift. The card looks exactly like today.
8. **Verify surface filter + archetype filter AND** — Select archetype "Adventure" AND surface "Gravel". Verify only gravel adventure routes remain (AND filter, not OR).
9. **Verify route pin archetype rendering** — Check map pins. Verify archetype badges still render correctly. Verify `qualityTier='minimal'` routes have reduced pin opacity.
10. **Type check passes** — Run `npm run type-check`. Verify no TypeScript errors.
11. **Component tests pass** — Run `npx jest components/ui/route-option-card components/discovery/discovery-filter-bar components/sheets/route-details-sheet`. Verify all pass.
12. **SQLite sync extended** — Run `lib/discovery/sync-lean.ts` tests. Verify new columns `surface`, `quality_tier`, `best_months` (JSON TEXT) exist and round-trip correctly through `bulkSyncLeanRoutes` and `queryByBoundingBox`.

13. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. Applicable: ALL steps (1-12). **Diff against the most recent baseline (likely Epic 10 if run in sequence, or Epic 3 if Epic 11 runs in parallel with Epic 4-10). Verify pipeline outputs unchanged by mobile UI work — Epic 11 is pure consumer, not producer. Then run the mobile smoke test: open app, verify surface filter works with real data, verify community signals visible on details sheet, verify zero visual regression.** Write `review.md` with verdict PASS including the mobile smoke test results.

All 13 verifications must pass. **Zero visual regression on routes without new fields.**

---

## Acceptance Criteria (Epic-Level)

- [ ] `components/ui/route-option-card.tsx` displays surface chip when `surface` is defined
- [ ] `components/sheets/route-details-sheet.tsx` shows description, community signals, best months, rating, weather suitability when defined
- [ ] `components/discovery/discovery-filter-bar.tsx` has surface filter row (conditional on data presence)
- [ ] `lib/discovery/sync-lean.ts` and `lib/discovery/db.ts` extended with `surface`, `quality_tier`, `best_months` columns
- [ ] `lib/discovery/intent/types.ts` `Spot` interface has matching optional fields
- [ ] `ConvexRoute` interface extended with new optional fields
- [ ] All new fields are optional with `!== undefined` guards (zero crashes on undefined)
- [ ] No hardcoded colors/spacing — `useSemanticTheme()` throughout
- [ ] Surface type chip icons mapped correctly (paved/gravel/dirt/mixed)
- [ ] Best months render as horizontal pill row (max 4 inline + "more")
- [ ] `qualityTier='minimal'` renders warning badge at 0.7 opacity
- [ ] No visual regression on routes with all new fields undefined
- [ ] TypeScript strict mode passes
- [ ] Component tests pass
- [ ] SQLite sync round-trips correctly

---

## PRD Sections Covered

- **S9** — Technical Requirements — Mobile Compatibility section

---

## Tasks (4 stubs)

These are the 4 DESIGN tasks produced by the UID agent analysis.

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks |
|----|-------|------|-------|----------|--------|----------|------------|--------|
| DESIGN-008 | RouteDiscoveryCard: Surface type badge, best months, and quality tier display | DESIGN | frontend-designer | P0 | M | 120 | DESIGN-011 | DESIGN-010 |
| DESIGN-009 | Discovery surface-type filter chip in DiscoveryFilterBar | DESIGN | frontend-designer | P1 | S | 75 | DESIGN-011 | — |
| DESIGN-010 | RouteDetailsSheet: description, best months, and community signals section | DESIGN | frontend-designer | P1 | M | 90 | DESIGN-008 | — |
| DESIGN-011 | Lean sync schema extension: surface, bestMonths, qualityTier in local SQLite | DESIGN | frontend-designer | P1 | S | 60 | INF-003 | DESIGN-008, DESIGN-009 |

**Total Tasks:** 4
**Total Estimated Effort:** 345 minutes (~6 hours)
**Parallelization:** DESIGN-011 first → DESIGN-008 + DESIGN-009 parallel → DESIGN-010 after DESIGN-008

---

## Dependencies

**Blocks:**
- (none — Epic 11 is independent of Epic 12)

**Depends On:**
- Epic 3: Foundation (INF-003 Convex schema with new fields must exist)

---

## Definition of Done

- [ ] All 4 DESIGN task files written and merged
- [ ] All 4 tasks moved to `Done`
- [ ] Mobile app runs without crashes against pipeline data (from Epic 4+)
- [ ] Type check + lint + component tests pass
- [ ] Visual diff on existing routes: zero change
- [ ] Surface filter works with real USFS MVUM and BDR data
- [ ] Route details sheet shows rich Rider Mag descriptions
- [ ] Curation Review Protocol executed with PASS verdict (mobile smoke test included)
- [ ] `review.md` committed with mobile smoke test results
- [ ] User has approved proceeding to Epic 12

---

## Notes

- **Progressive disclosure is the design principle** — compact card shows archetype + surface only; full detail sheet shows description + community signals + best months
- **Zero-fallback rendering** — `{field !== undefined && <Component />}` pattern throughout; no "No description" placeholder text
- SQLite lean projection only carries 3 new fields (surface, qualityTier, bestMonths) — heavy fields (description, rating, mentionFrequency, weatherSuitability) are fetched on demand via enrichment cache
- DESIGN-011 is the "data pipe" task — it's purely TypeScript/SQLite, no visual changes
- All fields come through as v.optional() from Convex — mobile must tolerate undefined without crash
- Raw scoring internals (`mentionFrequencyScore`, `designationScore`, `aadt`, `pavementIri`) are NOT surfaced in UI — consumer-facing only
- DESIGN tasks can start after Epic 3 completes — they do NOT need to wait for pipeline epics to finish
