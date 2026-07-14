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
  const trimmed = result.stdout.trim()
  // Convex CLI outputs 'null' or empty when the query returns no doc
  if (trimmed === '' || trimmed === 'null') return null
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

// ---------------------------------------------------------------------------
// REDHAT-FIX-003: runId-namespace isolation for concurrent-dev deployments
// (F-4: concurrent test sessions don't collide on shared dev)
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-003: concurrent-namespaces', () => {
  beforeAll(() => {
    // Clean slate for both namespaces
    runConvexFn(
      'curatedGeometryTestSupport:teardownHygieneScoreRowsByRunId',
      { runId: 'alpha' },
      { identity: true },
    )
    runConvexFn(
      'curatedGeometryTestSupport:teardownHygieneScoreRowsByRunId',
      { runId: 'beta' },
      { identity: true },
    )
  }, 120_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometryTestSupport:teardownHygieneScoreRowsByRunId',
      { runId: 'alpha' },
      { identity: true },
    )
    runConvexFn(
      'curatedGeometryTestSupport:teardownHygieneScoreRowsByRunId',
      { runId: 'beta' },
      { identity: true },
    )
  }, 120_000)

  // ───────────────────────────────────────────────────────────────────
  // AC-1 [PRIMARY]: two namespaces coexist without collision
  // ───────────────────────────────────────────────────────────────────
  describe('concurrent-namespaces', () => {
    it('seed alpha and beta rows coexist — all 4 rows exist with correct values', () => {
      runConvexFn(
        'curatedGeometryTestSupport:seedEditorialScoreRowsNamespaced',
        { runId: 'alpha' },
        { identity: true },
      )
      runConvexFn(
        'curatedGeometryTestSupport:seedCustomScoreRowsNamespaced',
        { runId: 'beta' },
        { identity: true },
      )

      const alpha90 = getRouteByRouteId('test:hyg:alpha:score-90')
      const alpha72 = getRouteByRouteId('test:hyg:alpha:score-72')
      const beta85 = getRouteByRouteId('test:hyg:beta:score-85')
      const beta70 = getRouteByRouteId('test:hyg:beta:score-70')

      // AC-1 MUST_OBSERVE: all 4 rows exist with correct seeded values
      expect(alpha90).not.toBeNull()
      expect(alpha90.compositeScore).toBe(90)
      expect(alpha72).not.toBeNull()
      expect(alpha72.compositeScore).toBe(72)
      expect(beta85).not.toBeNull()
      expect(beta85.compositeScore).toBe(85)
      expect(beta70).not.toBeNull()
      expect(beta70.compositeScore).toBe(70)

      // MUST_NOT_OBSERVE: any row null (collision)
      for (const row of [alpha90, alpha72, beta85, beta70]) {
        expect(row).not.toBeNull()
      }
    }, 120_000)
  })

  // ───────────────────────────────────────────────────────────────────
  // AC-2: alpha teardown does not affect beta rows
  // ───────────────────────────────────────────────────────────────────
  describe('alpha-teardown-beta-safe', () => {
    it('teardown alpha deletes only alpha rows — beta rows remain unchanged', () => {
      // Seed both namespaces fresh
      runConvexFn(
        'curatedGeometryTestSupport:teardownHygieneScoreRowsByRunId',
        { runId: 'alpha' },
        { identity: true },
      )
      runConvexFn(
        'curatedGeometryTestSupport:teardownHygieneScoreRowsByRunId',
        { runId: 'beta' },
        { identity: true },
      )
      runConvexFn(
        'curatedGeometryTestSupport:seedEditorialScoreRowsNamespaced',
        { runId: 'alpha' },
        { identity: true },
      )
      runConvexFn(
        'curatedGeometryTestSupport:seedCustomScoreRowsNamespaced',
        { runId: 'beta' },
        { identity: true },
      )

      // Teardown alpha only
      const teardownResult = runConvexFn(
        'curatedGeometryTestSupport:teardownHygieneScoreRowsByRunId',
        { runId: 'alpha' },
        { identity: true },
      )
      const teardownParsed = parseResult(teardownResult)
      expect(teardownParsed.count).toBe(2)

      // Alpha rows deleted
      const alpha90after = getRouteByRouteId('test:hyg:alpha:score-90')
      const alpha72after = getRouteByRouteId('test:hyg:alpha:score-72')
      expect(alpha90after).toBeNull()
      expect(alpha72after).toBeNull()

      // Beta rows UNCHANGED
      const beta85after = getRouteByRouteId('test:hyg:beta:score-85')
      const beta70after = getRouteByRouteId('test:hyg:beta:score-70')
      expect(beta85after).not.toBeNull()
      expect(beta85after.compositeScore).toBe(85)
      expect(beta70after).not.toBeNull()
      expect(beta70after.compositeScore).toBe(70)
    }, 120_000)
  })

  // ───────────────────────────────────────────────────────────────────
  // AC-3: normalize scoped to namespace prefix; beta untouched
  // ───────────────────────────────────────────────────────────────────
  describe('normalize-scoped-namespace', () => {
    it('normalize alpha prefix processes only alpha rows — beta rows untouched', () => {
      // Seed both namespaces fresh
      runConvexFn(
        'curatedGeometryTestSupport:teardownHygieneScoreRowsByRunId',
        { runId: 'alpha' },
        { identity: true },
      )
      runConvexFn(
        'curatedGeometryTestSupport:teardownHygieneScoreRowsByRunId',
        { runId: 'beta' },
        { identity: true },
      )
      runConvexFn(
        'curatedGeometryTestSupport:seedEditorialScoreRowsNamespaced',
        { runId: 'alpha' },
        { identity: true },
      )
      runConvexFn(
        'curatedGeometryTestSupport:seedCustomScoreRowsNamespaced',
        { runId: 'beta' },
        { identity: true },
      )

      // Normalize alpha namespace only (committed)
      const result = parseResult(
        runConvexFn('curatedGeometryHygiene:normalizeEditorialScores', {
          routeIdPrefix: 'test:hyg:alpha:',
        }),
      )
      expect(result.normalized).toBe(2)

      // Alpha rows normalized
      const alpha90 = getRouteByRouteId('test:hyg:alpha:score-90')
      expect(alpha90.compositeScore).toBeCloseTo(0.9, 5)
      expect(alpha90.scoreScaleNormalizedAt).toBeDefined()
      expect(typeof alpha90.scoreScaleNormalizedAt).toBe('number')
      expect(alpha90.scoreScaleNormalizedAt).toBeGreaterThan(0)

      // Beta rows UNTOUCHED — still at original 0-100 scale
      const beta85 = getRouteByRouteId('test:hyg:beta:score-85')
      expect(beta85.compositeScore).toBe(85)
      expect(beta85.scoreScaleNormalizedAt).toBeUndefined()

      const beta70 = getRouteByRouteId('test:hyg:beta:score-70')
      expect(beta70.compositeScore).toBe(70)
      expect(beta70.scoreScaleNormalizedAt).toBeUndefined()
    }, 120_000)
  })
})

