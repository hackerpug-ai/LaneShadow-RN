/**
 * REDHAT-FIX-08 AC-5: Top-50 sorting normalizes compositeScore so mixed
 * 0–1 and 0–100 values compare correctly (0.9 outranks integer 85 → 0.85).
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-VER-05
 * start_ref: redhatfix08-mixed-composite-score-scale
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { normalizeCompositeScore } from '../lib/top50Eligibility'

/** Mirror of sortManifestRows ranking (avoids importing top50Review → geospatial). */
function sortByNormalizedScore<T extends { compositeScore: number; routeId: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const nb = normalizeCompositeScore(b.compositeScore)
    const na = normalizeCompositeScore(a.compositeScore)
    if (nb !== na) return nb - na
    return a.routeId.localeCompare(b.routeId)
  })
}

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-08/evidence')

const CLERK_USER = 's4t5-redhatfix08-scores'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const INT_ROUTE = 'test:redhatfix08-score-int-85'
const DEC_ROUTE = 'test:redhatfix08-score-dec-0.9'
const PREFIX = 'test:redhatfix08-score-'

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
      env: {
        ...process.env,
        CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT ?? 'dev:quirky-panther-164',
      },
    })
    return { ok: true, stdout, stderr: '' }
  } catch (err: any) {
    return {
      ok: false,
      stdout: typeof err.stdout === 'string' ? err.stdout : '',
      stderr: typeof err.stderr === 'string' ? err.stderr : '',
    }
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

describe('REDHAT-FIX-08 AC-5: compositeScore scale normalization in top-50 sort', () => {
  let manifest: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    // Clean prior fixtures
    for (const id of [INT_ROUTE, DEC_ROUTE]) {
      runConvexFn(
        'curatedGeometry:purgeRoutesByPrefix',
        { prefix: id, limit: 5 },
        { identity: true },
      )
    }

    const seed = runConvexFn(
      'top50Review:seedMixedCompositeScorePublic',
      {
        routes: [
          {
            routeId: INT_ROUTE,
            name: 'REDHAT-FIX-08 integer score 85',
            compositeScore: 85,
            riderReady: true,
            provenance: 'ai_reconstructed',
          },
          {
            routeId: DEC_ROUTE,
            name: 'REDHAT-FIX-08 decimal score 0.9',
            compositeScore: 0.9,
            riderReady: true,
            provenance: 'ai_reconstructed',
          },
        ],
      },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const exp = runConvexFn(
      'top50Review:exportTop50Manifest',
      { limit: 10, routeIdPrefix: PREFIX },
      { identity: true },
    )
    expect(exp.ok, `export failed: ${exp.stderr}\n${exp.stdout}`).toBe(true)
    manifest = parseJson(exp.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-5-compositeScore-normalization.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          normalize: {
            int85: normalizeCompositeScore(85),
            dec09: normalizeCompositeScore(0.9),
          },
          pureSort: sortByNormalizedScore([
            { routeId: INT_ROUTE, compositeScore: 85 },
            { routeId: DEC_ROUTE, compositeScore: 0.9 },
          ]).map((r) => r.routeId),
          manifest,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    for (const id of [INT_ROUTE, DEC_ROUTE]) {
      runConvexFn(
        'curatedGeometry:purgeRoutesByPrefix',
        { prefix: id, limit: 5 },
        { identity: true },
      )
    }
  }, 120_000)

  it('unit: normalizeCompositeScore maps 85→0.85 and leaves 0.9', () => {
    expect(normalizeCompositeScore(85)).toBe(0.85)
    expect(normalizeCompositeScore(0.9)).toBe(0.9)
    expect(normalizeCompositeScore(0.9)).toBeGreaterThan(normalizeCompositeScore(85))
  })

  it('unit: normalized sort ranks 0.9 above integer 85', () => {
    const ordered = sortByNormalizedScore([
      { routeId: INT_ROUTE, compositeScore: 85 },
      { routeId: DEC_ROUTE, compositeScore: 0.9 },
    ])
    expect(ordered[0].routeId).toBe(DEC_ROUTE)
    expect(ordered[1].routeId).toBe(INT_ROUTE)
  })

  it('TC-5: exportTop50Manifest ranks decimal 0.9 above integer 85 under same prefix', () => {
    expect(manifest).toBeTruthy()
    const rows = manifest.rows ?? []
    expect(rows.length).toBeGreaterThanOrEqual(2)

    const idxDec = rows.findIndex((r: any) => r.routeId === DEC_ROUTE)
    const idxInt = rows.findIndex((r: any) => r.routeId === INT_ROUTE)
    expect(idxDec, 'decimal 0.9 row missing').toBeGreaterThanOrEqual(0)
    expect(idxInt, 'integer 85 row missing').toBeGreaterThanOrEqual(0)
    // 0.9 must outrank normalized(85)=0.85
    expect(idxDec).toBeLessThan(idxInt)
    // Negative control: raw numeric compare would put 85 first
    expect(rows[0].routeId).not.toBe(INT_ROUTE)
  })
})
