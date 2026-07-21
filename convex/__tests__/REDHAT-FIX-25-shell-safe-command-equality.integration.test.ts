/**
 * REDHAT-FIX-25 — Shell-SAFE exact command comparison (reject metachar suffix bypass).
 *
 * Closes HIGH residual: FIX-24 full-command equality is bypassable by appending
 * shell metacharacters after the plan-owned command (`bash …/step1.sh;:`,
 * `bash …/step1.sh$(true)`, etc.) because `canonicalizeScriptPath` falls back
 * to `/\S+\.sh/` which extracts a clean `.sh` prefix from a larger shell token.
 *
 * Contract under test:
 *   AC-1 PRIMARY: bash plan-script.sh;: → OFF_PLAN_SCRIPT / met===false
 *   AC-2: bash plan-script.sh$(true) and backtick form → OFF_PLAN_SCRIPT / met===false
 *   AC-3: && / || / | / > / < suffixes → OFF_PLAN_SCRIPT / met===false
 *   AC-4: newline/tab and quote/IFS evasion → OFF_PLAN_SCRIPT / met===false
 *   AC-5: exact plan full command → null; FIX-24 attacks still OFF_PLAN_SCRIPT
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
  const root = mkdtempSync(join(tmpdir(), 's4t25-repo-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo FIX-25\n')
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

/** Assert OFF_PLAN_SCRIPT + met===false for a shell-metachar attack command. */
function expectOffPlanMetachar(
  root: string,
  head: string,
  attackCmd: string,
  label: string,
): void {
  const steps = eightStepsWithRepro(attackCmd)
  const offPlan = rejectOffPlanScripts(steps, undefined, root, head)
  const state = deriveGoalState({
    steps,
    repoCwd: root,
    convexRepoCwd: root,
  })

  expect(offPlan, `expected OFF_PLAN for ${label}: ${attackCmd}`).not.toBeNull()
  expect(offPlan?.code, `expected OFF_PLAN_SCRIPT for ${label}`).toBe('OFF_PLAN_SCRIPT')
  const reason = offPlan?.details.reason ?? ''
  const script = offPlan?.details.script ?? ''
  expect(
    reason.toLowerCase().includes('off-plan') ||
      script.includes('step1.sh') ||
      /[;&|$\x60()<>\n\t]/.test(script),
    `expected off-plan reason or metachar/script; reason=${reason} script=${script}`,
  ).toBe(true)
  expect(state.met, `expected met===false for ${label}`).toBe(false)
  expect(state.error?.code).toBe('OFF_PLAN_SCRIPT')
  expect(offPlan === null).toBe(false)
  expect(state.met).not.toBe(true)
}

const temps: string[] = []

afterEach(() => {
  while (temps.length > 0) {
    const t = temps.pop()
    if (t) rmSync(t, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// AC-1 PRIMARY — Semicolon / trailing metachar suffix rejected
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-25 AC-1: semicolon metachar suffix → OFF_PLAN_SCRIPT', () => {
  it('AC-1: bash step1.sh;: → OFF_PLAN_SCRIPT and met===false (not .sh prefix extract)', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)
    const planLoad = loadHeadBoundGatePlan(root, head)
    expect(planLoad.ok).toBe(true)
    if (planLoad.ok) {
      expect(planLoad.literalCmds.some((c) => c.includes('step1.sh'))).toBe(true)
    }

    // BUG: canonicalizeScriptPath extracts clean .sh from `step1.sh;:` so
    // normalizeFullCommand yields the same stable key as the plan (null accept).
    // Shell-SAFE comparison must reject trailing semicolon metachar suffix.
    const semicolonSuffixCmd = `bash ${STEP1_REL};:`
    expectOffPlanMetachar(root, head, semicolonSuffixCmd, 'semicolon-suffix')
  })
})

