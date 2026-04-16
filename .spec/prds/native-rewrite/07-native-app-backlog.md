---
stability: FEATURE_SPEC
last_validated: 2026-04-16
prd_version: 1.0.0
functional_group: NATIVE-APP
---

# Native App — Backlog: Route Data Display

Deferred from [Curation Pipeline Hardening PRD](../../curation-hardening/tasks/INDEX.md) on 2026-04-16. Originally Epic 11 (DESIGN-008..011). The client is transitioning from React Native to native Kotlin (Android) + Swift (iOS). React Native UI work would be throwaway.

---

## Data Contract

The curation-hardening pipeline produces the following fields in Convex `curated_routes` for native apps to consume. All fields are `v.optional()` — native apps must tolerate `undefined`/`null` without crash.

| Field | Type | Description | Produced By |
|-------|------|-------------|-------------|
| `surface` | `string \| undefined` | paved\|gravel\|dirt\|mixed — from OSM way tags (primary) and GLM NLP extraction (secondary) | Epic 3 (schema), Epic 6 (OSM enrichment) |
| `qualityTier` | `string \| undefined` | premium\|standard\|minimal — from quality floor filter | Epic 6 (QUAL-003) |
| `bestMonths` | `string[] \| undefined` | e.g. ["May", "Jun", "Sep", "Oct"] — from NWS Climate Normals | Epic 8 (INF-009) |
| `description` | `string \| undefined` | Route description from pipeline extraction | Epic 3 (schema), sources |
| `rating` | `number \| undefined` | Community rating (0.0-5.0) | Sources |
| `sourceCount` | `number` | Number of sources mentioning this route (post-dedup) | Epic 6 (QUAL-001) |
| `mentionFrequency` | `number \| undefined` | NLP-derived mention frequency score | Epic 10 (RID-004) |
| `weatherSuitability` | `number \| undefined` | 0.0-1.0 composite from NWS climate data | Epic 8 (INF-009) |

**Full field definitions:** See [curation-hardening `09-technical-requirements.md`](../../curation-hardening/09-technical-requirements.md) Data Entities section.

---

## Deferred UI Work

### 1. Route Discovery Card — Surface Badge

**Original task:** DESIGN-008
**Display:** Surface type chip (gravel/dirt/mixed icon) below the archetype row on route discovery cards. Paved routes show no badge (paved is default, no noise). Quality tier badge for `qualityTier='minimal'` at reduced opacity (0.7).

### 2. Discovery Filter — Surface Type Filter Chips

**Original task:** DESIGN-009
**Display:** Second row of filter chips above/below archetype filter: All, Paved, Gravel, Dirt, Mixed. Tap to filter map and list. AND with archetype filter (not OR). Hidden when no surface data exists in current viewport.

### 3. Route Details Sheet — Expanded Fields

**Original task:** DESIGN-010
**Display:** Expanded route details sheet showing:
- Description (from pipeline, replacing any AI rationale slot)
- Community rating as a StatRow
- "Community Signals" section when `sourceCount >= 2` and `mentionFrequency > 0`
- "Best Months" row with month pills (Apr, May, Oct, etc.)
- "Weather suitability" as a percentage StatRow

### 4. Local Persistence — Schema Extension

**Original task:** DESIGN-011
**Platform-specific:** Native persistence layer must store `surface`, `qualityTier`, `bestMonths` locally for offline access.
- Android: Room database entity extension
- iOS: CoreData model extension

---

## Design Principles (from original Epic 11)

1. **Progressive disclosure** — Compact card shows archetype + surface only; full detail sheet shows description + community signals + best months
2. **Zero-fallback rendering** — `{field !== undefined && <Component />}` pattern; no "No description" placeholder text
3. **Conditional rendering** — Routes with all new fields `undefined` look exactly as they do today (zero visual regression)
4. **No hardcoded colors/spacing** — Use native design system tokens throughout
5. **Heavy fields fetched on demand** — `description`, `rating`, `mentionFrequency`, `weatherSuitability` fetched on demand via Convex query, not pre-cached locally

---

## Acceptance Criteria (Native Adaptation)

- [ ] Surface type badge renders on route cards when `surface` is defined and not "paved"
- [ ] Surface filter chip row appears when any route in the viewport has non-paved surface data
- [ ] Surface filter ANDs with archetype filter (not OR)
- [ ] Route details sheet shows description, community signals, best months, rating, weather suitability when defined
- [ ] All new fields tolerate `undefined`/`null` without crash
- [ ] No visual regression on routes with all new fields undefined
- [ ] Quality tier badge appears on `minimal` tier routes at reduced opacity
- [ ] Local persistence extended with surface, qualityTier, bestMonths fields
- [ ] TypeScript strict mode passes (or equivalent native type safety)

---

## Dependencies

- **Curation-hardening Epic 3** — Convex schema must have the new optional fields
- **Curation-hardening Epic 12** — Pipeline must produce and push the data
- **Native-rewrite restructure** — Repo must be restructured before native app development begins
