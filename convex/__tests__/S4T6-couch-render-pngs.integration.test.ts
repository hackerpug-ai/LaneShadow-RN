/**
 * AC-3: Couch-sample renders each route as map PNG with provenance +
 * measured-vs-claimed lengths.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real PNG rendering + metadata export)
 * FLOW_REF: UC-VER-05
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T6/evidence')
const EXPORT_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T6/export')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t6-couch-render-pngs',
  issuer: 'https://laneshadow.test',
})

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
      'couchSampleAssembler:exportCouchSample',
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
})
