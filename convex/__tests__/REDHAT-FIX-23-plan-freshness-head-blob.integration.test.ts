/**
 * REDHAT-FIX-23 — Plan freshness attests HEAD blob, not last-touch==HEAD.
 *
 * Closes HIGH-2 PLAN_STALE regression from FIX-21: loadHeadBoundGatePlan
 * rejected clean HEAD-bound plans whenever unrelated commits advanced HEAD
 * past the plan file's last-touch commit.
 *
 * Contract under test:
 *   AC-1 PRIMARY: clean last-touch-behind → planLoad.ok, expectedSteps 1..8, no PLAN_STALE
 *   AC-2: dirty WT still PLAN_NOT_HEAD_BOUND / PLAN_DIRTY
 *   AC-3: missing HEAD plan → PLAN_NOT_IN_HEAD
 *   AC-4: FIX-18 multi-commit incomplete path → INCOMPLETE_* / INVALID_STEP_IDENTITY (not PLAN_STALE)
 *   AC-5: FIX-21 revised contract — clean last-touch-behind succeeds; dirty still fails
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
import {
  gitBlobHashHead,
  gitBlobHashWorkingTree,
  gitHeadInternal,
  gitLastCommit,
  gitShowHead,
} from '../../tools/gate/gitUtils'
import {
  GATE_PLAN_REL,
  loadGatePlanExpectedSteps,
  loadHeadBoundGatePlan,
} from '../../tools/gate/verifyEvidenceManifest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const GATE_PLAN_PATH = join(PROJECT_ROOT, GATE_PLAN_REL)
const HONEST_RUN = '2026-07-21T152805Z'
const CANONICAL_STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const

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

function honestEightStepPlan(): string {
  const steps = CANONICAL_STEPS.map((n) => ({
    n,
    text: `step ${n}`,
    type: 'terminal',
    method: 'real-cli',
    literal_cmd: `bash .gate-evidence/${HONEST_RUN}/scripts/step${n}.sh`,
  }))
  return `${JSON.stringify(
    {
      sprint: 'sprint-04-trust-pipeline',
      planned_at: '2026-07-21T15:28:05Z',
      planned_steps: 8,
      steps,
    },
    null,
    2,
  )}\n`
}

function dirtyOneStepPlan(): string {
  return `${JSON.stringify(
    {
      sprint: 'sprint-04-trust-pipeline',
      planned_at: '2026-07-19T22:59:46Z',
      planned_steps: 1,
      steps: [
        {
          n: 1,
          text: 'forged one-step',
          type: 'terminal',
          method: 'real-cli',
          literal_cmd: 'bash .gate-evidence/2026-07-19T22:59:46Z/scripts/step1.sh',
        },
      ],
    },
    null,
    2,
  )}\n`
}

/**
 * Fixture: clean-plan-blob-at-head-last-touch-behind
 * Commit honest 8-step plan, then unrelated commit so last-touch != HEAD,
 * while WT plan bytes still equal HEAD plan blob.
 */
function makeCleanLastTouchBehindRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 's4t23-clean-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo FIX-23\n')
  const planDest = join(root, GATE_PLAN_REL)
  mkdirSync(join(planDest, '..'), { recursive: true })
  writeFileSync(planDest, honestEightStepPlan())
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', 'init honest 8-step plan'], root)

  // Unrelated commit advances HEAD past plan last-touch.
  writeFileSync(join(root, 'unrelated.txt'), 'head advance without plan touch\n')
  git(['add', '--', 'unrelated.txt'], root)
  git(['commit', '-q', '-m', 'unrelated file after plan'], root)
  return root
}

/** plan-missing-from-head: temp repo with no GATE_PLAN_REL at HEAD. */
function makeRepoWithoutPlan(): string {
  const root = mkdtempSync(join(tmpdir(), 's4t23-noplan-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo no plan\n')
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', 'init without gate-plan'], root)
  return root
}

/**
 * FIX-18-style: plan committed first from project gate-plan.json, then
 * evidence bundle in a later commit (HEAD advances past plan last-touch).
 */
function makeFix18StyleRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 's4t23-fix18-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo FIX-23/18\n')
  const planDest = join(root, GATE_PLAN_REL)
  mkdirSync(join(planDest, '..'), { recursive: true })
  writeFileSync(planDest, readFileSync(GATE_PLAN_PATH, 'utf-8'))
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', 'init with gate-plan'], root)
  return root
}

