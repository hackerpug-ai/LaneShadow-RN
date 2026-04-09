# Complete Local Routing - Epic Inventory

**Project:** LaneShadow Complete Local Routing
**Product Manager:** product-manager
**Date:** 2026-04-09
**Version:** 1.0.0
**Status:** Approved for Implementation

---

## Executive Summary

**Objective:** Migrate from Google Maps to Mapbox SDK with offline routing, hybrid enrichment (Qwen3.5 local + Haiku cloud), and local-first sync with @trestleinc/replicate.

**Timeline:** 10-12 weeks
**Team:** 1 React Native developer
**Cost Savings:** ~$1,470/month ($1,500 → $15/month)

**Epic Structure:** 10 epics, 35 tasks, 100% PRD coverage

---

## Epic Inventory

| Epic | Title | Tasks | Timeline | Gate |
|------|-------|-------|----------|------|
| [Epic 1](./epic-1-shadow-setup/EPIC.md) | Shadow Setup | 4 | Week 1 | Setup completion > 90% |
| [Epic 2](./epic-2-map-foundation/EPIC.md) | Map Foundation | 3 | Week 2 | Map rendering 60fps |
| [Epic 3](./epic-3-offline-regions/EPIC.md) | Offline Regions | 2 | Weeks 3-4 | Region download < 3min |
| [Epic 4](./epic-4-local-routing/EPIC.md) | Local Routing | 2 | Weeks 4-5 | Offline routing < 2s |
| [Epic 5](./epic-5-route-sync/EPIC.md) | Route Sync | 3 | Weeks 5-6 | Sync success > 99% |
| [Epic 6a](./epic-6a-progressive-skeleton/EPIC.md) | Progressive Skeleton | 1 | Week 6 | Skeleton render < 100ms |
| [Epic 6b](./epic-6b-progressive-partial/EPIC.md) | Progressive Partial | 1 | Week 6 | First response < 0.5s |
| [Epic 6c](./epic-6c-progressive-complete/EPIC.md) | Progressive Complete | 1 | Week 6 | Full enrichment < 5s |
| [Epic 7](./epic-7-weather-overlays/EPIC.md) | Weather Overlays | 4 | Week 7 | Weather render < 100ms |
| [Epic 8](./epic-8-testing-launch/EPIC.md) | Testing & Launch | 10 | Weeks 8-12 | All tests pass 100% |

---

## Dependency Graph

```
Epic 1 (Shadow Setup)
    ↓
Epic 2 (Map Foundation)
    ↓
Epic 3 (Offline Regions) ─────┐
    ↓                         │
Epic 4 (Local Routing) ◄─────┘
    ↓
Epic 5 (Route Sync)
    ↓
Epic 6a (Skeleton) → Epic 6b (Partial) → Epic 6c (Complete)
    ↓
Epic 8 (Testing & Launch)

Parallel: Epic 7 (Weather Overlays) after Epic 4
```

---

## Human Testing Gates

Each epic MUST pass its human testing gate before proceeding:

1. **Epic 1:** Setup completion rate > 90%
2. **Epic 2:** Map rendering 60fps
3. **Epic 3:** Region download < 3 min
4. **Epic 4:** Offline routing < 2s
5. **Epic 5:** Sync success rate > 99%
6. **Epic 6a:** Skeleton render < 100ms
7. **Epic 6b:** Time to first response < 0.5s
8. **Epic 6c:** Full enrichment < 5s
9. **Epic 7:** Weather render < 100ms
10. **Epic 8:** All tests pass 100%

---

## PRD Coverage

| Functional Group | Use Cases | Coverage |
|------------------|------------|----------|
| MAP (Foundation) | 5 | ✅ 100% |
| OFF (Offline) | 8 | ✅ 100% |
| RTE (Routing) | 4 | ✅ 100% |
| WUI (Weather UI) | 4 | ✅ 100% |
| PE (Progressive) | 3 | ✅ 100% |
| **Total** | **22** | **✅ 100%** |

---

## Risk Mitigation

| Risk | Level | Mitigation |
|------|-------|------------|
| Coordinate bugs | MEDIUM | Comprehensive unit tests |
| Model download failure | HIGH | Hard gate + retry logic |
| Replicate sync conflicts | LOW | Yjs CRDTs auto-merge |
| Performance regression | MEDIUM | Benchmark before/after |
| Progressive UX complexity | MEDIUM-HIGH | Skeleton states, animations |
| Shadow Setup abandonment | HIGH | Background download, progress |

---

## Next Steps

1. ✅ Epic breakdown complete
2. ✅ All epic and task files written
3. ⏭️ Run `/kb-project-plan` to generate task files
4. ⏭️ Run `/kb-run-epic` to begin Epic 1

---

**Product Manager Accountability:** If tasks don't fulfill PRD requirements, that is MY fault.

**Confidence Level:** 90%

**Status:** ✅ Ready for Implementation
