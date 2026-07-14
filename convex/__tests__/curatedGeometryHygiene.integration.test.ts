/**
 * S3-T1: Score-scale ÷100 normalization at rest with dry-run preview (UC-HYG-01)
 *
 * Integration tests against the real Convex dev deployment.
 * Seeds curated_routes rows with out-of-scale (0–100) editorial scores via
 * curatedGeometryTestSupport, runs normalizeEditorialScores, and asserts
 * persisted values from direct table queries.
 *
 * Uses routeIdPrefix:'test:hyg-score-' for test isolation so that normalized
 * counts are deterministic regardless of the full catalog state.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')

const TEST_IDENTITY = JSON.stringify({
  subject: 'hygiene-score-normalization-test',
  issuer: 'https://laneshadow.test',
})

/** Prefix that isolates hygiene test rows from the rest of the catalog. */
const TEST_PREFIX = 'test:hyg-score-'

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
      timeout: 120000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true, stdout, stderr: '' }
  } catch (err: any) {
    const stdout = typeof err.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    return { ok: false, stdout, stderr }
  }
}

/** Convex CLI: positional JSON args. */
function runConvexFn(
  fn: string,
  args: Record<string, unknown> = {},
  opts: { identity?: boolean } = {},
): RunResult {
  const cmd = ['convex', 'run', fn, JSON.stringify(args)]
  if (opts.identity) cmd.push('--identity', TEST_IDENTITY)
  return execNpx(cmd)
}

/** Parse the JSON result from a convex run stdout. */
function parseResult(result: RunResult): any {
  if (!result.ok) {
    throw new Error(`Convex function failed: ${result.stderr || result.stdout}`)
  }
  const trimmed = result.stdout.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const lines = trimmed.split('\n')
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        return JSON.parse(lines[i])
      } catch {
        /* try next line */
      }
    }
    throw new Error(`Could not parse Convex output: ${trimmed}`)
  }
}

/** Query a curated_routes row by routeId via a test-support query. */
function getRouteByRouteId(routeId: string): any | null {
  const result = runConvexFn(
    'curatedGeometryTestSupport:getTestRoute',
    { routeId },
    { identity: true },
  )
  if (!result.ok) return null
  return parseResult(result)
}

