# DESIGN-007: Discovery Empty/Loading State Overlays

**Task ID:** DESIGN-007
**Epic:** Epic 4 - Discovery UI & Data Flywheel
**Assigned To:** frontend-designer
**Priority:** P1
**Effort:** S
**Estimate:** 60 min
**Type:** [DESIGN]
**Depends On:** DESIGN-001 (RouteDiscoveryScreen layout)

---

## BACKGROUND

The discovery screen needs overlay components for three transitional states: initial loading (skeleton), no results (empty state), and offline notification (ConnectionBanner). These overlays are semi-transparent so the map remains visible behind them. The loading skeleton has a 300ms debounce to prevent flash on fast loads.

This is a DESIGN task — the components receive state booleans as props and render visual overlays.

**PRD references:** UC-DISC-01 (empty state when no routes), styles/RULES.md, existing EmptyState/Skeleton/ConnectionBanner components.

---

## ACCEPTANCE CRITERIA

### AC-001: Skeleton during initial load
**GIVEN** the discovery screen is performing its initial sync or first query
**WHEN** loading state is true for > 300ms
**THEN** a skeleton overlay appears over the map
**AND** the skeleton is semi-transparent (map visible behind it)
**AND** skeleton placeholders mimic the shape of expected content (filter bar area, pin area)
**AND** the skeleton disappears immediately when data loads

**Verify:** Trigger initial load, verify skeleton appears after 300ms debounce, verify it disappears when data arrives.

### AC-002: Empty state for no results
**GIVEN** the discovery screen has finished loading but found zero matching routes
**WHEN** filters or location produce no results
**THEN** a glassmorphic empty state overlay appears
**AND** it shows a message like "No routes in this area" or "No routes match your filters"
**AND** a suggestion to adjust filters or zoom out
**AND** the overlay is semi-transparent (map visible behind it)

**Verify:** Set filters to produce zero results, verify glassmorphic empty state overlay.

### AC-003: ConnectionBanner for offline
**GIVEN** the device is offline
**WHEN** the discovery screen is active
**THEN** a ConnectionBanner appears indicating offline status
**AND** the banner is non-blocking (does not cover map interaction area)
**AND** the banner uses existing ConnectionBanner component styling

**Verify:** Mock offline state, verify ConnectionBanner appears without blocking map.

---

## TEST CRITERIA

- [ ] Skeleton overlay renders during initial load with 300ms debounce
- [ ] Skeleton is semi-transparent (map visible behind)
- [ ] Empty state overlay renders for zero results
- [ ] Empty state is glassmorphic with message and suggestion
- [ ] ConnectionBanner renders for offline state
- [ ] None of the overlays fully cover the map
- [ ] Uses existing EmptyState, Skeleton, ConnectionBanner components
- [ ] No hardcoded hex colors
- [ ] Components render without errors

---

## READING LIST

- `styles/RULES.md` -- Theme tokens, glassmorphic overlay patterns
- `.spec/prds/curation/04-uc-discovery.md` -- UC-DISC-01
- Existing EmptyState, Skeleton, ConnectionBanner components

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `components/discovery/discovery-loading-overlay.tsx` (NEW)
- `components/discovery/discovery-empty-overlay.tsx` (NEW)

**NEVER:**
- Fully cover the map with any overlay
- Use modal dialogs for loading/empty states
- Import real data hooks (use mock props)
- Hardcode hex colors
- Create new EmptyState/Skeleton/ConnectionBanner components (reuse existing)

---

## CODE PATTERN

```typescript
// components/discovery/discovery-loading-overlay.tsx
import { useSemanticTheme } from '@theme/hooks/useSemanticTheme';
import { Skeleton } from '@components/common/Skeleton';  // existing

interface DiscoveryLoadingOverlayProps {
  visible: boolean;
}

export function DiscoveryLoadingOverlay({ visible }: DiscoveryLoadingOverlayProps) {
  const [debouncedVisible, setDebouncedVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setDebouncedVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setDebouncedVisible(false);
    }
  }, [visible]);

  if (!debouncedVisible) return null;

  return (
    <View style={styles.overlay}>
      {/* Skeleton placeholders for filter bar and content area */}
      <Skeleton width="100%" height={40} />
      <View style={styles.pinSkeletons}>
        <Skeleton width={200} height={100} />
        <Skeleton width={180} height={90} />
      </View>
    </View>
  );
}
```

```typescript
// components/discovery/discovery-empty-overlay.tsx
import { useSemanticTheme } from '@theme/hooks/useSemanticTheme';
import { EmptyState } from '@components/common/EmptyState';  // existing

interface DiscoveryEmptyOverlayProps {
  visible: boolean;
  message?: string;
}

export function DiscoveryEmptyOverlay({ visible, message }: DiscoveryEmptyOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <EmptyState
        title={message ?? 'No routes in this area'}
        subtitle="Try adjusting your filters or zooming out"
      />
    </View>
  );
}
```

---

## AGENT INSTRUCTIONS

1. Read `styles/RULES.md` for glassmorphic overlay patterns
2. Find and study existing EmptyState, Skeleton, and ConnectionBanner components
3. Create `discovery-loading-overlay.tsx` with 300ms debounce skeleton
4. Create `discovery-empty-overlay.tsx` with glassmorphic empty state
5. Both overlays must be semi-transparent (map visible behind them)
6. Use existing components (EmptyState, Skeleton, ConnectionBanner) — do not recreate them
7. All styling via useSemanticTheme()

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. Run `npm run typecheck` — must pass
2. Run `npm run lint` — zero lint errors
3. Verify both new overlay files exist
4. Verify skeleton has 300ms debounce logic
5. Verify overlays do not fully cover the map (semi-transparent backgrounds)
6. Verify existing EmptyState/Skeleton/ConnectionBanner are reused (not recreated)
7. Verify no hardcoded hex colors

---

## AGENT ASSIGNMENT

**Primary:** frontend-designer
**Reason:** Presentational overlay components with animation (debounce) and glassmorphic styling.

---

## EVIDENCE GATES

- [ ] `components/discovery/discovery-loading-overlay.tsx` exists with debounce
- [ ] `components/discovery/discovery-empty-overlay.tsx` exists
- [ ] TypeScript compiles cleanly
- [ ] No hardcoded hex colors
- [ ] Reuses existing EmptyState/Skeleton components

---

## REVIEW CRITERIA

- Loading skeleton debounced at 300ms (no flash on fast loads)
- Skeleton shape mimics expected content layout
- Empty state is glassmorphic and semi-transparent
- ConnectionBanner is non-blocking
- Map remains visible and interactive behind all overlays
- Transitions between states are smooth

---

## DEPENDENCIES

- **DESIGN-001** — RouteDiscoveryScreen provides the context for overlays

---

## NOTES

- The 300ms debounce on the loading skeleton is critical — without it, fast local queries (< 50ms) would flash a skeleton that disappears instantly, creating visual noise.
- The ConnectionBanner component should already exist in the project (for offline indication elsewhere). If not, reference its design pattern and note that it needs to be created separately.
- The empty state message should vary based on context: "No routes in this area" (location-based) vs "No routes match your filters" (filter-based).
