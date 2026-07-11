---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Architecture Diagram

```
 OPERATOR (npx convex run / driver scripts, serial)
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │ scripts/hygiene-curated-routes.ts        scripts/reconstruct-curated-geometry.ts│
 │ scripts/classify-curated-routes.ts       scripts/geometry-coverage-report.ts    │
 │ scripts/geometry-couch-sample.ts (renders Mapbox PNGs LOCALLY → .tmp/GEO/)      │
 └───────────────┬───────────────────────────────────────────────────────────────┘
                 │ npx convex run  (bounded batch per call; cursor resume;
                 │  lever-2 --all REFUSED until couchGateStatus = pass)
                 ▼
 CONVEX INTERNAL FUNCTIONS  (operator-only, deployment-env keys)
 ┌────────────────────────────────────────────────────────────────────────────┐
 │  default runtime                     │  'use node' actions (external calls)  │
 │  ────────────────                    │  ──────────────────                   │
 │  curatedGeometryHygiene   (HYG)      │  curatedGeometryReconstruct (lever 2) │
 │  curatedGeometryPromote   (lever 1)  │  curatedGeometryReroute     (lever 3) │
 │  curatedGeometryGate [PURE gate] ◄───┼── imported ──► curatedGeometryClassify│
 │  curatedGeometry (data-access)       │                                       │
 │  curatedGeometryReview (founder ops) │      │ LLM anchors  │ geocode │ route │
 └──────────────┬───────────────────────┴──────┼──────────────┼─────────┼──────┘
                │ persist (deterministic,       ▼              ▼         ▼
                │  atomic route+side-table)  ┌────────────┐ ┌──────────┐ ┌──────────┐
                │                            │ LLM tiers  │ │ Google   │ │ Google   │
                │                            │ geometry:  │ │ Geocoding│ │ Routes   │
                │                            │  Anthropic │ │ API      │ │ compute  │
                │                            │ classifier:│ └──────────┘ │ Routes   │
                │                            │  x-provider│              └──────────┘
                │                            │  (Mastra)  │
                │                            └────────────┘
                ▼
 TABLES
 ┌───────────────────────────────┐        ┌───────────────────────────────────────┐
 │ curated_routes                │ 1───1  │ curated_route_geometry (side table)    │
 │  geometryStatus / Provenance  │◄──────►│  value/segments + verification{ratio,  │
 │  riderReady (INDEXED)         │ routeId│   verdict,attempts,anchorCount} +      │
 │  rideWorthiness / retiredAt   │        │   provenance + anchors[]               │
 │  duplicateOf / quarantine     │        └───────────────────────────────────────┘
 │  by_riderReady_and_score      │
 │  by_geometry_status           │
 └──────────┬────────────────────┘
            │ GATED READ PATH (riderReady=true only; retired/shadow/quarantine excluded;
            │  saved-route detail reachability preserved)
            ▼
 PUBLIC (Clerk-gated)                      RN APP SURFACES
 ┌────────────────────────────┐           ┌────────────────────────────────────────┐
 │ listCuratedRoutes          │──────────►│ discovery pills/pins/carousel/chat cards│
 │ getCuratedRouteDetail      │           │ curated-route/[id] detail + provenance  │
 │ discoverCuratedRoutes tool │           │  caption; thin region → HONEST ABSENCE  │
 └────────────────────────────┘           │  (labeled fallback, no fabricated 0mi)  │
                                          └────────────────────────────────────────┘
```

## Conversation path (AGT, v3.0.1)

```
 RN CHAT (Route Plan View)                                EVAL HARNESS (repo, not Convex)
 ┌───────────────────────────┐                            ┌─────────────────────────────────┐
 │ chat-input → sendMessage  │                            │ scripts/agent-evals/             │
 └─────────────┬─────────────┘                            │  fixtures/*.transcript.json      │
               │ action(sessionId, content, currentLoc)   │  (SLC/Ogden = canonical)         │
               ▼                                          │  graders: tool-sel · args ·      │
 CONVEX 'use node' ACTION — sendMessage.ts (ENTRY UNCHANGED)  option-count · distance-echo    │
 ┌────────────────────────────────────────────────────────┤  + LLM-judge (comfort labels)    │
 │ DETERMINISTIC WRAP: requireIdentity · persist rider msg │  └── taps the SAME agent with a  │
 │  · load history · rate/budget checks                    │      MockLanguageModel at the    │
 │            ▼                                            │      model seam; tools/queries/  │
 │  getRideAgent().stream({memory:{thread:sessionId,       │      gates run REAL              │
 │                                 resource:clerkUserId}}) └─────────────────────────────────┤
 │  ┌────────────── MASTRA (module singleton — STATELESS by contract) ───────────────────┐  │
 │  │ Agent 'ride-agent'  ·  model ← getOrchestratorModel() [tier map → router string]    │  │
 │  │ system prompt vN (prompts/orchestrator.v1.ts; dynamic ctx appended per turn)        │  │
 │  │ budgetTracker(gate) ─wraps─ loop (maxSteps 8–12) ─wraps─ loopDetector(3)            │  │
 │  │ memory ⇄ lib/mastraConvexStore.ts ⇄ planning_sessions(.agentMemory)/session_messages│  │
 │  └──────┬──────────────────────────────────────────────────────────────────────────────┘  │
 │         │ tool registry (createTool: Zod in/out validated; errors-as-data)                 │
 │         ▼                                                                                  │
 │  searchCuratedRoutes ─► listCuratedRoutes (SURF gate: riderReady-only; distanceMi server)  │
 │  geocodePlace ────────► geocodingProvider (Google, session-biased; no gazetteer)           │
 │  planRoute ───────────► planRideOrchestrator (sketch→compile→weather; custom fallback)     │
 │  getRouteWeather ─────► weatherProvider     getUserFavorites ─► favorite_roads/saved_routes│
 │  searchAlongRoute/searchNearby ─► placesProvider     webSearch ─► web                      │
 │  enrichRoute ─────────► low-tier labeling (Mastra model layer)                             │
 │         │ reply + cards (≤3 options — deterministic cap at assembly)                       │
 │         ▼ persist: session_messages (+promptVersion/model/tier/traceId)                    │
 │         └────► TELEMETRY: Observability → OTLP exporter ───────────────────────────────────┼─► LangSmith
 └────────────────────────────────────────────────────────────────────────────────────────── ┘   (turn/model/tool spans;
                                                                                                    promptVersion stamped)
```
