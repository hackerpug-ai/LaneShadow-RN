---
title: "LLM-Enhanced Motorcycle Route Geocoding"
proposal_type: "technical-architecture"
status: "draft"
created: "2026-04-07"
author: "Research Team"
version: "1.0"
---

# LLM-Enhanced Motorcycle Route Geocoding

## Executive Summary

This proposal outlines a technical architecture for leveraging Large Language Models (LLMs) to suggest motorcycle riding routes that mapping software doesn't know about—specifically local roads, unnamed routes, and community-known scenic byways—while maintaining full compatibility with Google's geocoding and routing infrastructure.

**Key Innovation**: Use Claude's structured outputs to extract route waypoints from natural language descriptions, then apply a tiered geocoding strategy that gracefully falls back through multiple data sources to find coordinates for even the most obscure local roads.

**Projected Impact**: Enable riders to discover routes described in natural language ("take the dirt road past Miller's General Store, then north on County 9") and have them rendered as navigable routes on the map, unlocking local knowledge that doesn't exist in any mapping database.

---

## Problem Statement

### Current Limitations

1. **Mapping Software Blind Spots**: Google Maps and other routing APIs only know about roads that have been mapped and indexed. Local roads, unnamed scenic routes, and recently paved paths are invisible.

2. **Local Knowledge is Unstructured**: The best motorcycle roads are passed down through word-of-mouth, forum posts, and ride reports—all unstructured text that can't be directly geocoded.

3. **No Bridge Between Text and Maps**: When a rider describes a route in natural language, there's no automated way to convert that description into coordinates that mapping software can use.

### Opportunity

Motorcycle riders accumulate local knowledge about fun roads that don't appear in any database:
- "The dirt road past the old mill"
- "County Road 9 north of Springfield"
- "The scenic byway that runs along the river"

If we could bridge the gap between these descriptions and geocodable waypoints, we could unlock a massive repository of local knowledge.

---

## Proposed Solution

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INPUT LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  Natural Language: "Take Skyline Blvd south to the dirt road past   │
│  Miller's General Store, then head north on County Road 9 to the   │
│  scenic overlook"                                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LLM WAYPOINT EXTRACTION                          │
├─────────────────────────────────────────────────────────────────────┤
│  Claude API with Structured Outputs                                 │
│  • input_schema: User natural language route description            │
│  • output_schema: RouteWaypoint[] (guaranteed valid JSON)           │
│                                                                       │
│  Output Example:                                                     │
│  [                                                                   │
│    {                                                                 │
│      "name": "Skyline Boulevard",                                   │
│      "type": "named_road",                                          │
│      "description": "Primary scenic route south",                   │
│      "location_hint": "Skyline Blvd, San Mateo County"              │
│    },                                                                │
│    {                                                                 │
│      "name": "Miller's General Store",                              │
│      "type": "landmark",                                            │
│      "description": "Historic general store, landmark for turn",    │
│      "location_hint": "Near La Honda, CA"                           │
│    },                                                                │
│    {                                                                 │
│      "name": "County Road 9",                                       │
│      "type": "numbered_county_road",                                │
│      "description": "Northbound county road",                       │
│      "location_hint": "San Mateo County, CA"                        │
│    }                                                                 │
│  ]                                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     TIERED GEOCODING ENGINE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  TIER 1: Google Geocoding API (Primary)                             │
│  • Best for: Named roads, addresses, landmarks                      │
│  • Cost: $5 per 1000 requests after $200 free tier                  │
│  • Rate limit: 50 QPS                                               │
│  • Success rate: ~85% for named features                            │
│                                                                       │
│  TIER 2: OpenStreetMap/Nominatim (Fallback)                          │
│  • Best for: Unnamed roads, recent OSM contributions                │
│  • Cost: Free (requires attribution)                                │
│  • Rate limit: 1 QPS                                                │
│  • Success rate: ~10% additional coverage                           │
│                                                                       │
│  TIER 3: Reverse Geocoding Disambiguation                            │
│  • Best for: Relative positioning ("2 miles north of X")            │
│  • Method: Geocode anchor point → reverse-geocode surrounding area  │
│  • Success rate: ~3% additional coverage                            │
│                                                                       │
│  TIER 4: Crowdsourced Waypoint Database                              │
│  • Best for: Community-contributed local knowledge                  │
│  • Source: BestBikingRoads.com, MyRoute-app, user submissions       │
│  • Success rate: ~2% additional coverage                            │
│                                                                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      COORDINATE ASSEMBLY                            │
├─────────────────────────────────────────────────────────────────────┤
│  Input: RouteWaypoint[] + GeocodingResults[]                        │
│  Output:                                                           │
│  [                                                                   │
│    { lat: 37.4539, lng: -122.2341, source: "google", confidence: 0.98 }, │
│    { lat: 37.4412, lng: -122.2105, source: "nominatim", confidence: 0.85 }, │
│    { lat: 37.4287, lng: -122.1989, source: "user_db", confidence: 0.72 }   │
│  ]                                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GOOGLE ROUTES API                                │
├─────────────────────────────────────────────────────────────────────┤
│  • Travel mode: TWO_WHEELER (motorcycle-specific)                   │
│  • Interpolate between waypoints                                    │
│  • computeAlternativeRoutes: true (2-3 route variants)              │
│  • Combine with Kurviger API for curvature weighting                │
│                                                                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE RENDERING                                │
├─────────────────────────────────────────────────────────────────────┤
│  • Turn-by-turn directions with local roads                        │
│  • Route preview on map                                             │
│  • Weather overlays (wind, rain, temperature)                       │
│  • Save to user's route library                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technical Specification

