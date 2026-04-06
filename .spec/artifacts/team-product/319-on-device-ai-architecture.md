# On-Device AI — Technical Architecture Specification

**Task**: #319 — Technical Architecture & Native Plugin Feasibility
**Date**: 2026-04-06
**Status**: Draft
**Author**: engineering-manager agent

---

## 0. Critical Framing: The LLM as Translator, Not Oracle

The on-device LLM has exactly one job: translate between natural language and structured data.

| Mode | Input | Output | Example |
|------|-------|--------|---------|
| PARSE | Natural language utterance | Structured intent JSON | "Find gas within 20 miles" → `{intent: "poi_search", category: "fuel", radius: "20mi"}` |
| FORMAT | Structured database result | Natural language utterance | `{name: "Shell", dist: "2.1mi"}` → "Shell station, 2 miles ahead on your route" |

The LLM never answers from its own weights. All factual data comes from local databases (OSM tiles, POI spatial index, hazard reports, cached weather). This constraint is what makes small on-device models (1B–3B parameters) viable — they need to be good at translation, not at factual recall.

---

## 1. System Components

| Component | Role | Technology | New vs Existing |
|-----------|------|-----------|-----------------|
| **On-Device LLM Runtime** | Runs quantized language model for NL↔structured translation | react-native-executorch (ExecuTorch) | New |
| **Speech-to-Text (STT)** | Converts voice input to text; helmet-safe, glove-safe interaction | Whisper Tiny EN via react-native-executorch | New |
| **Text-to-Speech (TTS)** | Reads formatted responses aloud during riding | iOS AVSpeechSynthesizer / Android TextToSpeech (system APIs) | New (minimal integration) |
| **Offline Routing Engine** | Computes turn-by-turn routes without cloud | Valhalla C++ engine via custom Kotlin/Swift native module | New (custom native module) |
| **Spatial POI Database** | Spatial queries for gas, food, lodging, viewpoints | SQLite + Spatialite with R-tree index via custom native module | New (custom native module) |
| **Hazard Report Database** | Local store for rider-reported hazards; syncs to Convex when online | SQLite, background sync to Convex | New |
| **Map Data Manager** | Downloads, stores, and versions regional OSM tile packs | Custom downloader + file manager (Expo FileSystem) | New |
| **Model Manager** | Downloads, caches, and versions LLM + Whisper model files | Custom downloader + version registry | New |
| **Cloud Fallback Coordinator** | Detects device capability; routes requests to local or cloud pipeline | Capability detection module at app startup | New |
| **Deterministic Orchestrator** | Coordinates intents → database queries → formatted responses | Existing planRideOrchestrator (adapted) | Existing (extended) |
| **Convex Sync Layer** | Syncs hazard reports, saved routes, plan history when online | Existing Convex backend | Existing |

---

## 2. Custom Native Modules Required

This section is critical: four native modules require Kotlin/Swift work. User has approved this.

### 2.1 Valhalla Routing Engine Wrapper

**What it does**: Computes turn-by-turn motorcycle routes offline using OSM map data.

**Architecture**:
```
Valhalla C++ core (precompiled static library)
    ↓
JNI bridge (Android) / Objective-C++ bridge (iOS)
    ↓
Kotlin NativeModule (Android) / Swift NativeModule (iOS)
    ↓
React Native TurboModule interface
    ↓
JavaScript/TypeScript API
```

**Key API surface**:
```typescript
interface ValhallaNativeModule {
  // Initialize with path to regional OSM graph file
  initialize(graphPath: string): Promise<void>;
  
  // Compute route (replaces Google Routes API in offline mode)
  computeRoute(request: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    waypoints?: Array<{ lat: number; lng: number }>;
    costing: 'motorcycle' | 'auto';
    costingOptions?: { useScenicRoads: number; avoidHighways: boolean };
  }): Promise<{
    geometry: GeoJSON.LineString;
    distanceMeters: number;
    durationSeconds: number;
    legs: RouteLeg[];
  }>;
  
  // Check if graph data covers a bounding box
  coversBounds(bounds: LatLngBounds): Promise<boolean>;
}
```

