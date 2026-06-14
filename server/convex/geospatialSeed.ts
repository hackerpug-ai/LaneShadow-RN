import { internalAction, internalMutation } from './_generated/server'
import { geospatial } from './geospatialIndex'
import type { Doc } from './_generated/dataModel'

interface SeedResult {
  totalProcessed: number
  seeded: number
  skipped: number
  alreadyExisted: number
  errors: string[]
}

export const seedGeospatialIndex = internalMutation({
  args: {},
  handler: async (ctx): Promise<SeedResult> => {
    const result: SeedResult = {
      totalProcessed: 0,
      seeded: 0,
      skipped: 0,
      alreadyExisted: 0,
      errors: [],
    }

    // Process in batches using pagination
    let cursor: string | null = null
    const batchSize = 200

    while (true) {
      const page = await ctx.db
        .query('curated_routes')
        .paginate({ cursor: cursor ?? undefined, numItems: batchSize })

      for (const route of page.page) {
        result.totalProcessed++

        const lat = route.centroidLat
        const lng = route.centroidLng

        // Skip invalid centroids
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
          result.errors.push(
            `Skipped ${route.routeId}: invalid centroid (${lat}, ${lng})`,
          )
          continue
        }

        try {
          // Insert geospatial point (upsert — re-inserting with same key replaces)
          await geospatial.insert(
            ctx,
            route._id,
            { latitude: lat, longitude: lng },
            {
              state: route.state ?? 'Unknown',
              primaryArchetype: route.primaryArchetype ?? 'twisties',
            },
            route.compositeScore ?? 0,
          )
          result.seeded++
        } catch (error) {
          // If already exists, count as alreadyExisted
          const errMsg = error instanceof Error ? error.message : String(error)
          if (errMsg.includes('already') || errMsg.includes('duplicate') || errMsg.includes('exists')) {
            result.alreadyExisted++
          } else {
            result.skipped++
            result.errors.push(
              `Error seeding ${route.routeId}: ${errMsg}`,
            )
          }
        }
      }

      if (!page.continueCursor || page.isDone) {
        break
      }
      cursor = page.continueCursor
    }

    return result
  },
})