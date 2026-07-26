/**
 * REDHAT-FIX-07 AC-4 / TC-4: Prefix harness counts test rows; no silent take(500).
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-04
 * start_ref: redhatfix07-prefix-harness
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-07/evidence')

const CLERK_USER = 's4t5-redhatfix07-prefix'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const HARNESS_PREFIX = 'test:redhatfix07-harness-'
const OVERSIZE_PREFIX = 'motorcycleroads:redhatfix07-stable-'

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
  for (let i = 0; i < 20; i++) {
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

function seedOne(routeId: string, provenance: 'ai_reconstructed' | 'name_routed') {
  // seed via pool with count=1 using prefix+index encoding
  // routeId = prefix + '001' style — use seedRedhatFix07 with exact prefix slice
  const m = routeId.match(/^(.*)(\d{3})$/)
  const prefix = m ? m[1] : `${routeId}-`
  const startIndex = m ? Number(m[2]) : 1
  const r = runConvexFn(
    'curatedGeometry:seedRedhatFix07CoveragePool',
    {
      prefix,
      startIndex,
      count: 1,
      geometryStatus: 'generated',
      geometryProvenance: provenance,
    },
    { identity: true },
  )
  expect(r.ok, `seed ${routeId} failed: ${r.stderr}\n${r.stdout}`).toBe(true)
}

describe('REDHAT-FIX-07 AC-4: prefix harness + no silent take(500) final cap', () => {
  let prefixReport: any
  let firstOversize: any
  let secondOversize: any
  let sourceHasTake500: boolean

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    purgePrefix(HARNESS_PREFIX)
    purgePrefix(OVERSIZE_PREFIX)

    seedOne(`${HARNESS_PREFIX}ai-001`, 'ai_reconstructed')
    seedOne(`${HARNESS_PREFIX}nr-001`, 'name_routed')

    const prefQ = runConvexFn(
      'curatedGeometry:coverageReport',
      { routeIdPrefix: 'test:redhatfix07-' },
      { identity: true },
    )
    expect(prefQ.ok, `prefix coverage failed: ${prefQ.stderr}\n${prefQ.stdout}`).toBe(true)
    prefixReport = parseJson(prefQ.stdout)

    // Oversized fixture for stable re-query
    let seeded = 0
    while (seeded < 520) {
      const batch = Math.min(100, 520 - seeded)
      const r = runConvexFn(
        'curatedGeometry:seedRedhatFix07CoveragePool',
        {
          prefix: OVERSIZE_PREFIX,
          startIndex: seeded + 1,
          count: batch,
          geometryStatus: 'generated',
          geometryProvenance: 'scraped_promoted',
        },
        { identity: true },
      )
      expect(r.ok).toBe(true)
      seeded += parseJson(r.stdout)?.count ?? batch
    }

    const o1 = runConvexFn(
      'curatedGeometry:coverageReport',
      { routeIdPrefix: OVERSIZE_PREFIX },
      { identity: true },
    )
    firstOversize = parseJson(o1.stdout)
    const o2 = runConvexFn(
      'curatedGeometry:coverageReport',
      { routeIdPrefix: OVERSIZE_PREFIX },
      { identity: true },
    )
    secondOversize = parseJson(o2.stdout)

    // Static proof: curatedGeometry.ts must not contain a silent fixed-500 take
    // (rg "\.take\(500\)" must be zero matches — comments included).
    const src = readFileSync(resolve(PROJECT_ROOT, 'convex/curatedGeometry.ts'), 'utf-8')
    sourceHasTake500 = /\.take\(\s*500\s*\)/.test(src)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-prefix-and-no-take-cap.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          prefixReport,
          firstOversizeCandidates: leverCandidates(firstOversize, 'scraped_promoted'),
          secondOversizeCandidates: leverCandidates(secondOversize, 'scraped_promoted'),
          sourceHasTake500,
        },
        null,
        2,
      ),
    )
  }, 600_000)

  afterAll(() => {
    purgePrefix(HARNESS_PREFIX)
    purgePrefix(OVERSIZE_PREFIX)
  }, 300_000)

  it('TC-4: prefix counts harness test rows; live path has no silent take(500) final cap', () => {
    expect(leverCandidates(prefixReport, 'ai_reconstructed')).toBeGreaterThanOrEqual(1)
    expect(leverCandidates(prefixReport, 'name_routed')).toBeGreaterThanOrEqual(1)
    expect(prefixReport?.scrubbedTestSeed).toBe(false)

    expect(prefixReport?.livePathSilentTake500).toBe(false)
    expect(firstOversize?.livePathSilentTake500).toBe(false)
    expect(firstOversize?.exhaustive).toBe(true)
    expect(sourceHasTake500).toBe(false)

    const c1 = leverCandidates(firstOversize, 'scraped_promoted')
    const c2 = leverCandidates(secondOversize, 'scraped_promoted')
    expect(c1).toBe(520)
    expect(c2).toBe(520)
    expect(c1).toBe(c2)
  })
})