### 1. LLM Waypoint Extraction (Convex Action)

#### Schema Definition

```typescript
// convex/models/route-waypoints.ts

import { v } from 'convex/values';

export const waypointTypeValidator = v.union(
  v.literal('named_road'),
  v.literal('numbered_county_road'),
  v.literal('landmark'),
  v.literal('intersection'),
  v.literal('relative_position'),
  v.literal('unnamed_road'),
);

export const routeWaypointValidator = v.object({
  name: v.string(),
  type: waypointTypeValidator,
  description: v.optional(v.string()),
  location_hint: v.string(),  // Human-readable location context
  confidence: v.optional(v.number()),  // LLM's confidence in this waypoint
  sequence: v.number(),  // Order in the route
});

export const routeWaypointsResponseValidator = v.object({
  waypoints: v.array(routeWaypointValidator),
  route_summary: v.string(),
  total_distance_estimate: v.optional(v.string()),
  estimated_duration: v.optional(v.string()),
});
```

#### Convex Action Implementation

```typescript
// convex/actions/route-extraction.ts

import { action } from './_generated/server';
import { v } from 'convex/values';
import { routeWaypointsResponseValidator } from '../models/route-waypoints';

export const extractRouteWaypoints = action({
  args: {
    userMessage: v.string(),
    conversationContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { systemPrompt, userPrompt } = buildExtractionPrompts(
      args.userMessage,
      args.conversationContext
    );

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [
          { role: 'user', content: userPrompt },
        ],
        system: systemPrompt,
        output_config: {
          format: {
            type: 'json_schema',
            schema: routeWaypointsResponseValidator,
          },
        },
      }),
    });

    const data = await response.json();
    const parsed = routeWaypointsResponseValidator.parse(data.content[0].text);

    return parsed;
  },
});

function buildExtractionPrompts(userMessage: string, context?: string) {
  return {
    systemPrompt: `You are a motorcycle route extraction expert. Your task is to extract route waypoints from natural language descriptions.

OUTPUT FORMAT (strict JSON schema):
{
  "waypoints": [
    {
      "name": "string - the road/landmark name",
      "type": "enum: named_road, numbered_county_road, landmark, intersection, relative_position, unnamed_road",
      "description": "optional - why this waypoint matters",
      "location_hint": "string - any location context (county, nearby town, state)",
      "confidence": "optional number 0-1 - how confident you are this exists",
      "sequence": "number - order in the route (0-indexed)"
    }
  ],
  "route_summary": "string - 2-3 sentence description of the route",
  "total_distance_estimate": "optional string - rough distance if inferable",
  "estimated_duration": "optional string - rough duration if inferable"
}

WAYPOINT TYPES:
- named_road: Roads with proper names (e.g., "Skyline Boulevard", "Pacific Coast Highway")
- numbered_county_road: County roads (e.g., "County Road 9", "Route 9")
- landmark: Businesses, structures, natural features (e.g., "Miller's General Store", "the old mill")
- intersection: Where roads meet (e.g., "intersection of 92 and 35")
- relative_position: Described relative to another location (e.g., "2 miles north of Springfield")
- unnamed_road: Described without a formal name (e.g., "the dirt road", "the scenic byway")

