'use node'

/**
 * Map Data Actions — R2 PMTiles Management
 *
 * Handles:
 * - Generating presigned R2 URLs for PMTiles access
 * - Health-checking the PMTiles file on R2
 * - Syncing PMTiles from Protomaps daily builds (extract + upload)
 */

import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v } from 'convex/values'
import { action, internalAction } from '../_generated/server'

// ---------------------------------------------------------------------------
// R2 Client
// ---------------------------------------------------------------------------

function getR2Client(): S3Client {
  const endpoint = process.env.R2_S3_API
  const accessKeyId = process.env.R2_S3_KEY_ID
  const secretAccessKey = process.env.R2_S3_SECRET

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 credentials. Set R2_S3_API, R2_S3_KEY_ID, R2_S3_SECRET env vars.')
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

function getBucket(): string {
  const bucket = process.env.R2_S3_BUCKET_NAME
  if (!bucket) throw new Error('Missing R2_S3_BUCKET_NAME env var')
  return bucket
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PMTILES_KEY = 'map-data/us-canada.pmtiles'
const PRESIGNED_URL_EXPIRY_SECONDS = 3600 // 1 hour
const PROTOMAPS_BUILD_BASE = 'https://build.protomaps.com'

// US + Canada bounding box: all 50 states + all Canadian provinces/territories
const US_CANADA_BBOX = '-170,24,-52,72'
const MAX_ZOOM = 14

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

/**
 * Check if PMTiles file exists on R2 and return metadata.
 * Used by cron to determine if sync is needed.
 */
export const healthCheck = internalAction({
  args: {},
  handler: async (): Promise<{
    exists: boolean
    sizeBytes?: number
    lastModified?: string
    key: string
  }> => {
    const client = getR2Client()
    const bucket = getBucket()

    try {
      const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: PMTILES_KEY }))

      return {
        exists: true,
        sizeBytes: result.ContentLength,
        lastModified: result.LastModified?.toISOString(),
        key: PMTILES_KEY,
      }
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return { exists: false, key: PMTILES_KEY }
      }
      throw error
    }
  },
})

// ---------------------------------------------------------------------------
// Generate Presigned URL
// ---------------------------------------------------------------------------

/**
 * Generate a presigned URL for reading PMTiles from R2.
 * This allows the PMTiles client to make HTTP range requests directly to R2.
 */
export const getPresignedUrl = internalAction({
  args: {},
  handler: async (): Promise<string> => {
    const client = getR2Client()
    const bucket = getBucket()

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: PMTILES_KEY,
    })

    const url = await getSignedUrl(client, command, {
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    })

    console.log(
      `[mapData] Generated presigned URL for ${PMTILES_KEY} (expires in ${PRESIGNED_URL_EXPIRY_SECONDS}s)`,
    )
    return url
  },
})

// ---------------------------------------------------------------------------
// List R2 Objects
// ---------------------------------------------------------------------------

/**
 * List all map data objects in R2 bucket.
 */
export const listMapData = internalAction({
  args: {},
  handler: async (): Promise<{ key: string; size: number; lastModified: string }[]> => {
    const client = getR2Client()
    const bucket = getBucket()

    const result = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'map-data/',
      }),
    )

    return (result.Contents ?? []).map((obj) => ({
      key: obj.Key ?? '',
      size: obj.Size ?? 0,
      lastModified: obj.LastModified?.toISOString() ?? '',
    }))
  },
})

// ---------------------------------------------------------------------------
// Sync PMTiles from Protomaps
// ---------------------------------------------------------------------------

/**
 * Sync PMTiles from Protomaps daily build.
 *
 * This action checks if we need to update our R2 copy, then downloads
 * a US West extract and uploads it to R2.
 *
 * NOTE: This uses pmtiles extract which requires the pmtiles CLI.
 * For Convex actions, we instead download the relevant tiles via HTTP range
 * requests from the Protomaps build URL and upload chunks to R2.
 *
 * For large extracts (5GB+), this should be run from a CI/CD pipeline
 * or local machine, not from a Convex action (10min timeout).
 *
 * This action handles the lightweight case: checking freshness and
 * triggering a notification if the data is stale.
 */
