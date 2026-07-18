/**
 * S4-T6 / VER-05: Couch-sample assembler.
 *
 * Stratifies ~25 recovered routes across provenance types
 * (scraped_promoted, ai_reconstructed, name_routed) and reconstruction
 * difficulty (easy anchor-rich ↔ hard sparse), then exports each as a
 * map PNG + metadata (provenance, routedMiles, claimedMiles).
 */

import { ConvexError, v } from 'convex/values'
import { api } from './_generated/api'
import { action, mutation, query } from './_generated/server'
import { buildFixturePolyline } from './couchRouteMapPng'
import { geospatial } from './geospatialIndex'
import { requireIdentity } from './guards'

// Re-export fixture polyline builder for callers/tests.
export {
  buildFixturePolyline,
  MAP_PNG_HEIGHT,
  MAP_PNG_WIDTH,
  MIN_PNG_BASE64,
} from './couchRouteMapPng'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const COUCH_SAMPLE_TARGET = 25
export const COUCH_SAMPLE_MIN = 20
export const COUCH_SAMPLE_MAX = 30
export const MIN_PER_PROVENANCE = 5
export const COUCH_ROUTE_PREFIX = 'test:couch-'

export type Provenance = 'scraped_promoted' | 'ai_reconstructed' | 'name_routed'
export type Difficulty = 'easy' | 'medium' | 'hard'

export type CouchSampleRoute = {
  routeId: string
  provenance: Provenance
  anchorCount: number
  claimedMiles: number | null
  routedMiles: number
  difficulty: Difficulty
  descriptionLength: number
}

const PROVENANCES: Provenance[] = ['scraped_promoted', 'ai_reconstructed', 'name_routed']

// ---------------------------------------------------------------------------
// Pure stratification helpers (unit-testable)
// ---------------------------------------------------------------------------

export function classifyDifficulty(anchorCount: number, descriptionLength: number): Difficulty {
  if (anchorCount >= 7 && descriptionLength >= 80) return 'easy'
  if (anchorCount <= 3 || descriptionLength < 40) return 'hard'
  return 'medium'
}

/**
 * Stratify candidates into ~targetSize routes with:
 *  - ≥ MIN_PER_PROVENANCE of each provenance
 *  - difficulty range (at least one easy, one hard when available)
 */
export function stratifyCouchSample(
  candidates: CouchSampleRoute[],
  targetSize: number = COUCH_SAMPLE_TARGET,
): CouchSampleRoute[] {
  const size = Math.min(COUCH_SAMPLE_MAX, Math.max(COUCH_SAMPLE_MIN, targetSize))
  const byProv: Record<Provenance, CouchSampleRoute[]> = {
    scraped_promoted: [],
    ai_reconstructed: [],
    name_routed: [],
  }
  for (const c of candidates) {
    if (c.provenance in byProv) byProv[c.provenance].push(c)
  }

  // Prefer diversity within each provenance: sort hard → easy by anchor count spread
  for (const p of PROVENANCES) {
    byProv[p].sort((a, b) => a.anchorCount - b.anchorCount)
  }

  const picked = new Map<string, CouchSampleRoute>()

  // Round-robin minimum per provenance
  for (const p of PROVENANCES) {
    const pool = byProv[p]
    // Take extremes first (hard + easy) then fill
    const ordered = diversifyByDifficulty(pool)
    for (let i = 0; i < Math.min(MIN_PER_PROVENANCE, ordered.length); i++) {
      picked.set(ordered[i].routeId, ordered[i])
    }
  }

  // Ensure hard + easy representation globally when available
  const all = candidates.filter((c) => !picked.has(c.routeId))
  const hard = all.find((c) => c.difficulty === 'hard')
  const easy = all.find((c) => c.difficulty === 'easy')
  if (hard) picked.set(hard.routeId, hard)
  if (easy) picked.set(easy.routeId, easy)

  // Fill remaining slots round-robin across provenances
  let guard = 0
  while (picked.size < size && guard < candidates.length * 3) {
    guard += 1
    let added = false
    for (const p of PROVENANCES) {
      if (picked.size >= size) break
      const next = byProv[p].find((c) => !picked.has(c.routeId))
      if (next) {
        picked.set(next.routeId, next)
        added = true
      }
    }
    if (!added) break
  }

  return Array.from(picked.values()).slice(0, size)
}