// ---------------------------------------------------------------------------
// AC-2 — Command substitution $() and backticks rejected
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-25 AC-2: command substitution → OFF_PLAN_SCRIPT', () => {
  it('AC-2: bash step1.sh$(true) and backtick form → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)

    // Dollar-paren command substitution glued to plan script
    expectOffPlanMetachar(
      root,
      head,
      `bash ${STEP1_REL}$(true)`,
      'cmd-substitution-$()',
    )

    // Backtick command substitution glued to plan script
    expectOffPlanMetachar(
      root,
      head,
      // biome-ignore lint/style/useTemplate: intentional backtick form for shell metachar vector
      'bash ' + STEP1_REL + '`true`',
      'cmd-substitution-backtick',
    )
  })
})

// ---------------------------------------------------------------------------
// AC-3 — Operators && / || / | and redirects rejected
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-25 AC-3: operators and redirects → OFF_PLAN_SCRIPT', () => {
  it('AC-3: && / || / | / > / < suffixes → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)

    const variants: Array<{ cmd: string; label: string }> = [
      { cmd: `bash ${STEP1_REL}&&:`, label: 'and-and' },
      { cmd: `bash ${STEP1_REL}||:`, label: 'or-or' },
      { cmd: `bash ${STEP1_REL}|cat`, label: 'pipe' },
      { cmd: `bash ${STEP1_REL}>/tmp/x`, label: 'redirect-out' },
      { cmd: `bash ${STEP1_REL}</tmp/y`, label: 'redirect-in' },
    ]

    for (const { cmd, label } of variants) {
      expectOffPlanMetachar(root, head, cmd, label)
    }
  })
})

// ---------------------------------------------------------------------------
// AC-4 — Newline/tab control characters and quote/IFS evasion rejected
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-25 AC-4: control chars and quote/IFS evasion → OFF_PLAN_SCRIPT', () => {
  it('AC-4: newline/tab and quote/IFS evasion → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)

    // Newline after plan command + colon (control-char smuggle)
    expectOffPlanMetachar(
      root,
      head,
      `bash ${STEP1_REL}\n:`,
      'newline-suffix',
    )

    // Tab after plan command + extra token
    expectOffPlanMetachar(
      root,
      head,
      `bash ${STEP1_REL}\textra`,
      'tab-suffix',
    )

    // Quoted $() form that still embeds command-substitution metacharacters
    expectOffPlanMetachar(
      root,
      head,
      `bash ${STEP1_REL}'$(true)'`,
      'quoted-cmd-substitution',
    )

    // Escaped semicolon form (backslash before metachar still smuggles authority)
    expectOffPlanMetachar(
      root,
      head,
      `bash ${STEP1_REL}\\;:`,
      'escaped-semicolon',
    )
  })
})

// ---------------------------------------------------------------------------
// AC-5 — Exact plan full command accepted; FIX-24 attacks still reject
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-25 AC-5: exact plan accept + FIX-24 still reject', () => {
  it('AC-5: exact plan full command → null; FIX-24 flag/env/interpreter still OFF_PLAN', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)
    const exactCmd = step1LiteralCmd(root)
    expect(exactCmd).toBe(PLAN_STEP1_CMD)
    expect(exactCmd).toContain(HONEST_RUN)
    expect(exactCmd).toContain('step1.sh')

    // Exact plan step1 full command must NOT be OFF_PLAN on the off-plan axis
    const exactSteps: StepResult[] = [
      {
        n: 1,
        result: 'PASS',
        repro_cmd: exactCmd,
      },
    ]
    const exactOffPlan = rejectOffPlanScripts(exactSteps, undefined, root, head)
    expect(exactOffPlan).toBeNull()

    // FIX-24 named attacks must still reject after shell-SAFE hardening
    expectOffPlanMetachar(
      root,
      head,
      `bash ${STEP1_REL} --unreviewed-flag`,
      'fix24-extra-flag',
    )
    expectOffPlanMetachar(
      root,
      head,
      `env FOO=attacker bash ${STEP1_REL}`,
      'fix24-env-prefix',
    )
    expectOffPlanMetachar(root, head, `sh ${STEP1_REL}`, 'fix24-sh-swap')
    expectOffPlanMetachar(root, head, `python ${STEP1_REL}`, 'fix24-python-swap')
  })
})

// Keep PROJECT_ROOT referenced so the fixture stays tied to this worktree.
void PROJECT_ROOT
