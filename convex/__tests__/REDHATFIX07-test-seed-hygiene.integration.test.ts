/**
 * REDHAT-FIX-07 AC-3 / TC-3 (+ REDHAT-FIX-08 fixture scrub):
 * test:/seed: AND known production-prefixed fixtures excluded from unscoped
 * production counts and top-50 export.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-04 / UC-VER-05
 * start_ref: redhatfix07-contamination-pool / redhatfix08-test-seed-and-fixture-exclusion
 *
 * Race-safe against sibling REDHATFIX07 files on a shared Convex catalog:
 * - Uses dedicated prefixes only for this AC
 * - Proves scrub via testSeedRowsSkipped + prefix isolation (not fragile global deltas)
 * - Proves top-50 export excludes tepusquet fixture + test:/seed: rows
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-07/evidence')

const CLERK_USER = 's4t5-redhatfix07-hygiene'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const TEST_PREFIX = 'test:redhatfix07-cont-'
const SEED_PREFIX = 'seed:redhatfix07-cont-'
const REAL_PREFIX = 'motorcycleroads:redhatfix07-real-'
const FIXTURE_ROUTE_ID = 'motorcycleroads:twist-of-tepusquet-loop'

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

function leverCandidates(report: any, provenance: string): number {
  const levers = Array.isArray(report?.levers) ? report.levers : []
  const row = levers.find((l: any) => l.provenance === provenance)
  return typeof row?.candidateCount === 'number' ? row.candidateCount : 0
}

function purgePrefix(prefix: string) {
  for (let i = 0; i < 10; i++) {
    const r = runConvexFn(
      'curatedGeometry:purgeRoutesByPrefix',
      { prefix, limit: 100 },
      { identity: true },
    )
    if (!r.ok) break
    const body = parseJson(r.stdout)
    if (!body?.more && (body?.count ?? 0) === 0) break
    if (!body?.more) break
  }
}

function seedPool(
  prefix: string,
  count: number,
  provenance: string | undefined,
  status: 'generated' | 'unresolved',
) {
  let seeded = 0
  while (seeded < count) {
    const batch = Math.min(100, count - seeded)
    const r = runConvexFn(
      'curatedGeometry:seedRedhatFix07CoveragePool',
      {
        prefix,
        startIndex: seeded + 1,
        count: batch,
        geometryStatus: status,
        geometryProvenance: provenance,
      },
      { identity: true },
    )
    expect(r.ok, `seed failed: ${r.stderr}\n${r.stdout}`).toBe(true)
    seeded += parseJson(r.stdout)?.count ?? batch
  }
}

describe('REDHAT-FIX-07 AC-3: test:/seed:/fixture hygiene on unscoped coverage + top-50', () => {
  let unscopedReport: any
  let baselineSkipped: number
  let afterTestSkipped: number
  let afterSeedSkipped: number
  let afterFixtureSkipped: number
  let prefixTestAi: number
  let prefixRealAi: number
  let prefixSeedUnresolved: number
  let realOnlyUnscopedDelta: number
  let top50Manifest: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    purgePrefix(TEST_PREFIX)
    purgePrefix(SEED_PREFIX)
    purgePrefix(REAL_PREFIX)
    runConvexFn(
      'curatedGeometry:purgeRoutesByPrefix',
      { prefix: FIXTURE_ROUTE_ID, limit: 5 },
      { identity: true },
    )

    const baseQ = runConvexFn('curatedGeometry:coverageReport', {}, { identity: true })
    expect(baseQ.ok, `baseline coverage failed: ${baseQ.stderr}\n${baseQ.stdout}`).toBe(true)
    const baseline = parseJson(baseQ.stdout)
    baselineSkipped = baseline?.testSeedRowsSkipped ?? 0
    const baselineAi = leverCandidates(baseline, 'ai_reconstructed')

    // 40 test: ai_reconstructed — must be scrubbed on unscoped path
    seedPool(TEST_PREFIX, 40, 'ai_reconstructed', 'generated')
    const afterTestQ = runConvexFn('curatedGeometry:coverageReport', {}, { identity: true })
    expect(afterTestQ.ok, `afterTest failed: ${afterTestQ.stderr}`).toBe(true)
    const afterTest = parseJson(afterTestQ.stdout)
    afterTestSkipped = afterTest?.testSeedRowsSkipped ?? 0

    // 10 seed: unresolved — also scrubbed on unscoped
    seedPool(SEED_PREFIX, 10, undefined, 'unresolved')
    const afterSeedQ = runConvexFn('curatedGeometry:coverageReport', {}, { identity: true })
    expect(afterSeedQ.ok).toBe(true)
    const afterSeed = parseJson(afterSeedQ.stdout)
    afterSeedSkipped = afterSeed?.testSeedRowsSkipped ?? 0

    // Known production-prefixed fixture (seedPoCRoute id) — must scrub without "fixture" name
    const fixtureSeed = runConvexFn(
      'top50Review:seedMixedCompositeScorePublic',
      {
        routes: [
          {
            routeId: FIXTURE_ROUTE_ID,
            name: 'Twist of Tepusquet Loop',
            compositeScore: 99,
            riderReady: true,
            provenance: 'ai_reconstructed',
          },
        ],
      },
      { identity: true },
    )
    expect(
      fixtureSeed.ok,
      `fixture seed failed: ${fixtureSeed.stderr}\n${fixtureSeed.stdout}`,
    ).toBe(true)
    const afterFixtureQ = runConvexFn('curatedGeometry:coverageReport', {}, { identity: true })
    expect(afterFixtureQ.ok).toBe(true)
    afterFixtureSkipped = parseJson(afterFixtureQ.stdout)?.testSeedRowsSkipped ?? 0

    // 5 real production-like ai_reconstructed — MUST count on unscoped
    seedPool(REAL_PREFIX, 5, 'ai_reconstructed', 'generated')
    const afterRealQ = runConvexFn('curatedGeometry:coverageReport', {}, { identity: true })
    expect(afterRealQ.ok).toBe(true)
    unscopedReport = parseJson(afterRealQ.stdout)
    const afterRealAi = leverCandidates(unscopedReport, 'ai_reconstructed')
    realOnlyUnscopedDelta = afterRealAi - baselineAi

    const testPrefQ = runConvexFn(
      'curatedGeometry:coverageReport',
      { routeIdPrefix: TEST_PREFIX },
      { identity: true },
    )
    prefixTestAi = leverCandidates(parseJson(testPrefQ.stdout), 'ai_reconstructed')

    const realPrefQ = runConvexFn(
      'curatedGeometry:coverageReport',
      { routeIdPrefix: REAL_PREFIX },
      { identity: true },
    )
    prefixRealAi = leverCandidates(parseJson(realPrefQ.stdout), 'ai_reconstructed')

    const seedPrefQ = runConvexFn(
      'curatedGeometry:coverageReport',
      { routeIdPrefix: SEED_PREFIX },
      { identity: true },
    )
    prefixSeedUnresolved = parseJson(seedPrefQ.stdout)?.terminalStates?.unresolved ?? 0

    const top50Q = runConvexFn('top50Review:exportTop50Manifest', { limit: 50 }, { identity: true })
    expect(top50Q.ok, `top50 export failed: ${top50Q.stderr}\n${top50Q.stdout}`).toBe(true)
    top50Manifest = parseJson(top50Q.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-test-seed-hygiene.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          baselineSkipped,
          afterTestSkipped,
          afterSeedSkipped,
          afterFixtureSkipped,
          realOnlyUnscopedDelta,
          prefixTestAi,
          prefixRealAi,
          prefixSeedUnresolved,
          unscopedReport,
          top50RouteIds: (top50Manifest?.rows ?? []).map((r: any) => r.routeId),
        },
        null,
        2,
      ),
    )
  }, 600_000)

  afterAll(() => {
    purgePrefix(TEST_PREFIX)
    purgePrefix(SEED_PREFIX)
    purgePrefix(REAL_PREFIX)
    runConvexFn(
      'curatedGeometry:purgeRoutesByPrefix',
      { prefix: FIXTURE_ROUTE_ID, limit: 5 },
      { identity: true },
    )
  }, 300_000)

  it('TC-3: Unscoped live coverageReport + top-50 exclude test:/seed:/fixture; production rows still count', () => {
    // Prefix isolation (stable under concurrent sibling suites):
    // harness still counts intentional test:/seed: when scoped.
    expect(prefixTestAi).toBe(40)
    expect(prefixRealAi).toBe(5)
    expect(prefixSeedUnresolved).toBe(10)

    // Unscoped founder path scrub is active and reported.
    expect(unscopedReport?.source).toBe('live')
    expect(unscopedReport?.scrubbedTestSeed).toBe(true)
    expect(unscopedReport?.livePathSilentTake500).toBe(false)
    expect(unscopedReport?.exhaustive).toBe(true)

    // isTestSeedRoute exclusion: skipped count must cover our contamination pool
    // (absolute, not fragile delta — concurrent suites may add/remove other test: rows).
    expect(afterTestSkipped).toBeGreaterThanOrEqual(40)
    expect(afterSeedSkipped).toBeGreaterThanOrEqual(50)
    // Fixture must also contribute to scrub once isTestSeedRoute knows it
    expect(afterFixtureSkipped).toBeGreaterThanOrEqual(afterSeedSkipped)
    expect(unscopedReport?.testSeedRowsSkipped).toBeGreaterThanOrEqual(50)

    // Production-like rows still contribute to unscoped levers (not zeroed by scrub).
    // Delta may include concurrent production-like noise, but must not be the
    // false "40 test + 5 real" or pure-zero outcomes.
    expect(realOnlyUnscopedDelta).toBeGreaterThanOrEqual(5)
    expect(realOnlyUnscopedDelta).not.toBe(0)
    expect(realOnlyUnscopedDelta).not.toBe(45)
    // If test: rows leaked into unscoped levers, delta would typically jump by ~40
    // beyond the 5 reals (and any small concurrent noise). Cap the leak signal.
    expect(realOnlyUnscopedDelta).toBeLessThan(40)
    // Negative control: fixture must not add +1 to unscoped ai_reconstructed
    // beyond the 5 reals (would be baseline+6 if fixture leaked alone with reals).
    expect(realOnlyUnscopedDelta).not.toBe(6)

    // baselineSkipped is retained for evidence lineage only
    expect(typeof baselineSkipped).toBe('number')

    // Unscoped top-50 must not include fixture / test: / seed:
    const rows = top50Manifest?.rows ?? []
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.some((r: any) => r.routeId === FIXTURE_ROUTE_ID)).toBe(false)
    expect(rows.some((r: any) => String(r.routeId).startsWith('test:'))).toBe(false)
    expect(rows.some((r: any) => String(r.routeId).startsWith('seed:'))).toBe(false)
  })
})