function commitBundle(root: string, bundleRel: string, steps: number[]): string {
  const bundleAbs = join(root, bundleRel)
  mkdirSync(join(bundleAbs, 'evidence'), { recursive: true })
  const evidence_steps: Record<string, { result: string; artifacts: string[] }> = {}
  for (const n of steps) {
    writeFileSync(join(bundleAbs, `evidence/step${n}.json`), JSON.stringify({ step: n, ok: true }))
    evidence_steps[String(n)] = {
      result: 'PASS',
      artifacts: [`evidence/step${n}.json`],
    }
  }
  const manifest: EvidenceManifest = { version: 1, evidence_steps }
  writeFileSync(join(bundleAbs, 'manifest.json'), JSON.stringify(manifest))
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', `bundle ${bundleRel} steps ${steps.join(',')}`], root)
  return bundleAbs
}

/** clean-head-bound-eight-step-plan: last-touch may equal HEAD. */
function makeCleanHeadBoundRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 's4t23-headbound-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo clean head-bound\n')
  const planDest = join(root, GATE_PLAN_REL)
  mkdirSync(join(planDest, '..'), { recursive: true })
  writeFileSync(planDest, honestEightStepPlan())
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', 'init honest 8-step plan'], root)
  return root
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

describe('REDHAT-FIX-23 fixtures', () => {
  it('canonical gate-plan.json has steps n=1..8 (read-only shape check)', () => {
    expect(existsSync(GATE_PLAN_PATH)).toBe(true)
    const plan = JSON.parse(readFileSync(GATE_PLAN_PATH, 'utf-8')) as {
      planned_steps: number
      steps: Array<{ n: number }>
    }
    expect(plan.planned_steps).toBe(8)
    expect(plan.steps.map((s) => s.n)).toEqual([...CANONICAL_STEPS])
  })
})

// ---------------------------------------------------------------------------
// AC-1 PRIMARY — clean last-touch-behind does NOT return PLAN_STALE
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-23 AC-1: clean last-touch-behind plan loads from HEAD blob', () => {
  it('AC-1: clean last-touch != HEAD → planLoad.ok, expectedSteps 1..8, no PLAN_STALE', () => {
    const root = makeCleanLastTouchBehindRepo()
    temps.push(root)

    const head = gitHeadInternal(root)
    const planTouch = gitLastCommit(GATE_PLAN_REL, root)
    expect(planTouch).not.toBe(head)
    expect(planTouch.length).toBeGreaterThan(0)
    expect(head.length).toBeGreaterThan(0)

    const planWt = join(root, GATE_PLAN_REL)
    const wtHash = gitBlobHashWorkingTree(planWt, root)
    const headHash = gitBlobHashHead(GATE_PLAN_REL, root)
    expect(wtHash).toBe(headHash)
    expect(wtHash.length).toBeGreaterThan(0)

    const headContent = gitShowHead(GATE_PLAN_REL, root)
    expect(headContent).toBeTruthy()
    const headPlan = JSON.parse(headContent) as { steps: Array<{ n: number }> }
    expect(headPlan.steps.map((s) => s.n)).toEqual([...CANONICAL_STEPS])

    const planLoad = loadHeadBoundGatePlan(root, head)

    // MUST_OBSERVE
    expect(planLoad.ok).toBe(true)
    if (planLoad.ok) {
      expect(planLoad.expectedSteps).toEqual([...CANONICAL_STEPS])
    }
    expect(planLoad.ok === false && planLoad.code === 'PLAN_STALE').toBe(false)

    // deriveGoalState reaches step evaluation (may BLOCK on completeness / founder)
    const state = deriveGoalState({
      steps: ONE_STEP_PASS,
      repoCwd: root,
      convexRepoCwd: root,
    })
    expect(state.error?.code).not.toBe('PLAN_STALE')
    // Incomplete one-step is allowed; must not be PLAN_STALE
    expect(state.met).toBe(false)

    // MUST_NOT_OBSERVE
    if (planLoad.ok === false) {
      expect(planLoad.code).not.toBe('PLAN_STALE')
    }
  })
})

