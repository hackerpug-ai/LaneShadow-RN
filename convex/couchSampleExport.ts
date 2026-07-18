/**
 * S4-T6 / AC-3: Couch-sample PNG export (Node runtime).
 *
 * Uses Node zlib to compress PNG IDATs so a full ~25-route export stays under
 * Convex's action memory limit. Pixel drawing is pure (couchRouteMapPng).
 */

'use node'

import { deflateSync } from 'node:zlib'
import { ConvexError, v } from 'convex/values'
import { api } from './_generated/api'
import { action } from './_generated/server'
import { renderRouteMapPngBase64 } from './couchRouteMapPng'
import { requireIdentity } from './guards'

type Provenance = 'scraped_promoted' | 'ai_reconstructed' | 'name_routed'
type Difficulty = 'easy' | 'medium' | 'hard'

type CouchSampleRoute = {
  routeId: string
  provenance: Provenance
  anchorCount: number
  claimedMiles: number | null
  routedMiles: number
  difficulty: Difficulty
  descriptionLength: number
}

type CouchExportRoute = {
  routeId: string
  pngBase64: string
  metadata: {
    routeId: string
    provenance: Provenance
    routedMiles: number
    claimedMiles: number | null
    anchorCount: number
    difficulty: Difficulty
    descriptionLength: number
  }
}

type CouchExportResult = {
  sampleId: string
  size: number
  routes: CouchExportRoute[]
}

/** zlib wrapper for PNG IDAT (CMF/FLG + deflate + adler32). */
function compressZlib(raw: Uint8Array): Uint8Array {
  return deflateSync(raw, { level: 9 })
}

/**
 * Export a stored couch sample as per-route map PNGs + metadata.
 * Public API path: couchSampleExport:exportCouchSample
 * (also registered as couchSampleAssembler-compatible alias via re-export name).
 */
export const exportCouchSample = action({
  args: {
    sampleId: v.string(),
  },
  handler: async (ctx, { sampleId }): Promise<CouchExportResult> => {
    await requireIdentity(ctx)
    const sample = await ctx.runQuery(api.couchSampleAssembler.getCouchSample, {
      sampleId,
    })
    if (!sample) {
      throw new ConvexError({
        code: 'SAMPLE_NOT_FOUND',
        message: `No couch sample for sampleId=${sampleId}`,
      })
    }

    const routeIds = sample.routes.map((r: CouchSampleRoute) => r.routeId)
    const geoms: Record<string, string> = await ctx.runQuery(
      api.couchSampleAssembler.getGeometriesForRoutes,
      { routeIds },
    )

    const routes: CouchExportRoute[] = []
    for (const r of sample.routes as CouchSampleRoute[]) {
      const metadata = {
        routeId: r.routeId,
        provenance: r.provenance,
        routedMiles: r.routedMiles,
        claimedMiles: r.claimedMiles,
        anchorCount: r.anchorCount,
        difficulty: r.difficulty,
        descriptionLength: r.descriptionLength,
      }
      const pngBase64 = renderRouteMapPngBase64(
        {
          routeId: r.routeId,
          provenance: r.provenance,
          routedMiles: r.routedMiles,
          claimedMiles: r.claimedMiles,
          polyline: geoms[r.routeId] ?? null,
        },
        compressZlib,
      )
      routes.push({ routeId: r.routeId, pngBase64, metadata })
    }

    return {
      sampleId,
      size: routes.length,
      routes,
    }
  },
})