**Build complexity**: HIGH
- Valhalla has 30+ C++ dependencies; cross-compilation for iOS (arm64) and Android (arm64-v8a, x86_64) requires careful CMake configuration
- Tile graph files must be pre-built offline from OSM PBF data using `valhalla_build_tiles`
- Regional graph files are separate from raster map tiles (different from what map rendering uses)
- **Reference**: Valhalla has existing Android/iOS wrappers in the community (e.g., `valhalla-mobile`) — evaluate these before building from scratch

**Feasibility verdict**: Feasible but significant build infrastructure investment. Estimate 3–4 weeks for a stable native module with routing parity to Google Routes API for the offline case.

---

### 2.2 Spatialite Spatial Query Module

**What it does**: Executes spatial SQL queries against a local POI database using R-tree indexing for fast radius and bounding-box lookups.

**Architecture**:
```
SpatiaLite (SQLite extension, C)
    ↓
JNI bridge / Objective-C bridge
    ↓
Kotlin/Swift NativeModule
    ↓
React Native TurboModule
    ↓
TypeScript API
```

**Key API surface**:
```typescript
interface SpatialiteNativeModule {
  // Open database at path
  open(dbPath: string): Promise<void>;
  
  // Radius search — returns POIs within meters of a point
  queryRadius(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    category?: POICategory; // 'fuel' | 'food' | 'lodging' | 'viewpoint' | 'camping'
    limit?: number;
  }): Promise<POI[]>;
  
  // Bounding box search
  queryBounds(params: {
    bounds: LatLngBounds;
    category?: POICategory;
    limit?: number;
  }): Promise<POI[]>;
  
  // Nearest N POIs along a route geometry
  queryAlongRoute(params: {
    geometry: GeoJSON.LineString;
    bufferMeters: number;
    category?: POICategory;
    limit?: number;
  }): Promise<POI[]>;
}

interface POI {
  osmId: string;
  name: string;
  category: POICategory;
  lat: number;
  lng: number;
  tags: Record<string, string>; // raw OSM tags
  distanceMeters: number;
}
```

**Feasibility verdict**: Moderate complexity. SpatiaLite is well-tested on mobile (used by QGIS mobile, Marble). Pre-built static libraries exist for iOS and Android. The native module wrapper is ~2 weeks of work; database build pipeline (OSM PBF → SpatiaLite) is a separate tooling concern.

---

### 2.3 react-native-executorch: Custom .pte Model Loading Assessment

**Question**: Can react-native-executorch load custom pruned .pte models (e.g., a fine-tuned 1B parameter model for NL↔intent translation)?

**Assessment**:
- react-native-executorch is built on ExecuTorch, which uses the `.pte` (ExecuTorch Program) format
- The library exposes `LLM.load(modelPath, tokenizerPath)` — it accepts any `.pte` file at any local path
- **Yes, custom models are supported**: any model exported via `torch.export` + `executorch.exir` pipeline can be loaded
- The library's bundled models (Llama 3.2 1B/3B, Phi-3.5 Mini) use the same loading path as custom models
- **Constraint**: The tokenizer must match the model's vocabulary — if using a custom model, the tokenizer `.bin` file must be provided

**Recommended model for V2 on-device use**:
- **Llama 3.2 1B Instruct Q4** (~700MB on disk, ~900MB RAM at runtime with KV cache)
- Sufficient for intent parsing and response formatting — no factual recall required
- Can be fine-tuned on LaneShadow-specific intent schema using LoRA (adapter weights only, ~50MB additional)

---

### 2.4 ExecuTorch Backend Assessment

| Backend | Platform | Hardware Requirement | Performance |
|---------|----------|---------------------|-------------|
| **CoreML** | iOS only | A14+ Neural Engine (iPhone 12+) | Fastest: 10–40 tok/s for 1B model |
| **XNNPACK** | iOS + Android | Any ARM64 CPU | Moderate: 5–15 tok/s for 1B model |
| **Vulkan** | Android only | Vulkan 1.1+ GPU | Experimental; skip for V2 |
| **HTP (Hexagon)** | Android (Qualcomm only) | Snapdragon 8 Gen 1+ | Fast, but Qualcomm-specific |

**Decision**: Target CoreML (iOS) + XNNPACK (Android) for V2. This covers:
- iOS: iPhone 12+ (A14 Bionic) → CoreML with Neural Engine → ~20–40 tok/s
- Android: Snapdragon 8 Gen 1+ with 6GB+ RAM → XNNPACK → ~8–15 tok/s
- Devices below minimum spec → cloud fallback

---

