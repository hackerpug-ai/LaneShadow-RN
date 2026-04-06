---
stability: FEATURE_SPEC
last_validated: 2026-04-06
prd_version: 1.0.0
---

# Functional Groups

| Group | Prefix | Description |
|-------|--------|-------------|
| Voice Commands & STT | VC | Speech-to-text via on-device Whisper, helmet Bluetooth trigger, audio feedback patterns, TTS responses, speed-aware mode switching, integration with V1 chat input bar |
| On-Device Intelligence | OD | Local LLM as bidirectional translator — PARSE mode (NL --> intent JSON) and FORMAT mode (DB results --> NL). Intent parsing, route descriptions, hazard parsing, POI query parsing, response formatting |
| Offline Data Layer | OL | Valhalla offline routing (custom native module), Spatialite POI search (custom native module), local hazard database, cached weather, fuel range calculation |
| Data & Model Management | DM | Model download/update/removal, regional map pack management, device capability detection, cloud fallback coordination, first-launch onboarding, privacy controls |

## Use Case Summary

| Group | Prefix | Use Cases |
|-------|--------|-----------|
| Voice Commands & STT | VC | 7 |
| On-Device Intelligence | OD | 7 |
| Offline Data Layer | OL | 6 |
| Data & Model Management | DM | 4 |
| **Total** | | **24** |

## Dependencies

```
DM ────────> VC
  \            |
   \           v
    └───────> OD ────────> OL
```

- **DM** (Data & Model Management) has no dependencies — models and data must be downloaded before anything else works
- **VC** (Voice Commands) depends on DM — Whisper model must be downloaded
- **OD** (On-Device Intelligence) depends on DM — LLM must be downloaded
- **OL** (Offline Data Layer) depends on DM — map packs must be downloaded; also depends on OD for query parsing

## Group Rationale

### VC — Voice Commands & STT
The core interaction layer. Motorcycle riders cannot use a screen while riding — voice is not an optional enhancement, it is the primary interface during a ride. This group covers the full voice pipeline from physical trigger to audio response.

### OD — On-Device Intelligence
The LLM translator layer. Converts between rider-speak and structured database queries (PARSE mode) and between database results and natural language (FORMAT mode). This is the brain's tongue, not its memory — all facts come from databases.

### OL — Offline Data Layer
The knowledge layer. Valhalla routing engine, Spatialite POI database, local hazard reports, cached weather — these are where answers live. The LLM asks questions here; it never answers from its own weights. This group requires custom Kotlin/Swift native modules.

### DM — Data & Model Management
The infrastructure layer. Before any on-device AI can run, models must be downloaded and map packs installed. This group handles the download UX, storage management, capability detection, and cloud fallback coordination.