function diversifyByDifficulty(pool: CouchSampleRoute[]): CouchSampleRoute[] {
  if (pool.length <= 2) return [...pool]
  const hard = pool.filter((c) => c.difficulty === 'hard')
  const easy = pool.filter((c) => c.difficulty === 'easy')
  const med = pool.filter((c) => c.difficulty === 'medium')
  const out: CouchSampleRoute[] = []
  const queues = [hard, easy, med]
  let i = 0
  while (out.length < pool.length) {
    const q = queues[i % queues.length]
    const next = q.shift()
    if (next) out.push(next)
    i += 1
    if (queues.every((x) => x.length === 0)) break
  }
  return out
}

// ---------------------------------------------------------------------------
// Fixture seed / teardown
// ---------------------------------------------------------------------------

type SeedSpec = {
  routeId: string
  provenance: Provenance
  anchorCount: number
  claimedMiles: number
  routedMiles: number
  summary: string
  name: string
}

function buildSeedSpecs(): SeedSpec[] {
  const specs: SeedSpec[] = []

  // Explicit PRD fixtures
  specs.push({
    routeId: 'test:scraped-1',
    provenance: 'scraped_promoted',
    anchorCount: 5,
    claimedMiles: 41,
    routedMiles: 41,
    summary:
      'Foxen Canyon Road scenic loop through Santa Maria wine country with five named anchors.',
    name: 'Scraped Promoted Fixture 1',
  })
  specs.push({
    routeId: 'test:ai-recon-1',
    provenance: 'ai_reconstructed',
    // AC-3 seeded lengths: routedMiles 41.1, claimedMiles 41
    anchorCount: 7,
    claimedMiles: 41,
    routedMiles: 41.1,
    summary:
      'Highway 101 in Santa Maria, CA. Exit Betteravia Road heading East. Betteravia becomes Foxen Canyon. Follow canyon roads north to highway 166 then west to 101. Anchor-rich reconstruction with clear narrative.',
    name: 'AI Reconstructed Fixture 1',
  })
  specs.push({
    routeId: 'test:name-routed-1',
    provenance: 'name_routed',
    anchorCount: 2,
    claimedMiles: 25,
    routedMiles: 25,
    summary: 'Sparse.',
    name: 'Name Routed Fixture 1',
  })

  // Pad to ≥10 per provenance with difficulty range (anchorCount 2..15)
  const pad: Array<{ provenance: Provenance; base: string }> = [
    { provenance: 'scraped_promoted', base: `${COUCH_ROUTE_PREFIX}scraped` },
    { provenance: 'ai_reconstructed', base: `${COUCH_ROUTE_PREFIX}ai` },
    { provenance: 'name_routed', base: `${COUCH_ROUTE_PREFIX}name` },
  ]

  for (const { provenance, base } of pad) {
    for (let i = 0; i < 9; i++) {
      // Cycle difficulty: hard (2-3), medium (4-6), easy (7-15)
      let anchorCount: number
      let summary: string
      if (i % 3 === 0) {
        anchorCount = 2 + (i % 2) // 2 or 3
        summary = 'Short sparse.'
      } else if (i % 3 === 1) {
        anchorCount = 4 + (i % 3) // 4-6
        summary =
          'A medium-length description of the mountain loop with a few named roads and towns.'
      } else {
        anchorCount = 7 + (i % 5) // 7-11
        summary =
          'Highway 101 corridor scenic run with many named waypoints, canyon roads, mesa junctions, and clear turn-by-turn narrative for reconstruction. Anchor-rich easy case with detailed landmarks throughout the valley.'
      }
      const claimed = 20 + i * 3
      // Keep one ai route with the special 41.1/41 pair (already seeded as test:ai-recon-1)
      const routed = claimed + (i % 5 === 0 ? 0.5 : 0)
      specs.push({
        routeId: `${base}-${String(i).padStart(3, '0')}`,
        provenance,
        anchorCount,
        claimedMiles: claimed,
        routedMiles: routed,
        summary,
        name: `Couch ${provenance} ${i}`,
      })
    }
  }

  return specs
}