// ---------------------------------------------------------------------------
// REDHAT-FIX-004: paginated multi-batch catalog scan (F-3)
// ---------------------------------------------------------------------------

/** Prefix for paginated test rows. */
const PAG_PREFIX = 'test:hyg-pag-'

/** Run normalizeEditorialScores with pagination args scoped to paginated rows. */
function runPagNormalize(
  opts: { dryRun?: boolean; cursor?: string | null; batchSize?: number } = {},
): any {
  return parseResult(
    runConvexFn('curatedGeometryHygiene:normalizeEditorialScores', {
      routeIdPrefix: PAG_PREFIX,
      ...(opts.dryRun ? { dryRun: true } : {}),
      ...(opts.cursor !== undefined ? { cursor: opts.cursor } : {}),
      ...(opts.batchSize !== undefined ? { batchSize: opts.batchSize } : {}),
    }),
  )
}

describe('REDHAT-FIX-004: multi-batch-pagination', () => {
  beforeAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownPaginatedScoreRows', {}, { identity: true })
    runConvexFn('curatedGeometryTestSupport:seedPaginatedScoreRows', {}, { identity: true })
  }, 120_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownPaginatedScoreRows', {}, { identity: true })
  }, 120_000)

  // ───────────────────────────────────────────────────────────────────
  // AC-1 [PRIMARY]: multi-batch full-catalog via cursor loop (batchSize:3)
  // ───────────────────────────────────────────────────────────────────
  describe('multi-batch-pagination', () => {
    it('all 10 out-of-scale rows normalized across >= 2 batches; in-scale control untouched', () => {
      // Reseed fresh (other tests in this block may have normalized rows)
      runConvexFn('curatedGeometryTestSupport:teardownPaginatedScoreRows', {}, { identity: true })
      runConvexFn('curatedGeometryTestSupport:seedPaginatedScoreRows', {}, { identity: true })

      let cursor: string | null = null
      let totalNormalized = 0
      let batchCount = 0
      let isDone = false

      while (!isDone) {
        const response = runPagNormalize({ cursor, batchSize: 3 })
        totalNormalized += response.normalized
        batchCount++
        isDone = response.isDone
        cursor = response.continueCursor
        expect(typeof response.continueCursor).toBe('string')
        expect(typeof response.isDone).toBe('boolean')
      }

      // AC-1 MUST_OBSERVE
      expect(totalNormalized).toBe(10)
      expect(batchCount).toBeGreaterThanOrEqual(2)

      // All 10 out-of-scale rows have compositeScore ≤ 1.0
      for (let i = 1; i <= 10; i++) {
        const num = String(i).padStart(2, '0')
        const row = getRouteByRouteId(`test:hyg-pag-${num}`)
        expect(row).not.toBeNull()
        expect(row.compositeScore).toBeLessThanOrEqual(1.0)
        expect(row.scoreScaleNormalizedAt).toBeDefined()
        expect(typeof row.scoreScaleNormalizedAt).toBe('number')
        expect(row.scoreScaleNormalizedAt).toBeGreaterThan(0)
      }

      // TC-6: in-scale control row compositeScore still 0.85 (not divided)
      const inscale = getRouteByRouteId('test:hyg-pag-inscale')
      expect(inscale).not.toBeNull()
      expect(inscale.compositeScore).toBeCloseTo(0.85, 5)
      expect(inscale.scoreScaleNormalizedAt).toBeUndefined()
    }, 120_000)
  })

  // ───────────────────────────────────────────────────────────────────
  // AC-2: cursor continuation — batch1 isDone:false, batch2 cursor advanced
  // ───────────────────────────────────────────────────────────────────
  describe('cursor-continuation', () => {
    it('batch1 has isDone:false + non-empty cursor; batch2 advances', () => {
      runConvexFn('curatedGeometryTestSupport:teardownPaginatedScoreRows', {}, { identity: true })
      runConvexFn('curatedGeometryTestSupport:seedPaginatedScoreRows', {}, { identity: true })

      const batch1 = runPagNormalize({ cursor: null, batchSize: 3 })

      // 10 rows + 1 in-scale = 11 rows matching prefix; batchSize 3 → more remain
      expect(batch1.isDone).toBe(false)
      expect(batch1.continueCursor).toBeTruthy()
      expect(typeof batch1.continueCursor).toBe('string')
      expect(batch1.continueCursor).not.toBe('')

      const batch2 = runPagNormalize({ cursor: batch1.continueCursor, batchSize: 3 })

      // Cursor advanced
      expect(batch2.continueCursor).not.toBe(batch1.continueCursor)

      // batch1 + batch2 should not have processed everything yet (11 rows / 3 per batch → 4 batches)
      // OR at least batch2 has a different cursor
    }, 120_000)
  })

  // ───────────────────────────────────────────────────────────────────
  // AC-4: dryRun/committed consistency across batch sizes
  // ───────────────────────────────────────────────────────────────────
  describe('dryrun-committed-consistency', () => {
    it('dryRun multi-batch === committed multi-batch; dryRun writes nothing', () => {
      runConvexFn('curatedGeometryTestSupport:teardownPaginatedScoreRows', {}, { identity: true })
      runConvexFn('curatedGeometryTestSupport:seedPaginatedScoreRows', {}, { identity: true })

      // DryRun multi-batch (batchSize:3)
      let drCursor: string | null = null
      let totalDryRun = 0
      let drDone = false
      while (!drDone) {
        const res = runPagNormalize({ dryRun: true, cursor: drCursor, batchSize: 3 })
        totalDryRun += res.normalized
        drDone = res.isDone
        drCursor = res.continueCursor
      }

      // DryRun wrote nothing — all rows still > 1.0
      const row01 = getRouteByRouteId('test:hyg-pag-01')
      expect(row01.compositeScore).toBe(95)

      // Committed multi-batch (batchSize:3)
      let cmCursor: string | null = null
      let totalCommitted = 0
      let cmDone = false
      while (!cmDone) {
        const res = runPagNormalize({ cursor: cmCursor, batchSize: 3 })
        totalCommitted += res.normalized
        cmDone = res.isDone
        cmCursor = res.continueCursor
      }

      expect(totalDryRun).toBe(totalCommitted)
      expect(totalCommitted).toBe(10)

      // Now verify single-batch (batchSize:100) gives the same total
      runConvexFn('curatedGeometryTestSupport:teardownPaginatedScoreRows', {}, { identity: true })
      runConvexFn('curatedGeometryTestSupport:seedPaginatedScoreRows', {}, { identity: true })

      const singleBatch = runPagNormalize({ batchSize: 100 })
      expect(singleBatch.normalized).toBe(10)
      expect(singleBatch.isDone).toBe(true)
    }, 120_000)
  })
})

