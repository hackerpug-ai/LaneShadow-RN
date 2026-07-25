#!/usr/bin/env tsx

/**
 * S5-T3: Operator top-50 composite-rank review harness.
 *
 * Queries the real indexed rider-ready surface, writes a local manifest,
 * and optionally renders per-route map PNGs + metadata from geometry.
 * Image bytes stay local — Convex receives only IDs/metadata queries.
 *
 * Usage:
 *   pnpm tsx scripts/top-50-curated-review.ts
 *   pnpm tsx scripts/top-50-curated-review.ts --render
 *   pnpm tsx scripts/top-50-curated-review.ts --render --prefix=test:s5t3- --out=.tmp/top-50-review
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { deflateSync } from 'node:zlib'
import { renderRouteMapPngBase64 } from '../convex/couchRouteMapPng'

type ManifestRow = {
  routeId: string
  name: string
  compositeScore: number
  provenance: string
  measuredMiles: number
  claimedMiles: number | null
  geometryRef: string
  riderReady: boolean
  rank: number
}

type Manifest = {
  rowCount: number
  limit: number
  query: Record<string, unknown>
  rows: ManifestRow[]
}

type GeometryInfo = {
  polyline: string | null
  provenance: string | null
  measuredMiles: number | null
  claimedMiles: number | null
  name: string | null
}

function parseArgs(argv: string[]): {
  render: boolean
  prefix: string | null
  out: string
  identity: string | null
  limit: number
} {
  let render = false
  let prefix: string | null = null
  let out = path.resolve(process.cwd(), '.tmp', 'top-50-review')
  let identity: string | null = null
  let limit = 50
  for (const arg of argv.slice(2)) {
    if (arg === '--render') render = true
    else if (arg.startsWith('--prefix=')) prefix = arg.slice('--prefix='.length)
    else if (arg.startsWith('--out=')) out = path.resolve(process.cwd(), arg.slice('--out='.length))
    else if (arg.startsWith('--identity=')) identity = arg.slice('--identity='.length)
    else if (arg.startsWith('--limit=')) limit = Number(arg.slice('--limit='.length)) || 50
    else if (arg === '--help' || arg === '-h') {
      process.stdout.write(`
S5-T3 top-50 curated review harness

Usage:
  pnpm tsx scripts/top-50-curated-review.ts
  pnpm tsx scripts/top-50-curated-review.ts --render
  pnpm tsx scripts/top-50-curated-review.ts --render --prefix=test:s5t3- --out=.tmp/top-50-review
`)
      process.exit(0)
    }
  }
  return { render, prefix, out, identity, limit }
}

function runConvex(fn: string, args: Record<string, unknown>, identity: string | null): string {
  const cmd = ['convex', 'run', fn, JSON.stringify(args)]
  if (identity) {
    cmd.push('--identity', identity)
  }
  return execFileSync('npx', cmd, {
    cwd: process.cwd(),
    encoding: 'utf-8',
    timeout: 300000,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function compressZlib(raw: Uint8Array): Uint8Array {
  return deflateSync(raw, { level: 9 })
}

function safeFileId(routeId: string): string {
  return routeId.replace(/[^a-zA-Z0-9:_-]/g, '_')
}

function main(): void {
  const { render, prefix, out, identity, limit } = parseArgs(process.argv)
  fs.mkdirSync(out, { recursive: true })

  const payload: Record<string, unknown> = { limit }
  if (prefix) payload.routeIdPrefix = prefix

  // Convex query only — IDs + metadata, never images
  const manifestRaw = runConvex('top50Review:exportTop50Manifest', payload, identity)
  const manifest = JSON.parse(manifestRaw) as Manifest

  const manifestPath = path.join(out, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  process.stdout.write(`Wrote manifest rowCount=${manifest.rowCount} → ${manifestPath}\n`)

  if (!render) {
    process.stdout.write(
      `${JSON.stringify({ ok: true, rowCount: manifest.rowCount, imageByteCount: 0, mode: 'manifest-only' })}\n`,
    )
    return
  }

  const routeIds = (manifest.rows ?? []).map((r) => r.routeId)
  const geomsRaw = runConvex('top50Review:getTop50Geometries', { routeIds }, identity)
  const geoms = JSON.parse(geomsRaw) as Record<string, GeometryInfo>

  const metadataRoutes: Array<Record<string, unknown>> = []
  const failedRows: Array<{ routeId: string; reason: string }> = []
  let pngCount = 0

  for (const row of manifest.rows ?? []) {
    const g = geoms[row.routeId]
    const polyline = g?.polyline ?? null
    if (!polyline || polyline.length === 0) {
      failedRows.push({ routeId: row.routeId, reason: 'missing_geometry' })
      continue
    }

    const pngBase64 = renderRouteMapPngBase64(
      {
        routeId: row.routeId,
        provenance: (g.provenance ?? row.provenance) as
          | 'scraped_promoted'
          | 'ai_reconstructed'
          | 'name_routed',
        routedMiles: g.measuredMiles ?? row.measuredMiles,
        claimedMiles: g.claimedMiles ?? row.claimedMiles,
        polyline,
      },
      compressZlib,
    )

    const safeId = safeFileId(row.routeId)
    const pngPath = path.join(out, `${safeId}.png`)
    fs.writeFileSync(pngPath, Buffer.from(pngBase64, 'base64'))
    pngCount += 1

    const meta = {
      routeId: row.routeId,
      name: g.name ?? row.name,
      provenance: g.provenance ?? row.provenance,
      measuredMiles: g.measuredMiles ?? row.measuredMiles,
      claimedMiles: g.claimedMiles ?? row.claimedMiles,
      compositeScore: row.compositeScore,
      geometryRef: row.geometryRef,
      rank: row.rank,
      pngPath: path.relative(process.cwd(), pngPath),
    }
    metadataRoutes.push(meta)
    fs.writeFileSync(path.join(out, `${safeId}.meta.json`), JSON.stringify(meta, null, 2))
  }

  const metadata = {
    rowCount: manifest.rowCount,
    pngCount,
    failedRows,
    routes: metadataRoutes,
    outputDir: out,
  }
  fs.writeFileSync(path.join(out, 'metadata.json'), JSON.stringify(metadata, null, 2))

  const status = failedRows.length === 0 && pngCount === manifest.rowCount ? 'ok' : 'fail'
  const reviewPacket = {
    status: status === 'ok' ? 'pending_human_review' : 'fail',
    rowCount: manifest.rowCount,
    pngCount,
    failedRows,
    imageByteCount: 0,
    convexImageByteCount: 0,
    convexMutationsWithImages: 0,
    note: 'PNGs rendered locally; Convex payloads contained only IDs/metadata',
  }
  fs.writeFileSync(path.join(out, 'review-packet.json'), JSON.stringify(reviewPacket, null, 2))

  const summary = {
    ok: status === 'ok',
    status: reviewPacket.status,
    rowCount: manifest.rowCount,
    pngCount,
    metadataEntryCount: metadataRoutes.length,
    failedRows,
    imageByteCount: 0,
    convexImageByteCount: 0,
    convexMutationsWithImages: 0,
    outputDir: out,
  }
  process.stdout.write(`${JSON.stringify(summary)}\n`)

  if (status !== 'ok') {
    process.exitCode = 1
  }
}

main()
