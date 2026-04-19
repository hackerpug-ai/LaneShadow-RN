# EnrichmentProgressProvider - STYLE PROPERTIES MATRIX

**Component:** EnrichmentProgressProvider
**RN Source:** `react-native/components/enrichment/enrichment-progress-provider.tsx`
**Framework Primitives:** `react` Context API

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/enrichment/enrichment-progress-provider.tsx` | Public API, enrichment progress state |
| Context (React) | `node_modules/react/index.js` | State management provider |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- None (state provider only)

**Composition pattern:**
- Context provider for enrichment progress state
- Manages enrichment phase (idle, enriching, complete, error)
- Provides progress percentage (0-100)
- Provides enrichment status (fast, extended, cached)
- Wraps child components with enrichment context
- No visual output (state management only)

**Layout:** None (invisible provider wrapper)

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|---|
| enrichmentPhase | enum | Context state | `remember { mutableStateOf(EnrichmentPhase.IDLE) }` / `@State var phase: EnrichmentPhase = .idle` |
| progress | number | Context state | `remember { mutableStateOf(0) }` / `@State var progress: Double = 0` |
| enrichmentStatus | enum | Context state | `remember { mutableStateOf(EnrichmentStatus.UNKNOWN) }` / `@State var status: EnrichmentStatus = .unknown` |

**Side effects:**
- Progress updates: `useEffect` with enrichment service → `LaunchedEffect(routeId) { ... }` / `.task { ... }` async task
- Phase transitions: State updates from enrichment service → State updates from enrichment service callbacks

**Callback signatures:**
- (none - provider only, no callbacks)

**Context values:**
- `enrichmentPhase: EnrichmentPhase` → `EnrichmentPhase` enum / `EnrichmentPhase` enum
- `progress: number` (0-100) → `Float` (0.0-1.0) / `Double` (0.0-1.0)
- `enrichmentStatus: EnrichmentStatus` → `EnrichmentStatus` enum / `EnrichmentStatus` enum

---

## STYLE PROPERTIES MATRIX

### Layout — Provider Wrapper

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| (none - invisible provider) | - | - | `CompositionLocalProvider(...)` | `@Environment(\.enrichmentProgress)` | n/a |

---

## NOTES

- **State provider:** Context provider for enrichment progress state
- **Enrichment phases:** IDLE, ENRICHING, COMPLETE, ERROR
- **Progress range:** 0-100 (percentage) or 0.0-1.0 (fraction)
- **Enrichment status:** FAST (teal), EXTENDED (purple), CACHED (gray), UNKNOWN
- **Child components:** Access progress via context hook
- **No styling:** Pure state management, no visual output
- **Android translation:** Use `CompositionLocalProvider` or `ViewModel` with state flow
- **iOS translation:** Use `@Environment` values or `@StateObject` view model
- **Async updates:** Progress updates from enrichment service via async callbacks
- **Route-scoped:** One provider per route being enriched
- **Lifecycle:** Mounts when route card mounts, unmounts when card unmounts