export const checkFreshness = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    status: 'fresh' | 'stale' | 'missing'
    ageInDays?: number
    message: string
  }> => {
    const client = getR2Client()
    const bucket = getBucket()

    try {
      const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: PMTILES_KEY }))

      if (!result.LastModified) {
        return {
          status: 'stale',
          message: 'PMTiles file exists but has no last-modified date',
        }
      }

      const ageMs = Date.now() - result.LastModified.getTime()
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))

      if (ageDays > 30) {
        console.warn(`[mapData] PMTiles file is ${ageDays} days old — consider updating`)
        return {
          status: 'stale',
          ageInDays: ageDays,
          message: `PMTiles file is ${ageDays} days old. Run: npx tsx scripts/sync-protomaps-r2.ts`,
        }
      }

      console.log(`[mapData] PMTiles file is ${ageDays} days old — fresh`)
      return {
        status: 'fresh',
        ageInDays: ageDays,
        message: `PMTiles file is ${ageDays} days old`,
      }
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        console.warn('[mapData] No PMTiles file found on R2')
        return {
          status: 'missing',
          message: 'No PMTiles file found on R2. Run: npx tsx scripts/sync-protomaps-r2.ts',
        }
      }
      throw error
    }
  },
})

// ---------------------------------------------------------------------------
// Check Freshness with Alert
// ---------------------------------------------------------------------------

/**
 * Core freshness check logic with alerting.
 *
 * This is extracted as a pure function for testability.
 * It takes a checkFreshness function and wraps it with alerting logic.
 */
export async function checkFreshnessWithAlertLogic(
  checkFreshnessFn: () => Promise<{
    status: 'fresh' | 'stale' | 'missing'
    ageInDays?: number
    message: string
  }>,
): Promise<{
  status: 'fresh' | 'stale' | 'missing'
  ageInDays?: number
  message: string
}> {
  // Call the provided checkFreshness function
  const result = await checkFreshnessFn()

  // Emit error log for stale or missing data
  if (result.status === 'stale' || result.status === 'missing') {
    console.error(
      '[LOG]',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        category: 'protomaps.error',
        message: 'Map data is stale or missing',
        data: result,
      }),
    )
  }

  return result
}

/**
 * Check freshness and emit error log for stale/missing data.
 *
 * Wraps checkFreshness and adds structured error logging when data is stale
 * or missing, for integration with monitoring/alerting systems.
 */
export const checkFreshnessWithAlert = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    status: 'fresh' | 'stale' | 'missing'
    ageInDays?: number
    message: string
  }> => {
    // Get the R2 client and bucket
    const client = getR2Client()
    const bucket = getBucket()

    try {
      const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: PMTILES_KEY }))

      if (!result.LastModified) {
        const staleResult = {
          status: 'stale' as const,
          message: 'PMTiles file exists but has no last-modified date',
        }
        return checkFreshnessWithAlertLogic(async () => staleResult)
      }

      const ageMs = Date.now() - result.LastModified.getTime()
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))

      if (ageDays > 30) {
        const staleResult = {
          status: 'stale' as const,
          ageInDays: ageDays,
          message: `PMTiles file is ${ageDays} days old. Run: npx tsx scripts/sync-protomaps-r2.ts`,
        }
        return checkFreshnessWithAlertLogic(async () => staleResult)
      }

      const freshResult = {
        status: 'fresh' as const,
        ageInDays: ageDays,
        message: `PMTiles file is ${ageDays} days old`,
      }
      return checkFreshnessWithAlertLogic(async () => freshResult)
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        const missingResult = {
          status: 'missing' as const,
          message: 'No PMTiles file found on R2. Run: npx tsx scripts/sync-protomaps-r2.ts',
        }
        return checkFreshnessWithAlertLogic(async () => missingResult)
      }
      throw error
    }
  },
})

// ---------------------------------------------------------------------------
// Upload PMTiles chunk (for script-driven upload)
// ---------------------------------------------------------------------------

/**
 * Upload a PMTiles file chunk to R2.
 * Called by the local sync script to upload in parts.
 */
export const uploadChunk = internalAction({
  args: {
    key: v.string(),
    partNumber: v.number(),
    totalParts: v.number(),
    data: v.string(), // base64-encoded chunk
  },
  handler: async (_ctx, args): Promise<{ uploaded: boolean }> => {
    const client = getR2Client()
    const bucket = getBucket()

    const buffer = Buffer.from(args.data, 'base64')

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: args.key,
        Body: buffer,
        ContentType: 'application/octet-stream',
      }),
    )

    console.log(
      `[mapData] Uploaded chunk ${args.partNumber}/${args.totalParts} for ${args.key} (${buffer.length} bytes)`,
    )

    return { uploaded: true }
  },
})
