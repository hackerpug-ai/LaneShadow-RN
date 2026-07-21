/**
 * REDHAT-FIX-21 — Resolve canonical gate-plan authority from immutable HEAD-bound blob.
 *
 * Closes CRITICAL-1: loadGatePlanExpectedSteps / loadGatePlanBinding used
 * working-tree readFileSync, so a dirty one-step plan could shrink the
 * expected set to [1] and re-admit withdrawn run 2026-07-19T22:59:46Z.
 *
 * Contract under test:
 *   AC-1 PRIMARY: dirty one-step WT plan + one-step stale-run bundle rejected
 *   AC-2: HEAD-bound expected steps ignore dirty one-step WT plan
 *   AC-3: dirty plan fails closed with PLAN_NOT_HEAD_BOUND / PLAN_DIRTY
 *   AC-4: clean HEAD plan loads 1..8; clean last-touch-behind also loads 1..8
 *         (REDHAT-FIX-23: last-touch !== HEAD is NOT PLAN_STALE when blob at HEAD)
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import {
  deriveGoalState,
  type EvidenceManifest,
  loadGatePlanBinding,
  rejectOffPlanScripts,
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
  verifyEvidenceManifest,
} from '../../tools/gate/verifyEvidenceManifest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const GATE_PLAN_PATH = join(PROJECT_ROOT, GATE_PLAN_REL)
const HONEST_RUN = '2026-07-21T152805Z'
const WITHDRAWN_RUN = '2026-07-19T22:59:46Z'
const CANONICAL_STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const

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
          literal_cmd: `bash .gate-evidence/${WITHDRAWN_RUN}/scripts/step1.sh`,
        },
      ],
    },
    null,
    2,
  )}\n`
}

function makeTempRepoWithHonestPlan(): string {
  const root = mkdtempSync(join(tmpdir(), 's4t21-repo-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo FIX-21\n')
  const planDest = join(root, GATE_PLAN_REL)
  mkdirSync(join(planDest, '..'), { recursive: true })
  writeFileSync(planDest, honestEightStepPlan())
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', 'init honest 8-step plan'], root)
  return root
}

function commitAll(root: string, msg: string): void {
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', msg], root)
}

function applyDirtyOneStepPlan(root: string): void {
  writeFileSync(join(root, GATE_PLAN_REL), dirtyOneStepPlan())
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
 * Commit a one-step stale-run evidence bundle under the withdrawn run path.
 * Stages ONLY the bundle path so a dirty working-tree gate-plan is not
 * accidentally promoted into HEAD (preserves the dirty-plan attack surface).
 * Returns absolute bundle path.
 */