## 3. Data Architecture

### 3.1 OSM Map Packs

| Aspect | Detail |
|--------|--------|
| **Format** | Valhalla graph tiles (pre-built from OSM PBF) + raster/vector tiles for rendering (separate) |
| **Routing graph size per region** | US Northeast: ~800MB; US West Coast: ~1.2GB; Full US: ~6GB |
| **Practical approach for V2** | Offer sub-regional packs by state or metropolitan area (~200–500MB each); user selects home region |
| **Download strategy** | Background download via Expo FileSystem + resumable fetch; integrity check via SHA-256 |
| **Storage location** | iOS: `Documents/` directory (user-accessible, backed up by default — consider excluding from iCloud backup); Android: external storage or app-specific directory |
| **Versioning** | Version hash in manifest file; incremental diff updates where possible |
| **Rendering tiles** | Separate from routing graph. Use MapLibre GL with PMTiles format (self-hosted or CDN); regional .pmtiles packs for offline rendering |

### 3.2 POI Spatial Index

**Schema** (SpatiaLite):
```sql
CREATE TABLE pois (
  id          TEXT PRIMARY KEY,    -- OSM node/way ID
  name        TEXT,
  category    TEXT NOT NULL,       -- fuel | food | lodging | viewpoint | camping | rest_area
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  tags        TEXT,                -- JSON blob of raw OSM tags
  updated_at  INTEGER              -- Unix timestamp
);

-- R-tree spatial index (enables fast radius/bbox queries)
CREATE VIRTUAL TABLE pois_idx USING rtree(
  id,
  min_lat, max_lat,
  min_lng, max_lng
);

-- Trigger to keep R-tree in sync
CREATE TRIGGER pois_ai AFTER INSERT ON pois BEGIN
  INSERT INTO pois_idx VALUES (new.rowid, new.lat, new.lat, new.lng, new.lng);
END;
```

**Build pipeline** (offline tooling, not in-app):
```
OSM PBF regional extract
    → osmfilter (filter to POI node types)
    → osm2pgsql / custom parser
    → SpatiaLite database
    → Compress + package as regional download
```

**Query patterns**:
- "Find gas within 20 miles": R-tree radius query on `pois_idx` filtered by `category='fuel'`
- "What's along my route": Buffer route geometry, bbox query on `pois_idx`
- Both queries complete in <50ms on device for regions with 500K+ POIs (R-tree is O(log n))

### 3.3 Hazard Report Database

**Local schema** (SQLite):
```sql
CREATE TABLE hazard_reports (
  id            TEXT PRIMARY KEY,    -- UUID, generated on device
  hazard_type   TEXT NOT NULL,       -- road_debris | pothole | accident | flooding | animal | construction
  severity      TEXT NOT NULL,       -- low | medium | high
  lat           REAL NOT NULL,
  lng            REAL NOT NULL,
  description   TEXT,
  reporter_id   TEXT NOT NULL,       -- Clerk user ID
  reported_at   INTEGER NOT NULL,    -- Unix timestamp
  expires_at    INTEGER,             -- Hazard auto-expiry (e.g., 4 hours for debris, 24h for construction)
  synced_at     INTEGER,             -- NULL = pending sync to Convex
  convex_id     TEXT                 -- Set after successful sync
);

CREATE INDEX hazard_reports_sync ON hazard_reports(synced_at) WHERE synced_at IS NULL;
CREATE INDEX hazard_reports_location ON hazard_reports(lat, lng);
```

**Sync protocol**:
1. Hazard created locally → `synced_at = NULL`
2. Background sync job (every 5 min when online) → POST to `api.db.hazardReports.create`
3. On success → set `synced_at`, `convex_id`
4. Receive hazards from other riders via Convex reactive query → insert to local cache

### 3.4 Model Files

| File | Size | Storage |
|------|------|---------|
| Llama 3.2 1B Q4 `.pte` | ~700MB | App Documents/ (iOS) or app storage (Android) |
| Llama tokenizer `.bin` | ~500KB | Bundled with app or downloaded with model |
| Whisper Tiny EN `.pte` | ~150MB | Same directory as LLM |
| Whisper tokenizer | ~1MB | Bundled or downloaded with model |

**Versioning**: Version manifest JSON at well-known URL; app checks on launch (when online) and schedules background download if newer version available. Old version kept until new version verified (disk space allowing).

