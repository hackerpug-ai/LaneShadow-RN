---
title: "LLM Geocoding Integration Plan"
proposal_type: "integration-architecture"
status: "draft"
created: "2026-04-07"
author: "Research Team"
version: "1.0"
related_proposal: "llm-motorcycle-route-geocoding"
---

# LLM Geocoding Integration with Existing Routing Architecture

## Executive Summary

This document outlines how to integrate the LLM-enhanced geocoding strategy into LaneShadow's existing **Routing Sub-Agent** architecture. The integration is minimal and surgical: enhance the `geocode` tool with tiered fallback while preserving all existing workflows (PATH A: LLM sketches, PATH B: deterministic fallback).

**Key Insight**: The existing architecture already has a `geocode` tool that the Routing Sub-Agent calls. We simply enhance this tool to support the 4-tier geocoding strategy, enabling the agent to resolve waypoints that Google doesn't know about.

---

## Current Architecture Analysis

### Existing Routing Flow

```
Routing Sub-Agent (Claude Sonnet)
  Tools: geocode, createRouteSketch, compileSketch, planRoute

TWO PATHS:

PATH A: Sketch (LLM-authored)          PATH B: planRoute
───────────────────────────            (deterministic fallback)

1. geocode("Santa Cruz")
   → {lat: 36.97, lng: -122.03}

2. createRouteSketch({...})
   → stored in pendingSketches

3. compileSketch({start, end, sketch})
   → enters runCompileSketch
```

### Current Geocoding Implementation

**Location**: `routingProvider.ts:240-306` (routeSegment)

```typescript
// Current implementation (simplified)
async function resolveWaypointName(name: string, anchorPoints: Map<string, Point>): Promise<Point> {
  // 1. Check anchorPoints for lat/lng
  // 2. If missing: GEOCODE with 50km bias ← 🐛 BUG #1
  //    - Single Google geocoding call
  //    - No fallback if Google fails
  //    - No caching
}
```

**Identified Issues**:
1. **Single-source geocoding**: Only uses Google API
2. **No fallback**: Fails silently or throws on unmapped roads
3. **No caching**: Re-geocodes same waypoints repeatedly
4. **No community data**: Can't access crowdsourced local knowledge

---

## Proposed Integration

### Strategy: Enhance the `geocode` Tool

Instead of creating new workflows, we enhance the existing `geocode` tool to use **tiered geocoding**. This is a drop-in replacement that works with both PATH A and PATH B.

### New Geocoding Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  ENHANCED geocode TOOL (drop-in replacement)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input: name: string, bias?: Point                             │
│  Output: { lat, lng, source, confidence }                      │
│                                                                 │
│  TIER 1: waypointCache (Convex DB)                              │
│  ├─ Check if waypoint was geocoded before                      │
│  └─ Return cached coordinates if found                         │
│                                                                 │
│  TIER 2: Google Geocoding API                                   │
│  ├─ Primary geocoding service                                  │
│  ├─ Use bias point for regional context                        │
│  └─ Cache result on success                                    │
│                                                                 │
│  TIER 3: OpenStreetMap/Nominatim                                │
│  ├─ Fallback for unmapped roads                                │
│  ├─ 1 QPS rate limit (sequential processing)                   │
│  └─ Cache result on success                                    │
│                                                                 │
│  TIER 4: Crowdsourced Waypoint Database                         │
│  ├─ User-contributed local knowledge                           │
│  ├─ Semantic search on waypoint descriptions                   │
│  └─ Return best match with confidence score                    │
│                                                                 │
│  On all tiers fail: throw GeocodingError with retry hint       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Database Schema (Convex)

#### 1.1 Add waypointCache Table

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ... existing tables

  waypointCache: defineTable({
    // Input signature (for deduplication)
    name: v.string(),
    name_normalized: v.string(),  // Lowercase, trimmed

    // Regional bias used in geocoding
    bias_lat: v.optional(v.number()),
    bias_lng: v.optional(v.number()),

    // Geocoding result
    lat: v.number(),
    lng: v.number(),

    // Metadata
    source: v.string(),  // 'google', 'nominatim', 'crowdsourced'
    confidence: v.number(),  // 0-1
    geocoded_at: v.number(),

    // Usage tracking
    hit_count: v.number(),  // How many times this cache entry has been used
    last_used_at: v.number(),

    // Verification
    verified: v.optional(v.boolean()),  // Has this been confirmed by a human?
  })
    .index('by_name_normalized', ['name_normalized'])
    .index('by_location', ['lat', 'lng'])
    .index('by_source', ['source']),

  crowdsourcedWaypoints: defineTable({
    // User-submitted waypoints
    name: v.string(),
    name_normalized: v.string(),
    description: v.optional(v.string()),

    // Location
    lat: v.number(),
    lng: v.number(),

    // Categorization
    type: v.string(),  // 'unnamed_road', 'landmark', 'local_name'
    tags: v.optional(v.array(v.string())),

    // Provenance
    submitted_by: v.id('users'),  // Clerk user ID
    submitted_at: v.number(),

    // Community validation
    verified: v.boolean(),  // Has this been verified?
    verification_count: v.number(),  // How many users confirm this exists
    upvotes: v.number(),
    downvotes: v.number(),
    usage_count: v.number(),  // How many routes use this waypoint

    // Regional context
    region_hint: v.optional(v.string()),  // "San Mateo County, CA"
    nearby_towns: v.optional(v.array(v.string())),
  })
    .index('by_name_normalized', ['name_normalized'])
    .index('by_type', ['type'])
    .index('by_submitter', ['submitted_by'])
    .index('by_location', ['lat', 'lng']),
});
```

#### 1.2 Create Geocoding Models

```typescript
// convex/models/geocoding.ts

