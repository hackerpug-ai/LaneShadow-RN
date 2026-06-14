import { v } from 'convex/values'
import { action, internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import { geospatial } from './geospatialIndex'

interface BatchResult {
  seeded: number
  skipped: number
  alreadyExisted: number
  errors: string[]
  continueCursor: string | null
  isDone: boolean
}

interface SeedResult {
  totalProcessed: number
  seeded: number
  skipped: number
  alreadyExisted: number
  errors: string[]
  batchesRun: number
}

const seedGeospatialBatchInternal = internalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { cursor }): Promise<BatchResult> => {
    const result: BatchResult = {
      seeded: 0,
      skipped: 0,
      alreadyExisted: 0,
      errors: [],
      continueCursor: null,
      isDone: false,
    }

    const page = await ctx.db
      .query('curated_routes')
      .paginate({ cursor: cursor ?? undefined, numItems: 200 })

    for (const route of page.page) {
      const lat = route.centroidLat
      const lng = route.centroidLng

      if (
        lat == null ||
        lng == null ||
        typeof lat !== 'number' ||
        typeof lng !== 'number' ||
        isNaN(lat) ||
        isNaN(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        result.skipped++
        result.errors.push(`Skipped ${route.routeId}: invalid centroid (${lat}, ${lng})`)
        continue
      }

      try {
        await geospatial.insert(
          ctx,
          route._id,
          { latitude: lat, longitude: lng },
          { state: route.state ?? 'Unknown', primaryArchetype: route.primaryArchetype ?? 'twisties' },
          route.compositeScore ?? 0,
        )
        result.seeded++
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        if (errMsg.includes('already') || errMsg.includes('duplicate') || errMsg.includes('exists')) {
          result.alreadyExisted++
        } else {
          result.skipped++
          result.errors.push(`Error seeding ${route.routeId}: ${errMsg}`)
        }
      }
    }

    result.continueCursor = page.continueCursor ?? null
    result.isDone = page.isDone ?? false
    return result
  },
})

export { seedGeospatialBatchInternal }

export const seedGeospatialAll = action({
  args: {},
  handler: async (ctx): Promise<SeedResult> => {
    const result: SeedResult = {
      totalProcessed: 0,
      seeded: 0,
      skipped: 0,
      alreadyExisted: 0,
      errors: [],
      batchesRun: 0,
    }

    let cursor: string | null = null

    while (true) {
      const batch = await ctx.runMutation(internal.geospatialSeed.seedGeospatialBatchInternal, { cursor })

      result.seeded += batch.seeded
      result.skipped += batch.skipped
      result.alreadyExisted += batch.alreadyExisted
      result.errors.push(...batch.errors.slice(0, 5))
      result.batchesRun++

      if (batch.isDone || !batch.continueCursor) {
        break
      }
      cursor = batch.continueCursor
    }

    result.totalProcessed = result.seeded + result.skipped + result.alreadyExisted
    return result
  },
})
