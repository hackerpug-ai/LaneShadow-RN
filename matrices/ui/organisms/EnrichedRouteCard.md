# EnrichedRouteCard - STYLE PROPERTIES MATRIX

**Component:** EnrichedRouteCard
**RN Source:** `react-native/components/enrichment/enriched-route-card.tsx`
**Framework Primitives:** None (wrapper component)

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/enrichment/enriched-route-card.tsx` | Public API, enrichment status overlay |
| RouteOptionCard | `react-native/components/ui/route-option-card.tsx` | Base card (see `matrices/ui/molecules/RouteOptionCard.md`) |
| EnrichmentStatusIndicator | `react-native/components/planning/enrichment-status-indicator.tsx` | Status indicator (see `matrices/ui/molecules/EnrichmentStatusIndicator.md`) |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `RouteOptionCard` - Base route option card (see `matrices/ui/molecules/RouteOptionCard.md`)
- `EnrichmentStatusIndicator` - Inline enrichment status (see `matrices/ui/molecules/EnrichmentStatusIndicator.md`)

**Composition pattern:**
- Conditional rendering: Shows `EnrichmentStatusIndicator` above card when enrichment is pending/running/failed
- Hides indicator when enrichment is completed or cancelled
- Passes enriched weather summary to RouteOptionCard when enrichment completes
- Merges highlights into weather summary when available

**Layout:** Vertical column, indicator above card

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| enrichment | Enrichment | useEnrichmentStatus(routePlanId) | `LaunchedEffect(routePlanId) { enrichment = fetch(...) }` / `.task { enrichment = try await fetch(...) }` |
| showEnrichmentIndicator | boolean (computed) | useMemo | Derived from `enrichment?.status in ['pending', 'running', 'failed']` / Computed property |
| enrichedWeatherSummary | string (computed) | useMemo | Derived from `enrichment?.enrichments` / Computed property |
| indicatorStatus | string (computed) | useMemo | Maps `enrichment.status` + `enrichment.phase` to indicator format / Computed property |

**Side effects:**
- None (pure computed values)

**Callback signatures:**
- `onEnrichmentRetry?: () => void` → `() -> Unit` / `() -> Void`
- All other props passed through to RouteOptionCard

**Computed logic:**
- `showEnrichmentIndicator`: `['pending', 'running', 'failed'].includes(enrichment.status)`
- `indicatorStatus`: Maps 'running' to 'running-fast' or 'running-extended' based on phase
- `enrichedWeatherSummary`: Merges first 2 highlights with ' • ' separator

---

## STYLE PROPERTIES MATRIX

**Note:** This component has no intrinsic styling. All visual properties are delegated to child components.

| Element | Delegates to | Properties affected |
|---|---|---|
| Enrichment indicator | `EnrichmentStatusIndicator` variant="inline" | All indicator visual properties |
| Route card | `RouteOptionCard` | All card visual properties |

### Layout — Container (implicit)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper (implicit) | `'column'` (vertical stacking) | `Column(...)` | `VStack` | n/a |

---

## NOTES

- **Pure wrapper:** No visual properties, delegates all styling to children
- **Conditional indicator:** Only shows for pending/running/failed states
- **Weather enrichment:** Merges highlights into weather summary when enrichment completes
- **Status mapping:** Maps enrichment status to EnrichmentStatusIndicator format
- **Phase mapping:** Distinguishes 'running-fast' vs 'running-extended' based on phase
- **Merge logic:** Takes first 2 highlights, joins with ' • '
- **Pass-through:** All RouteOptionCard props passed through unmodified
- **Retry callback:** Passed to EnrichmentStatusIndicator for failed state
