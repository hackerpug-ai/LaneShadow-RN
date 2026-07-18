/**
 * AC-3: Couch-sample renders each route as map PNG with provenance +
 * measured-vs-claimed lengths.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real PNG rendering + metadata export)
 * FLOW_REF: UC-VER-05
 *
 * Anti-stub: PNGs must be real route maps (≥200×200), not the constant 1×1
 * MIN_PNG placeholder, and different geometries must produce different bytes.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T6/evidence')
const EXPORT_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T6/export')

/** Known 1×1 red stub that must never be returned by the real renderer. */
const MIN_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t6-couch-render-pngs',
  issuer: 'https://laneshadow.test',
})

/** Read PNG IHDR width/height from a base64-encoded PNG. */
function readPngDimensions(pngBase64: string): { width: number; height: number } {
  const buf = Buffer.from(pngBase64, 'base64')
  // Signature (8) + IHDR length (4) + "IHDR" (4) + width (4) + height (4)
  if (buf.length < 24) {
    throw new Error(`PNG too short (${buf.length} bytes) to contain IHDR`)
  }
  const sig = buf.subarray(0, 8).toString('hex')
  if (sig !== '89504e470d0a1a0a') {
    throw new Error(`Invalid PNG signature: ${sig}`)
  }
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  return { width, height }
}

interface RunResult {
  ok: boolean
  stdout: string
  stderr: string
}

function execNpx(cmd: string[]): RunResult {
  try {
    const stdout = execFileSync('npx', cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 300000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true, stdout, stderr: '' }
  } catch (err: any) {
    const stdout = typeof err.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    return { ok: false, stdout, stderr }
  }
}

function runConvexFn(
  fn: string,
  args: Record<string, unknown> = {},
  opts: { identity?: boolean } = {},
): RunResult {
  const cmd = ['convex', 'run', fn, JSON.stringify(args)]
  if (opts.identity) cmd.push('--identity', TEST_IDENTITY)
  return execNpx(cmd)
}