IMPORTANT:
- Preserve the order of waypoints as they appear in the route
- Include all location context provided (counties, nearby towns, landmarks)
- If a waypoint is described relative to another, extract both the anchor and the relative waypoint
- Set confidence lower for unnamed roads or obscure landmarks`,
    userPrompt: context
      ? `Context from our conversation: ${context}\n\nUser's route description: ${userMessage}`
      : `Extract route waypoints from this description: ${userMessage}`,
  };
}
```

### 2. Tiered Geocoding Engine (Convex Action)

```typescript
// convex/actions/geocoding.ts

import { action } from './_generated/server';
import { v } from 'convex/values';

export const geocodeWaypoints = action({
  args: {
    waypoints: v.array(v.object({
      name: v.string(),
      type: v.string(),
      description: v.optional(v.string()),
      location_hint: v.string(),
      confidence: v.optional(v.number()),
      sequence: v.number(),
    })),
    regionBias: v.optional(v.string()),  // e.g., "California, USA"
  },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.waypoints.map(async (waypoint) => {
        // Tier 1: Google Geocoding API
        const googleResult = await tryGoogleGeocoding(waypoint, args.regionBias);
        if (googleResult) {
          return { ...googleResult, source: 'google', tier: 1 };
        }

        // Tier 2: OpenStreetMap/Nominatim
        const nominatimResult = await tryNominatimGeocoding(waypoint, args.regionBias);
        if (nominatimResult) {
          return { ...nominatimResult, source: 'nominatim', tier: 2 };
        }

        // Tier 3: Reverse geocoding disambiguation
        const reverseResult = await tryReverseGeocodingDisambiguation(waypoint, args.regionBias);
        if (reverseResult) {
          return { ...reverseResult, source: 'reverse_geocode', tier: 3 };
        }

        // Tier 4: Crowdsourced waypoint database
        const crowdResult = await tryCrowdsourcedDatabase(waypoint);
        if (crowdResult) {
          return { ...crowdResult, source: 'crowdsourced', tier: 4 };
        }

        // All tiers failed
        return {
          waypoint_name: waypoint.name,
          lat: null,
          lng: null,
          source: 'failed',
          tier: 0,
          error: 'Unable to geocode waypoint',
        };
      })
    );

    return results;
  },
});

// Tier 1: Google Geocoding API
async function tryGoogleGeocoding(waypoint: any, regionBias?: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const query = buildGeocodingQuery(waypoint, regionBias);

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
  );

  const data = await response.json();

  if (data.status === 'OK' && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return {
      waypoint_name: waypoint.name,
      lat: location.lat,
      lng: location.lng,
      confidence: data.results[0].geometry.location_type,
    };
  }

  return null;
}

// Tier 2: OpenStreetMap/Nominatim
async function tryNominatimGeocoding(waypoint: any, regionBias?: string) {
  const query = buildGeocodingQuery(waypoint, regionBias);

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
    {
      headers: {
        'User-Agent': 'LaneShadow-Motorcycle-Route-Planner/1.0',
      },
    }
  );

  const data = await response.json();

  if (data.length > 0) {
    return {
      waypoint_name: waypoint.name,
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      confidence: parseFloat(data[0].importance),
    };
  }

  return null;
}

// Tier 3: Reverse geocoding disambiguation
async function tryReverseGeocodingDisambiguation(waypoint: any, regionBias?: string) {
  // For relative positioning ("2 miles north of Springfield")
  // 1. Geocode the anchor point
  // 2. Use reverse geocoding to find nearby features

  const anchorMatch = waypoint.description?.match(/(\d+)\s*miles?\s*(north|south|east|west)\s+of\s+(.+)/i);

  if (!anchorMatch) return null;

  const [, distance, direction, anchor] = anchorMatch;

  // Geocode the anchor
  const anchorResult = await tryGoogleGeocoding({ name: anchor, location_hint: waypoint.location_hint }, regionBias);
  if (!anchorResult) return null;

  // Calculate offset based on direction and distance
  const offset = calculateBearingOffset(anchorResult.lat, anchorResult.lng, direction, parseFloat(distance));

  return {
    waypoint_name: waypoint.name,
    lat: offset.lat,
    lng: offset.lng,
    confidence: 0.6,  // Lower confidence for calculated positions
  };
}

// Tier 4: Crowdsourced waypoint database
async function tryCrowdsourcedDatabase(waypoint: any) {
  // Query internal database of user-contributed waypoints
  // This would be a Convex query in production

  // For now, return null (this tier is a future enhancement)
  return null;
}