**Update mechanism**: Full model replacement (no incremental patching — ExecuTorch .pte files are binary blobs). Download to temp path, verify SHA-256, atomic rename.

### 3.5 Total On-Device Storage Estimate

| Component | Size |
|-----------|------|
| LLM model (Llama 3.2 1B Q4) | ~700MB |
| Whisper Tiny EN | ~150MB |
| Single regional routing graph (e.g., one US state) | ~200–500MB |
| Single regional POI database | ~50–150MB |
| Single regional rendering tiles (.pmtiles) | ~300–800MB |
| Hazard cache + app data | ~50MB |
| **Total (single region, minimal)** | **~1.45GB** |
| **Total (single region, full)** | **~2.3GB** |

**Recommendation**: Warn users before downloading that on-device mode requires ~1.5–2.5GB of storage. Make regional packs individually downloadable and deletable. Do not bundle map data in the app binary.

---

## 4. Device Constraints & Graceful Degradation

### 4.1 Minimum Supported Devices

| Platform | Minimum Device | Chip | RAM | On-Device Capability |
|----------|---------------|------|-----|---------------------|
| iOS | iPhone 12 | A14 Bionic | 4GB | LLM (CoreML) + Whisper + Valhalla |
| iOS | iPhone 11 and below | A13 or earlier | 4GB | Whisper only; LLM → cloud fallback |
| Android | Snapdragon 8 Gen 1 (2022+) | ARM64 | 6GB+ | LLM (XNNPACK) + Whisper + Valhalla |
| Android | Mid-range (e.g., Snapdragon 6xx) | ARM64 | 4GB | Whisper only; LLM → cloud fallback |

### 4.2 RAM Budget Analysis

For iPhone 12 (4GB physical, ~2.8–3.2GB available to apps):

| Allocation | RAM |
|------------|-----|
| App process (React Native + JS engine) | ~300MB |
| Map rendering (MapLibre GL) | ~200–400MB |
| LLM weights loaded (Q4 1B) | ~700MB |
| LLM KV cache (1K context, 1B model) | ~100MB |
| Whisper model loaded | ~150MB |
| Valhalla routing engine + graph cache | ~200MB |
| OS overhead + system | ~400MB |
| **Total** | **~2.05–2.25GB** |

**Assessment**: Fits within the ~2.8GB available on iPhone 12 with reasonable margin. Loading all models simultaneously is the worst case; in practice, Whisper is only loaded during voice input and can be unloaded immediately after transcription.

**Memory management strategy**:
- Load LLM at startup (if device qualifies), keep resident during session
- Load Whisper on demand (voice input activation), unload after transcription completes
- Valhalla routing engine loaded on demand when offline routing requested

### 4.3 Battery Impact

**Policy**: Burst inference only. The LLM runs for one request-response cycle (typically 200–500ms for intent parsing, 300–800ms for response formatting at 15–30 tok/s). No continuous listening. No streaming generation during navigation.

**STT pipeline**: Whisper processes audio in 30-second chunks after the rider stops speaking (push-to-talk trigger). Transcription takes ~1–3 seconds. No continuous audio processing.

**Estimated battery impact per query**: ~0.05–0.1% per on-device LLM call (burst inference at full CPU/Neural Engine for <1 second). At 20 queries per ride, <2% battery for the AI pipeline.

### 4.4 Capability Detection at App Startup

```typescript
interface DeviceCapability {
  canRunLLM: boolean;         // RAM + chip generation check
  canRunSTT: boolean;         // Whisper requires less than LLM; broader support
  hasOfflineRouting: boolean; // Valhalla graph files present and initialized
  hasOfflinePOI: boolean;     // SpatiaLite database present
  hasOfflineMaps: boolean;    // Map tiles present for current region
  mode: 'full_offline' | 'hybrid' | 'cloud_only';
}

// Detection logic
async function detectCapability(): Promise<DeviceCapability> {
  const ram = await NativeModules.DeviceInfo.getTotalMemory(); // bytes
  const chip = await NativeModules.DeviceInfo.getChipset();
  
  const canRunLLM = (
    (Platform.OS === 'ios' && isA14OrNewer(chip) && ram >= 3.5e9) ||
    (Platform.OS === 'android' && isSnapdragon8Gen1OrNewer(chip) && ram >= 5.5e9)
  );
  
  const canRunSTT = (
    (Platform.OS === 'ios' && isA13OrNewer(chip) && ram >= 3e9) ||
    (Platform.OS === 'android' && ram >= 4e9)
  );
  
  const modelExists = await FileSystem.getInfoAsync(LLM_MODEL_PATH);
  const graphExists = await FileSystem.getInfoAsync(VALHALLA_GRAPH_PATH);
  const poiExists = await FileSystem.getInfoAsync(SPATIALITE_DB_PATH);
  
  // ...
}
```

