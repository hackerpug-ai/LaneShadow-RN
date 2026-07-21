/**
 * REDHAT-FIX-24 — Exact NORMALIZED FULL-COMMAND equality for off-plan reject.
 *
 * Closes residual HIGH-1: path-only `.sh` match (FIX-22) accepted extra flags,
 * env-prefix wrappers, and interpreter swaps when the script key matched.
 *
 * Contract under test:
 *   AC-1 PRIMARY: bash plan-script.sh --unreviewed-flag → OFF_PLAN_SCRIPT / met===false
 *   AC-2: env FOO=attacker bash plan-script.sh → OFF_PLAN_SCRIPT / met===false
 *   AC-3: sh/python plan-script.sh (vs plan bash) → OFF_PLAN_SCRIPT / met===false
 *   AC-4: exact normalized plan step1 full command → null (not OFF_PLAN on off-plan axis)
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import {
  deriveGoalState,
  GATE_PLAN_REL,
  loadHeadBoundGatePlan,
  rejectOffPlanScripts,
  type StepResult,
} from '../../tools/gate/deriveGoalState'
import { gitHeadInternal } from '../../tools/gate/gitUtils'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const HONEST_RUN = '2026-07-21T152805Z'
const STEP1_REL = `.gate-evidence/${HONEST_RUN}/scripts/step1.sh`
const PLAN_STEP1_CMD = `bash ${STEP1_REL}`
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
  // Relative `.gate-evidence/...` so plan/repro_cmd compare equal after normalize.
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

function makeTempRepoWithPlan(planJson: string): string {
  const root = mkdtempSync(join(tmpdir(), 's4t24-repo-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo FIX-24\n')
  const planDest = join(root, GATE_PLAN_REL)
  mkdirSync(join(planDest, '..'), { recursive: true })
  writeFileSync(planDest, planJson)
  git(['add', '-A'], root)
  git(['commit', '-q', '-m', 'init HEAD-bound plan'], root)
  return root
}

function step1LiteralCmd(root: string): string {
  const head = gitHeadInternal(root)
  const planLoad = loadHeadBoundGatePlan(root, head)
  if (!planLoad.ok) throw new Error(`expected clean plan load: ${JSON.stringify(planLoad)}`)
  const step1 = planLoad.plan.steps.find((s) => s.n === 1)
  const cmd = typeof step1?.literal_cmd === 'string' ? step1.literal_cmd : ''
  if (!cmd) throw new Error('step1 literal_cmd missing')
  return cmd
}

/** Full 1..8 steps so identity/completeness does not short-circuit before off-plan. */
function eightStepsWithRepro(step1Repro: string): StepResult[] {
  return CANONICAL_STEPS.map((n) => ({
    n,
    result: 'PASS' as const,
    repro_cmd: n === 1 ? step1Repro : `bash .gate-evidence/${HONEST_RUN}/scripts/step${n}.sh`,
  }))
}

const temps: string[] = []

