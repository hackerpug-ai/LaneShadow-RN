# Epic 6a: Progressive Skeleton

**Epic ID:** CLR-E006A
**Status:** Pending
**Timeline:** Week 6
**PRD Coverage:** UC-PE-01 (partial)

---

## Human Test Deliverable

User sees skeleton loading states before enrichment

**Test Steps:**
1. Create new route
2. See shimmer placeholders for labels
3. See loading indicators for weather
4. Verify skeleton states render smoothly

**Gate:** Skeleton render < 100ms

---

## Theme

"Loading..." - Skeleton placeholders for progressive enhancement

---

## Tasks

### CLR-015: Skeleton Loading Components

**Assigned To:** frontend-designer
**Estimate:** 240 min
**Type:** [DESIGN] [FEATURE]

**Specification:**
Design and implement skeleton loading states for progressive enhancement:
- Shimmer effect for label placeholders
- Pulse animation for weather badges
- Skeleton cards for route details
- Fade-in transitions when content loads
- Loading state indicators

**Prerequisites:**
- Epic 2 complete (MapboxMapView working)
- Epic 4 complete (Route cards structure defined)

**Design Requirements:**
- Dark theme with copper accents (see styles/RULES.md)
- Shimmer animation direction: left to right
- Fade-in duration: 300ms
- Skeleton height matches actual content
- WeatherBadgeSkeleton component

**Examples:**
```typescript
// components/skeleton/LabelSkeleton.tsx
export const LabelSkeleton: React.FC = () => (
  <View style={styles.skeleton}>
    <ShimmerPattern />
  </View>
)

// components/skeleton/WeatherBadgeSkeleton.tsx
export const WeatherBadgeSkeleton: React.FC = () => (
  <View style={styles.badgeSkeleton}>
    <PulseAnimation />
  </View>
)
```

**Constraints:**
- Must follow LaneShadow UI/UX patterns
- Must work in dark and light themes
- Must match actual content dimensions
- Must animate smoothly (60fps)
- Must support accessibility

**Acceptance Criteria:**
- User sees shimmer placeholders for labels
- User sees pulse animation for weather
- Skeleton renders in < 100ms
- Fade-in transitions smooth (300ms)
- Skeleton matches content dimensions
- UI follows copper-accented dark theme

---

## Dependencies

**Blocks:** Epic 6b (Progressive Partial)
**Blocked By:** Epic 4 (Local Routing)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Skeleton jank | Performance testing, optimize animations |
| Dimension mismatch | Measure actual content first |

---

## Definition of Done

- [ ] All tasks completed
- [ ] Human test steps pass
- [ ] Skeleton render < 100ms gate met
- [ ] Design review approved
- [ ] Accessibility audit passed
