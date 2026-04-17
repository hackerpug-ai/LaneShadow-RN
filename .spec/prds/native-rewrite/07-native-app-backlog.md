---
stability: FEATURE_SPEC
last_validated: 2026-04-16
prd_version: 2.0.0
functional_group: NATIVE-APP
---

# Native App — Backlog: Route Data Display

Deferred from [Curation Pipeline Hardening PRD](../../curation-hardening/tasks/INDEX.md) on 2026-04-16. Originally Epic 11 (DESIGN-008..011). The client is transitioning from React Native to native Kotlin (Android) + Swift (iOS). React Native UI work would be throwaway.

---

## Atom-First Execution Strategy (effective 2026-04-17)

All 195 UI components are built in **Sprint 2 (`sprint-02-ui-component-translation/`)** before any feature sprint begins. Sprint 2 ships token-accurate Kotlin/Compose + Swift/SwiftUI components with sandbox verification, **no** backend wiring, nav logic, or state management.

Consequences for this backlog:

- **No feature sprint builds components.** Sprints 3–10 are wiring waves only. They consume Sprint-2 components by name (see `08a-atomic-component-catalog.md`) and attach data/state/nav/backend behavior.
- **Every UC in files `09–16` lists its `UI Components`** referenced from the Sprint-2 catalog. Feature tasks in each sprint cite the same components by name under a `Components Consumed` subsection.
- **Missing compositions** — any UI need not covered by the 195-component catalog — are added to Sprint 2 via `/kb-sprint-plan --delta-replan` before the consuming sprint begins. They never get built inline in a feature sprint.
- The "Deferred UI Work" items below are therefore **wiring atop existing Sprint-2 components** (e.g., Surface Badge = configure `RouteBadge` variant with the `surface` field), not net-new component work.

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

## Deferred UI Work (as wiring against Sprint-2 components)

### 1. Route Discovery Card — Surface Badge

**Original task:** DESIGN-008
**Components consumed (Sprint 2):** `RouteOptionCard` (molecule), `RouteBadge` (atom), `Chip` (atom) for discovery filter bar.
**Wiring:** Bind `surface` field → `RouteBadge` variant. Paved routes render no badge (suppress when `surface === 'paved'` or `undefined`). For `qualityTier === 'minimal'`, reduce RouteBadge opacity to 0.7.

### 2. Discovery Filter — Surface Type Filter Chips

**Original task:** DESIGN-009
**Components consumed (Sprint 2):** `DiscoveryFilterBar` (molecule), `Chip` (atom).
**Wiring:** Add a second chip row with options `All | Paved | Gravel | Dirt | Mixed`. AND-combine with archetype filter state. Hide row when no route in viewport has non-paved surface. No new component work.

### 3. Route Details Sheet — Expanded Fields

**Original task:** DESIGN-010
**Components consumed (Sprint 2):** `RouteDetailsSheet` (organism), `StatRow` (atom/molecule), `SectionHeader` (molecule), `Badge` (atom).
**Wiring:** Populate the existing sheet layout with:
- Description → markdown text block
- Community rating → `StatRow`
- Community Signals → conditionally rendered `SectionHeader` + `StatRow` list when `sourceCount >= 2 && mentionFrequency > 0`
- Best Months → horizontal `Badge` row
- Weather suitability → `StatRow`

All slots already exist in `RouteDetailsSheet`. No new component work.

### 4. Local Persistence — Schema Extension

**Original task:** DESIGN-011
**Platform-specific:** Native persistence layer must store `surface`, `qualityTier`, `bestMonths` locally for offline access.
- Android: Room database entity extension
- iOS: SwiftData model extension

(Persistence is out of scope for UI components; this task stays as pure wiring/backend work.)

---

## Complete Feature Parity Checklist

These items must all be implemented in native apps before React Native can be deleted. Source column references the React Native file that currently provides each feature.

### Authentication & User Management