function commitOneStepStaleRunBundle(root: string): string {
  const bundleRel = `.gate-evidence/${WITHDRAWN_RUN}`
  const bundleAbs = join(root, bundleRel)
  mkdirSync(join(bundleAbs, 'evidence'), { recursive: true })
  mkdirSync(join(bundleAbs, 'scripts'), { recursive: true })
  writeFileSync(join(bundleAbs, 'evidence/step1.json'), JSON.stringify({ step: 1, ok: true }))
  writeFileSync(join(bundleAbs, 'scripts/step1.sh'), '#!/bin/bash\necho withdrawn\n')
  writeFileSync(join(bundleAbs, 'manifest.json'), JSON.stringify(manifestForSteps([1])))
  // Do NOT git add -A — that would stage a dirty one-step gate-plan into HEAD.
  git(['add', '--', bundleRel], root)
  git(['commit', '-q', '-m', `one-step stale-run bundle ${WITHDRAWN_RUN}`], root)
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

describe('REDHAT-FIX-21 fixtures', () => {
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
// AC-1 PRIMARY — Dirty one-step WT plan + one-step stale-run bundle rejected
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-21 AC-1: dirty one-step plan + stale-run bundle rejected', () => {
  it('AC-1: dirty one-step WT plan + one-step stale-run never expected:[1]+offPlan:null+manifest.ok', () => {
    const root = makeTempRepoWithHonestPlan()
    temps.push(root)

    // Dirty WT plan (not committed) — shrinks authority to step 1 + withdrawn run.
    applyDirtyOneStepPlan(root)
    const planWt = join(root, GATE_PLAN_REL)
    const wtHash = gitBlobHashWorkingTree(planWt, root)
    const headHash = gitBlobHashHead(GATE_PLAN_REL, root)
    expect(wtHash).not.toBe(headHash)
    expect(wtHash.length).toBeGreaterThan(0)
    expect(headHash.length).toBeGreaterThan(0)

    // HEAD plan content still has 1..8.
    const headPlanRaw = gitShowHead(GATE_PLAN_REL, root)
    expect(headPlanRaw).toContain('"n": 1')
    expect(headPlanRaw).toContain('"n": 8')
    const headPlan = JSON.parse(headPlanRaw) as { steps: Array<{ n: number }> }
    expect(headPlan.steps.map((s) => s.n)).toEqual([...CANONICAL_STEPS])

    // One-step stale-run evidence bundle (committed).
    // Note: committing the bundle advances HEAD past the plan last-touch; the
    // dirty plan is still the primary attack under test.
    const bundlePath = commitOneStepStaleRunBundle(root)
    // Re-apply dirty plan after the bundle commit (commit restores clean WT via
    // git add of other paths only — plan WT may still be dirty if not staged).
    applyDirtyOneStepPlan(root)

    const head = gitHeadInternal(root)
    const planLoad = loadHeadBoundGatePlan(root, head)
    const expectedSteps = loadGatePlanExpectedSteps(root)
    const oneStep: StepResult[] = [
      {
        n: 1,
        result: 'PASS',
        repro_cmd: `bash .gate-evidence/${WITHDRAWN_RUN}/scripts/step1.sh`,
      },
    ]
    const offPlan = rejectOffPlanScripts(oneStep, bundlePath, root, head)
    const manifest = verifyEvidenceManifest(bundlePath, head, root)
    const state = deriveGoalState({
      steps: oneStep,
      bundlePath,
      repoCwd: root,
      convexRepoCwd: root,
    })

    // MUST_NOT_OBSERVE: silent WT authority shrink
    expect(expectedSteps).not.toEqual([1])
    expect(expectedSteps.length === 1 && expectedSteps[0] === 1).toBe(false)
    expect(offPlan === null && manifest.ok === true).toBe(false)
    expect(state.met).toBe(false)
    expect(state.goal).not.toBe('GATE-GOAL: ACHIEVED')

    // MUST_OBSERVE: HEAD expected 1..8 OR plan fail-closed; never met
    const planFailClosed =
      planLoad.ok === false &&
      (planLoad.code === 'PLAN_NOT_HEAD_BOUND' ||
        planLoad.code === 'PLAN_DIRTY' ||
        planLoad.code === 'PLAN_STALE' ||
        planLoad.code === 'PLAN_NOT_IN_HEAD')
    const expectedFromHead =
      Array.isArray(expectedSteps) &&
      expectedSteps.length === 8 &&
      expectedSteps.every((n, i) => n === CANONICAL_STEPS[i])
    expect(
      planFailClosed || expectedFromHead,
      `expected plan fail-closed or HEAD 1..8; planLoad=${JSON.stringify(planLoad)} expectedSteps=${JSON.stringify(expectedSteps)}`,
    ).toBe(true)

    const rejectNamed =
      manifest.ok === false ||
      state.error?.code === 'INCOMPLETE_EVIDENCE_STEPS' ||
      state.error?.code === 'INCOMPLETE_CANONICAL_STEPS' ||
      state.error?.code === 'OFF_PLAN_SCRIPT' ||
      state.error?.code === 'PLAN_NOT_HEAD_BOUND' ||
      state.error?.code === 'PLAN_DIRTY' ||
      state.error?.code === 'PLAN_STALE' ||
      state.error?.code === 'PLAN_NOT_IN_HEAD' ||
      offPlan !== null
    expect(
      rejectNamed,
      `expected reject signal; manifest=${JSON.stringify(manifest)} error=${JSON.stringify(state.error)} offPlan=${JSON.stringify(offPlan)}`,
    ).toBe(true)
    expect(state.met).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AC-2 — HEAD-bound expected steps ignore dirty one-step WT plan
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-21 AC-2: HEAD expected steps ignore dirty one-step WT', () => {
  it('AC-2: dirty one-step WT plan never silently returns expectedSteps === [1]', () => {
    const root = makeTempRepoWithHonestPlan()
    temps.push(root)

    applyDirtyOneStepPlan(root)
    const planWt = join(root, GATE_PLAN_REL)
    expect(gitBlobHashWorkingTree(planWt, root)).not.toBe(gitBlobHashHead(GATE_PLAN_REL, root))

    // HEAD still has 1..8
    const headPlan = JSON.parse(gitShowHead(GATE_PLAN_REL, root)) as {
      steps: Array<{ n: number }>
    }
    expect(headPlan.steps.map((s) => s.n)).toEqual([...CANONICAL_STEPS])

    const planLoad = loadHeadBoundGatePlan(root)
    const expectedSteps = loadGatePlanExpectedSteps(root)

    // MUST_NOT_OBSERVE
    expect(expectedSteps).not.toEqual([1])
    if (planLoad.ok) {
      expect(planLoad.expectedSteps).not.toEqual([1])
      expect(planLoad.expectedSteps).toEqual([...CANONICAL_STEPS])
    }

    // MUST_OBSERVE: HEAD 1..8 OR fail-closed PLAN_NOT_HEAD_BOUND/PLAN_DIRTY
    if (planLoad.ok) {
      expect(planLoad.expectedSteps).toEqual([...CANONICAL_STEPS])
      expect(expectedSteps).toEqual([...CANONICAL_STEPS])
    } else {
      expect(
        planLoad.code === 'PLAN_NOT_HEAD_BOUND' || planLoad.code === 'PLAN_DIRTY',
        `expected PLAN_NOT_HEAD_BOUND|PLAN_DIRTY; got ${planLoad.code}`,
      ).toBe(true)
      // loadGatePlanExpectedSteps must not return WT [1]
      expect(expectedSteps).not.toEqual([1])
    }
  })
})

// ---------------------------------------------------------------------------
// AC-3 — Dirty plan fails closed with PLAN_NOT_HEAD_BOUND/PLAN_DIRTY
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-21 AC-3: dirty plan fails closed', () => {
  it('AC-3: wtHash !== headHash → PLAN_NOT_HEAD_BOUND or PLAN_DIRTY; planLoad.ok false', () => {
    const root = makeTempRepoWithHonestPlan()
    temps.push(root)

    applyDirtyOneStepPlan(root)
    const planWt = join(root, GATE_PLAN_REL)
    const wtHash = gitBlobHashWorkingTree(planWt, root)
    const headHash = gitBlobHashHead(GATE_PLAN_REL, root)
    expect(wtHash !== headHash).toBe(true)

    const planLoad = loadHeadBoundGatePlan(root)
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

    // Binding must not use dirty WT withdrawn run as authority
    const binding = loadGatePlanBinding(root)
    expect(binding.runIds.has(WITHDRAWN_RUN)).toBe(false)

    const state = deriveGoalState({
      steps: [{ n: 1, result: 'PASS' }],
      repoCwd: root,
      convexRepoCwd: root,
    })
    expect(state.met).toBe(false)
    expect(
      state.error?.code === 'PLAN_NOT_HEAD_BOUND' ||
        state.error?.code === 'PLAN_DIRTY' ||
        state.error?.code === 'INCOMPLETE_CANONICAL_STEPS' ||
        state.error?.code === 'PLAN_STALE',
      `expected plan/incomplete error; got ${state.error?.code}`,
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AC-4 — Clean HEAD plan loads 1..8; clean last-touch-behind also succeeds
// (REDHAT-FIX-23: last-touch !== HEAD is NOT fail-closed for clean HEAD blob)
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-21 AC-4: clean HEAD plan loads 1..8; last-touch-behind also ok', () => {
  it('AC-4: clean plan returns expectedSteps 1..8; last-touch-behind also succeeds (not PLAN_STALE)', () => {
    // --- clean path: plan last-touch === HEAD, wtHash === headHash ---
    const cleanRoot = makeTempRepoWithHonestPlan()
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
      expect(cleanLoad.literalCmds.length).toBe(8)
      expect(cleanLoad.runIds.has(HONEST_RUN)).toBe(true)
      expect(cleanLoad.runIds.has(WITHDRAWN_RUN)).toBe(false)
    }
    expect(loadGatePlanExpectedSteps(cleanRoot)).toEqual([...CANONICAL_STEPS])

    // --- last-touch-behind path: unrelated commit advances HEAD; plan still clean ---
    // REDHAT-FIX-23: HEAD-bound plan blob is usable when last-touch != HEAD.
    const behindRoot = makeTempRepoWithHonestPlan()
    temps.push(behindRoot)
    writeFileSync(join(behindRoot, 'unrelated.txt'), 'head advance without plan touch\n')
    commitAll(behindRoot, 'unrelated file after plan')

    const behindHead = gitHeadInternal(behindRoot)
    const behindTouch = gitLastCommit(GATE_PLAN_REL, behindRoot)
    expect(behindTouch).not.toBe(behindHead)
    // Plan content still byte-equal (not dirty)
    const behindWt = join(behindRoot, GATE_PLAN_REL)
    expect(gitBlobHashWorkingTree(behindWt, behindRoot)).toBe(
      gitBlobHashHead(GATE_PLAN_REL, behindRoot),
    )

    const behindLoad = loadHeadBoundGatePlan(behindRoot, behindHead)
    expect(behindLoad.ok).toBe(true)
    if (behindLoad.ok) {
      expect(behindLoad.expectedSteps).toEqual([...CANONICAL_STEPS])
      expect(behindLoad.literalCmds.length).toBe(8)
      expect(behindLoad.runIds.has(HONEST_RUN)).toBe(true)
      expect(behindLoad.runIds.has(WITHDRAWN_RUN)).toBe(false)
    }
    expect(behindLoad.ok === false && behindLoad.code === 'PLAN_STALE').toBe(false)

    // MUST_NOT_OBSERVE
    if (cleanLoad.ok) {
      expect(cleanLoad.expectedSteps).not.toEqual([])
      expect(cleanLoad.expectedSteps).not.toEqual([1])
    }
    if (behindLoad.ok) {
      expect(behindLoad.expectedSteps).not.toEqual([])
      expect(behindLoad.expectedSteps).not.toEqual([1])
    }
  })
})
