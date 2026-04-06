---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-06
prd_version: 1.0.0
---

# Roles

## Primary Role

| Role | Description |
|------|-------------|
| **Rider** | A motorcycle rider who uses LaneShadow to plan and navigate scenic routes. During a ride, the Rider cannot safely interact with a screen — voice is the only interface. |

## Personas

| Persona | Archetype | Signal Availability | Offline Criticality | Setup Tolerance | Audio Response Length |
|---------|-----------|--------------------|--------------------|-----------------|---------------------|
| **Marcus** (ADV Tourer) | Multi-day adventure touring, remote backcountry | Frequently none (2-4hr dead zones) | Mission-critical | High (will configure) | Medium (10s OK) |
| **Diane** (Weekend Scenic) | 2-4hr weekend rides, spontaneous, scenic priority | Mostly connected, 20-40min canyon gaps | Important | Moderate | Medium |
| **Rafi** (Privacy-First) | Daily commuter + weekend touring, developer | Always connected but prefers local | Philosophical (privacy, not signal) | High (wants control) | Short |
| **Carol** (Sport Rider) | Fast-paced sport touring, low admin tolerance | Usually connected | Nice-to-have | Very low (zero friction) | Very short (4s max) |

### Key Persona Insights

1. **Audio response length must be tiered** — Carol needs 4 seconds max; Marcus can handle 10. Response verbosity adapts to command type and riding context.
2. **Setup friction is the #1 barrier for casual riders** — Model download must be automatic on first launch. Advanced controls exist but are not surfaced by default.
3. **On-device processing badge is a product feature** — For privacy-conscious riders (Rafi), the on-device indicator is a trust signal that affects adoption.
4. **Offline is mission-critical for ADV riders** — Not optional, not degraded. Full offline voice + routing must work without any signal whatsoever.
5. **Post-ride journaling must be near-automatic** — AI-generated draft + one-tap approve. If it requires effort, no persona will use it.
6. **Single-command pattern is universal** — All four personas want command --> response, not a conversation during the ride.

## System Role

| Role | Description |
|------|-------------|
| **System** | The on-device AI pipeline: Whisper STT, LLM translator, local databases (OSM routing, POI spatial index, hazard DB, weather cache), TTS output. Operates fully offline once models and map packs are downloaded. |