function buildGeocodingQuery(waypoint: any, regionBias?: string): string {
  let query = waypoint.name;

  if (waypoint.location_hint) {
    query += `, ${waypoint.location_hint}`;
  }

  if (regionBias) {
    query += `, ${regionBias}`;
  }

  return query;
}

function calculateBearingOffset(lat: number, lng: number, direction: string, distanceMiles: number) {
  // Convert distance to degrees (rough approximation)
  const degreesPerMile = 1 / 69;  // 1 degree ≈ 69 miles
  const offset = distanceMiles * degreesPerMile;

  switch (direction.toLowerCase()) {
    case 'north':
      return { lat: lat + offset, lng };
    case 'south':
      return { lat: lat - offset, lng };
    case 'east':
      return { lat, lng: lng + offset };
    case 'west':
      return { lat, lng: lng - offset };
    default:
      return { lat, lng };
  }
}
```

### 3. Database Schema (Convex)

#### Waypoint Cache Table

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ... existing tables

  waypointCache: defineTable({
    waypoint_name: v.string(),
    normalized_name: v.string(),  // Lowercase, for deduplication
    location_hint: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    source: v.string(),  // 'google', 'nominatim', 'crowdsourced', etc.
    confidence: v.number(),
    tier: v.number(),  // Which geocoding tier succeeded
    geocoded_at: v.number(),
    verified_count: v.number(),  // How many times this has been used successfully
  })
    .index('by_normalized_name', ['normalized_name'])
    .index('by_location', ['lat', 'lng']),

  crowdsourcedWaypoints: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    type: v.string(),
    submitted_by: v.string(),  // Clerk user ID
    submitted_at: v.number(),
    verified: v.boolean(),
    usage_count: v.number(),
    upvotes: v.number(),
    downvotes: v.number(),
  })
    .index('by_type', ['type'])
    .index('by_submitter', ['submitted_by']),
});
```

### 4. Integration with Existing LaneShadow Architecture

```typescript
// convex/actions/plan-route-llm-first.ts

import { action } from './_generated/server';
import { v } from 'convex/values';
import { extractRouteWaypoints } from './route-extraction';
import { geocodeWaypoints } from './geocoding';
import { api } from './_generated';

export const planRouteFromNaturalLanguage = action({
  args: {
    userMessage: v.string(),
    conversationId: v.optional(v.id('conversations')),
    departureTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Step 1: Extract waypoints using LLM
    const extraction = await extractRouteWaypoints(ctx, {
      userMessage: args.userMessage,
      conversationContext: args.conversationId
        ? await getConversationContext(ctx, args.conversationId)
        : undefined,
    });

    // Step 2: Geocode waypoints with tiered fallback
    const geocodedWaypoints = await geocodeWaypoints(ctx, {
      waypoints: extraction.waypoints,
      regionBias: inferRegionBias(extraction.waypoints),
    });

    // Step 3: Filter out failed geocodes
    const successfulWaypoints = geocodedWaypoints.filter(w => w.lat !== null);

    if (successfulWaypoints.length < 2) {
      throw new Error('Insufficient waypoints geocoded. Try being more specific about locations.');
    }

    // Step 4: Build route via Google Routes API
    const routeOptions = await buildRoutesFromWaypoints(ctx, {
      waypoints: successfulWaypoints,
      departureTime: args.departureTime || Date.now(),
    });

    // Step 5: Probe conditions and build response
    const enrichedRoutes = await Promise.all(
      routeOptions.map(route => enrichRouteWithConditions(ctx, route))
    );

    return {
      routes: enrichedRoutes,
      extraction_summary: extraction.route_summary,
      geocoding_summary: {
        total: geocodedWaypoints.length,
        successful: successfulWaypoints.length,
        by_tier: {
          google: geocodedWaypoints.filter(w => w.source === 'google').length,
          nominatim: geocodedWaypoints.filter(w => w.source === 'nominatim').length,
          reverse: geocodedWaypoints.filter(w => w.source === 'reverse_geocode').length,
          crowdsourced: geocodedWaypoints.filter(w => w.source === 'crowdsourced').length,
          failed: geocodedWaypoints.filter(w => w.source === 'failed').length,
        },
      },
    };
  },
});
```

---

## Implementation Roadmap

### Phase 1: Foundation (Sprint 1-2)

**Goal**: Basic LLM waypoint extraction + Google geocoding only

- [ ] Create `route-waypoints.ts` model with validators
- [ ] Implement `extractRouteWaypoints` action with Claude API
- [ ] Implement `tryGoogleGeocoding` tier 1
- [ ] Create `waypointCache` table
- [ ] Build basic route from geocoded waypoints using Google Routes API
- [ ] Manual testing with known route descriptions