// ---------------------------------------------------------------------------
// REDHAT-FIX-004: backward compatibility — bare {} call + existing S3-T1 ACs
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-004: backward-compat', () => {
  it('bare {} call returns {scanned, normalized, continueCursor, isDone} without error', () => {
    // Teardown + seed the standard 3-row fixture
    runConvexFn('curatedGeometryTestSupport:teardownHygieneScoreRows', {}, { identity: true })
    runConvexFn('curatedGeometryTestSupport:seedEditorialScoreRows', {}, { identity: true })

    // Bare call — no cursor, no batchSize
    const response = parseResult(
      runConvexFn('curatedGeometryHygiene:normalizeEditorialScores', {
        routeIdPrefix: 'test:hyg-score-',
      }),
    )

    // AC-5 MUST_OBSERVE: additive fields present
    expect(response).toHaveProperty('scanned')
    expect(response).toHaveProperty('normalized')
    expect(response).toHaveProperty('continueCursor')
    expect(response).toHaveProperty('isDone')
    expect(typeof response.continueCursor).toBe('string')
    expect(typeof response.isDone).toBe('boolean')
    expect(response.normalized).toBe(3)
    expect(response.isDone).toBe(true) // 3 rows < default batchSize of 100

    // Idempotency: second call returns normalized === 0
    const secondResponse = parseResult(
      runConvexFn('curatedGeometryHygiene:normalizeEditorialScores', {
        routeIdPrefix: 'test:hyg-score-',
      }),
    )
    expect(secondResponse.normalized).toBe(0)

    // Cleanup
    runConvexFn('curatedGeometryTestSupport:teardownHygieneScoreRows', {}, { identity: true })
  }, 120_000)
})

