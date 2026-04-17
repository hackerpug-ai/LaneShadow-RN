#!/usr/bin/env tsx

/**
 * Sync Protomaps PMTiles to R2
 *
 * Downloads a US West extract from the latest Protomaps daily build
 * and uploads it to our Cloudflare R2 bucket.
 *
 * Usage:
 *   npx tsx scripts/sync-protomaps-r2.ts
 *
 * Prerequisites:
 *   - pmtiles CLI installed: npm install -g pmtiles
 *   - R2 credentials in .env.local (R2_S3_*)
 *   - @aws-sdk/client-s3 installed
 *
 * This script:
 *   1. Checks the latest Protomaps build date
 *   2. Extracts US West region (bbox: -125,32,-100,49, maxzoom 14)
 *   3. Uploads to R2 at map-data/us-west.pmtiles
 *   4. Sets PROTOMAPS_US_URL in Convex
 */

import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { execSync } from 'child_process'
import * as dotenv from 'dotenv'
import { existsSync, readFileSync, statSync, unlinkSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const R2_ENDPOINT = process.env.R2_S3_API!
const R2_KEY_ID = process.env.R2_S3_KEY_ID!
const R2_SECRET = process.env.R2_S3_SECRET!
const R2_BUCKET = process.env.R2_S3_BUCKET_NAME!

const PMTILES_KEY = 'map-data/us-west.pmtiles'
const US_WEST_BBOX = '-125,32,-100,49'
const MAX_ZOOM = '14'

function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_KEY_ID,
      secretAccessKey: R2_SECRET,
    },
  })
}

function getBuildDate(): string {
  // Use today's date formatted as YYYYMMDD
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
}

async function checkR2Freshness(): Promise<{ exists: boolean; ageDays?: number }> {
  const client = getR2Client()

  try {
    const result = await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: PMTILES_KEY }))

    if (result.LastModified) {
      const ageMs = Date.now() - result.LastModified.getTime()
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))
      return { exists: true, ageDays }
    }

    return { exists: true }
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return { exists: false }
    }
    throw error
  }
}

async function generatePresignedUrl(): Promise<string> {
  const client = getR2Client()
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: PMTILES_KEY,
  })
  return getSignedUrl(client, command, { expiresIn: 3600 })
}

async function main() {
  console.log('🗺️  Protomaps R2 Sync')
  console.log('====================\n')

  // Check prerequisites
  if (!R2_ENDPOINT || !R2_KEY_ID || !R2_SECRET || !R2_BUCKET) {
    console.error('❌ Missing R2 credentials in .env.local')
    console.error('   Required: R2_S3_API, R2_S3_KEY_ID, R2_S3_SECRET, R2_S3_BUCKET_NAME')
    process.exit(1)
  }

  // Check if pmtiles CLI is available
  try {
    execSync('npx pmtiles --version', { stdio: 'pipe' })
  } catch {
    console.error('❌ pmtiles CLI not found. Install: npm install -g pmtiles')
    process.exit(1)
  }

  // Check current R2 state
  console.log('🔍 Checking R2 bucket...')
  const r2State = await checkR2Freshness()

  if (r2State.exists && r2State.ageDays !== undefined) {
    console.log(`   Found existing file, ${r2State.ageDays} days old`)

    if (r2State.ageDays < 7) {
      console.log('   ✅ File is fresh (< 7 days old). Skipping sync.')
      console.log('   Use --force to sync anyway.')

      if (!process.argv.includes('--force')) {
        // Still generate and set the presigned URL
        await setConvexUrl()
        return
      }
      console.log('   --force flag detected, proceeding with sync...\n')
    }
  } else {
    console.log('   No existing file found')
  }

  // Get build date
  const buildDate = getBuildDate()
  const buildUrl = `https://build.protomaps.com/${buildDate}.pmtiles`
  const localFile = `us-west-${buildDate}.pmtiles`

  console.log(`\n📥 Extracting US West from ${buildUrl}`)
  console.log(`   BBOX: ${US_WEST_BBOX}`)
  console.log(`   Max zoom: ${MAX_ZOOM}`)
  console.log(`   Output: ${localFile}`)
  console.log('   This may take 10-30 minutes...\n')

  // Extract US West region
  try {
    execSync(
      `npx pmtiles extract "${buildUrl}" "${localFile}" --bbox="${US_WEST_BBOX}" --maxzoom=${MAX_ZOOM}`,
      { stdio: 'inherit' },
    )
  } catch (error) {
    // If today's build isn't available yet, try yesterday
    console.warn(`\n⚠️  Build for ${buildDate} may not be ready. Trying yesterday...`)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDate = `${yesterday.getFullYear()}${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}`
    const yesterdayUrl = `https://build.protomaps.com/${yesterdayDate}.pmtiles`

    execSync(
      `npx pmtiles extract "${yesterdayUrl}" "${localFile}" --bbox="${US_WEST_BBOX}" --maxzoom=${MAX_ZOOM}`,
      { stdio: 'inherit' },
    )
  }

  if (!existsSync(localFile)) {
    console.error('❌ Extract failed — no output file')
    process.exit(1)
  }

  const fileSize = statSync(localFile).size
  const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1)
  console.log(`\n✅ Extract complete: ${localFile} (${fileSizeMB} MB)`)

  // Upload to R2
  console.log(`\n☁️  Uploading to R2: ${R2_BUCKET}/${PMTILES_KEY}`)
  console.log('   This may take 5-15 minutes...\n')

  const client = getR2Client()
  const fileBuffer = readFileSync(localFile)

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: PMTILES_KEY,
      Body: fileBuffer,
      ContentType: 'application/octet-stream',
    }),
  )

  console.log('✅ Upload complete')

  // Set Convex env var
  await setConvexUrl()

  // Cleanup local file
  console.log(`\n🧹 Cleaning up ${localFile}...`)
  unlinkSync(localFile)

  console.log('\n🎉 Sync complete!')
  console.log(`   R2 key: ${PMTILES_KEY}`)
  console.log(`   Size: ${fileSizeMB} MB`)
  console.log('   PROTOMAPS_US_URL set in Convex')
}

async function setConvexUrl() {
  console.log('\n⚙️  Setting PROTOMAPS_US_URL in Convex...')
  const presignedUrl = await generatePresignedUrl()

  // For Convex, we need a stable URL. Presigned URLs expire.
  // Instead, set the S3-style URL that the action can use to generate presigned URLs on-the-fly.
  // The protomapsProvider will use the presigned URL generated by the mapData action.
  // For now, set a marker so the provider knows to use R2.
  const r2Url = `${R2_ENDPOINT}/${R2_BUCKET}/${PMTILES_KEY}`

  try {
    execSync(`npx convex env set PROTOMAPS_US_URL "${r2Url}"`, { stdio: 'inherit' })
    console.log('✅ PROTOMAPS_US_URL set in Convex')
  } catch {
    console.warn('⚠️  Could not set Convex env var automatically.')
    console.log(`   Set manually: npx convex env set PROTOMAPS_US_URL "${r2Url}"`)
  }
}

main().catch((error) => {
  console.error('❌ Sync failed:', error)
  process.exit(1)
})