import { v } from 'convex/values';

export const geocodingResultValidator = v.object({
  lat: v.number(),
  lng: v.number(),
  source: v.string(),
  confidence: v.number(),
  cached: v.optional(v.boolean()),  // Was this served from cache?
});

export const geocodingErrorValidator = v.object({
  error: v.string(),
  retry_hint: v.optional(v.string()),  // Suggestion for retry
  attempted_tiers: v.array(v.string()),  // Which tiers were tried
});
```

### Phase 2: Enhanced Geocoding Tool (Convex Action)

#### 2.1 Tiered Geocoding Action

```typescript
// convex/actions/geocode.ts

import { action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated';

export const geocodeWaypoint = action({
  args: {
    name: v.string(),
    bias_lat: v.optional(v.number()),
    bias_lng: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { name, bias_lat, bias_lng } = args;

    // Normalize name for caching
    const name_normalized = normalizeName(name);

    // TIER 1: Check cache
    const cached = await ctx.runQuery(api.geocoding.getCachedWaypoint, {
      name_normalized,
      bias_lat,
      bias_lng,
    });

    if (cached) {
      // Update cache hit tracking
      await ctx.runMutation(api.geocoding.updateCacheHit, {
        id: cached._id,
      });

      return {
        lat: cached.lat,
        lng: cached.lng,
        source: cached.source,
        confidence: cached.confidence,
        cached: true,
      };
    }

    // TIER 2: Google Geocoding API
    const googleResult = await tryGoogleGeocoding(name, bias_lat, bias_lng);

    if (googleResult) {
      // Cache the result
      await ctx.runMutation(api.geocoding.storeGeocodingResult, {
        name,
        name_normalized,
        lat: googleResult.lat,
        lng: googleResult.lng,
        source: 'google',
        confidence: googleResult.confidence,
        bias_lat,
        bias_lng,
      });

      return {
        ...googleResult,
        cached: false,
      };
    }

    // TIER 3: OpenStreetMap/Nominatim
    const nominatimResult = await tryNominatimGeocoding(name, bias_lat, bias_lng);

    if (nominatimResult) {
      await ctx.runMutation(api.geocoding.storeGeocodingResult, {
        name,
        name_normalized,
        lat: nominatimResult.lat,
        lng: nominatimResult.lng,
        source: 'nominatim',
        confidence: nominatimResult.confidence,
        bias_lat,
        bias_lng,
      });

      return {
        ...nominatimResult,
        cached: false,
      };
    }

    // TIER 4: Crowdsourced waypoint database
    const crowdResult = await ctx.runQuery(api.geocoding.searchCrowdsourcedWaypoints, {
      name_normalized,
      bias_lat,
      bias_lng,
    });

    if (crowdResult) {
      return {
        lat: crowdResult.lat,
        lng: crowdResult.lng,
        source: 'crowdsourced',
        confidence: crowdResult.verification_count / 10,  // 0-1 based on verifications
        cached: false,
      };
    }

    // All tiers failed
    throw new Error(
      `Geocoding failed for "${name}". ` +
      `Tried: google, nominatim, crowdsourced. ` +
      `Suggestion: Try being more specific or provide nearby landmarks.`
    );
  },
});

// Helper functions

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function tryGoogleGeocoding(
  name: string,
  bias_lat?: number,
  bias_lng?: number
): Promise<{ lat: number; lng: number; confidence: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(name)}&key=${apiKey}`;

  if (bias_lat && bias_lng) {
    url += `&bounds=${bias_lat - 0.5},${bias_lng - 0.5}|${bias_lat + 0.5},${bias_lng + 0.5}`;
  }

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'OK' && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return {
      lat: location.lat,
      lng: location.lng,
      confidence: data.results[0].geometry.location_type === 'ROOFTOP' ? 1.0 : 0.8,
    };
  }

  return null;
}

async function tryNominatimGeocoding(
  name: string,
  bias_lat?: number,
  bias_lng?: number
): Promise<{ lat: number; lng: number; confidence: number } | null> {
  const apiKey = process.env.NOMINATIM_API_KEY;

  let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&limit=1&addressdetails=1`;

  if (apiKey) {
    url += `&key=${apiKey}`;
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'LaneShadow-Motorcycle-Route-Planner/1.0',
    },
  });

  const data = await response.json();

  if (data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      confidence: parseFloat(data[0].importance || 0.5),
    };
  }

  return null;
}
```

#### 2.2 Geocoding Queries & Mutations

```typescript
// convex/geocoding.ts

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const getCachedWaypoint = query({
  args: {
    name_normalized: v.string(),
    bias_lat: v.optional(v.number()),
    bias_lng: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query('waypointCache')
      .withIndex('by_name_normalized', q => q.eq('name_normalized', args.name_normalized))
      .first();

    if (!cached) return null;

    // Check if bias is within acceptable range (50km)
    if (args.bias_lat && args.bias_lng) {
      const distance = haversineDistance(
        args.bias_lat,
        args.bias_lng,
        cached.lat,
        cached.lng
      );

      if (distance > 50) {
        // Bias point is too far, don't use this cache entry
        return null;
      }
    }

    return cached;
  },
});