// ---------------------------------------------------------------------------
// S3-T2: Duplicate route detection + reversible shadow-flagging (dedupeGroups)
// ---------------------------------------------------------------------------

/** Run dedupeGroups via the Convex CLI. */
function runDedupe(opts: { dryRun?: boolean; routeIdPrefix?: string } = {}): any {
  return parseResult(
    runConvexFn(
      'curatedGeometryHygiene:dedupeGroups',
      {
        ...(opts.dryRun ? { dryRun: true } : {}),
        ...(opts.routeIdPrefix ? { routeIdPrefix: opts.routeIdPrefix } : {}),
      },
      // dedupeGroups is an internalMutation — no identity needed
    ),
  )
}

describe('S3-T2: dedupeGroups', () => {
  afterEach(() => {
    runConvexFn('curatedGeometryTestSupport:teardownDedupeRows', {}, { identity: true })
  })

  // ─────────────────────────────────────────────────────────────────────
  // dedupe-detect: detect duplicate group, mark shadows, idempotent re-run
  // ─────────────────────────────────────────────────────────────────────
  describe('dedupe-detect', () => {
    it('detects 1 group of 3 same-name proximity rows; canonical has duplicateOf==null; shadows marked; second run finds 0 new shadows', () => {
      runConvexFn('curatedGeometryTestSupport:seedDedupeGroup', {}, { identity: true })

      const result = runDedupe({ routeIdPrefix: 'test:cherohala-' })

      // 1 group detected, 2 shadows marked
      expect(result.groups).toBe(1)
      expect(result.shadows).toBe(2)

      // Canonical has duplicateOf falsy (not shadowed)
      const canonical = getRouteByRouteId('test:cherohala-canonical')
      expect(canonical).not.toBeNull()
      expect(canonical.duplicateOf).toBeFalsy()

      // Shadows have duplicateOf pointing to canonical
      const shadowA = getRouteByRouteId('test:cherohala-shadow-a')
      const shadowB = getRouteByRouteId('test:cherohala-shadow-b')
      expect(shadowA.duplicateOf).toBe('test:cherohala-canonical')
      expect(shadowB.duplicateOf).toBe('test:cherohala-canonical')

      // Second run: idempotent — 0 new shadows
      const secondRun = runDedupe({ routeIdPrefix: 'test:cherohala-' })
      expect(secondRun.shadows).toBe(0)
      expect(secondRun.groups).toBe(0)
    }, 120_000)
  })

  // ─────────────────────────────────────────────────────────────────────
  // dedupe-dryrun: dryRun returns plan, writes nothing; committed matches
  // ─────────────────────────────────────────────────────────────────────
  describe('dedupe-dryrun', () => {
    it('dryRun returns plan with groups==1 shadows==2; writes nothing; committed run matches plan', () => {
      runConvexFn('curatedGeometryTestSupport:seedDedupeGroup', {}, { identity: true })

      const dryRunResult = runDedupe({ dryRun: true, routeIdPrefix: 'test:cherohala-' })

      // Plan returned
      expect(dryRunResult.groups).toBe(1)
      expect(dryRunResult.shadows).toBe(2)
      expect(dryRunResult.plan).toHaveLength(1)
      expect(dryRunResult.plan[0].canonical).toBe('test:cherohala-canonical')
      expect(dryRunResult.plan[0].shadows).toContain('test:cherohala-shadow-a')
      expect(dryRunResult.plan[0].shadows).toContain('test:cherohala-shadow-b')

      // DryRun wrote nothing — no row has duplicateOf set
      const shadowAAfterDry = getRouteByRouteId('test:cherohala-shadow-a')
      expect(shadowAAfterDry.duplicateOf).toBeFalsy()

      // Committed run matches plan
      const committedResult = runDedupe({ routeIdPrefix: 'test:cherohala-' })
      expect(committedResult.groups).toBe(dryRunResult.groups)
      expect(committedResult.shadows).toBe(dryRunResult.shadows)

      // Now shadows are actually written
      const shadowAAfterCommit = getRouteByRouteId('test:cherohala-shadow-a')
      expect(shadowAAfterCommit.duplicateOf).toBe('test:cherohala-canonical')
    }, 120_000)
  })

  // ─────────────────────────────────────────────────────────────────────
  // canonical-precedence: gate-passing (generated) row preferred as canonical
  // ─────────────────────────────────────────────────────────────────────
  describe('canonical-precedence', () => {
    it('gate-passing lower-score row is canonical over non-passing higher-score row', () => {
      runConvexFn('curatedGeometryTestSupport:seedPrecedenceGroup', {}, { identity: true })

      const result = runDedupe({ routeIdPrefix: 'test:deals-' })

      expect(result.groups).toBe(1)
      expect(result.shadows).toBe(1)

      // The gate-passing (generated) lower-score row is canonical
      const canonical = getRouteByRouteId('test:deals-lowscore-passing')
      expect(canonical).not.toBeNull()
      expect(canonical.duplicateOf).toBeFalsy()
      expect(canonical.geometryStatus).toBe('generated')

      // The higher-score non-passing row is shadowed
      const shadow = getRouteByRouteId('test:deals-highscore-review')
      expect(shadow.duplicateOf).toBe('test:deals-lowscore-passing')
    }, 120_000)
  })

  // ─────────────────────────────────────────────────────────────────────
  // no-overmerge: distinct names + far-apart same-name rows don't merge
  // ─────────────────────────────────────────────────────────────────────
  describe('no-overmerge', () => {
    it('distinct names and far-apart same-name rows produce 0 groups and no duplicateOf', () => {
      runConvexFn('curatedGeometryTestSupport:seedNoMergeControl', {}, { identity: true })

      const result = runDedupe({ routeIdPrefix: 'test:' })

      // 0 groups — nothing merged
      expect(result.groups).toBe(0)
      expect(result.shadows).toBe(0)

      // No row has duplicateOf set
      const routeIds = [
        'test:distinct-blueridge',
        'test:distinct-tail',
        'test:cherohala-far-nc',
        'test:cherohala-far-ca',
      ]
      for (const routeId of routeIds) {
        const row = getRouteByRouteId(routeId)
        expect(row).not.toBeNull()
        expect(row.duplicateOf).toBeFalsy()
      }
    }, 120_000)
  })
})

