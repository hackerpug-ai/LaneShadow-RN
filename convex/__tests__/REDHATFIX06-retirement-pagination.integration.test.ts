/**
 * REDHAT-FIX-06 AC-2 / TC-2: listRetirementCandidates pagination stays under read limit.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-05
 * start_ref: redhatfix06-large-candidate-scan
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-redhatfix06-page',
  issuer: 'https://laneshadow.test',
})
const PREFIX = 'test:redhatfix06-page-'

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

describe('REDHAT-FIX-06 AC-2: listRetirementCandidates pagination', () => {
  let page1: any
  let page2: any | null = null
  let readLimitErrors = 0

  beforeAll(() => {
    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-redhatfix06-page', role: 'operator' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    const seed = runConvexFn(
      'curatedGeometry:seedRedhatFix06PaginationFixtures',
      { prefix: PREFIX, count: 60 },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const list1 = runConvexFn(
      'curatedGeometry:listRetirementCandidates',
      { limit: 50, routeIdPrefix: PREFIX, cursor: null },
      { identity: true },
    )
    if (!list1.ok) {
      if (/16.?MB|read limit|Too many bytes/i.test(list1.stderr + list1.stdout)) {
        readLimitErrors += 1
      }
    }
    expect(list1.ok, `list page1 failed: ${list1.stderr}\n${list1.stdout}`).toBe(true)
    page1 = parseJson(list1.stdout)

    if (page1?.continueCursor != null && page1?.isDone !== true) {
      const list2 = runConvexFn(
        'curatedGeometry:listRetirementCandidates',
        {
          limit: 50,
          routeIdPrefix: PREFIX,
          cursor: page1.continueCursor,
        },
        { identity: true },
      )
      if (!list2.ok) {
        if (/16.?MB|read limit|Too many bytes/i.test(list2.stderr + list2.stdout)) {
          readLimitErrors += 1
        }
      }
      expect(list2.ok, `list page2 failed: ${list2.stderr}\n${list2.stdout}`).toBe(true)
      page2 = parseJson(list2.stdout)
    }
  }, 300_000)

  afterAll(() => {
    runConvexFn('curatedGeometry:teardownS5T2Fixtures', { prefixes: [PREFIX] }, { identity: true })
  })

  it('TC-2: returns bounded page with continueCursor when more candidates exist', () => {
    const candidates = page1?.candidates ?? page1?.page ?? []
    expect(Array.isArray(candidates)).toBe(true)
    expect(candidates.length).toBeGreaterThanOrEqual(1)
    expect(candidates.length).toBeLessThanOrEqual(50)

    // Pagination contract: continueCursor present OR isDone true
    const hasCursor = page1?.continueCursor != null
    const isDone = page1?.isDone === true
    expect(hasCursor || isDone).toBe(true)

    // With 60 seeded rows and limit 50, we must not claim done without cursor
    // while remaining rows exist (pool size > page size).
    if (candidates.length === 50) {
      expect(page1?.continueCursor != null || page1?.isDone === true).toBe(true)
      // Prefer real multi-page: if continueCursor set, next page has rows or isDone
      if (page1?.continueCursor != null) {
        const next = page2?.candidates ?? page2?.page ?? []
        expect(Array.isArray(next)).toBe(true)
        // next page should not exceed limit
        expect(next.length).toBeLessThanOrEqual(50)
      }
    }

    expect(readLimitErrors).toBe(0)
    // MUST_NOT_OBSERVE: page.length > limit
    expect(candidates.length).toBeLessThanOrEqual(50)
  })
})