---

## 5. Integration with V1 Architecture

### 5.1 Current V1 Pipeline (Cloud)

```
Rider message
    ↓
parseNaturalLanguageInput (Convex action → OpenAI)
    ↓
planRideOrchestrator (Convex action → Google Routes API + Overpass + Open-Meteo)
    ↓
enrichRoute (Convex action → OpenAI)
    ↓
PlannedRouteOptionsView → UI
```

### 5.2 V2 Hybrid Pipeline

```
Rider message
    ↓
[DEVICE] STT (Whisper) — if voice input
    ↓
[DEVICE] On-device LLM → parse intent → structured PlanInput
    ↓ (success path — device capable + model loaded)
[DEVICE] ValhallaNativeModule.computeRoute() — if offline routing available
    ↓ (success path — graph files present)
[DEVICE] SpatialiteNativeModule.queryAlongRoute() — POIs along route
    ↓
[DEVICE] On-device LLM → format response from database results
    ↓ (success path)
[DEVICE] TTS → speak response to rider
    ↓
Result displayed in UI

    ↓ (fallback paths — any capability missing)
[CLOUD] Convex: parseNaturalLanguageInput → OpenAI
    ↓
[CLOUD] planRideOrchestrator → Google Routes + Overpass + Open-Meteo
    ↓
[CLOUD] enrichRoute → OpenAI
    ↓
Result displayed in UI
```

### 5.3 V2 Full Offline Pipeline

```
Rider voice input
    ↓
[DEVICE] Whisper STT
    ↓
[DEVICE] LLM PARSE: utterance → {intent, params}
    ↓
[DEVICE] Intent router (deterministic, no LLM):
    ├── route_request → ValhallaNativeModule.computeRoute()
    ├── poi_search   → SpatialiteNativeModule.queryRadius()
    ├── hazard_query → HazardReportDB.query()
    └── weather_query → CachedWeatherDB.query()
    ↓
[DEVICE] LLM FORMAT: database results → natural language
    ↓
[DEVICE] AVSpeechSynthesizer / TextToSpeech
    ↓
[BACKGROUND, when online] Sync hazard reports → Convex
```

### 5.4 Coexistence of Local LLM and Cloud pi core

The cloud pi core agent and on-device LLM serve different roles and are not in conflict:

| Aspect | Cloud pi core (V1) | On-Device LLM (V2) |
|--------|-------------------|-------------------|
| **Role** | Full agentic planning: interprets intent, calls tools, reasons about routes | Translator only: NL→intent JSON and result→NL |
| **When active** | Online, capable device prefers cloud (lower latency for planning) | Offline, or when user opts into on-device mode |
| **Context window** | Large (GPT-4o mini, 128K) | Small (Llama 1B, 2K–4K tokens) |
| **Planning quality** | High — can reason about complex constraints | Limited to pre-defined intent schema |
| **Fallback direction** | → On-device LLM if cloud unavailable | → Cloud pi core if device incapable |

**Recommended V2 default**: Cloud pi core for route planning (better quality), on-device LLM for real-time riding assistance (gas, hazards, weather queries while moving). These are complementary, not competing.

**Fallback strategy**:
```typescript
async function handleRiderQuery(query: string): Promise<Response> {
  const capability = await getDeviceCapability();
  const isOnline = await NetInfo.isConnected();
  
  if (isOnline && !userPrefersOffline) {
    // Cloud path: full pi core agent
    return await cloudPiCore.handle(query);
  }
  
  if (capability.canRunLLM && capability.hasOfflineRouting) {
    // Full offline path
    return await onDevicePipeline.handle(query);
  }
  
  if (!isOnline) {
    return { error: 'offline_no_local_model', message: 'Download offline pack to use LaneShadow without signal.' };
  }
  
  // Degraded: online but device incapable → cloud
  return await cloudPiCore.handle(query);
}
```

---