export const storeGeocodingResult = mutation({
  args: {
    name: v.string(),
    name_normalized: v.string(),
    lat: v.number(),
    lng: v.number(),
    source: v.string(),
    confidence: v.number(),
    bias_lat: v.optional(v.number()),
    bias_lng: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const waypointId = await ctx.db.insert('waypointCache', {
      ...args,
      geocoded_at: Date.now(),
      hit_count: 0,
      last_used_at: Date.now(),
    });

    return waypointId;
  },
});

export const updateCacheHit = mutation({
  args: {
    id: v.id('waypointCache'),
  },
  handler: async (ctx, args) => {
    const cached = await ctx.db.get(args.id);
    if (!cached) return;

    await ctx.db.patch(args.id, {
      hit_count: (cached.hit_count || 0) + 1,
      last_used_at: Date.now(),
    });
  },
});

export const searchCrowdsourcedWaypoints = query({
  args: {
    name_normalized: v.string(),
    bias_lat: v.optional(v.number()),
    bias_lng: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Fuzzy search on name_normalized
    let results = await ctx.db
      .query('crowdsourcedWaypoints')
      .withIndex('by_name_normalized', q =>
        q.eq('name_normalized', args.name_normalized)
      )
      .collect();

    // If no exact match, try partial match
    if (results.length === 0) {
      const allWaypoints = await ctx.db
        .query('crowdsourcedWaypoints')
        .collect();

      results = allWaypoints.filter(wp =>
        wp.name_normalized.includes(args.name_normalized) ||
        args.name_normalized.includes(wp.name_normalized)
      );
    }

    // If bias provided, filter by distance and sort by proximity
    if (args.bias_lat && args.bias_lng) {
      results = results
        .filter(wp => {
          const distance = haversineDistance(
            args.bias_lat!,
            args.bias_lng!,
            wp.lat,
            wp.lng
          );
          return distance <= 100; // Within 100km
        })
        .sort((a, b) => {
          const distA = haversineDistance(args.bias_lat!, args.bias_lng!, a.lat, a.lng);
          const distB = haversineDistance(args.bias_lat!, args.bias_lng!, b.lat, b.lng);
          return distA - distB;
        });
    }

    // Return best match
    return results[0] || null;
  },
});

// Helper: Haversine distance formula in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

### Phase 3: Update Routing Provider

#### 3.1 Enhance routeSegment with Tiered Geocoding

```typescript
// convex/routingProvider.ts

// Existing function: enhance with tiered geocoding

async function resolveWaypointName(
  name: string,
  anchorPoints: Map<string, Point>,
  biasPoint?: Point
): Promise<Point> {
  // 1. Check anchorPoints for lat/lng (unchanged)
  const anchor = anchorPoints.get(name);
  if (anchor?.lat && anchor?.lng) {
    return anchor;
  }

  // 2. Use enhanced geocode tool with tiered fallback
  try {
    const result = await geocodeWaypoint({
      name,
      bias_lat: biasPoint?.lat,
      bias_lng: biasPoint?.lng,
    });

    return {
      lat: result.lat,
      lng: result.lng,
    };
  } catch (error) {
    // All tiers failed - this is where we'd provide rich feedback
    throw new RouteSegmentError(
      `Unable to geocode waypoint "${name}". ` +
      `This road or landmark may not exist in mapping databases. ` +
      `Try: (1) Being more specific about the location, ` +
      `(2) Providing nearby landmarks, or (3) Using the route planner fallback.`
    );
  }
}
```

