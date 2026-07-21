/**
 * REDHAT-FIX-26 — STRICTLY ASCII + BYTE-EXACT command language.
 *
 * Closes HIGH-1 (cycle-5): FIX-25 shell-SAFE equality is still bypassable because
 * `normalizeFullCommand` tokenizes with JS `\s+`, which treats Unicode whitespace
 * (NBSP U+00A0, U+2007, U+202F, U+2028) as separators. `bash\u00A0…/step1.sh`
 * normalizes to the same stable key as the plan ASCII command and is accepted
 * despite not being byte-identical.
 *
 * Contract under test:
 *   AC-1 PRIMARY: Unicode whitespace separators → OFF_PLAN_SCRIPT / met===false
 *   AC-2: zero-width (U+200B / U+FEFF) → OFF_PLAN_SCRIPT / met===false
 *   AC-3: homoglyph / non-ASCII lookalike → OFF_PLAN_SCRIPT / met===false
 *   AC-4: blanket any non-ASCII → OFF_PLAN_SCRIPT / met===false
 *   AC-5: exact ASCII plan → null; FIX-24/25 vectors still OFF_PLAN_SCRIPT
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
  const root = mkdtempSync(join(tmpdir(), 's4t26-repo-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo FIX-26\n')
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

/** Assert OFF_PLAN_SCRIPT + met===false for a non-ASCII / off-plan attack command. */
function expectOffPlanStrictAscii(
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

  expect(offPlan, `expected OFF_PLAN for ${label}: ${JSON.stringify(attackCmd)}`).not.toBeNull()
  expect(offPlan?.code, `expected OFF_PLAN_SCRIPT for ${label}`).toBe('OFF_PLAN_SCRIPT')
  const reason = offPlan?.details.reason ?? ''
  const script = offPlan?.details.script ?? ''
  expect(
    reason.toLowerCase().includes('off-plan') ||
      script.includes('step1.sh') ||
      script.includes('\u00A0') ||
      /[^\x00-\x7F]/.test(script),
    `expected off-plan reason or non-ASCII/script; reason=${reason} script=${JSON.stringify(script)}`,
  ).toBe(true)
  // Leave script text intact — do not strip Unicode from details.
  expect(script, `details.script must preserve attack text for ${label}`).toBe(attackCmd)
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
// AC-1 PRIMARY — Unicode whitespace separators rejected
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-26 AC-1: Unicode whitespace separators → OFF_PLAN_SCRIPT', () => {
  it('AC-1: bash + NBSP/U+2007/U+202F/U+2028 + step1.sh → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)
    const planLoad = loadHeadBoundGatePlan(root, head)
    expect(planLoad.ok).toBe(true)
    if (planLoad.ok) {
      expect(planLoad.literalCmds.some((c) => c.includes('step1.sh'))).toBe(true)
    }

    // BUG: normalizeFullCommand uses text.trim().split(/\s+/) — JS \s matches
    // Unicode whitespace, so these normalize to the same stable key as the plan.
    const variants: Array<{ cmd: string; label: string }> = [
      { cmd: `bash\u00A0${STEP1_REL}`, label: 'nbsp-U+00A0' },
      { cmd: `bash\u2007${STEP1_REL}`, label: 'figure-space-U+2007' },
      { cmd: `bash\u202F${STEP1_REL}`, label: 'narrow-nbsp-U+202F' },
      { cmd: `bash\u2028${STEP1_REL}`, label: 'line-separator-U+2028' },
    ]

    for (const { cmd, label } of variants) {
      expectOffPlanStrictAscii(root, head, cmd, label)
    }
  })
})

