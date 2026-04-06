---
stability: FEATURE_SPEC
last_validated: 2026-04-06
prd_version: 1.0.0
appetite_weeks: 6
---

# Scope

## Appetite

**6 weeks** — Full on-device AI feature: voice interface, local LLM translator, offline data layer (routing + POI + hazards), custom native modules (Kotlin/Swift), model and map pack management.

## In Scope

### Voice Commands & Speech-to-Text
- On-device speech-to-text via Whisper Tiny EN (react-native-executorch)
- Helmet Bluetooth button trigger (primary) with optional wake word (advanced setting)
- Three interaction contexts: pre-ride (screen), mid-ride (audio-only), post-ride (screen)
- Speed-aware mode switching: stationary = transcribe to text field; moving = direct audio response
- Audio feedback patterns: activation chime, processing chime, confirm chime, error chime
- System TTS for audio responses (iOS AVSpeechSynthesizer / Android TextToSpeech)
- Mid-ride responses capped at 8 words (navigation) / 15 words (information)
- Microphone button added to V1 chat input bar (between text field and Send)

### On-Device LLM Intelligence
- Llama 3.2 1B Q4 (~700MB) as bidirectional translator via react-native-executorch
- PARSE mode: natural language --> structured intent JSON (route requests, POI queries, hazard reports, fuel queries, weather queries)
- FORMAT mode: database results --> natural language response (TTS-optimized, concise)
- Route intent parsing (same as V1 cloud, but local): "2hr coastal ride avoiding highways" --> PlanInput JSON
- Refinement parsing: "make it shorter", "add a stop at Big Sur" --> delta JSON
- Route description generation: route metadata --> "Coastal Cruiser" name + descriptive text
- Hazard report parsing: "gravel on this road" --> {type, subtype, coords}
- POI query parsing: "find gas within 20 miles" --> {category, radius, scope}
- Fuel range query parsing: "can I make it to Ojai?" --> {destination, query_type}
- Natural language search over saved routes: "my coastal rides from last fall" --> search filters

### Offline Data Layer
- Offline routing via Valhalla C++ engine (custom Kotlin/Swift TurboModule)
- Spatial POI search via SQLite/Spatialite with R-tree index (custom Kotlin/Swift TurboModule)
- Regional OSM map pack downloads (routing graph + POI database + rendering tiles)
- Local hazard report database (SQLite) with background sync to Convex when online
- Cached weather data from last sync (Open-Meteo via Convex)
- Fuel range calculation using bike profile + route elevation + distance (deterministic)

### Data & Model Management
- Model download: Wi-Fi only, background, resumable, with progress UI
- First-launch onboarding: "Voice Commands — Set Up Once" prompt with storage estimate
- Model management settings: version info, storage used, update check, remove, privacy controls
- Regional map pack selection and download (by state or metro area)
- Map pack storage management: individual download/delete per region
- Device capability detection at startup: full_offline | hybrid | cloud_only
- Graceful degradation: cloud fallback for devices that can't run the model

### Post-Ride Features
- AI-generated ride summary from route data, stops, duration, conditions
- One-tap approve/edit/discard pattern for journaling (near-automatic)
- Voice note addition to ride journal (on-device transcription)
- Hazard review from the ride (logged hazards shown with option to edit before sync)

## Out of Scope

| Feature | Disposition |
|---------|-------------|
| On-device model fine-tuning | V3. Requires on-device training infrastructure. |
| Multi-region simultaneous routing | V3. Single active region is sufficient. |
| Real-time traffic in offline mode | Impossible without data feed. Not feasible offline. |
| CarPlay / Android Auto integration | Separate certification effort. V3. |
| Continuous ambient listening (always-on wake word) | Battery impact too high (~15% drain). Button-press is primary. Wake word is optional advanced setting only. |
| Custom wake word training | V3. Standard wake word only for now. |
| Offline map tile rendering | Use MapLibre GL with .pmtiles for offline rendering. Already available, not custom work. |
| Route recording / GPS tracking | V2 scope from main PRD, not specific to on-device AI. |
| Group ride voice coordination | V3. Requires BLE mesh or similar. |
| On-device model pruning pipeline as user-facing feature | Development tooling only. Not user-facing. |
| TTS voice customization | Use system defaults. V3 for custom voices. |
| Multi-language support | English only for V2. Multilingual requires larger models. |
