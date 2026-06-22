/**
 * DATA-011 QA: validate the CORRECTNESS of generated route geometries (not just presence).
 *
 * Nominatim name-matching can return the WRONG road (a same-named highway in another
 * county/state). Two cheap, objective signals catch that across all generated rows:
 *   - centroid distance: the geometry's midpoint should sit near the route's stored
 *     centroidLat/Lng. A wrong same-name match lands tens/hundreds of miles away.
 *   - length ratio: the decoded LineString length vs the route's lengthMiles. A partial
 *     or wrong match is wildly shorter/longer than the catalog length.
 *
 * Run:  npx convex run curatedGeometryQa:qa '{}'
 *       npx convex run curatedGeometryQa:exportGenerated '{}'   (data for the HTML map)
 */

import polyline from '@mapbox/polyline'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import { internalAction, internalQuery } from './_generated/server'

type QaRow = {
  id: import('./_generated/dataModel').Id<'curated_routes'>
  routeId: string
  name: string
  state: string
  centroidLat: number
  centroidLng: number
  lengthMiles: number | null
  value: string
  segments: string[] | null
  precision: number
}
type QaPage = { rows: QaRow[]; continueCursor: string; isDone: boolean }

type QaReport = {
  processed: number
  ok: number
  suspectFar: number
  suspectLength: number
  twoPointOnly: number
  suspects: Array<Record<string, unknown>>
}

const R_MI = 3958.7613 // earth radius, miles
function haversineMi(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R_MI * Math.asin(Math.min(1, Math.sqrt(s)))
}

