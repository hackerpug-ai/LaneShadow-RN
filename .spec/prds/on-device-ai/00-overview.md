---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-06
prd_version: 1.0.0
---

# On-Device AI: Local LLM + Voice Interface for Offline Rider Intelligence

## Product Description

On-Device AI adds a voice-first, fully offline AI layer to LaneShadow. Motorcycle riders get a hands-free voice interface that works in mountains, canyons, and remote backroads with zero cell signal. The system runs entirely on the rider's phone — no cloud, no API calls, no data leaving the device.

## Problem Statement

Motorcycle riders face a unique set of constraints that no existing navigation or planning app addresses:

1. **No screen interaction while riding.** Riders wear gloves, helmets, and are focused on the road. The phone screen is effectively invisible and untouchable during a ride.
2. **No signal where riders ride.** Mountain passes, canyons, national forests, and rural backroads — the roads motorcyclists love — are precisely the areas with no cell coverage.
3. **Cloud-dependent AI becomes a brick.** LaneShadow's V1 conversational planning requires internet for every interaction. When signal drops mid-ride, the AI disappears.
4. **Real-time information needs don't stop.** Fuel range, nearby gas stations, road hazards, weather ahead, points of interest — riders need answers to these questions *during* the ride, not before or after.

## Solution

Add an on-device AI layer that acts as a **bidirectional natural language translator** between the rider and local databases:

```
[Voice / Text] --> [On-Device LLM: PARSE] --> Structured Query
                                                    |
                                            [Local Databases]
                                            (OSM, POI, Hazards,
                                             Weather Cache, Routes)
                                                    |
[Audio / Text] <-- [On-Device LLM: FORMAT] <-- Structured Result
```

## The LLM Contract: What It IS and ISN'T

This is the most important section of this PRD. Every design decision flows from this contract.

### The LLM IS:

| Role | Description | Example |
|------|-------------|---------|
| **Intent parser** | Converts natural language to structured JSON | "Find gas within 20 miles" --> `{intent: "poi_search", category: "fuel", radius: "20mi"}` |
| **Response formatter** | Converts database results to natural language | `{name: "Shell", dist: "2.1mi"}` --> "Shell station, 2 miles ahead" |
| **Domain vocabulary engine** | Understands geographic, motorcycle, weather, and road terminology | "twisties", "switchbacks", "crosswind", "gravel", "washboard" |

### The LLM is NOT:

| Anti-pattern | Why | What does it instead |
|-------------|-----|---------------------|
| A knowledge source | Model weights are frozen at training time; the world changes | Local databases have current data (OSM, synced hazards, cached weather) |
| A reasoning engine | Multi-step logic is unreliable in small models | Deterministic code handles all calculations (fuel range, distance, route scoring) |
| A road conditions oracle | Conditions change by the hour | Rider-reported hazard database + cached weather from last sync |
| A POI directory | Millions of locations can't fit in model weights | Spatialite spatial database with R-tree index built from OSM data |
| A navigation computer | Pathfinding is a graph algorithm, not language generation | Valhalla offline routing engine computes routes from OSM graph data |

### The mental model

The LLM is a **bilingual receptionist**. A guest speaks English; the receptionist translates to the system's language (structured queries). The system returns data; the receptionist translates back to English. The receptionist never answers from memory — she looks up every answer in the system.

## Key Differentiators

1. **Voice-first during ride** — No competitor offers hands-free AI for motorcyclists that works offline
2. **Fully offline** — Not degraded, not limited — fully functional without signal
3. **Privacy by architecture** — Voice and ride data never leave the device (not just a policy — a technical guarantee)
4. **Bidirectional translator pattern** — Enables a small, fast, cheap-to-run model instead of a massive general-purpose one
