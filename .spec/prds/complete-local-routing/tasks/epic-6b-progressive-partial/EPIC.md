# Epic 6b: Progressive Partial

**Epic ID:** CLR-E006B
**Status:** DEPROCATED/CANCELED
**Timeline:** Week 6
**PRD Coverage:** UC-PE-01 (partial), UC-RTE-04

IMPORTANT: WE'RE NOT DOING THIS ANYMORE

---

## Human Test Deliverable

User sees route enhance with leg labels immediately

**Test Steps:**
1. Create route
2. See leg labels appear immediately (0.35s)
3. See "Enhancing..." badge
4. Verify local model works offline

**Gate:** Time to first response < 0.5s

---

## Theme

"Almost There..." - Partial enrichment with local AI

---

## Tasks

### CLR-016: Dual-Model Orchestration

**Assigned To:** pi-agent-implementer
**Estimate:** 1200 min
**Type:** [FEATURE]

**Specification:**
Implement hybrid enrichment orchestration with dual-model strategy:
- Local path: Qwen3.5 for leg labels (immediate, 0.35s)
- Remote path: Haiku for full enrichment (background, 3.9s)
- State machine: draft → partial → complete
- Progress hooks for UI updates
- Error handling with fallbacks

**Prerequisites:**
- Epic 1 complete (Qwen3.5 model available)
- Epic 4 complete (Local leg labels working)
- Epic 6a complete (Skeleton states ready)

**Examples:**
```typescript
// lib/ai/hybrid-enrichment.ts
export const enrichRoute = async (
  route: Route
): Promise<EnrichmentResult> => {
  // Local path: immediate leg labels
  const legLabels = await QwenModel.generateLegLabels(route.legs)
  
  // Update UI with partial enrichment
  updateEnrichmentStatus({ status: "partial", legLabels })
  
  // Remote path: full enrichment in background
  const fullEnrichment = await HaikuModel.enrichRoute(route)
  
  return { legLabels, ...fullEnrichment }
}
```

**Constraints:**
- Must show leg labels in < 0.5s
- Must not block UI on remote enrichment
- Must handle model failures gracefully
- Must work offline for local path
- Must sync enrichment state to server

**Acceptance Criteria:**
- System shows leg labels immediately (0.35s)
- System displays "Enhancing..." badge
- System works offline for local labels
- System enriches fully in background
- System updates UI progressively
- System handles model failures

---

## Dependencies

**Blocks:** Epic 6c (Progressive Complete)
**Blocked By:** Epic 4 (Local Routing), Epic 6a (Progressive Skeleton)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Local model slow | Optimize model loading, cache in memory |
| Remote model fails | Fallback to partial enrichment |

---

## Definition of Done

- [ ] All tasks completed
- [ ] Human test steps pass
- [ ] Time to first response < 0.5s gate met
- [ ] Unit tests for state machine
- [ ] Integration tests for dual-model flow
- [ ] Performance benchmarks documented