afterEach(() => {
  while (temps.length > 0) {
    const t = temps.pop()
    if (t) rmSync(t, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// AC-1 PRIMARY — Extra unreviewed flags rejected (path-only is insufficient)
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-24 AC-1: extra flags → OFF_PLAN_SCRIPT (full-command equality)', () => {
  it('AC-1: bash step1.sh --unreviewed-flag → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)
    const planLoad = loadHeadBoundGatePlan(root, head)
    expect(planLoad.ok).toBe(true)
    if (planLoad.ok) {
      expect(planLoad.literalCmds.some((c) => c.includes('step1.sh'))).toBe(true)
    }

    // Path alone would match plan under FIX-22 path-only; full-command must reject.
    const extraFlagCmd = `bash ${STEP1_REL} --unreviewed-flag`
    const steps = eightStepsWithRepro(extraFlagCmd)

    const offPlan = rejectOffPlanScripts(steps, undefined, root, head)
    const state = deriveGoalState({
      steps,
      repoCwd: root,
      convexRepoCwd: root,
    })

    // MUST_OBSERVE
    expect(offPlan).not.toBeNull()
    expect(offPlan?.code).toBe('OFF_PLAN_SCRIPT')
    const reason = offPlan?.details.reason ?? ''
    const script = offPlan?.details.script ?? ''
    expect(
      reason.toLowerCase().includes('off-plan') ||
        script.includes('--unreviewed-flag') ||
        script.includes('step1.sh'),
      `expected off-plan reason or flag/script; reason=${reason} script=${script}`,
    ).toBe(true)
    expect(state.met).toBe(false)
    expect(state.error?.code).toBe('OFF_PLAN_SCRIPT')

    // MUST_NOT_OBSERVE: path-only accept
    expect(offPlan === null).toBe(false)
    expect(state.met).not.toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AC-2 — Env-prefix wrapper rejected
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-24 AC-2: env-prefix wrapper → OFF_PLAN_SCRIPT', () => {
  it('AC-2: env FOO=attacker bash step1.sh → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)
    const envPrefixCmd = `env FOO=attacker bash ${STEP1_REL}`
    const steps = eightStepsWithRepro(envPrefixCmd)

    const offPlan = rejectOffPlanScripts(steps, undefined, root, head)
    const state = deriveGoalState({
      steps,
      repoCwd: root,
      convexRepoCwd: root,
    })

    // MUST_OBSERVE
    expect(offPlan).not.toBeNull()
    expect(offPlan?.code).toBe('OFF_PLAN_SCRIPT')
    expect(state.met).toBe(false)
    expect(state.error?.code).toBe('OFF_PLAN_SCRIPT')

    // MUST_NOT_OBSERVE: env-prefix stripped to path-only accept
    expect(offPlan === null).toBe(false)
    expect(state.met).not.toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AC-3 — Different interpreter rejected
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-24 AC-3: interpreter mismatch → OFF_PLAN_SCRIPT', () => {
  it('AC-3: sh/python step1.sh (plan is bash) → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)

    for (const interpreter of ['sh', 'python'] as const) {
      const swappedCmd = `${interpreter} ${STEP1_REL}`
      const steps = eightStepsWithRepro(swappedCmd)

      const offPlan = rejectOffPlanScripts(steps, undefined, root, head)
      const state = deriveGoalState({
        steps,
        repoCwd: root,
        convexRepoCwd: root,
      })

      // MUST_OBSERVE
      expect(offPlan, `expected OFF_PLAN for ${interpreter}`).not.toBeNull()
      expect(offPlan?.code, `expected OFF_PLAN_SCRIPT for ${interpreter}`).toBe('OFF_PLAN_SCRIPT')
      expect(state.met, `expected met===false for ${interpreter}`).toBe(false)
      expect(state.error?.code).toBe('OFF_PLAN_SCRIPT')

      // MUST_NOT_OBSERVE: interpreter ignored, path-only accept
      expect(offPlan === null).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// AC-4 — Exact plan full command accepted on off-plan axis
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-24 AC-4: exact plan full command not OFF_PLAN', () => {
  it('AC-4: repro_cmd equal to plan step1 full literal_cmd → rejectOffPlanScripts returns null', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)
    const exactCmd = step1LiteralCmd(root)
    expect(exactCmd).toBe(PLAN_STEP1_CMD)
    expect(exactCmd).toContain(HONEST_RUN)
    expect(exactCmd).toContain('step1.sh')

    const steps: StepResult[] = [
      {
        n: 1,
        result: 'PASS',
        repro_cmd: exactCmd,
      },
    ]

    const offPlan = rejectOffPlanScripts(steps, undefined, root, head)

    // MUST_OBSERVE: not OFF_PLAN on script axis
    expect(offPlan).toBeNull()

    // Plan-owned full command is in the allowed set
    const planLoad = loadHeadBoundGatePlan(root, head)
    expect(planLoad.ok).toBe(true)
    if (planLoad.ok) {
      expect(planLoad.literalCmds.some((c) => c === exactCmd || c.includes('step1.sh'))).toBe(true)
    }
  })
})

// Keep PROJECT_ROOT referenced so the fixture stays tied to this worktree.
void PROJECT_ROOT
