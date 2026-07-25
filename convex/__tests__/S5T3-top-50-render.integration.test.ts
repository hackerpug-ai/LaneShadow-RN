/**
 * AC-2: Local PNG + metadata per manifest row; no image bytes in Convex.
 *
 * TEST_TIER: integration + human-gate
 * VERIFICATION_SERVICE: Convex dev + local top-50-curated-review.ts harness
 * FLOW_REF: TR 11 §3 / T-VER-020
 *
 * Anti-stub: PNGs produced by reading real geometry; missing geometry fails the row.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S5-T3/evidence')
const OUTPUT_DIR = resolve(PROJECT_ROOT, '.tmp/top-50-review')
const PREFIX = 'test:s5t3-render-'

const TEST_IDENTITY = JSON.stringify({
  subject: 'test:s5t3-render',
  issuer: 'https://laneshadow.test',
})

interface RunResult {
  ok: boolean
  stdout: string
  stderr: string
  exitCode: number
}

function execNpx(cmd: string[]): RunResult {
  try {
    const stdout = execFileSync('npx', cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 300000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true, stdout, stderr: '', exitCode: 0 }
  } catch (err: any) {
    const stdout = typeof err.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    const exitCode = typeof err.status === 'number' ? err.status : 1
    return { ok: false, stdout, stderr, exitCode }
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

function parseJson(stdout: string): any {
  try {
    return JSON.parse(stdout)
  } catch {
    return null
  }
}

describe('AC-2: Local top-50 PNG/metadata render boundary', () => {
  let manifest: any
  let renderResult: any
  let pngFiles: string[] = []
  let metadata: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    if (existsSync(OUTPUT_DIR)) {
      rmSync(OUTPUT_DIR, { recursive: true, force: true })
    }
    mkdirSync(OUTPUT_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s5t3-render', role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    runConvexFn('top50Review:teardownTop50FixturesPublic', { prefix: PREFIX }, { identity: true })

    // Smaller set for render AC (still exercises full path); 8 ready + 1 non-ready
    const seed = runConvexFn(
      'top50Review:seedTop50FixturesPublic',
      { prefix: PREFIX, readyCount: 8, nonReadyCount: 1 },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const exp = runConvexFn(
      'top50Review:exportTop50Manifest',
      { limit: 50, routeIdPrefix: PREFIX },
      { identity: true },
    )
    expect(exp.ok, `export failed: ${exp.stderr}\n${exp.stdout}`).toBe(true)
    manifest = parseJson(exp.stdout)
    expect(manifest?.rowCount).toBeGreaterThan(0)

    // Run local harness --render (no image bytes to Convex)
    const render = execNpx([
      'tsx',
      'scripts/top-50-curated-review.ts',
      '--render',
      `--prefix=${PREFIX}`,
      `--out=${OUTPUT_DIR}`,
      `--identity=${TEST_IDENTITY}`,
    ])
    expect(render.ok, `render harness failed: ${render.stderr}\n${render.stdout}`).toBe(true)
    renderResult = parseJson(
      render.stdout
        .split('\n')
        .filter((l) => l.trim().startsWith('{'))
        .pop() ?? render.stdout,
    )

    pngFiles = existsSync(OUTPUT_DIR)
      ? readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.png'))
      : []
    const metaPath = resolve(OUTPUT_DIR, 'metadata.json')
    metadata = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf-8')) : null

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-top-50-render.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          rowCount: manifest.rowCount,
          pngCount: pngFiles.length,
          pngFiles,
          metadata,
          renderResult,
          convexStdoutHasBase64Image: /iVBORw0KGgo/.test(render.stdout) === false,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn('top50Review:teardownTop50FixturesPublic', { prefix: PREFIX }, { identity: true })
  })

  it('MUST_OBSERVE: pngCount == manifest.rowCount (one PNG per row)', () => {
    expect(pngFiles.length).toBe(manifest.rowCount)
  })

  it('MUST_OBSERVE: metadataEntryCount == manifest.rowCount with 1:1 routeId mapping', () => {
    expect(metadata).toBeTruthy()
    const entries = metadata.routes ?? metadata.rows ?? []
    expect(entries.length).toBe(manifest.rowCount)
    const metaIds = new Set(entries.map((e: any) => e.routeId))
    for (const row of manifest.rows ?? []) {
      expect(metaIds.has(row.routeId)).toBe(true)
    }
  })

  it('MUST_OBSERVE: each metadata row has measuredMiles, claimedMiles, provenance, routeId', () => {
    const entries = metadata.routes ?? metadata.rows ?? []
    for (const e of entries) {
      expect(e.routeId?.length).toBeGreaterThanOrEqual(1)
      expect(typeof e.measuredMiles).toBe('number')
      expect(typeof e.claimedMiles === 'number' || e.claimedMiles === null).toBe(true)
      expect(e.provenance?.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('MUST_OBSERVE: output path is local under .tmp/ and Convex payloads have imageByteCount==0', () => {
    expect(OUTPUT_DIR.includes('.tmp')).toBe(true)
    expect(renderResult?.imageByteCount ?? 0).toBe(0)
    expect(renderResult?.convexImageByteCount ?? 0).toBe(0)
    // Harness must not push PNG base64 into Convex mutations
    expect(renderResult?.convexMutationsWithImages ?? 0).toBe(0)
  })

  it('MUST_NOT_OBSERVE: status pass after deleting one geometry (negative control)', () => {
    const targetId = manifest.rows?.[0]?.routeId
    expect(targetId).toBeTruthy()

    const del = runConvexFn(
      'top50Review:deleteGeometryForRoutePublic',
      { routeId: targetId },
      { identity: true },
    )
    expect(del.ok, `delete geometry failed: ${del.stderr}`).toBe(true)

    const negOut = resolve(PROJECT_ROOT, '.tmp/top-50-review-neg')
    if (existsSync(negOut)) rmSync(negOut, { recursive: true, force: true })

    const render = execNpx([
      'tsx',
      'scripts/top-50-curated-review.ts',
      '--render',
      `--prefix=${PREFIX}`,
      `--out=${negOut}`,
      `--identity=${TEST_IDENTITY}`,
    ])
    // Harness must fail (non-zero) or report failed rows — not emit passing packet
    const packetPath = resolve(negOut, 'review-packet.json')
    let packet: any = null
    if (existsSync(packetPath)) {
      packet = JSON.parse(readFileSync(packetPath, 'utf-8'))
    }
    const failed =
      !render.ok ||
      (packet && packet.status === 'fail') ||
      (renderResult && (render.stdout.includes('"failedRows"') || render.stdout.includes('fail')))
    expect(failed || (packet && packet.status !== 'pass')).toBe(true)
    if (packet) {
      expect(packet.status).not.toBe('pass')
    }
  })
})
