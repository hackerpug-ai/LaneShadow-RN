/**
 * REDHAT-FIX-18 — Canonical gate-step completeness (fixed 1..8 from gate-plan.json).
 *
 * Closes red-hat CRITICAL-2: allStepsPass was merely
 *   opts.steps.length > 0 && !anyBlocked
 * so a 1-step HEAD-bound all-PASS bundle could satisfy the mechanical
 * predicate while omitting human steps 3/4/5/7.
 *
 * Contract under test:
 *   AC-1 PRIMARY: 1-step all-PASS HEAD-bound bundle → met:false / incomplete (not ACHIEVED)
 *   AC-2: duplicate / missing / extra / reordered step IDs rejected
 *   AC-3: full 1..8 substantiated-PASS satisfies step completeness (founder may still block)
 *   AC-4: verifyEvidenceManifest rejects incomplete evidence_steps vs canonical 1..8
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import {
  deriveGoalState,
  type EvidenceManifest,
  type StepResult,
} from '../../tools/gate/deriveGoalState'
import { verifyEvidenceManifest } from '../../tools/gate/verifyEvidenceManifest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const GATE_PLAN_PATH = join(
  PROJECT_ROOT,
  '.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json',
)
const GATE_PLAN_REL = '.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json'

const ALL_PASS: StepResult[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  n,
  result: 'PASS' as const,
}))
const ONE_STEP_PASS: StepResult[] = [{ n: 1, result: 'PASS' }]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function git(args: string[], cwd: string): string {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return ''
  }
}

function makeTempRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 's4t18-repo-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo FIX-18\n')
  // Seed the committed gate-plan (read-only expected step set source) so
  // deriveGoalState / verifyEvidenceManifest can load steps[].n from cwd.
  const planDest = join(root, GATE_PLAN_REL)
  mkdirSync(join(planDest, '..'), { recursive: true })
  writeFileSync(planDest, readFileSync(GATE_PLAN_PATH, 'utf-8'))
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', 'init'], root)
  return root
}

function commitAll(root: string, msg: string): void {
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', msg], root)
}

function gitHead(root: string): string {
  return git(['rev-parse', 'HEAD'], root)
}

function manifestForSteps(steps: number[]): EvidenceManifest {
  const evidence_steps: Record<string, { result: string; artifacts: string[] }> = {}
  for (const n of steps) {
    evidence_steps[String(n)] = {
      result: 'PASS',
      artifacts: [`evidence/step${n}.json`],
    }
  }
  return { version: 1, evidence_steps }
}

/**
 * Build a HEAD-bound evidence bundle with PASS entries for the given step numbers.
 * Commits everything so per-file freshness == HEAD.
 */
function commitBundle(root: string, bundleRel: string, steps: number[]): string {
  const bundleAbs = join(root, bundleRel)
  mkdirSync(join(bundleAbs, 'evidence'), { recursive: true })
  for (const n of steps) {
    writeFileSync(join(bundleAbs, `evidence/step${n}.json`), JSON.stringify({ step: n, ok: true }))
  }
  writeFileSync(join(bundleAbs, 'manifest.json'), JSON.stringify(manifestForSteps(steps)))
  commitAll(root, `bundle ${bundleRel} steps ${steps.join(',')}`)
  return bundleAbs
}

const temps: string[] = []

