---
title: "LLM Geocoding Integration - Complete Change Checklist"
proposal_type: "implementation-checklist"
status: "draft"
created: "2026-04-07"
author: "Research Team"
version: "1.0"
related_proposal: "llm-geocoding-integration-plan"
---

# LLM Geocoding Integration - Complete Change Checklist

This document lists **every specific change** required to integrate the LLM-enhanced geocoding strategy into LaneShadow's existing routing architecture.

---

## Phase 1: Database Schema Changes

### 1.1 Schema Definition (`convex/schema.ts`)

**Add two new tables:**

```typescript
// Add to existing schema exports

waypointCache: defineTable({
  // Input signature (for deduplication)
  name: v.string(),
  name_normalized: v.string(),

  // Regional bias used in geocoding
  bias_lat: v.optional(v.number()),
  bias_lng: v.optional(v.number()),

  // Geocoding result
  lat: v.number(),
  lng: v.number(),

  // Metadata
  source: v.string(),
  confidence: v.number(),
  geocoded_at: v.number(),

  // Usage tracking
  hit_count: v.number(),
  last_used_at: v.number(),

  // Verification
  verified: v.optional(v.boolean()),
})
  .index('by_name_normalized', ['name_normalized'])
  .index('by_location', ['lat', 'lng'])
  .index('by_source', ['source']),

crowdsourcedWaypoints: defineTable({
  name: v.string(),
  name_normalized: v.string(),
  description: v.optional(v.string()),
  lat: v.number(),
  lng: v.number(),
  type: v.string(),
  tags: v.optional(v.array(v.string())),
  submitted_by: v.id('users'),
  submitted_at: v.number(),
  verified: v.boolean(),
  verification_count: v.number(),
  upvotes: v.number(),
  downvotes: v.number(),
  usage_count: v.number(),
  region_hint: v.optional(v.string()),
  nearby_towns: v.optional(v.array(v.string())),
})
  .index('by_name_normalized', ['name_normalized'])
  .index('by_type', ['type'])
  .index('by_submitter', ['submitted_by'])
  .index('by_location', ['lat', 'lng']),
```

**Migration Required:** No (additive tables only)

---

### 1.2 Create Geocoding Models (`convex/models/geocoding.ts`)

**New file - create with:**

```typescript
import { v } from 'convex/values';

export const geocodingResultValidator = v.object({
  lat: v.number(),
  lng: v.number(),
  source: v.string(),
  confidence: v.number(),
  cached: v.optional(v.boolean()),
});

export const geocodingErrorValidator = v.object({
  error: v.string(),
  retry_hint: v.optional(v.string()),
  attempted_tiers: v.array(v.string()),
});
```

---

## Phase 2: Geocoding Actions & Queries

### 2.1 Create Geocoding Action (`convex/actions/geocode.ts`)

**New file - create with:**

```typescript
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
    const name_normalized = normalizeName(name);

    // TIER 1: Check cache
    const cached = await ctx.runQuery(api.geocoding.getCachedWaypoint, {
      name_normalized,
      bias_lat,
      bias_lng,
    });

    if (cached) {
      await ctx.runMutation(api.geocoding.updateCacheHit, { id: cached._id });
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
      return { ...googleResult, cached: false };
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
      return { ...nominatimResult, cached: false };
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
        confidence: crowdResult.verification_count / 10,
        cached: false,
      };
    }

    throw new Error(
      `Geocoding failed for "${name}". ` +
      `Tried: google, nominatim, crowdsourced. ` +
      `Suggestion: Try being more specific or provide nearby landmarks.`
    );
  },
});

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
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&limit=1&addressdetails=1`;

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

---

### 2.2 Create Geocoding Queries (`convex/geocoding.ts`)

**New file - create with:**