## 6. Architecture Diagrams

### 6.1 Full On-Device Pipeline (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RIDER INPUT                                     │
│                                                                         │
│   [Voice] ──→ [Bluetooth Headset / Mic]                                │
│   [Text]  ──→ [Chat Input Bar]                                          │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SPEECH-TO-TEXT (on-device)                           │
│                                                                         │
│   Whisper Tiny EN via react-native-executorch                           │
│   Input: 30-second audio chunk                                          │
│   Output: text transcript                                               │
│   Latency: 1–3 seconds                                                  │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   LLM PARSE (on-device)                                 │
│                                                                         │
│   Llama 3.2 1B Q4 via react-native-executorch (CoreML / XNNPACK)       │
│   Input: text utterance + conversation context (last 3 turns)           │
│   Output: {intent, params} JSON                                         │
│   Latency: 200–800ms                                                    │
│                                                                         │
│   Intents: route_request | poi_search | hazard_report |                 │
│            weather_query | hazard_query | general_info                  │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                DETERMINISTIC INTENT ROUTER (no LLM)                    │
│                                                                         │
│   Switch on intent type:                                                │
│                                                                         │
│   route_request ──→ [Valhalla Native Module]                           │
│                      Kotlin/Swift → C++ Valhalla engine                 │
│                      OSM graph files on-device                          │
│                      Output: GeoJSON route + legs                       │
│                                                                         │
│   poi_search ──→ [SpatiaLite Native Module]                            │
│                  R-tree spatial query                                   │
│                  Local POI database (built from OSM)                    │
│                  Output: Array<POI>                                     │
│                                                                         │
│   hazard_query ──→ [Local SQLite Hazard DB]                            │
│                    Direct SQLite query                                   │
│                    Output: Array<HazardReport>                          │
│                                                                         │
│   weather_query ──→ [Cached Weather Store]                             │
│                     Last-synced Open-Meteo data                         │
│                     Output: WeatherSnapshot                             │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   LLM FORMAT (on-device)                                │
│                                                                         │
│   Llama 3.2 1B Q4 (same model, second pass)                            │
│   Input: database result JSON + user context                            │
│   Output: natural language response (1–2 sentences, TTS-optimized)     │
│   Latency: 300–1000ms                                                   │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                 ┌───────┴───────┐
                 ▼               ▼
         [TTS OUTPUT]     [UI DISPLAY]
         AVSpeechSynth    Chat message +
         / TextToSpeech   map update
         (immediate,      (simultaneous)
          riding-safe)
                         │
                         │ (when online, background)
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATA SYNC (Convex)                                   │
│                                                                         │
│   ← Download: hazard reports from other riders                         │
│   → Upload: local hazard reports, saved routes, plan history           │
│   ← Download: weather updates (every 30 min when online)               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Cloud Fallback Path