describe('AC-3: Couch-sample export renders PNG + metadata per route', () => {
  let sample: any
  let exportResult: any
  let pngFiles: string[] = []
  let metadataCatalog: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    mkdirSync(EXPORT_DIR, { recursive: true })

    const seed = runConvexFn('couchSampleAssembler:seedCouchFixtures', {}, { identity: true })
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const assemble = runConvexFn(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25 },
      { identity: true },
    )
    expect(assemble.ok, `assemble failed: ${assemble.stderr}\n${assemble.stdout}`).toBe(true)
    sample = JSON.parse(assemble.stdout)

    const exp = runConvexFn(
      // Node-runtime export (zlib-compressed PNG IDAT) — see couchSampleExport.ts
      'couchSampleExport:exportCouchSample',
      { sampleId: sample.sampleId },
      { identity: true },
    )
    expect(exp.ok, `export failed: ${exp.stderr}\n${exp.stdout}`).toBe(true)
    exportResult = JSON.parse(exp.stdout)

    // Materialize PNG + metadata artifacts from Convex export payload
    for (const item of exportResult.routes ?? []) {
      const safeId = String(item.routeId).replace(/[^a-zA-Z0-9:_-]/g, '_')
      const pngPath = resolve(EXPORT_DIR, `${safeId}.png`)
      writeFileSync(pngPath, Buffer.from(item.pngBase64, 'base64'))
      writeFileSync(
        resolve(EXPORT_DIR, `${safeId}.meta.json`),
        JSON.stringify(item.metadata, null, 2),
      )
    }
    writeFileSync(
      resolve(EXPORT_DIR, 'catalog.json'),
      JSON.stringify(
        {
          sampleId: exportResult.sampleId,
          routes: (exportResult.routes ?? []).map((r: any) => r.metadata),
        },
        null,
        2,
      ),
    )

    pngFiles = readdirSync(EXPORT_DIR).filter((f) => f.endsWith('.png'))
    metadataCatalog = JSON.parse(
      // catalog always written above
      require('node:fs').readFileSync(resolve(EXPORT_DIR, 'catalog.json'), 'utf-8'),
    )

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-couch-render-pngs.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          sampleSize: sample.routes?.length,
          pngCount: pngFiles.length,
          pngFiles,
          catalog: metadataCatalog,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('couchSampleAssembler:teardownCouchFixtures', {}, { identity: true })
  })

  // TC-3 CASE 1 — couch-render-pngs
  it('MUST_OBSERVE: PNG count == sample size', () => {
    expect(pngFiles.length).toBe(sample.routes.length)
    expect(exportResult.routes?.length).toBe(sample.routes.length)
  })

  it("MUST_OBSERVE: metadata.provenance includes 'ai_reconstructed' literal", () => {
    const metas = metadataCatalog.routes ?? []
    const hasAi = metas.some((m: any) => m.provenance === 'ai_reconstructed')
    expect(hasAi).toBe(true)
  })

  it('MUST_OBSERVE: metadata has routedMiles 41.1 AND claimedMiles 41', () => {
    const metas = metadataCatalog.routes ?? []
    const match = metas.find((m: any) => m.routedMiles === 41.1 && m.claimedMiles === 41)
    expect(match, 'expected a route with routedMiles=41.1 and claimedMiles=41').toBeTruthy()
    expect(match.provenance).toBeTruthy()
  })

  it('MUST_NOT_OBSERVE: PNG files missing or metadata incomplete', () => {
    expect(pngFiles.length).toBeGreaterThan(0)
    for (const f of pngFiles) {
      expect(existsSync(resolve(EXPORT_DIR, f))).toBe(true)
    }
    for (const m of metadataCatalog.routes ?? []) {
      expect(m.provenance).toBeTruthy()
      expect(typeof m.routedMiles).toBe('number')
      expect(m.claimedMiles === null || typeof m.claimedMiles === 'number').toBe(true)
      expect(m.routeId).toBeTruthy()
    }
  })

  it('MUST_OBSERVE: each PNG is ≥200×200 (founder-reviewable map, not 1×1 stub)', () => {
    const dims: Array<{ routeId: string; width: number; height: number }> = []
    for (const item of exportResult.routes ?? []) {
      expect(item.pngBase64, `${item.routeId} missing pngBase64`).toBeTruthy()
      expect(
        item.pngBase64,
        `${item.routeId} still returns hardcoded MIN_PNG_BASE64 stub`,
      ).not.toBe(MIN_PNG_BASE64)
      const { width, height } = readPngDimensions(item.pngBase64)
      dims.push({ routeId: item.routeId, width, height })
      expect(width, `${item.routeId} width ${width}`).toBeGreaterThanOrEqual(200)
      expect(height, `${item.routeId} height ${height}`).toBeGreaterThanOrEqual(200)
    }
    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-png-dimensions.json'),
      JSON.stringify({ capturedAt: new Date().toISOString(), dims }, null, 2),
    )
  })

  it('MUST_OBSERVE: different route geometries produce different PNG bytes', () => {
    const routes = exportResult.routes ?? []
    expect(routes.length).toBeGreaterThanOrEqual(2)

    const pngByRoute = new Map<string, string>()
    for (const item of routes) {
      pngByRoute.set(item.routeId, item.pngBase64)
    }

    // Unique base64 payloads across the sample — geometry-driven render must not
    // collapse all routes to the same placeholder bytes.
    const uniquePngs = new Set(pngByRoute.values())
    expect(
      uniquePngs.size,
      `expected many unique map PNGs from stratified sample, got ${uniquePngs.size} unique of ${routes.length}`,
    ).toBeGreaterThanOrEqual(Math.min(10, routes.length))

    // Explicit pair check: PRD fixtures must not share identical map bytes.
    const scraped = pngByRoute.get('test:scraped-1')
    const ai = pngByRoute.get('test:ai-recon-1')
    const nameRouted = pngByRoute.get('test:name-routed-1')
    if (scraped && ai) {
      expect(scraped, 'scraped vs ai-recon maps must differ').not.toBe(ai)
    }
    if (scraped && nameRouted) {
      expect(scraped, 'scraped vs name-routed maps must differ').not.toBe(nameRouted)
    }
    if (ai && nameRouted) {
      expect(ai, 'ai-recon vs name-routed maps must differ').not.toBe(nameRouted)
    }

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-png-uniqueness.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          sampleSize: routes.length,
          uniquePngCount: uniquePngs.size,
          stubHits: routes.filter((r: any) => r.pngBase64 === MIN_PNG_BASE64).length,
        },
        null,
        2,
      ),
    )
  })
})