---

## Agent Prompt Updates

### Update Routing Sub-Agent System Prompt

```typescript
// Update the Routing Sub-Agent prompt to explain tiered geocoding

const ROUTING_AGENT_SYSTEM_PROMPT = `
You are a motorcycle route planning expert with access to powerful geocoding tools.

GEOCODING CAPABILITIES:
Your geocode tool uses a 4-tier strategy to find coordinates for roads and landmarks:

1. CACHE: First checks if we've geocoded this waypoint before
2. GOOGLE: Primary geocoding service (best for named roads and landmarks)
3. OPENSTREETMAP: Fallback for unmapped roads and local features
4. CROWDSOURCED: Community-contributed local knowledge roads

This means you can successfully geocode:
- Named roads (e.g., "Skyline Boulevard", "Highway 1")
- County roads (e.g., "County Road 9", "Route 9")
- Landmarks (e.g., "Miller's General Store", "the old mill")
- Unnamed roads (e.g., "the dirt road past the landmark")
- Local names (e.g., "The Dragon's Tail" - if crowdsourced)

When geocoding fails:
- The error will include specific suggestions
- Try being more specific (add county, nearby town)
- Try providing nearby landmarks as anchor points
- Fall back to planRoute for deterministic routing

CREATING ROUTE SKETCHES:
When creating route sketches, be specific about waypoint locations:
- Include regional context (e.g., "Skyline Blvd, San Mateo County")
- Use landmarks for turns (e.g., "turn at Miller's General Store")
- Describe unnamed roads relative to known features
`;
```

---

## Migration Strategy

### Step-by-Step Rollout

**Week 1: Database & Foundation**
1. Add `waypointCache` and `crowdsourcedWaypoints` tables to schema
2. Run migration (non-blocking, additive tables)
3. Deploy geocoding queries and mutations

**Week 2: Geocoding Tool Enhancement**
1. Implement `geocodeWaypoint` action with Tiers 1-2 (cache + Google)
2. Update `routingProvider.ts` to use enhanced geocoding
3. A/B test against existing implementation
4. Monitor cache hit rate and performance

**Week 3: Tier 3 Integration**
1. Add Nominatim (OpenStreetMap) geocoding
2. Implement rate limiting (1 QPS as required by OSM)
3. Test with known unmapped roads
4. Measure success rate improvement

**Week 4: Tier 4 & Community Features**
1. Build crowdsourced waypoint submission UI
2. Implement semantic search for community waypoints
3. Add upvote/downvote system
4. Launch community contribution features

**Week 5: Polish & Optimization**
1. Add cost monitoring dashboard
2. Implement batch geocoding for parallel processing
3. Add progressive geocoding (background processing)
4. Documentation and agent prompt refinement

---

## Success Metrics

### Technical Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Geocoding success rate | ~85% | >95% | % of waypoints successfully geocoded |
| Cache hit rate | 0% | >70% | % of geocoding requests served from cache |
| Avg geocoding time | 200ms | <300ms | Per waypoint (including cache) |
| Routes with unmapped roads | 0% | >10% | % of routes using Tier 3/4 data |

### User Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Route generation success rate | >98% | % of route attempts that succeed |
| "Local road" badges | >5% of routes | % of routes using crowdsourced waypoints |
| User waypoint contributions | >10% of users | % of users who submit waypoints |
| Cost per route | <$0.15 | All-in LLM + Google + infrastructure |

---

## Open Questions

1. **Nominatim rate limiting**: With 1 QPS limit, how do we handle batch geocoding for routes with many waypoints?
   - **Answer**: Sequential processing with timeout, fail fast to next tier

2. **Crowdsourced data quality**: How do we prevent spam/low-quality waypoints?
   - **Answer**: Karma system, verification requirements, gradual trust building

3. **Cache invalidation**: When should we invalidate cached waypoints?
   - **Answer**: Rarely - roads don't move. Consider invalidating after 1 year or on user feedback

4. **Cost monitoring**: How do we track Google API costs in real-time?
   - **Answer**: Increment a counter on each geocoding call, expose in dashboard

---

## Related Documentation

- [Original LLM Geocoding Proposal](./llm-motorcycle-route-geocoding.md)
- [Deep Research: LLM Motorcycle Routes Geocoding Strategy](https://holocron.app/doc/js7errnbe9y5ayvzwth444yp2584cx0j)
- [Technical Backend Architecture](../prds/v1/07-technical-backend.md)
- [Routing Sub-Agent Documentation](../prds/v1/tasks/epic-3c-agent-orchestrator-refactor/)