**Success Criteria**:
- Can extract waypoints from simple descriptions like "Take Highway 1 south to Santa Cruz"
- Google geocoding finds coordinates for named roads and landmarks
- Route renders on map with turn-by-turn directions

### Phase 2: Tiered Geocoding (Sprint 3)

**Goal**: Add fallback tiers for unmapped roads

- [ ] Implement `tryNominatimGeocoding` tier 2
- [ ] Implement `tryReverseGeocodingDisambiguation` tier 3
- [ ] Build crowdsourced waypoint database schema
- [ ] Add geocoding summary to route response
- [ ] Cache successful geocodes in `waypointCache`
- [ ] Unit tests for each geocoding tier

**Success Criteria**:
- Unnamed roads are found via OSM/Nominatim
- Relative positioning ("2 miles north of X") works via reverse geocoding
- Geocoding success rate improves from 85% to ~95%

### Phase 3: Community Integration (Sprint 4)

**Goal**: Integrate crowdsourced GPX databases

- [ ] Build scraper/importer for BestBikingRoads.com
- [ ] Build scraper/importer for MyRoute-app public routes
- [ ] Implement `tryCrowdsourcedDatabase` tier 4
- [ ] Add waypoint contribution UI
- [ ] Implement upvote/downvote system for waypoint quality
- [ ] Add "local knowledge" badges to routes using crowdsourced waypoints

**Success Criteria**:
- Community routes are queryable via LLM extraction
- Users can contribute waypoints with GPS coordinates
- Quality scoring system prevents spam/low-quality data

### Phase 4: Optimization & Polish (Sprint 5)

**Goal**: Performance, cost optimization, and UX refinement

- [ ] Implement batch geocoding for parallel processing
- [ ] Add intelligent caching (TTL based on source reliability)
- [ ] Build cost monitoring dashboard (Google API usage)
- [ ] Add progressive geocoding (start with Google, fill gaps asynchronously)
- [ ] UX improvements for failed geocodes (ask user for clarification)
- [ ] A/B testing against baseline route quality

**Success Criteria**:
- Average route generation time < 10 seconds
- Google geocoding costs < $0.05 per route
- 90%+ user satisfaction with route quality

---

## Cost Analysis

### Google Maps API Usage

| Operation | Cost per 1000 | Est. per Route | Monthly Est (100 routes) |
|-----------|---------------|----------------|--------------------------|
| Geocoding | $5.00 | $0.05 | $5.00 |
| Routes API | $5.00 | $0.05 | $5.00 |
| **Total** | | **$0.10** | **$10.00** |

