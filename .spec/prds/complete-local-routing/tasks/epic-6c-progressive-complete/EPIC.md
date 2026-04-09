# Epic 6c: Progressive Complete

**Epic ID:** CLR-E006C
**Status:** Pending
**Timeline:** Week 6
**PRD Coverage:** UC-PE-01, UC-PE-02, UC-PE-03

---

## Human Test Deliverable

User sees full enrichment complete progressively

**Test Steps:**
1. Create route (Epic 6b complete)
2. See creative label fade in (3.9s)
3. See rationale appear (3.9s)
4. See highlight tags appear (3.9s)
5. See badge change to "complete"
6. See toast dismiss automatically

**Gate:** Full enrichment < 5s

---

## Theme

"Complete!" - Full enrichment with cloud AI

---

## Tasks

### CLR-017: Progressive Enhancement UI

**Assigned To:** frontend-designer
**Estimate:** 1200 min
**Type:** [DESIGN] [FEATURE]

**Specification:**
Design and implement progressive enhancement UI:
- Fade-in animations for creative labels
- Staggered reveal for rationale and highlights
- Enrichment status badges (partial → complete)
- Toast notifications for completion
- Loading state transitions

**Prerequisites:**
- Epic 6a complete (Skeleton components)
- Epic 6b complete (Partial enrichment working)

**Design Requirements:**
- Dark theme with copper accents (see styles/RULES.md)
- Fade-in duration: 300ms
- Stagger delay: 100ms between elements
- Badge colors: partial (copper), complete (green)
- Toast auto-dismiss: 3s

**Examples:**
```typescript
// components/enrichment/EnrichmentStatus.tsx
export const EnrichmentStatus: React.FC<{ status: EnrichmentStatus }> = ({ status }) => (
  <View style={styles.badge}>
    {status === "partial" && <Text style={styles.copper}>Enhancing...</Text>}
    {status === "complete" && <Text style={styles.green}>Complete</Text>}
  </View>
)

// components/enrichment/CreativeLabel.tsx
export const CreativeLabel: React.FC<{ label: string }> = ({ label }) => (
  <FadeIn duration={300}>
    <Text style={styles.label}>{label}</Text>
  </FadeIn>
)
```

**Constraints:**
- Must follow LaneShadow UI/UX patterns
- Must work in dark and light themes
- Must animate smoothly (60fps)
- Must handle rapid enrichment changes
- Must support accessibility

**Acceptance Criteria:**
- User sees creative label fade in
- User sees rationale appear
- User sees highlight tags appear
- Badge changes from "partial" to "complete"
- Toast dismisses automatically
- Animations are smooth (60fps)
- UI follows copper-accented dark theme

---

### CLR-018: Enrichment Status Hooks

**Assigned To:** react-native-ui-implementer
**Estimate:** 480 min
**Type:** [FEATURE]

**Specification:**
Implement React hooks for enrichment status tracking:
- useEnrichmentStatus hook
- Status updates from hybrid enrichment
- Progress tracking for background jobs
- Toast notification triggers
- Error state handling

**Prerequisites:**
- CLR-016 complete (Dual-model orchestration)
- CLR-017 complete (UI components ready)

**Examples:**
```typescript
// hooks/useEnrichmentStatus.ts
export const useEnrichmentStatus = (routeId: string) => {
  const [status, setStatus] = useState<EnrichmentStatus>("draft")
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const sub = subscribeToEnrichment(routeId, (update) => {
      setStatus(update.status)
      setProgress(update.progress)
      
      if (update.status === "complete") {
        showToast("Route enhancement complete")
      }
    })
    
    return () => sub.unsubscribe()
  }, [routeId])
  
  return { status, progress }
}
```

**Constraints:**
- Must update reactively
- Must handle rapid status changes
- Must clean up subscriptions
- Must work offline

**Acceptance Criteria:**
- Hook tracks enrichment status
- Hook reports progress percentage
- Hook triggers toast on completion
- Hook handles errors gracefully
- Hook works offline

---

## Dependencies

**Blocks:** Epic 8 (Testing & Launch)
**Blocked By:** Epic 4 (Local Routing), Epic 6a (Skeleton), Epic 6b (Partial)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Animation jank | Performance testing, optimize renders |
| Rapid status changes | Debounce updates, batch state changes |

---

## Definition of Done

- [ ] All tasks completed
- [ ] Human test steps pass
- [ ] Full enrichment < 5s gate met
- [ ] Unit tests for hooks
- [ ] Integration tests for progressive flow
- [ ] Design review approved
