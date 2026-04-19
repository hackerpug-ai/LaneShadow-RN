# EnrichmentProgressProvider - STYLE PROPERTIES MATRIX

**Component:** EnrichmentProgressProvider
**RN Source:** `react-native/components/enrichment/enrichment-progress-provider.tsx`
**Framework Primitives:** None (React context provider)

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/enrichment/enrichment-progress-provider.tsx` | Public API, context provider |
| React Context | `node_modules/react/src/React.js` | Context API |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- None (provider component)

**Composition pattern:**
- React Context provider for enrichment progress state
- Manages progress state (draft → partial → complete → failed)
- Manages toast visibility with auto-dismiss on completion
- Broadcasts screen reader announcements on status transitions
- Provides callbacks for manual toast control

**Layout:** None (invisible provider wrapper)

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| progress | EnrichmentProgress | useState({routeId, status, stage, progress, stages}) | `remember { mutableStateOf(...) }` / `@State var progress: EnrichmentProgress` |
| toastVisible | boolean | useState(false) | `remember { mutableStateOf(false) }` / `@State var toastVisible: Bool` |

**Side effects:**
- Auto-dismiss toast on completion: `useEffect([progress.status, toastVisible, autoDismissDelay])` → `LaunchedEffect(progress.status) { if (status == complete) delay(autoDismissDelay); toastVisible = false }` / `.onChange(of: progress.status) { if status == complete { DispatchQueue.main.asyncAfter(deadline: .now() + autoDismissDelay) { toastVisible = false } } }`
- Accessibility announcements: `useEffect([progress.status])` with `AccessibilityInfo.announceForAccessibility` → `LaunchedEffect(progress.status) { LocalContext.current.announce(...) }` / `.accessibilityAnnouncement(status)` |

**Callback signatures:**
- `updateProgress: (update: Partial<EnrichmentProgress>) => void` → `(update: Partial<EnrichmentProgress>) -> Unit` / `(Partial<EnrichmentProgress>) -> Void`
- `dismissToast: () => void` → `() -> Unit` / `() -> Void`
- `showToast: () => void` → `() -> Unit` / `() -> Void`

**Context value:**
```typescript
{
  progress: EnrichmentProgress,
  toastVisible: boolean,
  updateProgress: (update: Partial<EnrichmentProgress>) => void,
  dismissToast: () => void,
  showToast: () => void
}
```

---

## STYLE PROPERTIES MATRIX

**Note:** This component has no visual properties. It's a state provider only.

---

## NOTES

- **Context provider:** No visual output, provides state via React Context
- **Auto-dismiss:** 3000ms default delay when progress.status === 'complete'
- **Stages:** Default stages are ['Leg labels', 'Weather data', 'Elevation', 'Scenic analysis']
- **Progress values:** 0-100 range
- **Status transitions:** draft → partial → complete OR failed
- **Accessibility:** Announces status changes to screen readers
- **Announcements:** "Route enrichment starting", "Route partially enriched", "Route enrichment complete", "Route enrichment failed"
- **Toast control:** Manual show/hide via callbacks, auto-dismiss on completion
- **Route ID:** Immutable, preserved through updates
- **Hook access:** Children use `useEnrichmentProgress()` hook to access context
- **Custom stages:** Can be overridden via initialProgress.stages prop
