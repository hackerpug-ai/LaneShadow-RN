/**
 * REDHAT-FIX-22 — Exact HEAD-bound plan script/command match for off-plan reject.
 *
 * Closes HIGH-1: rejectOffPlanScripts was run-ID allow-list only, so any
 * substitute script under an allowed `.gate-evidence/<runId>/` directory was
 * accepted. Fail-closed must also apply when HEAD plan has no usable literal_cmds.
 *
 * Contract under test:
 *   AC-1 PRIMARY: substitute not-in-gate-plan.sh under allowed run → OFF_PLAN_SCRIPT / met===false
 *   AC-2: exact plan step1 literal_cmd is not OFF_PLAN on script axis
 *   AC-3: empty/malformed plan literal_cmds fail closed (not null skip)
 *   AC-4: withdrawn 2026-07-19T22:59:46Z path still OFF_PLAN_SCRIPT
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

function honestEightStepPlan(rootPrefix?: string): string {
  // Relative `.gate-evidence/...` so plan/repro_cmd compare equal after canonicalize.
  // Optional rootPrefix allows absolute-style plan cmds when needed.
  const prefix = rootPrefix ? `${rootPrefix}/` : ''
  const steps = CANONICAL_STEPS.map((n) => ({
    n,
    text: `step ${n}`,
    type: 'terminal',
    method: 'real-cli',
    literal_cmd: `bash ${prefix}.gate-evidence/${HONEST_RUN}/scripts/step${n}.sh`,
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

function emptyLiteralCmdsPlan(): string {
  const steps = CANONICAL_STEPS.map((n) => ({
    n,
    text: `step ${n}`,
    type: 'terminal',
    method: 'real-cli',
    // Missing / empty / non-string literal_cmd — no usable binding surface.
    ...(n % 3 === 0 ? { literal_cmd: '' } : n % 3 === 1 ? {} : { literal_cmd: 42 }),
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
  const root = mkdtempSync(join(tmpdir(), 's4t22-repo-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo FIX-22\n')
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

const temps: string[] = []

afterEach(() => {
  while (temps.length > 0) {
    const t = temps.pop()
    if (t) rmSync(t, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// AC-1 PRIMARY — Substitute script under allowed run dir rejected
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-22 AC-1: substitute script under allowed run → OFF_PLAN_SCRIPT', () => {
  it('AC-1: not-in-gate-plan.sh under 2026-07-21T152805Z → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)
    const planLoad = loadHeadBoundGatePlan(root, head)
    expect(planLoad.ok).toBe(true)
    if (planLoad.ok) {
      expect(planLoad.runIds.has(HONEST_RUN)).toBe(true)
      expect(planLoad.literalCmds.length).toBe(8)
    }

    // Full 1..8 so identity/completeness does not short-circuit before off-plan.
    const substituteCmd = `bash ${root}/.gate-evidence/${HONEST_RUN}/scripts/not-in-gate-plan.sh`
    const steps: StepResult[] = CANONICAL_STEPS.map((n) => ({
      n,
      result: 'PASS' as const,
      // Only step 1 uses the substitute; others use plan-owned paths.
      repro_cmd: n === 1 ? substituteCmd : `bash .gate-evidence/${HONEST_RUN}/scripts/step${n}.sh`,
    }))

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
      reason.toLowerCase().includes('off-plan') || script.includes('not-in-gate-plan.sh'),
      `expected off-plan reason or script path; reason=${reason} script=${script}`,
    ).toBe(true)
    expect(state.met).toBe(false)
    expect(state.goal).not.toBe('GATE-GOAL: ACHIEVED')
    expect(state.error?.code).toBe('OFF_PLAN_SCRIPT')

    // MUST_NOT_OBSERVE: run-ID allow-list only (null accept)
    expect(offPlan === null).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AC-2 — Exact plan literal_cmd is not OFF_PLAN on script axis
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-22 AC-2: exact plan step1 literal_cmd not OFF_PLAN', () => {
  it('AC-2: repro_cmd equal to plan step1 literal_cmd → rejectOffPlanScripts returns null', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)
    const exactCmd = step1LiteralCmd(root)
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
    // Plan-owned path is accepted (exact match)
    const planLoad = loadHeadBoundGatePlan(root, head)
    expect(planLoad.ok).toBe(true)
    if (planLoad.ok) {
      expect(planLoad.literalCmds.some((c) => c === exactCmd || c.includes('step1.sh'))).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// AC-3 — Empty/malformed plan literal_cmds fail closed
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-22 AC-3: empty/malformed literal_cmds fail closed', () => {
  it('AC-3: HEAD plan with no usable literal_cmds does NOT return null skip', () => {
    const root = makeTempRepoWithPlan(emptyLiteralCmdsPlan())
    temps.push(root)

    const head = gitHeadInternal(root)
    const planLoad = loadHeadBoundGatePlan(root, head)
    // Plan parses (steps 1..8 present) but literalCmds empty.
    expect(planLoad.ok).toBe(true)
    if (planLoad.ok) {
      expect(planLoad.literalCmds.length).toBe(0)
      expect(planLoad.expectedSteps).toEqual([...CANONICAL_STEPS])
    }

    const steps: StepResult[] = [
      {
        n: 1,
        result: 'PASS',
        repro_cmd: `bash .gate-evidence/${HONEST_RUN}/scripts/step1.sh`,
      },
    ]

    const offPlan = rejectOffPlanScripts(steps, undefined, root, head)

    // MUST_OBSERVE: fail closed — not null skip on empty literalCmds
    expect(offPlan).not.toBeNull()
    const code = offPlan?.code
    const reason = (offPlan?.details.reason ?? '').toLowerCase()
    const failClosed =
      code === 'OFF_PLAN_SCRIPT' ||
      code === 'PLAN_NOT_HEAD_BOUND' ||
      code === 'PLAN_UNPARSEABLE' ||
      reason.includes('literal_cmd') ||
      reason.includes('no plan')
    expect(
      failClosed,
      `expected fail-closed on empty literal_cmds; got ${JSON.stringify(offPlan)}`,
    ).toBe(true)

    // MUST_NOT_OBSERVE: silent skip
    expect(offPlan === null).toBe(false)

    const state = deriveGoalState({
      steps,
      repoCwd: root,
      convexRepoCwd: root,
    })
    expect(state.met).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AC-4 — Withdrawn forged run path still OFF_PLAN
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-22 AC-4: withdrawn run path still OFF_PLAN_SCRIPT', () => {
  it('AC-4: repro_cmd under 2026-07-19T22:59:46Z → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)
    const planLoad = loadHeadBoundGatePlan(root, head)
    expect(planLoad.ok).toBe(true)
    if (planLoad.ok) {
      expect(planLoad.runIds.has(HONEST_RUN)).toBe(true)
      expect(planLoad.runIds.has(WITHDRAWN_RUN)).toBe(false)
    }

    // Full 1..8 so identity check does not pre-empt OFF_PLAN_SCRIPT.
    const withdrawnCmd = `bash .gate-evidence/${WITHDRAWN_RUN}/scripts/step1.sh`
    const steps: StepResult[] = CANONICAL_STEPS.map((n) => ({
      n,
      result: 'PASS' as const,
      repro_cmd: n === 1 ? withdrawnCmd : `bash .gate-evidence/${HONEST_RUN}/scripts/step${n}.sh`,
    }))

    const offPlan = rejectOffPlanScripts(steps, undefined, root, head)
    const state = deriveGoalState({
      steps,
      repoCwd: root,
      convexRepoCwd: root,
    })

    expect(offPlan).not.toBeNull()
    expect(offPlan?.code).toBe('OFF_PLAN_SCRIPT')
    expect(state.met).toBe(false)
    expect(state.goal).not.toBe('GATE-GOAL: ACHIEVED')
    expect(state.error?.code).toBe('OFF_PLAN_SCRIPT')
  })
})

// Keep PROJECT_ROOT referenced so the fixture stays tied to this worktree.
void PROJECT_ROOT