async function upsertCouchRoute(
  ctx: any,
  spec: SeedSpec,
): Promise<{ routeId: string; created: boolean }> {
  const existing = await ctx.db
    .query('curated_routes')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', spec.routeId))
    .first()

  // Distinct centroid + polyline per routeId so rendered map PNGs differ.
  const centroidLat = 34.95 + (spec.anchorCount % 10) * 0.01 + (spec.routeId.length % 7) * 0.003
  const centroidLng =
    -120.42 -
    (spec.anchorCount % 10) * 0.01 -
    (spec.routeId.charCodeAt(spec.routeId.length - 1) % 5) * 0.004
  const nowMs = Date.now()
  const difficulty = classifyDifficulty(spec.anchorCount, spec.summary.length)
  const routePolyline = buildFixturePolyline(spec.routeId, centroidLat, centroidLng)

  const base = {
    name: spec.name,
    lengthMiles: spec.claimedMiles,
    centroidLat,
    centroidLng,
    boundsNeLat: centroidLat + 0.3,
    boundsNeLng: centroidLng + 0.3,
    boundsSwLat: centroidLat - 0.3,
    boundsSwLng: centroidLng - 0.3,
    location: { type: 'Point' as const, coordinates: [centroidLng, centroidLat] },
    compositeScore: 85,
    curvatureScore: 90,
    scenicScore: 80,
    technicalScore: 85,
    trafficScore: 75,
    remotenessScore: 70,
    routePolyline,
    geometryStatus: 'generated' as const,
    geometryProvenance: spec.provenance,
    riderReady: true,
    state: 'California',
    summary: spec.summary,
    retiredAt: undefined,
    duplicateOf: undefined,
    quarantine: undefined,
  }

  let docId = existing?._id
  if (existing) {
    await ctx.db.patch(existing._id, base)
  } else {
    docId = await ctx.db.insert('curated_routes', {
      routeId: spec.routeId,
      source: 'editorial',
      primaryArchetype: 'twisties',
      secondaryTags: ['test', 's4t6', 'couch', difficulty],
      oneLiner: `Couch sample ${spec.provenance}`,
      badges: [],
      season: 'year_round',
      contentVersion: 1,
      seededAt: nowMs,
      rideWorthiness: {
        verdict: 'ride' as const,
        reason: 's4t6 couch seed',
        model: 'test',
        classifiedAt: nowMs,
      },
      ...base,
    })
  }

  const anchors = Array.from({ length: spec.anchorCount }, (_, i) => ({
    lat: centroidLat + i * 0.01,
    lng: centroidLng + i * 0.01,
    formatted: `Anchor ${i + 1}`,
    distanceFromCentroid: i * 0.5,
  }))

  const geomDoc = {
    routeId: spec.routeId,
    format: 'polyline' as const,
    encoding: 'utf-8',
    precision: 5,
    value: routePolyline,
    provenance: spec.provenance,
    verification: {
      routeId: spec.routeId,
      verdict: 'pass' as const,
      provenance: spec.provenance,
      geometry: routePolyline,
      geometryStatus: 'generated' as const,
      anchorCount: spec.anchorCount,
      anchors,
      pointCount: 50 + spec.anchorCount,
      degenerate: false,
      ratio: spec.claimedMiles > 0 ? spec.routedMiles / spec.claimedMiles : null,
      claimedMiles: spec.claimedMiles,
      routedMiles: spec.routedMiles,
    },
  }

  const geom = await ctx.db
    .query('curated_route_geometry')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', spec.routeId))
    .first()
  if (geom) {
    await ctx.db.replace(geom._id, geomDoc)
  } else {
    await ctx.db.insert('curated_route_geometry', geomDoc)
  }

  try {
    await geospatial.insert(
      ctx,
      docId,
      { latitude: centroidLat, longitude: centroidLng },
      { state: 'California', primaryArchetype: 'twisties' },
      85,
    )
  } catch {
    /* may already be indexed */
  }

  return { routeId: spec.routeId, created: !existing }
}

export const seedCouchFixtures = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const specs = buildSeedSpecs()
    const seeded: string[] = []
    for (const spec of specs) {
      const r = await upsertCouchRoute(ctx, spec)
      seeded.push(r.routeId)
    }
    return { seeded, count: seeded.length }
  },
})

export const teardownCouchFixtures = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const prefixes = [COUCH_ROUTE_PREFIX, 'test:scraped-', 'test:ai-recon-', 'test:name-routed-']
    const removed: string[] = []

    const deleteByRouteId = async (routeId: string) => {
      const doc = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
        .first()
      if (!doc) return
      const geom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
        .first()
      if (geom) await ctx.db.delete(geom._id)
      try {
        await geospatial.remove(ctx, doc._id)
      } catch {
        /* not indexed */
      }
      await ctx.db.delete(doc._id)
      removed.push(routeId)
    }

    for (const status of ['generated', 'unresolved', 'review', 'failed'] as const) {
      const rows = await ctx.db
        .query('curated_routes')
        .withIndex('by_geometry_status', (q: any) => q.eq('geometryStatus', status))
        .take(500)
      for (const row of rows) {
        if (prefixes.some((p) => row.routeId.startsWith(p))) {
          await deleteByRouteId(row.routeId)
        }
      }
    }

    // Drop couch samples for these tests
    const samples = await ctx.db.query('couch_samples').take(50)
    for (const s of samples) {
      if (s.sampleId.startsWith('couch-')) {
        await ctx.db.delete(s._id)
      }
    }

    return { removed, count: removed.length }
  },
})

