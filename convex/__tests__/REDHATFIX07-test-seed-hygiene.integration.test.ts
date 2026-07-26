/**
 * REDHAT-FIX-07 AC-3 / TC-3: test:/seed: excluded from unscoped production counts.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-04
 * start_ref: redhatfix07-contamination-pool
 *
 * Race-safe against sibling REDHATFIX07 files on a shared Convex catalog:
 * - Uses dedicated prefixes only for this AC
 * - Proves scrub via testSeedRowsSkipped + prefix isolation (not fragile global deltas)
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

describe('REDHAT-FIX-07 AC-3: test:/seed: hygiene on unscoped coverage counts', () => {
  let unscopedReport: any
  let baselineSkipped: number
  let afterTestSkipped: number
  let afterSeedSkipped: number
  let prefixTestAi: number
  let prefixRealAi: number
  let prefixSeedUnresolved: number
  let realOnlyUnscopedDelta: number

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

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-test-seed-hygiene.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          baselineSkipped,
          afterTestSkipped,
          afterSeedSkipped,
          realOnlyUnscopedDelta,
          prefixTestAi,
          prefixRealAi,
          prefixSeedUnresolved,
          unscopedReport,
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
  }, 300_000)

  it('TC-3: Unscoped live coverageReport does not count test:/seed:; production rows still count', () => {
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

    // baselineSkipped is retained for evidence lineage only
    expect(typeof baselineSkipped).toBe('number')
  })
})