afterEach(() => {
  while (temps.length > 0) {
    const t = temps.pop()
    if (t) rmSync(t, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Fixture sanity
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-18 fixtures', () => {
  it('canonical gate-plan.json has steps n=1..8 in order', () => {
    expect(existsSync(GATE_PLAN_PATH)).toBe(true)
    const plan = JSON.parse(readFileSync(GATE_PLAN_PATH, 'utf-8')) as {
      planned_steps: number
      steps: Array<{ n: number }>
    }
    expect(plan.planned_steps).toBe(8)
    expect(plan.steps.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
})

// ---------------------------------------------------------------------------
// AC-1 PRIMARY — 1-step all-PASS bundle is incomplete
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-18 AC-1: 1-step all-PASS bundle is incomplete', () => {
  it('AC-1: 1-step HEAD-bound all-PASS yields met:false / incomplete (not ACHIEVED)', () => {
    const root = makeTempRepo()
    temps.push(root)

    const bundleRel = '.gate-evidence/one-step'
    const bundlePath = commitBundle(root, bundleRel, [1])

    const state = deriveGoalState({
      steps: ONE_STEP_PASS,
      bundlePath,
      repoCwd: root,
      convexRepoCwd: root,
    })

    // MUST_OBSERVE
    expect(state.met).toBe(false)
    expect(state.goal).toBe('GATE-GOAL: BLOCKED')
    const incompleteNamed =
      state.error?.code === 'INCOMPLETE_CANONICAL_STEPS' ||
      state.error?.code === 'INCOMPLETE_EVIDENCE_STEPS' ||
      (typeof state.gate.blocker === 'string' && /incomplete/i.test(state.gate.blocker))
    expect(
      incompleteNamed,
      `expected incomplete-steps signal; got error=${JSON.stringify(state.error)} blocker=${state.gate.blocker}`,
    ).toBe(true)

    // MUST_NOT_OBSERVE
    expect(state.met).not.toBe(true)
    expect(state.goal).not.toBe('GATE-GOAL: ACHIEVED')
  })
})

// ---------------------------------------------------------------------------
// AC-2 — Duplicate / missing / extra / reordered rejected
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-18 AC-2: step identity violations rejected', () => {
  it('AC-2: duplicate / missing / extra / reordered step IDs → met:false with identity violation', () => {
    const root = makeTempRepo()
    temps.push(root)

    // Full 1..8 HEAD-bound bundle so only step-results identity is under test.
    const bundlePath = commitBundle(
      root,
      '.gate-evidence/full-for-identity',
      [1, 2, 3, 4, 5, 6, 7, 8],
    )

    const cases: Array<{ name: string; steps: StepResult[] }> = [
      {
        name: 'duplicate n:1 + missing n:7',
        steps: [
          { n: 1, result: 'PASS' },
          { n: 1, result: 'PASS' },
          { n: 2, result: 'PASS' },
          { n: 3, result: 'PASS' },
          { n: 4, result: 'PASS' },
          { n: 5, result: 'PASS' },
          { n: 6, result: 'PASS' },
          { n: 8, result: 'PASS' },
        ],
      },
      {
        name: 'extra n:9',
        steps: [...ALL_PASS, { n: 9, result: 'PASS' }],
      },
      {
        name: 'reordered (7 before 6)',
        steps: [
          { n: 1, result: 'PASS' },
          { n: 2, result: 'PASS' },
          { n: 3, result: 'PASS' },
          { n: 4, result: 'PASS' },
          { n: 5, result: 'PASS' },
          { n: 7, result: 'PASS' },
          { n: 6, result: 'PASS' },
          { n: 8, result: 'PASS' },
        ],
      },
      {
        name: 'missing n:7 (only 1..6,8)',
        steps: [1, 2, 3, 4, 5, 6, 8].map((n) => ({ n, result: 'PASS' as const })),
      },
    ]

    for (const c of cases) {
      const state = deriveGoalState({
        steps: c.steps,
        bundlePath,
        repoCwd: root,
        convexRepoCwd: root,
      })
      expect(state.met, `${c.name}: met`).toBe(false)
      expect(state.goal, `${c.name}: goal`).toBe('GATE-GOAL: BLOCKED')
      const identityNamed =
        state.error?.code === 'INVALID_STEP_IDENTITY' ||
        state.error?.code === 'INCOMPLETE_CANONICAL_STEPS' ||
        (typeof state.gate.blocker === 'string' &&
          (/duplicate/i.test(state.gate.blocker) ||
            /missing/i.test(state.gate.blocker) ||
            /reordered|order|extra|identity/i.test(state.gate.blocker)))
      expect(
        identityNamed,
        `${c.name}: expected identity/order violation; got error=${JSON.stringify(state.error)} blocker=${state.gate.blocker}`,
      ).toBe(true)
      expect(state.goal).not.toBe('GATE-GOAL: ACHIEVED')
    }
  })
})

// ---------------------------------------------------------------------------
// AC-3 — Full 1..8 substantiated-PASS satisfies step completeness
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-18 AC-3: full 1..8 substantiated-PASS satisfies completeness', () => {
  it('AC-3: full 1..8 PASS has no incomplete-steps error; founder still blocks met', () => {
    const root = makeTempRepo()
    temps.push(root)

    const bundlePath = commitBundle(root, '.gate-evidence/full-eight', [1, 2, 3, 4, 5, 6, 7, 8])

    const state = deriveGoalState({
      steps: ALL_PASS,
      bundlePath,
      repoCwd: root,
      convexRepoCwd: root,
    })

    expect(state.gate.steps.length).toBe(8)
    expect(state.error?.code).not.toBe('INCOMPLETE_CANONICAL_STEPS')
    expect(state.error?.code).not.toBe('INVALID_STEP_IDENTITY')
    expect(state.error?.code).not.toBe('INCOMPLETE_EVIDENCE_STEPS')
    // Founder attestation is absent in temp repo — met stays false (must not ACHIEVE without S4-T7).
    expect(state.met).toBe(false)
    expect(state.goal).toBe('GATE-GOAL: BLOCKED')
    expect(state.human_test.verdict).toBe('pending')
  })
})

// ---------------------------------------------------------------------------
// AC-4 — verifyEvidenceManifest rejects incomplete evidence_steps
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-18 AC-4: verifyEvidenceManifest rejects incomplete evidence_steps', () => {
  it('AC-4: one-step evidence_steps fails closed vs canonical 1..8', () => {
    const root = makeTempRepo()
    temps.push(root)

    const bundlePath = commitBundle(root, '.gate-evidence/one-step-manifest', [1])
    const head = gitHead(root)

    const verifyResult = verifyEvidenceManifest(bundlePath, head, root)

    // MUST_OBSERVE: verification fails closed OR deriveGoalState reports incomplete
    const state = deriveGoalState({
      steps: ONE_STEP_PASS,
      bundlePath,
      repoCwd: root,
      convexRepoCwd: root,
    })

    expect(state.met).toBe(false)
    const failClosed =
      verifyResult.ok === false ||
      state.error?.code === 'INCOMPLETE_EVIDENCE_STEPS' ||
      state.error?.code === 'INCOMPLETE_CANONICAL_STEPS'
    expect(
      failClosed,
      `expected fail-closed; verifyResult=${JSON.stringify(verifyResult)} error=${JSON.stringify(state.error)}`,
    ).toBe(true)

    if (verifyResult.ok === false) {
      expect(
        verifyResult.code === 'INCOMPLETE_EVIDENCE_STEPS' ||
          /incomplete|missing|canonical/i.test(verifyResult.details.reason),
      ).toBe(true)
    }

    // MUST_NOT_OBSERVE
    expect(state.goal).not.toBe('GATE-GOAL: ACHIEVED')
    expect(verifyResult.ok).not.toBe(true)
  })
})