// ---------------------------------------------------------------------------
// AC-2 — dirty WT still fails closed after freshness model change
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-23 AC-2: dirty WT plan still fails closed', () => {
  it('AC-2: wtHash !== headHash after last-touch-behind → PLAN_NOT_HEAD_BOUND|PLAN_DIRTY', () => {
    const root = makeCleanLastTouchBehindRepo()
    temps.push(root)

    // Mutate WT without commit
    writeFileSync(join(root, GATE_PLAN_REL), dirtyOneStepPlan())

    const planWt = join(root, GATE_PLAN_REL)
    const wtHash = gitBlobHashWorkingTree(planWt, root)
    const headHash = gitBlobHashHead(GATE_PLAN_REL, root)
    expect(wtHash !== headHash).toBe(true)
    expect(wtHash.length).toBeGreaterThan(0)
    expect(headHash.length).toBeGreaterThan(0)

    // HEAD blob still honest 1..8
    const headPlan = JSON.parse(gitShowHead(GATE_PLAN_REL, root)) as {
      steps: Array<{ n: number }>
    }
    expect(headPlan.steps.map((s) => s.n)).toEqual([...CANONICAL_STEPS])

    const planLoad = loadHeadBoundGatePlan(root)

    // MUST_OBSERVE
    expect(planLoad.ok).toBe(false)
    if (planLoad.ok === false) {
      expect(
        planLoad.code === 'PLAN_NOT_HEAD_BOUND' || planLoad.code === 'PLAN_DIRTY',
        `expected PLAN_NOT_HEAD_BOUND|PLAN_DIRTY; got ${planLoad.code}`,
      ).toBe(true)
      expect(
        planLoad.details.reason === 'dirty_working_tree' || /dirty/i.test(planLoad.details.reason),
      ).toBe(true)
    }

    // MUST_NOT_OBSERVE
    expect(planLoad.ok).not.toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AC-3 — missing HEAD plan fails PLAN_NOT_IN_HEAD
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-23 AC-3: missing HEAD plan fails closed', () => {
  it('AC-3: GATE_PLAN_REL absent from HEAD → PLAN_NOT_IN_HEAD', () => {
    const root = makeRepoWithoutPlan()
    temps.push(root)

    expect(gitShowHead(GATE_PLAN_REL, root)).toBeFalsy()

    const planLoad = loadHeadBoundGatePlan(root)

    // MUST_OBSERVE
    expect(planLoad.ok).toBe(false)
    if (planLoad.ok === false) {
      expect(planLoad.code).toBe('PLAN_NOT_IN_HEAD')
    }

    // MUST_NOT_OBSERVE
    expect(planLoad.ok).not.toBe(true)
    if (planLoad.ok === false) {
      expect(planLoad.code).not.toBe('PLAN_STALE')
    }
  })
})

// ---------------------------------------------------------------------------
// AC-4 — FIX-18 multi-commit incomplete path is not PLAN_STALE
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-23 AC-4: multi-commit plan-then-evidence is not PLAN_STALE', () => {
  it('AC-4: incomplete one-step after plan-then-evidence → INCOMPLETE_* / INVALID_*, not PLAN_STALE', () => {
    const root = makeFix18StyleRepo()
    temps.push(root)

    const bundlePath = commitBundle(root, '.gate-evidence/one-step', [1])

    const head = gitHeadInternal(root)
    const planTouch = gitLastCommit(GATE_PLAN_REL, root)
    expect(planTouch).not.toBe(head)

    const state = deriveGoalState({
      steps: ONE_STEP_PASS,
      bundlePath,
      repoCwd: root,
      convexRepoCwd: root,
    })

    // MUST_OBSERVE
    expect(state.met).toBe(false)
    expect(state.error?.code).not.toBe('PLAN_STALE')
    const incompleteOrIdentity =
      state.error?.code === 'INCOMPLETE_CANONICAL_STEPS' ||
      state.error?.code === 'INVALID_STEP_IDENTITY' ||
      state.error?.code === 'INCOMPLETE_EVIDENCE_STEPS' ||
      (typeof state.gate.blocker === 'string' && /incomplete/i.test(state.gate.blocker))
    expect(
      incompleteOrIdentity,
      `expected incomplete/identity code; got error=${JSON.stringify(state.error)} blocker=${state.gate.blocker}`,
    ).toBe(true)

    // Identity-violation path (duplicate / missing) also not PLAN_STALE
    const identityState = deriveGoalState({
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
      bundlePath: commitBundle(root, '.gate-evidence/identity', [1, 2, 3, 4, 5, 6, 7, 8]),
      repoCwd: root,
      convexRepoCwd: root,
    })
    expect(identityState.met).toBe(false)
    expect(identityState.error?.code).not.toBe('PLAN_STALE')
    const identityNamed =
      identityState.error?.code === 'INVALID_STEP_IDENTITY' ||
      identityState.error?.code === 'INCOMPLETE_CANONICAL_STEPS' ||
      (typeof identityState.gate.blocker === 'string' &&
        (/duplicate|missing|identity|order|extra/i.test(identityState.gate.blocker) ||
          /incomplete/i.test(identityState.gate.blocker)))
    expect(
      identityNamed,
      `expected identity violation; got error=${JSON.stringify(identityState.error)}`,
    ).toBe(true)

    // MUST_NOT_OBSERVE
    expect(state.goal).not.toBe('GATE-GOAL: ACHIEVED')
    expect(identityState.goal).not.toBe('GATE-GOAL: ACHIEVED')
  })
})

