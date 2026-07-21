/**
 * REDHAT-FIX-20 — Rebind gate-plan.json to honest 2026-07-21T152805Z control
 * surface and reject off-plan / stale forged scripts.
 *
 * Contract under test:
 *   AC-1 PRIMARY: no literal_cmd contains 2026-07-19T22:59:46Z; step1 points
 *     at 2026-07-21T152805Z; steps.length === 8
 *   AC-2: deriveGoalState rejects repro_cmd/bundle paths not in HEAD-bound plan
 *     → met===false with OFF_PLAN_SCRIPT / off-plan / stale blocker
 *   AC-3: plan-referenced step1.sh has no lever2FixedGeometry and no bare
 *     s4-human-gate operator identity
 *   AC-4: human steps 3/4/5/7 remain BLOCKED; rebinding alone never ACHIEVES
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { deriveGoalState, type StepResult } from '../../tools/gate/deriveGoalState'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const GATE_PLAN_PATH = join(
  PROJECT_ROOT,
  '.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json',
)
const GATE_PLAN_REL = '.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json'
const HONEST_RUN = '2026-07-21T152805Z'
const FORGED_RUN = '2026-07-19T22:59:46Z'
const HONEST_EVIDENCE_DIR = join(
  PROJECT_ROOT,
  '.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence',
  HONEST_RUN,
)
const HONEST_STEP_RESULTS_PATH = join(
  PROJECT_ROOT,
  '.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/honest-step-results.json',
)
const HONEST_RUN_STEP_RESULTS_PATH = join(HONEST_EVIDENCE_DIR, 'honest-step-results.json')

type GatePlan = {
  planned_at?: string
  planned_steps?: number
  steps: Array<{ n: number; literal_cmd?: string }>
}

function loadPlan(): GatePlan {
  return JSON.parse(readFileSync(GATE_PLAN_PATH, 'utf-8')) as GatePlan
}

function extractScriptPath(literalCmd: string): string | null {
  // literal_cmd is typically: bash <abs-or-rel-path>
  const m = literalCmd.match(/(?:^|\s)((?:\/|\.\/)?\S+\.sh)\s*$/)
  if (m) return m[1]
  const any = literalCmd.match(/(\S+\.sh)/)
  return any ? any[1] : null
}

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

function makeTempRepoWithPlan(): string {
  const root = mkdtempSync(join(tmpdir(), 's4t20-repo-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo FIX-20\n')
  // Seed the committed gate-plan so plan-binding reads the HEAD-bound plan.
  const planDest = join(root, GATE_PLAN_REL)
  mkdirSync(join(planDest, '..'), { recursive: true })
  writeFileSync(planDest, readFileSync(GATE_PLAN_PATH, 'utf-8'))
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', 'init'], root)
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
// AC-1 PRIMARY — gate-plan no longer references forged 2026-07-19 timestamp
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-20 AC-1: gate-plan rebound to honest control surface', () => {
  it('AC-1: no literal_cmd contains forged timestamp; step1 points at honest run; steps.length===8', () => {
    expect(existsSync(GATE_PLAN_PATH)).toBe(true)
    const plan = loadPlan()

    expect(plan.steps.length).toBe(8)
    expect(plan.steps.every((s) => !(s.literal_cmd ?? '').includes(FORGED_RUN))).toBe(true)

    const step1 = plan.steps.find((s) => s.n === 1)
    expect(step1).toBeDefined()
    expect(step1!.literal_cmd ?? '').toContain(HONEST_RUN)
    expect(step1!.literal_cmd ?? '').not.toContain(FORGED_RUN)
    expect(step1!.literal_cmd ?? '').not.toContain('lever2FixedGeometry')

    // Every step must reference the honest control surface.
    for (const step of plan.steps) {
      expect(step.literal_cmd ?? '', `step ${step.n} must reference ${HONEST_RUN}`).toContain(
        HONEST_RUN,
      )
      expect(
        step.literal_cmd ?? '',
        `step ${step.n} must not reference ${FORGED_RUN}`,
      ).not.toContain(FORGED_RUN)
    }

    // planned_at must not advertise the forged run identity.
    expect(plan.planned_at ?? '').not.toContain(FORGED_RUN)
    expect(plan.planned_at ?? '').not.toBe('2026-07-19T22:59:46Z')
  })
})

// ---------------------------------------------------------------------------
// AC-2 — Writer rejects stale forged script/bundle paths not in HEAD-bound plan
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-20 AC-2: writer rejects off-plan stale forged scripts', () => {
  it('AC-2: repro_cmd pointing at forged 2026-07-19 scripts → met:false + off-plan error', () => {
    const root = makeTempRepoWithPlan()
    temps.push(root)

    // Confirm the seeded plan is the HEAD-bound honest plan (post-fix) or at
    // least whatever is committed — AC-2 requires rejection when steps reference
    // a path NOT in that plan.
    const plan = JSON.parse(readFileSync(join(root, GATE_PLAN_REL), 'utf-8')) as GatePlan
    const planText = JSON.stringify(plan)
    // Off-plan forged path must not be an allowed plan script after rebinding.
    expect(
      planText.includes(FORGED_RUN) ||
        plan.steps.some((s) => (s.literal_cmd ?? '').includes(FORGED_RUN)),
    ).toBe(false)

    const forgedSteps: StepResult[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
      n,
      result: 'PASS' as const,
      repro_cmd: `bash .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/${FORGED_RUN}/scripts/step${n}.sh`,
    }))

    const state = deriveGoalState({
      steps: forgedSteps,
      repoCwd: root,
      convexRepoCwd: root,
    })

    expect(state.met).toBe(false)
    expect(state.goal).not.toBe('GATE-GOAL: ACHIEVED')

    const errorCode = state.error?.code
    const blocker = state.gate.blocker ?? ''
    const observesOffPlan =
      errorCode === 'OFF_PLAN_SCRIPT' ||
      blocker.includes(FORGED_RUN) ||
      blocker.toLowerCase().includes('off-plan')

    expect(
      observesOffPlan,
      `expected OFF_PLAN_SCRIPT or blocker naming off-plan/stale; got code=${errorCode} blocker=${blocker}`,
    ).toBe(true)
  })

  it('AC-2b: bundlePath at forged run dir rejected when plan is HEAD-bound to honest run', () => {
    const root = makeTempRepoWithPlan()
    temps.push(root)

    // Create a local forged-looking bundle path (untracked ok — plan-binding
    // should fire before or alongside structural validation).
    const forgedBundleRel = `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/${FORGED_RUN}`
    const forgedBundleAbs = join(root, forgedBundleRel)
    mkdirSync(join(forgedBundleAbs, 'scripts'), { recursive: true })
    writeFileSync(join(forgedBundleAbs, 'scripts/step1.sh'), '#!/bin/bash\necho forged\n')

    const steps: StepResult[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
      n,
      result: 'PASS' as const,
    }))

    const state = deriveGoalState({
      steps,
      bundlePath: forgedBundleAbs,
      repoCwd: root,
      convexRepoCwd: root,
    })

    expect(state.met).toBe(false)
    const errorCode = state.error?.code
    const blocker = state.gate.blocker ?? ''
    const observesOffPlan =
      errorCode === 'OFF_PLAN_SCRIPT' ||
      blocker.includes(FORGED_RUN) ||
      blocker.toLowerCase().includes('off-plan')
    expect(
      observesOffPlan,
      `expected off-plan rejection for forged bundle; got code=${errorCode} blocker=${blocker}`,
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AC-3 — Honest step1 control surface has no lever2FixedGeometry seam
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-20 AC-3: honest step1 has no lever2FixedGeometry / bare s4-human-gate', () => {
  it('AC-3: plan-referenced step1 script body is clean of forbidden seams', () => {
    const plan = loadPlan()
    const step1 = plan.steps.find((s) => s.n === 1)
    expect(step1?.literal_cmd).toBeTruthy()

    const scriptPath = extractScriptPath(step1!.literal_cmd!)
    expect(scriptPath, 'step1 literal_cmd must reference a .sh script').toBeTruthy()
    expect(scriptPath!).toContain(HONEST_RUN)
    expect(scriptPath!).not.toContain(FORGED_RUN)

    // Prefer worktree honest control surface over absolute paths from another checkout.
    const byName = join(HONEST_EVIDENCE_DIR, 'scripts', basename(scriptPath!))
    let resolved = existsSync(byName) ? byName : scriptPath!
    if (!existsSync(resolved)) {
      resolved = scriptPath!
    }
    expect(existsSync(resolved), `script must exist: ${resolved}`).toBe(true)

    const scriptBody = readFileSync(resolved, 'utf-8')
    expect(scriptBody.length).toBeGreaterThan(0)

    // AC-3: operational body must not use lever2FixedGeometry or bare s4-human-gate.
    // Strip pure comment lines so a doc note "NO lever2FixedGeometry seam" is not a seam.
    const operationalBody = scriptBody
      .split('\n')
      .filter((line) => {
        const t = line.trimStart()
        return t.length > 0 && !t.startsWith('#')
      })
      .join('\n')
    expect(operationalBody.includes('lever2FixedGeometry')).toBe(false)
    expect(operationalBody.includes('s4-human-gate')).toBe(false)
    // Full body must still lack the bare closeout identity (forged scripts set it as subject).
    expect(scriptBody.includes('s4-human-gate')).toBe(false)
    // And must not pass lever2FixedGeometry as a JSON/CLI argument (forged step1 does).
    expect(/["']lever2FixedGeometry["']\s*:/.test(scriptBody)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AC-4 — Human steps remain honestly BLOCKED (no forged PASS)
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-20 AC-4: human steps 3/4/5/7 remain BLOCKED after rebinding', () => {
  it('AC-4: honest-step-results 3/4/5/7 are BLOCKED; plan rebinding alone does not ACHIEVE', () => {
    const resultsPath = existsSync(HONEST_RUN_STEP_RESULTS_PATH)
      ? HONEST_RUN_STEP_RESULTS_PATH
      : HONEST_STEP_RESULTS_PATH
    expect(existsSync(resultsPath)).toBe(true)

    const honest = JSON.parse(readFileSync(resultsPath, 'utf-8')) as {
      steps: Array<{ n: number; result: string }>
    }
    const human = honest.steps.filter((s) => [3, 4, 5, 7].includes(s.n))
    expect(human.length).toBe(4)
    expect(human.every((s) => s.result === 'BLOCKED')).toBe(true)
    expect(human.some((s) => s.result === 'PASS' || s.result === 'PASS-real')).toBe(false)

    // Plan rebinding alone must not produce met:true / ACHIEVED.
    const root = makeTempRepoWithPlan()
    temps.push(root)
    const steps: StepResult[] = honest.steps.map((s) => ({
      n: s.n,
      result: s.result as StepResult['result'],
    }))
    const state = deriveGoalState({
      steps,
      repoCwd: root,
      convexRepoCwd: root,
    })
    expect(state.met).toBe(false)
    expect(state.goal).toBe('GATE-GOAL: BLOCKED')
    expect(state.goal).not.toBe('GATE-GOAL: ACHIEVED')
  })
})