// ---------------------------------------------------------------------------
// AC-2 — Zero-width injection rejected
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-26 AC-2: zero-width injection → OFF_PLAN_SCRIPT', () => {
  it('AC-2: U+200B between tokens and U+FEFF prefix/mid → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)

    // Zero-width space between interpreter and script (no ASCII space)
    expectOffPlanStrictAscii(
      root,
      head,
      `bash\u200B${STEP1_REL}`,
      'zwsp-between-tokens-U+200B',
    )

    // ZWSP inside path
    expectOffPlanStrictAscii(
      root,
      head,
      `bash .gate-evidence/${HONEST_RUN}/scripts/step\u200B1.sh`,
      'zwsp-inside-path-U+200B',
    )

    // BOM / ZWNBSP prefix — JS trim() may strip FEFF; STRICTLY-ASCII must still reject
    expectOffPlanStrictAscii(
      root,
      head,
      `\uFEFF${PLAN_STEP1_CMD}`,
      'feff-prefix-U+FEFF',
    )

    // FEFF mid-command between tokens
    expectOffPlanStrictAscii(
      root,
      head,
      `bash\uFEFF${STEP1_REL}`,
      'feff-mid-U+FEFF',
    )
  })
})

// ---------------------------------------------------------------------------
// AC-3 — Homoglyph / non-ASCII lookalike rejected
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-26 AC-3: homoglyph / non-ASCII lookalike → OFF_PLAN_SCRIPT', () => {
  it('AC-3: Cyrillic a in bash and full-width path → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)

    // Cyrillic 'а' (U+0430) replaces Latin 'a' in "bash"
    expectOffPlanStrictAscii(
      root,
      head,
      `b\u0430sh ${STEP1_REL}`,
      'cyrillic-homoglyph-bash',
    )

    // Full-width solidus (U+FF0F) in path segment
    expectOffPlanStrictAscii(
      root,
      head,
      `bash .gate-evidence${'\uFF0F'}${HONEST_RUN}/scripts/step1.sh`,
      'full-width-solidus-path',
    )
  })
})

// ---------------------------------------------------------------------------
// AC-4 — Blanket reject of ANY non-ASCII character
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-26 AC-4: blanket any non-ASCII → OFF_PLAN_SCRIPT', () => {
  it('AC-4: emoji / accented Latin in plan-shaped command → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)

    // Emoji injected into otherwise plan-shaped command
    expectOffPlanStrictAscii(
      root,
      head,
      `bash ${STEP1_REL} \u{1F680}`,
      'emoji-suffix',
    )

    // Accented Latin in interpreter-adjacent token
    expectOffPlanStrictAscii(
      root,
      head,
      `b\u00E1sh ${STEP1_REL}`,
      'accented-latin-bash',
    )
  })
})

// ---------------------------------------------------------------------------
// AC-5 — Exact ASCII plan accept; FIX-24/25 still reject
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-26 AC-5: exact ASCII plan accept + FIX-24/25 still reject', () => {
  it('AC-5: exact ASCII plan → null; flag/env/interpreter/metachar still OFF_PLAN', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)
    const exactCmd = step1LiteralCmd(root)
    expect(exactCmd).toBe(PLAN_STEP1_CMD)
    expect(exactCmd).toContain(HONEST_RUN)
    expect(exactCmd).toContain('step1.sh')
    // Plan command itself must be pure ASCII
    expect(/[^\x00-\x7F]/.test(exactCmd)).toBe(false)

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

    // FIX-24 named attacks
    expectOffPlanStrictAscii(
      root,
      head,
      `bash ${STEP1_REL} --unreviewed-flag`,
      'fix24-extra-flag',
    )
    expectOffPlanStrictAscii(
      root,
      head,
      `env FOO=attacker bash ${STEP1_REL}`,
      'fix24-env-prefix',
    )
    expectOffPlanStrictAscii(root, head, `sh ${STEP1_REL}`, 'fix24-sh-swap')

    // FIX-25 metachar suffix
    expectOffPlanStrictAscii(root, head, `bash ${STEP1_REL};:`, 'fix25-semicolon-suffix')
  })
})

// Keep PROJECT_ROOT referenced so the fixture stays tied to this worktree.
void PROJECT_ROOT