// ---------------------------------------------------------------------------
// List recovered candidates (internal-ish public query for assembler)
// ---------------------------------------------------------------------------

async function toCandidate(ctx: any, row: any): Promise<CouchSampleRoute | null> {
  const geom = await ctx.db
    .query('curated_route_geometry')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', row.routeId))
    .first()

  const provenance = (geom?.provenance ??
    row.geometryProvenance ??
    geom?.verification?.provenance) as Provenance | undefined
  if (!provenance || !PROVENANCES.includes(provenance)) return null

  const anchorCount = geom?.verification?.anchorCount ?? 2
  const claimedMiles = geom?.verification?.claimedMiles ?? row.lengthMiles ?? null
  const routedMiles = geom?.verification?.routedMiles ?? row.lengthMiles ?? 0
  const descriptionLength = (row.summary ?? row.oneLiner ?? '').length
  const difficulty = classifyDifficulty(anchorCount, descriptionLength)

  return {
    routeId: row.routeId,
    provenance,
    anchorCount,
    claimedMiles,
    routedMiles,
    difficulty,
    descriptionLength,
  }
}

export const listRecoveredCandidates = query({
  args: {
    routeIdPrefix: v.optional(v.string()),
    /** When true (default), look up known couch fixture routeIds by index so
     * they are not lost among a large generated catalog. */
    preferFixtures: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { routeIdPrefix, preferFixtures, limit }) => {
    await requireIdentity(ctx)
    const take = Math.min(limit ?? 200, 400)
    const candidates: CouchSampleRoute[] = []
    const seen = new Set<string>()

    // Prefer explicit fixture lookups (index by_routeId) — reliable for tests.
    if (preferFixtures !== false) {
      for (const spec of buildSeedSpecs()) {
        if (routeIdPrefix && !spec.routeId.startsWith(routeIdPrefix)) {
          const isPrd =
            spec.routeId.startsWith('test:scraped-') ||
            spec.routeId.startsWith('test:ai-recon-') ||
            spec.routeId.startsWith('test:name-routed-')
          if (!isPrd) continue
        }
        const row = await ctx.db
          .query('curated_routes')
          .withIndex('by_routeId', (q) => q.eq('routeId', spec.routeId))
          .first()
        if (!row || row.geometryStatus !== 'generated') continue
        const c = await toCandidate(ctx, row)
        if (c && !seen.has(c.routeId)) {
          seen.add(c.routeId)
          candidates.push(c)
        }
      }
    }

    // Supplement from generated index when more catalog routes are wanted
    if (candidates.length < take) {
      const rows = await ctx.db
        .query('curated_routes')
        .withIndex('by_geometry_status', (q) => q.eq('geometryStatus', 'generated'))
        .take(take)
      for (const row of rows) {
        if (seen.has(row.routeId)) continue
        if (routeIdPrefix && !row.routeId.startsWith(routeIdPrefix)) continue
        const c = await toCandidate(ctx, row)
        if (c) {
          seen.add(c.routeId)
          candidates.push(c)
        }
      }
    }

    return { candidates, count: candidates.length }
  },
})

export const getCouchSample = query({
  args: { sampleId: v.string() },
  handler: async (ctx, { sampleId }) => {
    await requireIdentity(ctx)
    const row = await ctx.db
      .query('couch_samples')
      .withIndex('by_sampleId', (q) => q.eq('sampleId', sampleId))
      .first()
    return row ?? null
  },
})