// ---------------------------------------------------------------------------
// S3-T3: Length-outlier quarantine, test-row quarantine, state normalization
// ---------------------------------------------------------------------------

/**
 * Identity for S3-T3 hygiene tests.
 */
const HYGIENE_IDENTITY = JSON.stringify({
  subject: 'hygiene-test',
  issuer: 'https://laneshadow.test',
})

/** Run a convex function with the S3-T3 test identity. */
function runHygieneFn(fn: string, args: Record<string, unknown> = {}): any {
  const cmd = ['convex', 'run', fn, JSON.stringify(args), '--identity', HYGIENE_IDENTITY]
  return parseResult(execNpx(cmd))
}

/** Run a quarantine/state hygiene internal mutation (no identity needed). */
function runHygieneInternal(fn: string, args: Record<string, unknown> = {}): any {
  const cmd = ['convex', 'run', fn, JSON.stringify(args)]
  return parseResult(execNpx(cmd))
}

describe('length-quarantine', () => {
  beforeAll(() => {
    runHygieneFn('curatedGeometryTestSupport:teardownQuarantineStateRows')
    runHygieneFn('curatedGeometryTestSupport:seedLengthOutlierRows')
  }, 120_000)

  afterAll(() => {
    runHygieneFn('curatedGeometryTestSupport:teardownQuarantineStateRows')
  })

  it('dryRun previews counts without writing; committed quarantines zero + outlier; idempotent re-run', () => {
    // DryRun — no writes
    const dryResult = runHygieneInternal('curatedGeometryHygiene:fixLengthOutliers', {
      dryRun: true,
      routeIdPrefix: 'test:hyg-len-',
    })
    expect(dryResult.scanned).toBe(2)
    expect(dryResult.flagged).toBe(2)

    // Verify dryRun wrote nothing
    const zeroRowAfterDry = getRouteByRouteId('test:hyg-len-zero')
    expect(zeroRowAfterDry.quarantine).toBeFalsy()
    const bigRowAfterDry = getRouteByRouteId('test:hyg-len-5000')
    expect(bigRowAfterDry.quarantine).toBeFalsy()

    // Committed run
    const result = runHygieneInternal('curatedGeometryHygiene:fixLengthOutliers', {
      routeIdPrefix: 'test:hyg-len-',
    })
    expect(result.scanned).toBe(2)
    expect(result.flagged).toBe(2)

    // Zero-length row quarantined with reason='zero_length'
    const zeroRow = getRouteByRouteId('test:hyg-len-zero')
    expect(zeroRow.quarantine).not.toBeNull()
    expect(zeroRow.quarantine.reason).toBe('zero_length')

    // 5000mi row quarantined with reason='length_outlier'
    const bigRow = getRouteByRouteId('test:hyg-len-5000')
    expect(bigRow.quarantine).not.toBeNull()
    expect(bigRow.quarantine.reason).toBe('length_outlier')

    // Second run — idempotent (0 new flags)
    const secondResult = runHygieneInternal('curatedGeometryHygiene:fixLengthOutliers', {
      routeIdPrefix: 'test:hyg-len-',
    })
    expect(secondResult.flagged).toBe(0)
  }, 120_000)
})