- [ ] OAuth sign-in (Google/Apple) — `app/(auth)/oauth-callback.tsx`, `hooks/use-oauth-flow.ts`
- [ ] Session management — `providers/auth-provider.tsx`
- [ ] Auth state persistence (secure storage) — `hooks/use-async-storage.ts`

### Map & Location

- [ ] Interactive map with route overlays — `components/map/interactive-map.tsx`, `components/map/route-overlays.tsx`
- [ ] Camera controls and style switching — `components/map/camera-controls.tsx`, `components/map/map-styles.tsx`
- [ ] Location marker — `components/map/location-marker.tsx`
- [ ] Background location provider — `providers/location-provider.tsx`
- [ ] Place autocomplete search — `hooks/use-place-autocomplete.ts`

### Ride Discovery & Planning

- [ ] Discovery feed with route cards — `components/discovery/discovery-feed.tsx`, `components/discovery/route-card.tsx`
- [ ] Filter bar (archetype + surface) — `components/discovery/filter-bar.tsx`
- [ ] Chat-based ride planning — `hooks/use-chat-planning.ts`, `components/chat/`
- [ ] Route planner with waypoints — `components/planning/route-planner.tsx`, `components/planning/waypoint-search.tsx`
- [ ] Route preview — `components/planning/route-preview.tsx`
- [ ] Intent search (NLP) — `hooks/use-intent-search.ts`
- [ ] Route enrichment — `hooks/use-route-enrichment.ts`
- [ ] Route comparison — `hooks/use-route-comparison.ts`

### Active Ride

- [ ] Ride flow state machine — `hooks/use-ride-flow.ts`
- [ ] Turn-by-turn navigation — See UC-NAV (09)
- [ ] Ride recording with background tracking — `hooks/use-ride-recording.ts`, `hooks/use-active-session-route.ts`
- [ ] Ride controls sheet — `components/sheets/ride-controls-sheet.tsx`
- [ ] Route sharing — `hooks/use-route-sharing.ts`

### Offline & Data

- [ ] Offline region download — `hooks/useOfflineDownload.ts`
- [ ] Region selector and list — `app/(app)/offline/`
- [ ] Download progress UI — `components/offline/download-progress.tsx`
- [ ] Offline provider — `providers/offline-provider.tsx`

### Voice Assistant

- [ ] Voice interaction (STT/TTS) — `components/assistant/voice-assistant.tsx`
- [ ] Voice prompt card — `components/assistant/voice-prompt-card.tsx`

### UI/UX Systems

- [ ] Bottom sheet system (18+ sheets) — `components/sheets/`
- [ ] Toast notifications — `components/toasts/`, `hooks/use-toast-messages.ts`
- [ ] Theme switching (dark/light) — `hooks/use-semantic-theme.ts`
- [ ] Onboarding flow — `components/onboarding/`
- [ ] Gatekeeper/trial system — `components/gatekeeper/`
- [ ] Skeleton loading states — `components/skeleton/`

### Route Details & Enrichment

- [ ] Route details card — `components/enrichment/route-details-card.tsx`
- [ ] Photo gallery — `components/enrichment/photo-gallery.tsx`
- [ ] Curvature card — `components/enrichment/curvature-card.tsx`
- [ ] Waypoint management — `components/waypoints/`
- [ ] Saved routes CRUD — `hooks/use-saved-routes.ts`
- [ ] Settings screen — `components/settings/`

### Platform Infrastructure

- [ ] Deep linking (Universal Links / App Links)
- [ ] Push notifications (APNs / FCM)
- [ ] Permissions system (location, microphone, notifications, storage)
- [ ] Foreground service architecture (Android)
- [ ] Room/SwiftData schema design and migration
- [ ] Crash reporting & analytics

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
- [ ] **All items in Feature Parity Checklist above are implemented**
- [ ] React Native app can be deleted with zero lost functionality

---

## Dependencies

- **Curation-hardening Epic 3** — Convex schema must have the new optional fields
- **Curation-hardening Epic 12** — Pipeline must produce and push the data
- **Native-rewrite restructure** — Repo must be restructured before native app development begins
- **UC files 09-16** — Core use cases must be implemented before RN deletion
