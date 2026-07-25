/**
 * AC-1 [PRIMARY]: Top-50 manifest is exactly the real rank-ordered ready surface.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real indexed rider-ready compositeScore query)
 * FLOW_REF: UC-VER-05 / T-VER-020
 *
 * Anti-stub: ranking comes from by_riderReady_and_composite_score; non-ready
 * higher-score rows must not enter the manifest.
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S5-T3/evidence')
const PREFIX = 'test:s5t3-manifest-'

const TEST_IDENTITY = JSON.stringify({
  subject: 'test:s5t3-manifest',
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

function parseJson(stdout: string): any {
  try {
    return JSON.parse(stdout)
  } catch {
    return null
  }
}

describe('AC-1: Top-50 manifest is real rank-ordered rider-ready surface', () => {
  let seedResult: any
  let manifest: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 'test:s5t3-manifest', role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    // Teardown any prior fixtures for this prefix
    runConvexFn('top50Review:teardownTop50FixturesPublic', { prefix: PREFIX }, { identity: true })

    const seed = runConvexFn(
      'top50Review:seedTop50FixturesPublic',
      { prefix: PREFIX, readyCount: 50, nonReadyCount: 5 },
      { identity: true },
    )
    expect(seed.ok, `seedTop50Fixtures failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
    seedResult = parseJson(seed.stdout)

    const exp = runConvexFn(
      'top50Review:exportTop50Manifest',
      { limit: 50, routeIdPrefix: PREFIX },
      { identity: true },
    )
    expect(exp.ok, `exportTop50Manifest failed: ${exp.stderr}\n${exp.stdout}`).toBe(true)
    manifest = parseJson(exp.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-top-50-manifest.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          seedResult,
          manifest,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn('top50Review:teardownTop50FixturesPublic', { prefix: PREFIX }, { identity: true })
  })

  it('MUST_OBSERVE: manifest.rowCount == 50 (exactly first 50 eligible ready rows)', () => {
    expect(manifest).toBeTruthy()
    expect(manifest.rowCount).toBe(50)
    expect(manifest.rows?.length).toBe(50)
  })

  it('MUST_OBSERVE: rows are score-descending with deterministic tie-break', () => {
    const rows = manifest.rows ?? []
    for (let i = 0; i < rows.length - 1; i++) {
      const a = rows[i]
      const b = rows[i + 1]
      expect(a.compositeScore).toBeGreaterThanOrEqual(b.compositeScore)
      if (a.compositeScore === b.compositeScore) {
        expect(a.routeId.localeCompare(b.routeId)).toBeLessThanOrEqual(0)
      }
    }
  })

  it('MUST_OBSERVE: each row has routeId/name/score/provenance/measured/claimed/geometryRef', () => {
    for (const row of manifest.rows ?? []) {
      expect(row.routeId?.length).toBeGreaterThanOrEqual(1)
      expect(row.name?.length).toBeGreaterThanOrEqual(1)
      expect(typeof row.compositeScore).toBe('number')
      expect(row.provenance?.length).toBeGreaterThanOrEqual(1)
      expect(typeof row.measuredMiles).toBe('number')
      expect(typeof row.claimedMiles === 'number' || row.claimedMiles === null).toBe(true)
      expect(row.geometryRef?.length).toBeGreaterThanOrEqual(1)
      expect(row.riderReady).toBe(true)
    }
  })

  it('MUST_NOT_OBSERVE: non-ready row (including higher-score 0.995) in manifest', () => {
    const rows = manifest.rows ?? []
    for (const row of rows) {
      expect(row.riderReady).toBe(true)
      expect(row.routeId).not.toMatch(/nonready/)
    }
    // Explicit negative control: highest non-ready score must not appear
    const nonReadyIds = (seedResult?.nonReadyRouteIds ?? []) as string[]
    for (const id of nonReadyIds) {
      expect(rows.some((r: any) => r.routeId === id)).toBe(false)
    }
    // Seeded high-score non-ready (compositeScore ~0.995 scale or 99.5)
    const highNonReady = nonReadyIds[0]
    if (highNonReady) {
      expect(rows.find((r: any) => r.routeId === highNonReady)).toBeUndefined()
    }
  })

  it('MUST_NOT_OBSERVE: empty manifest after seeding 50 riderReady rows', () => {
    expect(manifest.rowCount).not.toBe(0)
    expect(seedResult?.readyRouteIds?.length).toBe(50)
  })

  it('MUST_OBSERVE: ordering matches indexed ready surface (no client re-sort fixture list)', () => {
    // Re-query and confirm identical order (server is source of truth)
    const again = runConvexFn(
      'top50Review:exportTop50Manifest',
      { limit: 50, routeIdPrefix: PREFIX },
      { identity: true },
    )
    expect(again.ok).toBe(true)
    const m2 = parseJson(again.stdout)
    const ids1 = (manifest.rows ?? []).map((r: any) => r.routeId)
    const ids2 = (m2.rows ?? []).map((r: any) => r.routeId)
    expect(ids2).toEqual(ids1)
    // Highest score first
    expect(manifest.rows[0].compositeScore).toBeGreaterThanOrEqual(
      manifest.rows[manifest.rows.length - 1].compositeScore,
    )
  })
})