**Optimization Strategies**:
1. **Aggressive caching**: Successful geocodes cached indefinitely (roads don't move)
2. **Batch geocoding**: Process all waypoints in parallel to reduce latency
3. **Tier prioritization**: Only use Google for high-confidence waypoints, fallback to free tiers
4. **User-provided coordinates**: Allow users to drop pins for unmapped roads

### Infrastructure Costs

| Service | Monthly Cost |
|---------|--------------|
| Convex hosting (included in tier) | $0 |
| Claude API (Opus 4.6) | ~$0.10 per route (3K input + 1K output tokens) |
| Google Maps (after $200 credit) | ~$10 per 100 routes |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Google geocoding fails on obscure roads | HIGH | MEDIUM | Tiered fallback strategy (Nominatim, reverse geocode, crowdsourced) |
| LLM hallucinates non-existent roads | MEDIUM | HIGH | Confidence scoring, user verification loop, community validation |
| Cost overruns on Google API | LOW | MEDIUM | Caching, batch processing, cost monitoring dashboard |
| Crowdsourced data quality issues | MEDIUM | MEDIUM | Upvote/downvote system, verification requirements, karma-based submission limits |
| Performance degradation with many waypoints | LOW | MEDIUM | Progressive geocoding, background processing for low-priority waypoints |

---

## Success Metrics

### Technical Metrics
- **Geocoding success rate**: Target > 95% (vs 85% with Google-only)
- **Route generation time**: Target < 10 seconds (p95)
- **LLM extraction accuracy**: Target > 90% waypoint precision (manual validation)
- **Cache hit rate**: Target > 70% for repeat waypoints

### User Experience Metrics
- **Route satisfaction**: Target > 4.0/5.0 stars
- **Failed route rate**: Target < 5% (routes that cannot be generated)
- **User contribution rate**: Target > 10% of users submit at least one waypoint
- **Local road discovery**: Track % of routes using at least one crowdsourced waypoint

### Business Metrics
- **Cost per route**: Target < $0.15 (all-in including LLM + Google)
- **Monthly active users**: Monitor growth after feature launch
- **Route saves per user**: Track engagement with generated routes

---

## Open Questions & Future Work

### Technical Questions
1. **GPX route matching**: How to semantically match a user's description to existing GPX routes in community databases?
2. **LLM fine-tuning**: Can we fine-tune a smaller model on motorcycle route descriptions to reduce Claude API costs?
3. **Satellite imagery**: Can we use satellite/AI to discover unnamed roads that don't appear in any database?

### Product Questions
1. **User verification**: How do we verify that a suggested route is actually rideable and safe?
2. **Route ratings**: Should users be able to rate routes generated from natural language descriptions?
3. **Local knowledge attribution**: How do we credit users who contribute valuable waypoints?

### Research Questions
1. **Accuracy benchmarking**: How does LLM-extracted route quality compare to human-curated routes?
2. **Regional bias**: Does geocoding success rate vary significantly by region/country?
3. **Road surface detection**: Can we infer road surface (paved vs dirt) from descriptions and community data?

---

## Appendix: Example Workflows

### Example 1: Named Roads

**User Input**: "Take Highway 1 south from San Francisco to Santa Cruz, then cut over on Highway 17 to Los Gatos"

**LLM Extraction**:
```json
{
  "waypoints": [
    { "name": "San Francisco", "type": "landmark", "sequence": 0 },
    { "name": "Highway 1", "type": "named_road", "sequence": 1 },
    { "name": "Santa Cruz", "type": "landmark", "sequence": 2 },
    { "name": "Highway 17", "type": "named_road", "sequence": 3 },
    { "name": "Los Gatos", "type": "landmark", "sequence": 4 }
  ],
  "route_summary": "Scenic coastal route on Highway 1, then mountain crossing on Highway 17"
}
```

**Geocoding**: All waypoints geocode successfully via Google (Tier 1)

**Result**: 3 route variants rendered on map with weather overlays

### Example 2: Local Knowledge Roads

**User Input**: "Take the dirt road past Miller's General Store in La Honda, then head north on County Road 9 to the scenic overlook"

**LLM Extraction**:
```json
{
  "waypoints": [
    { "name": "Miller's General Store", "type": "landmark", "description": "Historic store, landmark for turn", "sequence": 0 },
    { "name": "the dirt road", "type": "unnamed_road", "sequence": 1 },
    { "name": "County Road 9", "type": "numbered_county_road", "sequence": 2 },
    { "name": "scenic overlook", "type": "landmark", "sequence": 3 }
  ],
  "route_summary": "Local dirt road route through La Honda area"
}
```

**Geocoding**:
- Miller's General Store → Google geocoding succeeds
- "the dirt road" → Google fails, Nominatim succeeds (Tier 2)
- County Road 9 → Google geocoding succeeds
- "scenic overlook" → Reverse geocoding from County Road 9 finds nearby overlook (Tier 3)

**Result**: Route rendered with warning that "dirt road" segment may not be accurately mapped

### Example 3: Crowdsourced Route

**User Input**: "Show me the route that locals call 'The Dragon's Tail' through the Santa Cruz mountains"

**LLM Extraction**:
```json
{
  "waypoints": [
    { "name": "The Dragon's Tail", "type": "unnamed_road", "description": "Local name for a scenic route", "sequence": 0 }
  ],
  "route_summary": "Locally-known scenic route in Santa Cruz mountains"
}
```

**Geocoding**:
- "The Dragon's Tail" → Google fails, Nominatim fails, Reverse geocoding fails
- Crowdsourced waypoint database finds match (Tier 4)
- Returns pre-curated GPX track with 15 waypoints

**Result**: Full route rendered from community data with "local knowledge" badge

---

## Related Documentation

- [Deep Research: LLM Motorcycle Routes Geocoding Strategy](https://holocron.app/doc/js7errnbe9y5ayvzwth444yp2584cx0j)
- [Scenic Motorcycle Route Generation — Strategy Comparison](https://holocron.app/doc/js7dzezp61k3rd5ane66jk9n11845r6j)
- [LaneShadow PRD v1.0](/.spec/PRD.md)
- [Technical Backend Architecture](/.spec/prds/v1/07-technical-backend.md)