// ---------------------------------------------------------------------------
// AC-5 — FIX-21 revised contract: clean last-touch-behind succeeds; dirty fails
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-23 AC-5: FIX-21 revised stale-last-touch contract', () => {
  it('AC-5: clean path 1..8; last-touch-behind ok 1..8; dirty fails closed', () => {
    // --- clean path: last-touch may === HEAD ---
    const cleanRoot = makeCleanHeadBoundRepo()
    temps.push(cleanRoot)

    const cleanHead = gitHeadInternal(cleanRoot)
    const cleanTouch = gitLastCommit(GATE_PLAN_REL, cleanRoot)
    expect(cleanTouch).toBe(cleanHead)
    const cleanWt = join(cleanRoot, GATE_PLAN_REL)
    expect(gitBlobHashWorkingTree(cleanWt, cleanRoot)).toBe(
      gitBlobHashHead(GATE_PLAN_REL, cleanRoot),
    )

    const cleanLoad = loadHeadBoundGatePlan(cleanRoot, cleanHead)
    expect(cleanLoad.ok).toBe(true)
    if (cleanLoad.ok) {
      expect(cleanLoad.expectedSteps).toEqual([...CANONICAL_STEPS])
    }
    expect(loadGatePlanExpectedSteps(cleanRoot)).toEqual([...CANONICAL_STEPS])

    // --- last-touch-behind clean path: MUST succeed (NOT PLAN_STALE) ---
    const behindRoot = makeCleanLastTouchBehindRepo()
    temps.push(behindRoot)

    const behindHead = gitHeadInternal(behindRoot)
    const behindTouch = gitLastCommit(GATE_PLAN_REL, behindRoot)
    expect(behindTouch).not.toBe(behindHead)
    const behindWt = join(behindRoot, GATE_PLAN_REL)
    expect(gitBlobHashWorkingTree(behindWt, behindRoot)).toBe(
      gitBlobHashHead(GATE_PLAN_REL, behindRoot),
    )

    const behindLoad = loadHeadBoundGatePlan(behindRoot, behindHead)
    expect(behindLoad.ok).toBe(true)
    if (behindLoad.ok) {
      expect(behindLoad.expectedSteps).toEqual([...CANONICAL_STEPS])
    }
    expect(behindLoad.ok === false && behindLoad.code === 'PLAN_STALE').toBe(false)

    // --- dirty path still fails ---
    writeFileSync(join(behindRoot, GATE_PLAN_REL), dirtyOneStepPlan())
    const dirtyLoad = loadHeadBoundGatePlan(behindRoot)
    expect(dirtyLoad.ok).toBe(false)
    if (dirtyLoad.ok === false) {
      expect(
        dirtyLoad.code === 'PLAN_NOT_HEAD_BOUND' || dirtyLoad.code === 'PLAN_DIRTY',
        `expected PLAN_NOT_HEAD_BOUND|PLAN_DIRTY; got ${dirtyLoad.code}`,
      ).toBe(true)
    }

    // MUST_NOT_OBSERVE
    if (cleanLoad.ok) {
      expect(cleanLoad.expectedSteps).not.toEqual([])
      expect(cleanLoad.expectedSteps).not.toEqual([1])
    }
    expect(dirtyLoad.ok).not.toBe(true)
  })
})