```typescript
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

    if (args.bias_lat && args.bias_lng) {
      const distance = haversineDistance(
        args.bias_lat,
        args.bias_lng,
        cached.lat,
        cached.lng
      );
      if (distance > 50) return null;
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
    return await ctx.db.insert('waypointCache', {
      ...args,
      geocoded_at: Date.now(),
      hit_count: 0,
      last_used_at: Date.now(),
    });
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
    let results = await ctx.db
      .query('crowdsourcedWaypoints')
      .withIndex('by_name_normalized', q => q.eq('name_normalized', args.name_normalized))
      .collect();

    if (results.length === 0) {
      const allWaypoints = await ctx.db.query('crowdsourcedWaypoints').collect();
      results = allWaypoints.filter(wp =>
        wp.name_normalized.includes(args.name_normalized) ||
        args.name_normalized.includes(wp.name_normalized)
      );
    }

    if (args.bias_lat && args.bias_lng) {
      results = results
        .filter(wp => haversineDistance(args.bias_lat!, args.bias_lng!, wp.lat, wp.lng) <= 100)
        .sort((a, b) =>
          haversineDistance(args.bias_lat!, args.bias_lng!, a.lat, a.lng) -
          haversineDistance(args.bias_lat!, args.bias_lng!, b.lat, b.lng)
        );
    }

    return results[0] || null;
  },
});

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

---

## Phase 3: Update Routing Provider

### 3.1 Update `routingProvider.ts`

**Locate:** `convex/routingProvider.ts` (lines 240-306 in `routeSegment` function)

**Find this existing code:**

```typescript
// EXISTING CODE (to be replaced)
async function resolveWaypointName(name: string, anchorPoints: Map<string, Point>): Promise<Point> {
  // 1. Check anchorPoints for lat/lng
  // 2. If missing: GEOCODE with 50km bias
}
```

**Replace with:**

```typescript
// NEW CODE (enhanced with tiered geocoding)
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
    throw new RouteSegmentError(
      `Unable to geocode waypoint "${name}". ` +
      `This road or landmark may not exist in mapping databases. ` +
      `Try: (1) Being more specific about the location, ` +
      `(2) Providing nearby landmarks, or (3) Using the route planner fallback.`
    );
  }
}
```

**Changes made:**
1. Added optional `biasPoint` parameter
2. Added try-catch with enhanced error messaging
3. Replaced direct Google geocoding call with `geocodeWaypoint` action

---

### 3.2 Update RouteSegment Type Definition

**Locate:** Type definitions in `routingProvider.ts` or shared types file

**Add to existing Point type:**

```typescript
// No changes needed - Point type already has lat/lng
// Just ensuring geocodeWaypoint is imported and available
```

---

## Phase 4: Agent Prompt Updates

### 4.1 Update Routing Sub-Agent System Prompt

**Locate:** Agent prompt configuration (likely in `convex/agents/` or agent config)

**Add to system prompt:**

```
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
```

---

## Phase 5: Environment Variables

### 5.1 Add to `.env.local` or environment configuration

**Add these variables:**

```bash
# Google Maps API (already exists, ensuring it's present)
GOOGLE_MAPS_API_KEY=your_key_here

# Nominatim/OSM (optional - for better rate limiting)
NOMINATIM_API_KEY=your_key_here  # Optional

# Geocoding configuration
GEOCODING_CACHE_TTL_SECONDS=2592000  # 30 days (optional)
GEOCODING_MAX_CACHE_SIZE=10000  # Maximum cache entries (optional)
```

---

## Phase 6: Testing Changes

### 6.1 Create Geocoding Tests

**New file:** `convex/tests/geocoding.test.ts`

```typescript
import { test } from 'convex-dev';
import { geocodeWaypoint } from '../actions/geocode';

test('geocodeWaypoint - named road via Google', async () => {
  const result = await geocodeWaypoint({
    name: 'Skyline Boulevard, San Mateo County',
  });

  expect(result.lat).toBeDefined();
  expect(result.lng).toBeDefined();
  expect(result.source).toBe('google');
});