```
┌─────────────────────────────────────────────────────────────────────────┐
│              CLOUD FALLBACK COORDINATOR                                 │
│                                                                         │
│   Triggers fallback when:                                               │
│   • Device capability check fails (insufficient RAM/chip)              │
│   • Model files not downloaded                                          │
│   • User explicitly selects cloud mode                                  │
│   • Online + planning request (cloud preferred for quality)            │
│                                                                         │
│   [Rider Query]                                                         │
│        ↓                                                                │
│   [Convex: parseNaturalLanguageInput → OpenAI GPT-4o mini]             │
│        ↓                                                                │
│   [Convex: planRideOrchestrator → Google Routes + Overpass + Open-Meteo]│
│        ↓                                                                │
│   [Convex: enrichRoute → OpenAI]                                        │
│        ↓                                                                │
│   [PlannedRouteOptionsView → UI]                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Data Sync Architecture

```
┌──────────────────────────┐       ┌──────────────────────────┐
│     ON-DEVICE STORAGE    │       │     CONVEX BACKEND        │
│                          │       │                           │
│  ┌────────────────────┐  │       │  ┌────────────────────┐  │
│  │  Hazard Reports    │◄─┼──────►│  │  hazard_reports    │  │
│  │  (SQLite)          │  │  sync │  │  table             │  │
│  └────────────────────┘  │       │  └────────────────────┘  │
│                          │       │                           │
│  ┌────────────────────┐  │       │  ┌────────────────────┐  │
│  │  Saved Routes      │◄─┼──────►│  │  saved_routes      │  │
│  │  (SQLite cache)    │  │  sync │  │  table             │  │
│  └────────────────────┘  │       │  └────────────────────┘  │
│                          │       │                           │
│  ┌────────────────────┐  │       │  ┌────────────────────┐  │
│  │  Weather Cache     │◄─┼──────►│  │  Open-Meteo        │  │
│  │  (SQLite)          │  │ fetch │  │  (via Convex action)│  │
│  └────────────────────┘  │       │  └────────────────────┘  │
│                          │       │                           │
│  ┌────────────────────┐  │       │                           │
│  │  OSM Map Tiles     │  │       │                           │
│  │  (.pmtiles)        │  │       │  (CDN download,           │
│  │  Valhalla Graph    │  │       │   no Convex involvement)  │
│  │  SpatiaLite POIs   │  │       │                           │
│  └────────────────────┘  │       │                           │
│                          │       │                           │
│  ┌────────────────────┐  │       │                           │
│  │  LLM Models        │  │       │  (CDN download,           │
│  │  (.pte files)      │  │       │   no Convex involvement)  │
│  └────────────────────┘  │       │                           │
└──────────────────────────┘       └──────────────────────────┘
```

---

## 7. Open Questions & Risks

| # | Question / Risk | Severity | Mitigation |
|---|-----------------|----------|-----------|
| 1 | Valhalla cross-compilation complexity: iOS + Android simultaneously | HIGH | Evaluate `valhalla-mobile` community wrapper before custom build; allocate 4 weeks |
| 2 | Llama 3.2 1B intent parsing accuracy on motorcycle-domain queries | HIGH | Benchmark against 200 real user queries before shipping; fine-tune if accuracy <90% |
| 3 | 700MB model download — user drop-off before first use | MEDIUM | Make offline mode opt-in; show clear value prop; allow partial download (model without map data) |
| 4 | iPhone 12 RAM pressure when LLM + Whisper + Valhalla simultaneously loaded | MEDIUM | Implement aggressive model unloading; profile on device, not simulator |
| 5 | SpatiaLite POI database currency (OSM data becomes stale) | MEDIUM | Monthly regional POI pack updates; timestamp-based cache invalidation |
| 6 | react-native-executorch API stability (library is relatively new) | LOW-MEDIUM | Pin to specific version; maintain fork if needed |
| 7 | Android fragmentation: XNNPACK performance varies by SoC | LOW | Test on Snapdragon 8 Gen 1, 8 Gen 2, 8 Gen 3; document performance per tier |
| 8 | TTS voice quality in helmet via Bluetooth | LOW | Use native TTS APIs (best OS integration); allow user to adjust speed/pitch |

---

## 8. V2 Scope Boundary

What is IN scope for V2 on-device AI:
- STT via Whisper Tiny EN (react-native-executorch)
- On-device LLM for intent parsing and response formatting
- System TTS for riding-safe audio output
- Offline routing via Valhalla native module
- Offline POI lookup via SpatiaLite native module
- Local hazard report storage with Convex sync
- Regional map pack download + management
- Model download + version management
- Capability detection and cloud fallback

What remains OUT of scope for V2 (V3+):
- On-device model fine-tuning
- Multi-region simultaneous routing
- Real-time traffic in offline mode (requires data feed)
- CarPlay / Android Auto integration
- Continuous ambient listening (always-on wake word)

---

## 9. Recommended Implementation Sequence

Phase 1 (4 weeks): Native modules
1. Valhalla routing native module (Android first, then iOS)
2. SpatiaLite POI native module
3. Map pack download + management infrastructure

Phase 2 (3 weeks): On-device AI pipeline
1. react-native-executorch integration (Whisper STT)
2. LLM loading + intent parsing (PARSE mode)
3. LLM response formatting (FORMAT mode)
4. TTS integration

Phase 3 (2 weeks): Orchestration + fallback
1. Capability detection module
2. Cloud fallback coordinator
3. Hybrid routing (local Valhalla OR cloud Google Routes)
4. Hazard sync to Convex

Phase 4 (1 week): Polish + testing
1. Device-specific performance profiling (iPhone 12, Pixel 7, S22)
2. Model download UX
3. Battery impact measurement
4. Edge case handling (model OOM, graph file corruption)

Total estimate: ~10 weeks of engineering work, parallelizable across 2–3 engineers.