describe('test-row-quarantine', () => {
  beforeAll(() => {
    runHygieneFn('curatedGeometryTestSupport:teardownQuarantineStateRows')
    runHygieneFn('curatedGeometryTestSupport:seedTestRowForQuarantine')
  }, 120_000)

  afterAll(() => {
    runHygieneFn('curatedGeometryTestSupport:teardownQuarantineStateRows')
  })

  it('dryRun previews without writing; committed quarantines test row; idempotent', () => {
    // DryRun — no writes
    const dryResult = runHygieneInternal('curatedGeometryHygiene:quarantineTestRows', {
      dryRun: true,
      routeIdPrefix: 'test:hyg-testrow',
    })
    expect(dryResult.flagged).toBe(1)

    // Verify dryRun wrote nothing
    const rowAfterDry = getRouteByRouteId('test:hyg-testrow')
    expect(rowAfterDry.quarantine).toBeFalsy()

    // Committed run
    const result = runHygieneInternal('curatedGeometryHygiene:quarantineTestRows', {
      routeIdPrefix: 'test:hyg-testrow',
    })
    expect(result.flagged).toBe(1)

    // Test row quarantined with reason='test_row'
    const row = getRouteByRouteId('test:hyg-testrow')
    expect(row.quarantine).not.toBeNull()
    expect(row.quarantine.reason).toBe('test_row')

    // Second run — idempotent (0 new flags)
    const secondResult = runHygieneInternal('curatedGeometryHygiene:quarantineTestRows', {
      routeIdPrefix: 'test:hyg-testrow',
    })
    expect(secondResult.flagged).toBe(0)
  }, 120_000)
})

