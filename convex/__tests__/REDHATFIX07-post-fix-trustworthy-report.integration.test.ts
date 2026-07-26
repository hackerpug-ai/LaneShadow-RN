/**
 * REDHAT-FIX-07 AC-5 / TC-5: Post-fix report is the only valid founder input.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-04
 * start_ref: redhatfix07-minority-buried-after-500
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-07/evidence')

const CLERK_USER = 's4t5-redhatfix07-postfix'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const PREFIX = 'motorcycleroads:redhatfix07-postfix-'
const SCRAPED_PREFIX = `${PREFIX}scraped-`
const AI_PREFIX = `${PREFIX}ai-`
const NR_PREFIX = `${PREFIX}nr-`

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
  for (let i = 0; i < 30; i++) {
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

function seedPool(prefix: string, count: number, provenance: string) {
  let seeded = 0
  while (seeded < count) {
    const batch = Math.min(100, count - seeded)
    const r = runConvexFn(
      'curatedGeometry:seedRedhatFix07CoveragePool',
      {
        prefix,
        startIndex: seeded + 1,
        count: batch,
        geometryStatus: 'generated',
        geometryProvenance: provenance,
      },
      { identity: true },
    )
    expect(r.ok, `seed failed: ${r.stderr}\n${r.stdout}`).toBe(true)
    seeded += parseJson(r.stdout)?.count ?? batch
  }
}

describe('REDHAT-FIX-07 AC-5: post-fix trustworthy report for founder input', () => {
  let report: any
  let operatorNoteIncludesAll: boolean
  let postFixTrustworthy: boolean

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    purgePrefix(PREFIX)
    seedPool(SCRAPED_PREFIX, 500, 'scraped_promoted')
    seedPool(AI_PREFIX, 15, 'ai_reconstructed')
    seedPool(NR_PREFIX, 12, 'name_routed')

    const q = runConvexFn(
      'curatedGeometry:coverageReport',
      { routeIdPrefix: PREFIX },
      { identity: true },
    )
    expect(q.ok, `coverageReport failed: ${q.stderr}\n${q.stdout}`).toBe(true)
    report = parseJson(q.stdout)

    const ai = leverCandidates(report, 'ai_reconstructed')
    const nr = leverCandidates(report, 'name_routed')
    postFixTrustworthy =
      ai === 15 &&
      nr === 12 &&
      report?.source === 'live' &&
      report?.exhaustive === true &&
      report?.livePathSilentTake500 === false

    // Operator verification note: full-catalog rebatch before production founder accept
    const taskPath = resolve(
      PROJECT_ROOT,
      '.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/REDHAT-FIX-07-exhaustive-coverage-report-lever-counts.md',
    )
    const taskBody = readFileSync(taskPath, 'utf-8')
    const operatorNote = [
      'pnpm tsx scripts/backfill-curated-geometry.ts --all',
      'Post-fix coverageReport is the only valid founder accept/reject input.',
      'Pre-fix truncated packet (take(500) false zeros) MUST NOT drive UC-REC-04 accept.',
    ].join('\n')
    writeFileSync(resolve(EVIDENCE_DIR, 'AC-5-operator-rebatch-note.txt'), operatorNote)
    operatorNoteIncludesAll =
      operatorNote.includes('pnpm tsx scripts/backfill-curated-geometry.ts --all') &&
      taskBody.includes('pnpm tsx scripts/backfill-curated-geometry.ts --all')

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-5-post-fix-trustworthy.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          report,
          postFixTrustworthy,
          operatorNoteIncludesAll,
          pre_fix_truncated_report_used_for_accept: false,
        },
        null,
        2,
      ),
    )
  }, 600_000)

  afterAll(() => {
    purgePrefix(PREFIX)
  }, 300_000)

  it('TC-5: Post-fix re-query remains exhaustive; pre-fix truncated zeros not acceptable', () => {
    expect(leverCandidates(report, 'ai_reconstructed')).toBe(15)
    expect(leverCandidates(report, 'name_routed')).toBe(12)
    expect(leverCandidates(report, 'ai_reconstructed')).not.toBe(0)
    expect(leverCandidates(report, 'name_routed')).not.toBe(0)
    expect(postFixTrustworthy).toBe(true)
    expect(operatorNoteIncludesAll).toBe(true)
    expect(report?.exhaustive).toBe(true)
    expect(report?.livePathSilentTake500).toBe(false)
    expect(Array.isArray(report?.levers) && report.levers.length > 0).toBe(true)
  })
})