export const storeCouchSample = mutation({
  args: {
    sampleId: v.string(),
    routes: v.array(
      v.object({
        routeId: v.string(),
        provenance: v.union(
          v.literal('scraped_promoted'),
          v.literal('ai_reconstructed'),
          v.literal('name_routed'),
        ),
        anchorCount: v.number(),
        claimedMiles: v.union(v.number(), v.null()),
        routedMiles: v.number(),
        difficulty: v.union(v.literal('easy'), v.literal('medium'), v.literal('hard')),
        descriptionLength: v.number(),
      }),
    ),
  },
  handler: async (ctx, { sampleId, routes }) => {
    await requireIdentity(ctx)
    if (routes.length < COUCH_SAMPLE_MIN || routes.length > COUCH_SAMPLE_MAX) {
      throw new ConvexError({
        code: 'INVALID_SAMPLE_SIZE',
        message: `Couch sample size must be ${COUCH_SAMPLE_MIN}–${COUCH_SAMPLE_MAX}, got ${routes.length}`,
      })
    }
    for (const p of PROVENANCES) {
      const n = routes.filter((r) => r.provenance === p).length
      if (n === 0) {
        throw new ConvexError({
          code: 'UNSTRATIFIED_SAMPLE',
          message: `Couch sample missing provenance ${p}`,
        })
      }
    }

    const existing = await ctx.db
      .query('couch_samples')
      .withIndex('by_sampleId', (q) => q.eq('sampleId', sampleId))
      .first()
    const doc = {
      sampleId,
      size: routes.length,
      routes,
      createdAt: Date.now(),
    }
    if (existing) {
      await ctx.db.replace(existing._id, doc)
      return { sampleId, size: routes.length, replaced: true }
    }
    await ctx.db.insert('couch_samples', doc)
    return { sampleId, size: routes.length, replaced: false }
  },
})

// ---------------------------------------------------------------------------
// Assemble + export actions
// ---------------------------------------------------------------------------

export const assembleCouchSample = action({
  args: {
    targetSize: v.optional(v.number()),
    routeIdPrefix: v.optional(v.string()),
    sampleId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const targetSize = args.targetSize ?? COUCH_SAMPLE_TARGET
    // Default: include PRD fixtures + couch-prefixed seeds
    const listed = await ctx.runQuery(api.couchSampleAssembler.listRecoveredCandidates, {
      // Empty prefix → listRecoveredCandidates returns all generated; we filter below
      limit: 400,
    })

    // Prefer couch test fixtures when present; fall back to full catalog
    let pool = (listed.candidates as CouchSampleRoute[]).filter(
      (c) =>
        c.routeId.startsWith(COUCH_ROUTE_PREFIX) ||
        c.routeId.startsWith('test:scraped-') ||
        c.routeId.startsWith('test:ai-recon-') ||
        c.routeId.startsWith('test:name-routed-') ||
        (args.routeIdPrefix != null && c.routeId.startsWith(args.routeIdPrefix)),
    )
    if (pool.length < COUCH_SAMPLE_MIN) {
      pool = listed.candidates as CouchSampleRoute[]
    }

    const routes = stratifyCouchSample(pool, targetSize)
    if (routes.length < COUCH_SAMPLE_MIN) {
      throw new ConvexError({
        code: 'INSUFFICIENT_CANDIDATES',
        message: `Need ≥${COUCH_SAMPLE_MIN} recovered candidates for couch sample, got ${routes.length}`,
      })
    }

    const sampleId = args.sampleId ?? `couch-${Date.now()}`
    await ctx.runMutation(api.couchSampleAssembler.storeCouchSample, {
      sampleId,
      routes,
    })

    const counts = {
      scraped_promoted: routes.filter((r) => r.provenance === 'scraped_promoted').length,
      ai_reconstructed: routes.filter((r) => r.provenance === 'ai_reconstructed').length,
      name_routed: routes.filter((r) => r.provenance === 'name_routed').length,
    }

    return {
      sampleId,
      size: routes.length,
      routes,
      counts,
    }
  },
})

/**
 * Look up encoded polylines for export rendering.
 * Prefers curated_route_geometry.value, falls back to curated_routes.routePolyline.
 */
export const getGeometriesForRoutes = query({
  args: {
    routeIds: v.array(v.string()),
  },
  handler: async (ctx, { routeIds }) => {
    await requireIdentity(ctx)
    const out: Record<string, string> = {}
    for (const routeId of routeIds) {
      const geom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (geom?.value && typeof geom.value === 'string' && geom.value.length > 0) {
        out[routeId] = geom.value
        continue
      }
      const route = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (route?.routePolyline && typeof route.routePolyline === 'string') {
        out[routeId] = route.routePolyline
      }
    }
    return out
  },
})

// exportCouchSample lives in couchSampleExport.ts ("use node") so Node zlib can
// compress PNG IDAT — uncompressed 25×240² RGBA maps OOM the 64MB isolate.