describe('state-normalize', () => {
  beforeAll(() => {
    runHygieneFn('curatedGeometryTestSupport:teardownQuarantineStateRows')
    runHygieneFn('curatedGeometryTestSupport:seedDirtyStateRows')
  }, 120_000)

  afterAll(() => {
    runHygieneFn('curatedGeometryTestSupport:teardownQuarantineStateRows')
  })

  it('dryRun writes nothing; committed normalizes dashed + multi-state; preserves stateRaw', () => {
    // DryRun — no writes
    const dryResult = runHygieneInternal('curatedGeometryHygiene:normalizeStates', {
      dryRun: true,
      routeIdPrefix: 'test:hyg-state-',
    })
    expect(dryResult.changed).toBe(3) // ny, nc, tri — not the canonical control

    // Verify dryRun wrote nothing — state still dirty
    const nyAfterDry = getRouteByRouteId('test:hyg-state-ny')
    expect(nyAfterDry.state).toBe('New-York')

    // Committed run
    const result = runHygieneInternal('curatedGeometryHygiene:normalizeStates', {
      routeIdPrefix: 'test:hyg-state-',
    })
    expect(result.changed).toBe(3)

    // 'New-York' → state='New York', stateRaw='New-York'
    const nyRow = getRouteByRouteId('test:hyg-state-ny')
    expect(nyRow.state).toBe('New York')
    expect(nyRow.stateRaw).toBe('New-York')

    // 'North-Carolina' → state='North Carolina', stateRaw='North-Carolina'
    const ncRow = getRouteByRouteId('test:hyg-state-nc')
    expect(ncRow.state).toBe('North Carolina')
    expect(ncRow.stateRaw).toBe('North-Carolina')

    // 'Alabama / Mississippi / Tennessee' → state='Alabama', statesAll ordered, stateRaw preserved
    const triRow = getRouteByRouteId('test:hyg-state-tri')
    expect(triRow.state).toBe('Alabama')
    expect(triRow.statesAll).toEqual(['Alabama', 'Mississippi', 'Tennessee'])
    expect(triRow.stateRaw).toBe('Alabama / Mississippi / Tennessee')

    // Already-canonical control 'North Carolina' — NOT modified
    const canonRow = getRouteByRouteId('test:hyg-state-canon')
    expect(canonRow.state).toBe('North Carolina')
    expect(canonRow.stateRaw).toBeUndefined()
    expect(canonRow.statesAll).toBeUndefined()
  }, 120_000)
})

describe('state-idempotent', () => {
  beforeAll(() => {
    runHygieneFn('curatedGeometryTestSupport:teardownQuarantineStateRows')
    runHygieneFn('curatedGeometryTestSupport:seedDirtyStateRows')
    // Run once to normalize
    runHygieneInternal('curatedGeometryHygiene:normalizeStates', {
      routeIdPrefix: 'test:hyg-state-',
    })
  }, 120_000)

  afterAll(() => {
    runHygieneFn('curatedGeometryTestSupport:teardownQuarantineStateRows')
  })

  it('second run changes 0 rows; canonical control still unmodified', () => {
    const secondResult = runHygieneInternal('curatedGeometryHygiene:normalizeStates', {
      routeIdPrefix: 'test:hyg-state-',
    })
    expect(secondResult.changed).toBe(0)

    // Canonical control still unchanged
    const canonRow = getRouteByRouteId('test:hyg-state-canon')
    expect(canonRow.state).toBe('North Carolina')
    expect(canonRow.stateRaw).toBeUndefined()

    // Previously normalized rows still canonical
    const nyRow = getRouteByRouteId('test:hyg-state-ny')
    expect(nyRow.state).toBe('New York')
    expect(nyRow.stateRaw).toBe('New-York')

    const triRow = getRouteByRouteId('test:hyg-state-tri')
    expect(triRow.state).toBe('Alabama')
    expect(triRow.statesAll).toEqual(['Alabama', 'Mississippi', 'Tennessee'])
  }, 120_000)
})
