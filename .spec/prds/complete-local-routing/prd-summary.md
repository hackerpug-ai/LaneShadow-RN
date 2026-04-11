# Complete Local Routing PRD - Summary

> **v1.4 Rollback Note (2026-04-10):** @trestleinc/replicate, Yjs, and op-sqlite removed. Route persistence is Convex-only. Route editing requires connectivity. Offline route creation is out of scope.

## Status: ✅ COMPLETE

**Created:** 2026-04-09
**Version:** 1.4.0
**Appetite:** 6 weeks (full feature with polish)

## Deliverables

### PRD Structure
```
.spec/prds/complete-local-routing/
├── README.md                        ✅ Index with metadata
├── 00-overview.md                   ✅ Product description
├── 01-scope.md                      ✅ Scope boundaries
├── 02-roles.md                      ✅ User roles
├── 03-functional-groups.md          ✅ 4 functional groups
├── 04-uc-map.md                     ✅ 5 use cases (MAP)
├── 05-uc-off.md                     ✅ 6 use cases (OFF)
├── 06-uc-rte.md                     ✅ 4 use cases (RTE)
├── 07-uc-mig.md                     ✅ 5 use cases (MIG)
└── 08-technical-requirements.md    ✅ Technical specs
```

## Metrics

- **Functional Groups:** 4
- **Use Cases:** 20
- **System Components:** 5 (v1.4: LocalEnrichment, HybridEnrichment, ReplicateCollection, DraftRouteStore removed)
- **Data Entities:** 3
- **API Endpoints:** 5
- **External Dependencies:** 3

## Team Contributions

### Phase 1: User Personas (ui-designer + product-manager)
- ✅ 4 user personas defined (Nanny, Family/Admin, Platform Admin, System)
- ✅ User needs and pain points identified
- ✅ User journeys mapped for offline workflows

### Phase 2: Architecture (product-manager + engineering-manager)
- ✅ 7 system components identified
- ✅ 3 Convex data entities defined (featureFlags, routes, offlineRegions)
- ✅ 5 API endpoints designed (3 mutations, 2 queries)
- ✅ External dependencies specified with documentation URLs

### Phase 3: UI Infrastructure (engineering-manager + ui-designer)
- ✅ Design libraries confirmed (all existing)
- ✅ Style token extensions defined (enrichment phases)
- ✅ Component reuse analysis (6 existing, 3 new)
- ✅ Accessibility requirements specified

### Phase 4: Technical Synthesis (product-manager lead)
- ✅ Architecture diagram created
- ✅ Implementation phases defined
- ✅ Risk mitigation strategies outlined
- ✅ Success metrics established

## Key Technical Decisions

1. **Mapbox SDK over Custom Engine** - 2-3 months vs 6+ months
2. **Convex-Only Persistence** - No on-device database; all routes stored in Convex
3. **Provider-Agnostic Storage** - Routes stored as encoded polylines
4. **Feature Flag Rollout** - Gradual migration (10% → 50% → 100%)
5. **Coordinate Conversion** - Utilities for [lat,lng] ↔ [lng,lat]
6. **Preserved Functionality** - Weather overlays, mini-maps, themes, offline geometry calculation

## Business Impact

- **Cost Reduction:** ~$1,485/month ($1,500 → $15)
- **Offline Capability:** True on-device routing
- **Timeline:** 8-10 weeks
- **Team:** 1 React Native developer

## Next Steps

1. ✅ PRD reviewed and validated
2. ⏭️ Run `/kb-project-plan` to generate task breakdown
3. ⏭️ Run `/kb-run-epic` to begin implementation
4. ⏭️ Set up Mapbox account and access tokens

## Validation Checklist

- ✅ PRD folder created at correct path
- ✅ All 9 section files generated
- ✅ Version 1.0.0 initialized
- ✅ Appetite 6 weeks enforced
- ✅ Spec layers assigned to all sections
- ✅ UCs organized by functional group
- ✅ Team contributions documented
- ✅ Technical requirements included
- ✅ README.md links validated
- ✅ Single project scope confirmed
- ✅ Team collaboration completed

---

**PRD Status:** READY FOR IMPLEMENTATION PLANNING
