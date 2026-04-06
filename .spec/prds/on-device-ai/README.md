# On-Device AI: Local LLM + Voice Interface for Offline Rider Intelligence

Voice-first, offline-capable AI for motorcycle riders — a bidirectional natural language translator between rider-speak and local databases.

## PRD Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Appetite | 6 weeks |
| Scope Level | Full feature |
| Created | 2026-04-06 |
| Last Updated | 2026-04-06 |
| Depends On | V1 (conversational planning, saved routes, weather overlays) |
| Research | Holocron ID: js7d6fqewjy2k4gtkpr8he2px184be6a |

## Document Index

| File | Section | Stability |
|------|---------|-----------|
| [00-overview.md](./00-overview.md) | Product description, problem statement, the LLM contract | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | User roles and personas | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Functional group overview and use case summary | FEATURE_SPEC |
| [04-uc-vc.md](./04-uc-vc.md) | UC-VC: Voice Commands & STT | FEATURE_SPEC |
| [05-uc-od.md](./05-uc-od.md) | UC-OD: On-Device Intelligence (LLM parse/format) | FEATURE_SPEC |
| [06-uc-ol.md](./06-uc-ol.md) | UC-OL: Offline Data Layer (routing, POI, hazards) | FEATURE_SPEC |
| [07-uc-dm.md](./07-uc-dm.md) | UC-DM: Data & Model Management | FEATURE_SPEC |
| [08-team-contributions.md](./08-team-contributions.md) | Phase contributions from specialist agents | - |
| [09-technical-requirements.md](./09-technical-requirements.md) | Technical architecture, native modules, data schema | CONSTITUTION |

## Quick Stats

| Metric | Value |
|--------|-------|
| Functional Groups | 4 |
| Use Cases | 24 |
| Custom Native Modules | 2 (Valhalla routing, Spatialite POI) |
| On-Device Models | 2 (Llama 3.2 1B Q4, Whisper Tiny EN) |
| Storage Footprint | 1.5-2.5 GB per region |
| Minimum Device | iPhone 12 / Snapdragon 8 Gen 1 |

## Version History

| Version | Date | Changes | Trigger |
|---------|------|---------|---------|
| 1.0.0 | 2026-04-06 | Initial PRD | New initiative from deep research session |

## Next Steps

- `/kb-project-plan` - Build implementation plan with task files
- `/trd-plan` - Generate detailed TRD for native module architecture
- `/pixel-perfect:design` - Design voice interaction UI components