/** Page of generated geometries with the catalog fields needed to QA them. */
export const listGeneratedForQa = internalQuery({
  args: { cursor: v.union(v.string(), v.null()), batchSize: v.number() },
  handler: async (ctx, { cursor, batchSize }): Promise<QaPage> => {
    const page = await ctx.db
      .query('curated_routes')
      .filter((q) => q.eq(q.field('geometryStatus'), 'generated'))
      .paginate({ cursor, numItems: batchSize })
    return {
      rows: page.page.map((r) => ({
        id: r._id,
        routeId: r.routeId,
        name: r.name,
        state: r.state,
        centroidLat: r.centroidLat,
        centroidLng: r.centroidLng,
        lengthMiles: r.lengthMiles ?? null,
        value: r.routeGeometry?.value ?? '',
        segments: r.routeGeometry?.segments ?? null,
        precision: r.routeGeometry?.precision ?? 5,
      })),
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

/**
 * Classify every generated geometry as ok / suspect-far / suspect-length.
 * Thresholds: midpoint >25mi from the catalog centroid → likely a wrong same-name road;
 * decoded length <0.25× or >4× the catalog lengthMiles → likely partial/wrong.
 */
export const qa = internalAction({
  args: { sample: v.optional(v.number()) },
  handler: async (ctx, { sample }): Promise<QaReport> => {
    let cursor: string | null = null
    let isDone = false
    let processed = 0
    let ok = 0
    let suspectFar = 0
    let suspectLength = 0
    let twoPointOnly = 0
    const suspects: Array<Record<string, unknown>> = []
    const cap = sample ?? Number.POSITIVE_INFINITY

    while (!isDone && processed < cap) {
      const page: QaPage = await ctx.runQuery(internal.curatedGeometryQa.listGeneratedForQa, {
        cursor,
        batchSize: 100,
      })
      for (const r of page.rows) {
        if (processed >= cap) break
        processed++
        // Build the coordinate set: multipolyline → all segments; single-line → value.
        let segList: [number, number][][] = []
        if (r.segments?.length) {
          segList = r.segments
            .map((s) => polyline.decode(s, r.precision) as [number, number][])
            .filter((c) => c.length >= 2)
        } else if (r.value) {
          const c = polyline.decode(r.value, r.precision) as [number, number][]
          if (c.length >= 2) segList = [c]
        }
        if (!segList.length) continue
        const totalPts = segList.reduce((s, c) => s + c.length, 0)
        // midpoint of the longest segment for the centroid (location) check
        const longest = segList.reduce((a, b) => (b.length > a.length ? b : a))
        const mid = longest[Math.floor(longest.length / 2)]
        const dCentroidMi = haversineMi(mid[0], mid[1], r.centroidLat, r.centroidLng)
        let geomLenMi = 0
        for (const c of segList) {
          for (let i = 1; i < c.length; i++) {
            geomLenMi += haversineMi(c[i - 1][0], c[i - 1][1], c[i][0], c[i][1])
          }
        }
        const lenRatio = r.lengthMiles && r.lengthMiles > 0 ? geomLenMi / r.lengthMiles : null
        if (totalPts === 2) twoPointOnly++

        let kind = 'ok'
        if (dCentroidMi > 25) {
          kind = 'suspect_far'
          suspectFar++
        } else if (lenRatio !== null && (lenRatio < 0.25 || lenRatio > 4)) {
          kind = 'suspect_length'
          suspectLength++
        } else {
          ok++
        }
        if (kind !== 'ok' && suspects.length < 80) {
          suspects.push({
            routeId: r.routeId,
            name: r.name,
            state: r.state,
            kind,
            dCentroidMi: Math.round(dCentroidMi),
            geomLenMi: Math.round(geomLenMi),
            routeLenMi: r.lengthMiles,
            points: totalPts,
            segments: segList.length,
          })
        }
      }
      cursor = page.continueCursor
      isDone = page.isDone
    }
    return { processed, ok, suspectFar, suspectLength, twoPointOnly, suspects }
  },
})

type ExportRow = {
  routeId: string
  name: string
  state: string
  centroidLat: number
  centroidLng: number
  coords: [number, number][]
}
type ExportResult = { count: number; routes: ExportRow[] }

/**
 * Export decoded geometries (capped) for the HTML/Leaflet visual QA map.
 */
export const exportGenerated = internalAction({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }): Promise<ExportResult> => {
    const cap = limit ?? 1500
    let cursor: string | null = null
    let isDone = false
    const routes: ExportRow[] = []
    while (!isDone && routes.length < cap) {
      const page: QaPage = await ctx.runQuery(internal.curatedGeometryQa.listGeneratedForQa, {
        cursor,
        batchSize: 200,
      })
      for (const r of page.rows) {
        if (routes.length >= cap) break
        if (!r.value) continue
        const coords = polyline.decode(r.value, r.precision) as [number, number][]
        if (coords.length < 2) continue
        routes.push({
          routeId: r.routeId,
          name: r.name,
          state: r.state,
          centroidLat: r.centroidLat,
          centroidLng: r.centroidLng,
          coords,
        })
      }
      cursor = page.continueCursor
      isDone = page.isDone
    }
    return { count: routes.length, routes }
  },
})

type ResetReport = { scanned: number; kept: number; cleared: number }

/**
 * FIX #1 (safety) + re-queue: scan every generated geometry and CLEAR the ones that fail the
 * geocoder's acceptance rule (midpoint >maxCentroidMi from centroid, or span <minSpanMi) —
 * they fall back to the centroid (no wrong line) AND are re-queued for the corrected backfill.
 * Two-pass (read-only scan → clear) so mutations never disturb the pagination.
 */
export const resetSuspects = internalAction({
  args: { maxCentroidMi: v.optional(v.number()), minSpanMi: v.optional(v.number()) },
  handler: async (ctx, { maxCentroidMi, minSpanMi }): Promise<ResetReport> => {
    const maxC = maxCentroidMi ?? 40
    const minSpan = minSpanMi ?? 0.2
    let cursor: string | null = null
    let isDone = false
    let scanned = 0
    let kept = 0
    const toClear: Array<import('./_generated/dataModel').Id<'curated_routes'>> = []

    while (!isDone) {
      const page: QaPage = await ctx.runQuery(internal.curatedGeometryQa.listGeneratedForQa, {
        cursor,
        batchSize: 200,
      })
      for (const r of page.rows) {
        scanned++
        let bad = !r.value
        if (!bad) {
          const coords = polyline.decode(r.value, r.precision) as [number, number][]
          if (coords.length < 2) {
            bad = true
          } else {
            const mid = coords[Math.floor(coords.length / 2)]
            const dC = haversineMi(mid[0], mid[1], r.centroidLat, r.centroidLng)
            let span = 0
            for (let i = 1; i < coords.length; i++) {
              span += haversineMi(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1])
            }
            if (dC > maxC || span < minSpan) bad = true
          }
        }
        if (bad) toClear.push(r.id)
        else kept++
      }
      cursor = page.continueCursor
      isDone = page.isDone
    }

    for (const id of toClear) {
      await ctx.runMutation(internal.curatedGeometry.clearGeometry, { id })
    }
    return { scanned, kept, cleared: toClear.length }
  },
})

/**
 * DATA-011-C5: clear EVERY generated geometry → null, re-queuing all of them for the
 * Overpass MultiLineString backfill (upgrades the single-line Nominatim fragments to full
 * multi-segment routes). Unresolved rows are left as-is (Overpass won't help name-only byways).
 */
export const clearAllGenerated = internalAction({
  args: {},
  handler: async (ctx): Promise<{ cleared: number }> => {
    let cursor: string | null = null
    let isDone = false
    const ids: Array<import('./_generated/dataModel').Id<'curated_routes'>> = []
    while (!isDone) {
      const page: QaPage = await ctx.runQuery(internal.curatedGeometryQa.listGeneratedForQa, {
        cursor,
        batchSize: 200,
      })
      for (const r of page.rows) ids.push(r.id)
      cursor = page.continueCursor
      isDone = page.isDone
    }
    for (const id of ids) {
      await ctx.runMutation(internal.curatedGeometry.clearGeometry, { id })
    }
    return { cleared: ids.length }
  },
})
