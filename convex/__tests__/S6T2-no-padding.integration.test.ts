/**
 * S6-T2 TC-5 / AC-5: Thin-region queries return honest empty/partial, never padded.
 *
 * GIVEN a region with only non-rider-ready rows (or few ready rows)
 * WHEN browse/discovery is asked for limit=10
 * THEN returned.length reflects real rider-ready supply — never padded to 10.
 *
 * TEST_TIER: integration
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S6-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's6t2-no-padding',
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
      timeout: 180_000,
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

describe('TC-5: thin-region honest empty/partial — never pad to limit', () => {
  let thinSeed: any
  let onlyNonReadySeed: any
  let partialWy: any[]
  let emptyPrefixFilter: string[]

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    runConvexFn('curatedGeometryTestSupport:teardownS6T2Fixtures', {}, { identity: true })

    const thinRes = runConvexFn(
      'curatedGeometryTestSupport:seedS6T2ThinRegion',
      {},
      { identity: true },
    )
    expect(thinRes.ok, `thin seed failed: ${thinRes.stderr}\n${thinRes.stdout}`).toBe(true)
    thinSeed = parseJson(thinRes.stdout)

    const onlyRes = runConvexFn(
      'curatedGeometryTestSupport:seedS6T2ThinRegionOnlyNonReady',
      {},
      { identity: true },
    )
    expect(onlyRes.ok, `only-non-ready seed failed: ${onlyRes.stderr}\n${onlyRes.stdout}`).toBe(
      true,
    )
    onlyNonReadySeed = parseJson(onlyRes.stdout)

    const wyRes = runConvexFn('curatedRoutes:listCuratedRoutesInternal', {
      state: 'Wyoming',
      sort: 'best',
      limit: 10,
    })
    expect(wyRes.ok, `WY list failed: ${wyRes.stderr}\n${wyRes.stdout}`).toBe(true)
    partialWy = parseJson(wyRes.stdout) ?? []

    // Filter to only our thin-only-non prefix to prove those never pad the result
    emptyPrefixFilter = partialWy
      .map((r: any) => r.routeId)
      .filter((id: string) => id.startsWith('test:s6t2-thin-only-non-'))

    writeFileSync(
      resolve(EVIDENCE_DIR, 'TC-5-no-padding.json'),
      JSON.stringify(
        {
          thinSeed,
          onlyNonReadySeed,
          partialWyIds: partialWy.map((r: any) => r.routeId),
          emptyPrefixFilter,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownS6T2Fixtures', {}, { identity: true })
  })

  it('TC-5: WY returns only ready fixtures (partial); non-ready never pad to limit=10', () => {
    // Discovery must not pad via candidateRoutes.slice
    const source = readFileSync(
      resolve(PROJECT_ROOT, 'convex/actions/agent/tools/discoverCuratedRoutes.ts'),
      'utf-8',
    )
    expect(source).not.toMatch(/candidateRoutes\.slice\s*\(\s*0\s*,\s*requestedLimit\s*\)/)

    const nonReadyIds: string[] = [
      ...(thinSeed.nonReadyIds ?? []),
      ...(onlyNonReadySeed.nonReadyIds ?? []),
    ]
    const readyIds: string[] = thinSeed.readyIds ?? []

    // No non-ready id may appear
    for (const id of nonReadyIds) {
      expect(
        partialWy.find((r: any) => r.routeId === id),
        `non-ready ${id} must not pad WY results`,
      ).toBeUndefined()
    }

    // thin-only-non prefix must contribute 0 rows
    expect(emptyPrefixFilter).toEqual([])

    // Ready WY fixtures should appear (partial honest result, not empty)
    for (const id of readyIds) {
      expect(
        partialWy.find((r: any) => r.routeId === id),
        `ready ${id} should surface in WY list`,
      ).toBeDefined()
    }

    // Must NOT pad to the requested limit of 10 with non-ready rows.
    // Only our 2 ready fixtures are guaranteed; total may include other real WY ready routes.
    // Assert: every returned row is NOT in the non-ready seed set, and length of our
    // fixture contribution is exactly readyIds.length (not inflated with non-ready).
    const fixtureHits = partialWy.filter((r: any) =>
      [...readyIds, ...nonReadyIds].includes(r.routeId),
    )
    expect(fixtureHits.map((r: any) => r.routeId).sort()).toEqual([...readyIds].sort())
    expect(fixtureHits.length).toBe(readyIds.length)
    expect(fixtureHits.length).toBeLessThan(10)

    // Seed honesty
    for (const r of thinSeed.ready ?? []) {
      expect(r.riderReady).toBe(true)
    }
    for (const r of thinSeed.nonReady ?? []) {
      expect(r.riderReady).toBe(false)
    }
  })
})