test('geocodeWaypoint - cache hit on second call', async () => {
  const result1 = await geocodeWaypoint({
    name: 'Santa Cruz, CA',
  });

  const result2 = await geocodeWaypoint({
    name: 'Santa Cruz, CA',
  });

  expect(result2.cached).toBe(true);
  expect(result1.lat).toBe(result2.lat);
});

test('geocodeWaypoint - unnamed road falls back to Nominatim', async () => {
  const result = await geocodeWaypoint({
    name: 'dirt road near Pescadero',
  });

  expect(result.lat).toBeDefined();
  expect(result.lng).toBeDefined();
  expect(['google', 'nominatim']).toContain(result.source);
});

test('geocodeWaypoint - all tiers fail throws error', async () => {
  await expect(async () => {
    await geocodeWaypoint({
      name: 'completely made up road name xyz123',
    });
  }).rejects.toThrow('Geocoding failed');
});
```

---

## Phase 7: UI Changes (Optional - Phase 4)

### 7.1 Waypoint Contribution Component

**New file:** `components/WaypointContributionForm.tsx`

```typescript
import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from 'convex/_generated/api';

export function WaypointContributionForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('unnamed_road');
  const contribute = useAction(api.geocoding.contributeWaypoint);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await contribute({ name, description, type });
    setName('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Road or landmark name"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description and how to find it"
      />
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="unnamed_road">Unnamed Road</option>
        <option value="landmark">Landmark</option>
        <option value="local_name">Local Name</option>
      </select>
      <button type="submit">Contribute</button>
    </form>
  );
}
```

---

## Summary: All Files to Modify/Create

### Files to CREATE (6 new files):

1. `convex/models/geocoding.ts` - Geocoding validators
2. `convex/actions/geocode.ts` - Tiered geocoding action
3. `convex/geocoding.ts` - Geocoding queries/mutations
4. `convex/tests/geocoding.test.ts` - Test suite
5. `components/WaypointContributionForm.tsx` - UI component (Phase 4)
6. `.spec/proposals/llm-geocoding-changes-checklist.md` - This checklist

### Files to MODIFY (3 existing files):

1. `convex/schema.ts` - Add 2 new tables (waypointCache, crowdsourcedWaypoints)
2. `convex/routingProvider.ts` - Update resolveWaypointName function (lines 240-306)
3. Agent prompt config - Add geocoding capabilities section

### Environment changes:

1. Add optional environment variables to `.env.local`

---

## Deployment Order

**Deploy in this order to avoid breaking changes:**

1. **Deploy Phase 1** (schema + models)
   - No runtime impact (additive tables)
   - Can deploy anytime

2. **Deploy Phase 2** (geocoding actions)
   - Creates new actions, doesn't break existing code
   - Can deploy anytime

3. **Deploy Phase 3** (routing provider update)
   - **CRITICAL DEPLOYMENT** - This changes production behavior
   - Deploy during low-traffic window
   - Have rollback plan ready
   - Monitor geocoding success rate closely

4. **Deploy Phase 4** (UI changes - optional)
   - Independent deployment
   - No impact on core routing

5. **Deploy Phase 5** (environment variables)
   - Can be done anytime

---

## Rollback Plan

If Phase 3 deployment causes issues:

```bash
# Rollback routingProvider.ts to previous version
git revert <commit-hash>

# Keep new tables and actions (no harm in leaving them)
# They'll be available for future use
```

**Monitoring during rollout:**

```typescript
// Add temporary logging to routingProvider.ts
console.log('[Geocoding] Tier used:', result.source);
console.log('[Geocoding] Cache hit:', result.cached);
console.log('[Geocoding] Confidence:', result.confidence);
```

---

## Success Criteria

After all changes are deployed:

- [ ] Geocoding success rate > 95% (up from ~85%)
- [ ] Cache hit rate > 70% after 1 week
- [ ] Zero increase in route generation failures
- [ ] Cost per route remains <$0.15
- [ ] At least 5% of routes use Tier 3 or Tier 4 geocoding