/** Run normalizeEditorialScores scoped to test rows only. */
function runNormalize(opts: { dryRun?: boolean } = {}): any {
  return parseResult(
    runConvexFn('curatedGeometryHygiene:normalizeEditorialScores', {
      routeIdPrefix: TEST_PREFIX,
      ...(opts.dryRun ? { dryRun: true } : {}),
    }),
  )
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('S3-T1: Score-scale ÷100 normalization at rest', () => {
  beforeAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownHygieneScoreRows', {}, { identity: true })
    runConvexFn('curatedGeometryTestSupport:seedEditorialScoreRows', {}, { identity: true })
  }, 120_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownHygieneScoreRows', {}, { identity: true })
  })

  // ─────────────────────────────────────────────────────────────────────
  // AC-1 [PRIMARY]: ÷100 editorial scores at rest with counted change-set
  // ─────────────────────────────────────────────────────────────────────
  describe('AC-1: normalize-at-rest', () => {
    beforeAll(() => {
      runConvexFn('curatedGeometryTestSupport:teardownHygieneScoreRows', {}, { identity: true })
      runConvexFn('curatedGeometryTestSupport:seedEditorialScoreRows', {}, { identity: true })
    }, 120_000)
    it('divides composite and every dimension score by 100 at rest, stamps scoreScaleNormalizedAt, counts normalized', () => {
      const row90Before = getRouteByRouteId('test:hyg-score-90')
      expect(row90Before).not.toBeNull()
      expect(row90Before.compositeScore).toBe(90)

      const response = runNormalize()
      expect(response.normalized).toBe(3)

      const row90 = getRouteByRouteId('test:hyg-score-90')
      const row72 = getRouteByRouteId('test:hyg-score-72')
      const row85 = getRouteByRouteId('test:hyg-score-85')

      // compositeScore == 0.90 (was 90)
      expect(row90.compositeScore).toBeCloseTo(0.9, 5)

      // curvatureScore == 0.88 on test:hyg-score-90
      expect(row90.curvatureScore).toBeCloseTo(0.88, 5)

      // every dimension score on all 3 rows in [0,1]
      for (const row of [row90, row72, row85]) {
        expect(row.compositeScore).toBeLessThanOrEqual(1.0)
        expect(row.curvatureScore).toBeLessThanOrEqual(1.0)
        expect(row.scenicScore).toBeLessThanOrEqual(1.0)
        expect(row.technicalScore).toBeLessThanOrEqual(1.0)
        expect(row.trafficScore).toBeLessThanOrEqual(1.0)
        expect(row.remotenessScore).toBeLessThanOrEqual(1.0)
      }

      // scoreScaleNormalizedAt stamped on all 3 normalized rows
      for (const row of [row90, row72, row85]) {
        expect(row.scoreScaleNormalizedAt).toBeDefined()
        expect(typeof row.scoreScaleNormalizedAt).toBe('number')
        expect(row.scoreScaleNormalizedAt).toBeGreaterThan(0)
      }

      // MUST_NOT_OBSERVE: compositeScore == 90 (unchanged start value)
      expect(row90.compositeScore).not.toBe(90)
      expect(row72.compositeScore).not.toBe(72)
      expect(row85.compositeScore).not.toBe(85)
    }, 120_000)
  })

  // ─────────────────────────────────────────────────────────────────────
  // AC-2: dryRun previews the change-set and writes nothing
  // ─────────────────────────────────────────────────────────────────────
  describe('AC-2: dry-run', () => {
    beforeAll(() => {
      runConvexFn('curatedGeometryTestSupport:teardownHygieneScoreRows', {}, { identity: true })
      runConvexFn('curatedGeometryTestSupport:seedEditorialScoreRows', {}, { identity: true })
    }, 120_000)

    it('returns the preview change-set and writes NOTHING; committed run matches preview', () => {
      const dryRunResponse = runNormalize({ dryRun: true })

      // dry-run response normalized == 3
      expect(dryRunResponse.normalized).toBe(3)

      // after the dry-run, compositeScore == 90 (still unwritten)
      const rowAfterDryRun = getRouteByRouteId('test:hyg-score-90')
      expect(rowAfterDryRun.compositeScore).toBe(90)

      // Run committed
      const committedResponse = runNormalize()

      // committed run normalized == 3, matching the dry-run preview
      expect(committedResponse.normalized).toBe(3)
      expect(committedResponse.normalized).toBe(dryRunResponse.normalized)
      expect(committedResponse.scanned).toBe(dryRunResponse.scanned)
    }, 120_000)
  })

  // ─────────────────────────────────────────────────────────────────────
  // AC-3: Second run is a no-op (idempotent)
  // ─────────────────────────────────────────────────────────────────────
  describe('AC-3: idempotent', () => {
    beforeAll(() => {
      runConvexFn('curatedGeometryTestSupport:teardownHygieneScoreRows', {}, { identity: true })
      runConvexFn('curatedGeometryTestSupport:seedEditorialScoreRows', {}, { identity: true })
    }, 120_000)

    it('first pass normalizes 3 rows; second pass is a no-op', () => {
      const firstResponse = runNormalize()

      // first-pass normalized == 3 (non-degenerate)
      expect(firstResponse.normalized).toBe(3)

      // Verify compositeScore is now 0.90
      const rowAfterFirst = getRouteByRouteId('test:hyg-score-90')
      expect(rowAfterFirst.compositeScore).toBeCloseTo(0.9, 5)

      // Second committed pass
      const secondResponse = runNormalize()

      // second-run normalized == 0 (no-op)
      expect(secondResponse.normalized).toBe(0)

      // compositeScore == 0.90 unchanged (not 0.009)
      const rowAfterSecond = getRouteByRouteId('test:hyg-score-90')
      expect(rowAfterSecond.compositeScore).toBeCloseTo(0.9, 5)
      expect(rowAfterSecond.compositeScore).not.toBeCloseTo(0.009, 5)
    }, 120_000)
  })

  // ─────────────────────────────────────────────────────────────────────
  // AC-4: No composite > 1.0 invariant; in-scale rows untouched
  // ─────────────────────────────────────────────────────────────────────
  describe('AC-4: invariant', () => {
    beforeAll(() => {
      runConvexFn('curatedGeometryTestSupport:teardownHygieneScoreRows', {}, { identity: true })
      runConvexFn('curatedGeometryTestSupport:seedEditorialScoreRows', {}, { identity: true })
      runConvexFn('curatedGeometryTestSupport:seedInScaleControlRow', {}, { identity: true })
    }, 120_000)

    it('in-scale control row is unchanged; no seeded row has compositeScore > 1.0 after pass', () => {
      // Run committed — note: the in-scale control row has routeId test:hyg-score-inscale
      // which matches the prefix, so it will be scanned but NOT normalized (value ≤ 1 guard)
      const response = runNormalize()

      // 3 out-of-scale rows normalized (the in-scale row is scanned but not normalized)
      expect(response.normalized).toBe(3)

      const inScaleRow = getRouteByRouteId('test:hyg-score-inscale')

      // in-scale control compositeScore == 0.85 (unchanged)
      expect(inScaleRow.compositeScore).toBeCloseTo(0.85, 5)
      expect(inScaleRow.compositeScore).not.toBeCloseTo(0.0085, 6)

      // in-scale control dimensions unchanged
      expect(inScaleRow.curvatureScore).toBeCloseTo(0.88, 5)
      expect(inScaleRow.scenicScore).toBeCloseTo(0.84, 5)
      expect(inScaleRow.technicalScore).toBeCloseTo(0.8, 5)
      expect(inScaleRow.trafficScore).toBeCloseTo(0.76, 5)
      expect(inScaleRow.remotenessScore).toBeCloseTo(0.7, 5)

      // 0 seeded rows with compositeScore > 1.0 after the pass
      const allRouteIds = [
        'test:hyg-score-90',
        'test:hyg-score-72',
        'test:hyg-score-85',
        'test:hyg-score-inscale',
      ]
      for (const routeId of allRouteIds) {
        const row = getRouteByRouteId(routeId)
        expect(row).not.toBeNull()
        expect(row.compositeScore).toBeLessThanOrEqual(1.0)
      }
    }, 120_000)
  })

  // ─────────────────────────────────────────────────────────────────────
  // REDHAT-FIX-001: Mixed-scale dimension guards through the real handler
  // ─────────────────────────────────────────────────────────────────────

  /** Prefix that isolates mixed-scale hygiene test rows. */
  const MIXED_PREFIX = 'test:hyg-mixed-'

  /** Run normalizeEditorialScores scoped to mixed-scale test rows only. */
  function runMixedNormalize(opts: { dryRun?: boolean } = {}): any {
    return parseResult(
      runConvexFn('curatedGeometryHygiene:normalizeEditorialScores', {
        routeIdPrefix: MIXED_PREFIX,
        ...(opts.dryRun ? { dryRun: true } : {}),
      }),
    )
  }

  describe('REDHAT-FIX-001: mixed-scale dimension guards', () => {
    // Shared handler response — all 3 rows exercised by a single run
    let response: any

    beforeAll(() => {
      // Clean slate + seed all 3 mixed-scale rows
      runConvexFn('curatedGeometryTestSupport:teardownHygieneScoreRows', {}, { identity: true })
      runConvexFn('curatedGeometryTestSupport:seedMixedScaleRows', {}, { identity: true })

      // Run the REAL handler once — exercises all 3 rows in a single pass
      response = runMixedNormalize()
    }, 120_000)

    afterAll(() => {
      runConvexFn('curatedGeometryTestSupport:teardownHygieneScoreRows', {}, { identity: true })
    })

    // ───────────────────────────────────────────────────────────────────
    // AC-1 [PRIMARY]: mixed-scale — only out-of-scale dimensions ÷100
    // ───────────────────────────────────────────────────────────────────
    describe('mixed-scale', () => {
      it('only divides out-of-scale dimensions; in-scale dimensions stay byte-for-byte unchanged', () => {
        const row = getRouteByRouteId('test:hyg-mixed-001')
        expect(row).not.toBeNull()

        // response.normalized >= 1 (the mixed-scale row was processed)
        expect(response.normalized).toBeGreaterThanOrEqual(1)

        // In-scale dimensions — STRICT equality (byte-for-byte unchanged)
        expect(row.compositeScore).toBe(0.85)
        expect(row.scenicScore).toBe(0.84)
        expect(row.trafficScore).toBe(0.76)

        // Out-of-scale dimensions — ÷100 (toBeCloseTo precision 5)
        expect(row.curvatureScore).toBeCloseTo(0.88, 5)
        expect(row.technicalScore).toBeCloseTo(0.75, 5)
        expect(row.remotenessScore).toBeCloseTo(0.7, 5)

        // scoreScaleNormalizedAt stamped
        expect(row.scoreScaleNormalizedAt).toBeDefined()
        expect(typeof row.scoreScaleNormalizedAt).toBe('number')
        expect(row.scoreScaleNormalizedAt).toBeGreaterThan(0)

        // MUST_NOT_OBSERVE: in-scale values divided (the bug)
        expect(row.compositeScore).not.toBeCloseTo(0.0085, 6)
        expect(row.scenicScore).not.toBeCloseTo(0.0084, 6)
        expect(row.trafficScore).not.toBeCloseTo(0.0076, 6)

        // MUST_NOT_OBSERVE: out-of-scale value unchanged (no normalization)
        expect(row.curvatureScore).not.toBe(88)
      }, 120_000)
    })

    // ───────────────────────────────────────────────────────────────────
    // AC-2: all-in-scale control — completely untouched
    // ───────────────────────────────────────────────────────────────────
    describe('all-in-scale', () => {
      it('row is scanned but NOT normalized — every score field unchanged, no stamp', () => {
        const row = getRouteByRouteId('test:hyg-mixed-all-inscale')
        expect(row).not.toBeNull()

        // Every score field unchanged (strict equality)
        expect(row.compositeScore).toBe(0.9)
        expect(row.curvatureScore).toBe(0.88)
        expect(row.scenicScore).toBe(0.84)
        expect(row.technicalScore).toBe(0.8)
        expect(row.trafficScore).toBe(0.76)
        expect(row.remotenessScore).toBe(0.7)

        // scoreScaleNormalizedAt NOT stamped (row was not normalized)
        expect(row.scoreScaleNormalizedAt).toBeUndefined()
      }, 120_000)
    })

    // ───────────────────────────────────────────────────────────────────
    // AC-3: all-out-of-scale regression guard — all dimensions ÷100
    // ───────────────────────────────────────────────────────────────────
    describe('all-out-regression', () => {
      it('all dimensions still ÷100 — regression guard for the original path', () => {
        const row = getRouteByRouteId('test:hyg-mixed-all-out')
        expect(row).not.toBeNull()

        // ALL score fields ÷100 (toBeCloseTo precision 5)
        expect(row.compositeScore).toBeCloseTo(0.9, 5)
        expect(row.curvatureScore).toBeCloseTo(0.88, 5)
        expect(row.scenicScore).toBeCloseTo(0.84, 5)
        expect(row.technicalScore).toBeCloseTo(0.8, 5)
        expect(row.trafficScore).toBeCloseTo(0.76, 5)
        expect(row.remotenessScore).toBeCloseTo(0.7, 5)

        // scoreScaleNormalizedAt stamped
        expect(row.scoreScaleNormalizedAt).toBeDefined()
        expect(typeof row.scoreScaleNormalizedAt).toBe('number')
        expect(row.scoreScaleNormalizedAt).toBeGreaterThan(0)

        // MUST_NOT_OBSERVE: any score still > 1.0
        expect(row.compositeScore).toBeLessThanOrEqual(1.0)
        expect(row.curvatureScore).toBeLessThanOrEqual(1.0)
        expect(row.scenicScore).toBeLessThanOrEqual(1.0)
        expect(row.technicalScore).toBeLessThanOrEqual(1.0)
        expect(row.trafficScore).toBeLessThanOrEqual(1.0)
        expect(row.remotenessScore).toBeLessThanOrEqual(1.0)

        // MUST_NOT_OBSERVE: compositeScore unchanged at 90
        expect(row.compositeScore).not.toBe(90)
      }, 120_000)
    })
  })
})
