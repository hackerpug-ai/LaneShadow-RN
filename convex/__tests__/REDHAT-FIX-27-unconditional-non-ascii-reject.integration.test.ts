/**
 * REDHAT-FIX-27 — Unconditional non-ASCII reject BEFORE marker heuristics.
 *
 * Closes HIGH-1 (cycle-6 re-review HEAD 41eca15c): FIX-26 claimed blanket
 * non-ASCII reject but implemented it CONDITIONAL on namesGateEvidenceScript(text),
 * which requires literal ASCII `.gate-evidence` AND `.sh` (or timestamp-shaped path).
 * Mutating those markers with Cyrillic е/һ, ZWSP, or full-width ．/／ blinds the
 * marker check → non-ASCII gate skipped → full-command check also skipped → null (ACCEPTED).
 *
 * Contract under test:
 *   AC-1 PRIMARY: Cyrillic е in .gatе-evidence / .gate-evidеnce → OFF_PLAN_SCRIPT
 *   AC-2: Cyrillic һ in .sһ / non-ASCII path segment → OFF_PLAN_SCRIPT
 *   AC-3: ZWSP / full-width ． / full-width ／ → OFF_PLAN_SCRIPT
 *   AC-4: non-ASCII in args (markers intact) OR no markers at all → OFF_PLAN_SCRIPT
 *   AC-5: exact ASCII plan → null; FIX-24/25/26 still OFF_PLAN; no conditional marker gate
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
  const root = mkdtempSync(join(tmpdir(), 's4t27-repo-'))
  git(['init', '-q'], root)
  git(['config', 'user.email', 'gate-test@laneshadow.test'], root)
  git(['config', 'user.name', 'Gate Test'], root)
  writeFileSync(join(root, 'README.md'), '# temp gate repo FIX-27\n')
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

/** True when any code unit is outside ASCII (0x00–0x7F). Avoids control-char regex lint. */
function hasNonAscii(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 0x7f) return true
  }
  return false
}

/** Assert OFF_PLAN_SCRIPT + met===false for a non-ASCII / off-plan attack command. */
function expectOffPlan(root: string, head: string, attackCmd: string, label: string): void {
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
      reason.toLowerCase().includes('non-ascii') ||
      hasNonAscii(script),
    `expected off-plan/non-ASCII reason or non-ASCII script; reason=${reason} script=${JSON.stringify(script)}`,
  ).toBe(true)
  // Leave script text intact — do not strip/NFKC Unicode from details.
  expect(script, `details.script must preserve raw attack text for ${label}`).toBe(attackCmd)
  expect(
    hasNonAscii(script) ||
      attackCmd.includes(';') ||
      attackCmd.includes('--') ||
      attackCmd.startsWith('env ') ||
      attackCmd.startsWith('sh '),
    `attack text should retain distinctive content for ${label}`,
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
// AC-1 PRIMARY — Cyrillic е in .gate-evidence / evidence marker
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-27 AC-1: Cyrillic marker obfuscation → OFF_PLAN_SCRIPT', () => {
  it('AC-1: Cyrillic е in .gatе-evidence and .gate-evidеnce → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)
    const planLoad = loadHeadBoundGatePlan(root, head)
    expect(planLoad.ok).toBe(true)
    if (planLoad.ok) {
      expect(planLoad.literalCmds.some((c) => c.includes('step1.sh'))).toBe(true)
    }

    // BUG at HEAD: namesGateEvidenceScript requires literal ASCII '.gate-evidence'
    // Cyrillic е (U+0435) blinds marker → conditional non-ASCII check skipped → null accept
    const cyrillicE = '\u0435' // Cyrillic small letter ie

    // `.gatе-evidence` — Cyrillic е replaces Latin e in 'gate'
    const gateCyrillic = `bash .gat${cyrillicE}-evidence/${HONEST_RUN}/scripts/step1.sh`
    expect(gateCyrillic.includes('.gate-evidence')).toBe(false)
    expect(hasNonAscii(gateCyrillic)).toBe(true)
    expectOffPlan(root, head, gateCyrillic, 'cyrillic-e-in-gate')

    // `.gate-evidеnce` — Cyrillic е replaces Latin e in 'evidence'
    const evidenceCyrillic = `bash .gate-evid${cyrillicE}nce/${HONEST_RUN}/scripts/step1.sh`
    expect(evidenceCyrillic.includes('.gate-evidence')).toBe(false)
    expect(hasNonAscii(evidenceCyrillic)).toBe(true)
    expectOffPlan(root, head, evidenceCyrillic, 'cyrillic-e-in-evidence')

    // details.script must preserve U+0435
    const steps = eightStepsWithRepro(gateCyrillic)
    const offPlan = rejectOffPlanScripts(steps, undefined, root, head)
    expect(offPlan?.details.script).toContain(cyrillicE)
  })
})

// ---------------------------------------------------------------------------
// AC-2 — Cyrillic һ in .sh extension / non-ASCII path segment
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-27 AC-2: Cyrillic .sh extension / path segment → OFF_PLAN_SCRIPT', () => {
  it('AC-2: Cyrillic һ in .sһ and non-ASCII path segment → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)

    // Cyrillic һ (U+04BB) in extension — namesGateEvidenceScript requires literal '.sh'
    const cyrillicH = '\u04bb' // Cyrillic small letter shha
    const shCyrillic = `bash .gate-evidence/${HONEST_RUN}/scripts/step1.s${cyrillicH}`
    expect(shCyrillic.includes('.sh')).toBe(false)
    expect(hasNonAscii(shCyrillic)).toBe(true)
    expectOffPlan(root, head, shCyrillic, 'cyrillic-h-in-sh-ext')

    // Non-ASCII path segment before extension (markers otherwise look plan-shaped)
    // e.g. step1-café.sh — has .gate-evidence and .sh but non-ASCII in path
    // Actually for AC-2 the path segment with non-ASCII might still have .sh and .gate-evidence
    // At HEAD: if markers intact, FIX-26 would catch it. The BYPASS is when markers break.
    // Variant: non-ASCII path segment with broken markers — e.g. scripts/stеp1.sh (Cyrillic е)
    // Wait - if .gate-evidence and .sh intact, namesGateEvidenceScript is true → HEAD already rejects.
    // The bug path is when markers are broken. Contract says:
    // "non-ASCII in path segment before extension while markers otherwise look plan-shaped"
    // With intact markers + non-ASCII, FIX-26 already rejects. But AC-2 primary is .sһ.
    // Also test path segment with Cyrillic that still has markers for completeness:
    const pathSegNonAscii = `bash .gate-evidence/${HONEST_RUN}/scripts/st\u0435p1.sh`
    expect(hasNonAscii(pathSegNonAscii)).toBe(true)
    expectOffPlan(root, head, pathSegNonAscii, 'non-ascii-path-segment-before-ext')
  })
})

// ---------------------------------------------------------------------------
// AC-3 — ZWSP / full-width blinding of markers
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-27 AC-3: ZWSP / full-width marker blinding → OFF_PLAN_SCRIPT', () => {
  it('AC-3: ZWSP in marker, full-width dot, full-width slash → OFF_PLAN_SCRIPT and met===false', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)

    // ZWSP U+200B inside `.gate-\u200bevidence`
    const zwspMarker = `bash .gate-\u200bevidence/${HONEST_RUN}/scripts/step1.sh`
    expect(zwspMarker.includes('.gate-evidence')).toBe(false)
    expect(hasNonAscii(zwspMarker)).toBe(true)
    expectOffPlan(root, head, zwspMarker, 'zwsp-inside-gate-evidence-marker')

    // Full-width ideographic full stop U+FF0E replacing ASCII '.'
    const fullWidthDot = `bash \uFF0Egate-evidence/${HONEST_RUN}/scripts/step1.sh`
    expect(fullWidthDot.includes('.gate-evidence')).toBe(false)
    expect(hasNonAscii(fullWidthDot)).toBe(true)
    expectOffPlan(root, head, fullWidthDot, 'full-width-dot-gate-evidence')

    // Full-width solidus U+FF0F preceding marker without leading ASCII dot
    const fullWidthSlash = `bash \uFF0Fgate-evidence/${HONEST_RUN}/scripts/step1.sh`
    expect(fullWidthSlash.includes('.gate-evidence')).toBe(false)
    expect(hasNonAscii(fullWidthSlash)).toBe(true)
    expectOffPlan(root, head, fullWidthSlash, 'full-width-slash-preceding-marker')

    // details.script preserves ZWSP / full-width code units
    const stepsZwsp = eightStepsWithRepro(zwspMarker)
    const offZwsp = rejectOffPlanScripts(stepsZwsp, undefined, root, head)
    expect(offZwsp?.details.script).toContain('\u200b')

    const stepsDot = eightStepsWithRepro(fullWidthDot)
    const offDot = rejectOffPlanScripts(stepsDot, undefined, root, head)
    expect(offDot?.details.script).toContain('\uff0e')

    const stepsSlash = eightStepsWithRepro(fullWidthSlash)
    const offSlash = rejectOffPlanScripts(stepsSlash, undefined, root, head)
    expect(offSlash?.details.script).toContain('\uff0f')
  })
})

// ---------------------------------------------------------------------------
// AC-4 — Non-ASCII in args / unrecognized still rejected without needing markers
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-27 AC-4: non-ASCII args / unrecognized unconditional → OFF_PLAN_SCRIPT', () => {
  it('AC-4: intact markers + café arg; /tmp/run-é.sh; emoji/CJK unrecognized → OFF_PLAN', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)

    // Intact ASCII markers + non-ASCII arg (FIX-26 already covers if markers intact;
    // proves unconditional still holds for args)
    const cafeArg = `bash ${STEP1_REL} --label=caf\u00e9`
    expect(cafeArg.includes('.gate-evidence')).toBe(true)
    expect(cafeArg.includes('.sh')).toBe(true)
    expect(hasNonAscii(cafeArg)).toBe(true)
    expectOffPlan(root, head, cafeArg, 'intact-markers-cafe-arg')

    // No gate-evidence markers at all + non-ASCII
    const tmpNonAscii = 'bash /tmp/run-\u00e9.sh'
    expect(tmpNonAscii.includes('.gate-evidence')).toBe(false)
    expect(hasNonAscii(tmpNonAscii)).toBe(true)
    expectOffPlan(root, head, tmpNonAscii, 'tmp-run-e-acute-no-markers')

    // Completely unrecognized shape + emoji/CJK
    const emojiCjk = 'run \u{1F680} \u4e2d\u6587-payload.sh'
    expect(emojiCjk.includes('.gate-evidence')).toBe(false)
    expect(hasNonAscii(emojiCjk)).toBe(true)
    expectOffPlan(root, head, emojiCjk, 'unrecognized-emoji-cjk')
  })
})

// ---------------------------------------------------------------------------
// AC-5 — Exact ASCII plan accept; FIX-24/25/26 still reject; order is non-ASCII first
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-27 AC-5: exact ASCII accept + FIX-24/25/26 still reject + unconditional gate', () => {
  it('AC-5: exact ASCII plan → null; flag/env/interpreter/metachar/NBSP still OFF_PLAN; no conditional marker gate', () => {
    const root = makeTempRepoWithPlan(honestEightStepPlan())
    temps.push(root)

    const head = gitHeadInternal(root)
    const exactCmd = step1LiteralCmd(root)
    expect(exactCmd).toBe(PLAN_STEP1_CMD)
    expect(exactCmd).toContain(HONEST_RUN)
    expect(exactCmd).toContain('step1.sh')
    expect(hasNonAscii(exactCmd)).toBe(false)

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
    expectOffPlan(root, head, `bash ${STEP1_REL} --unreviewed-flag`, 'fix24-extra-flag')
    expectOffPlan(root, head, `env FOO=attacker bash ${STEP1_REL}`, 'fix24-env-prefix')
    expectOffPlan(root, head, `sh ${STEP1_REL}`, 'fix24-sh-swap')

    // FIX-25 metachar suffix
    expectOffPlan(root, head, `bash ${STEP1_REL};:`, 'fix25-semicolon-suffix')

    // FIX-26 Unicode-whitespace separator
    expectOffPlan(root, head, `bash\u00A0${STEP1_REL}`, 'fix26-nbsp-separator')

    // Source assertion: non-ASCII reject must NOT be gated on namesGateEvidenceScript
    const deriveSrc = readFileSync(join(PROJECT_ROOT, 'tools/gate/deriveGoalState.ts'), 'utf-8')
    // Must have unconditional isStrictAscii reject (no && namesGateEvidenceScript on same condition)
    expect(
      deriveSrc.includes('if (!isStrictAscii(text) && namesGateEvidenceScript(text))'),
      'production checkText must NOT gate non-ASCII reject on namesGateEvidenceScript',
    ).toBe(false)
    expect(
      /if\s*\(\s*!isStrictAscii\s*\(\s*text\s*\)\s*\)/.test(deriveSrc),
      'production checkText must have unconditional if (!isStrictAscii(text))',
    ).toBe(true)

    // Behavioral equivalent: non-marker non-ASCII must reject (proves unconditional)
    const noMarkerNonAscii = 'echo \u00e9'
    expectOffPlan(root, head, noMarkerNonAscii, 'no-marker-non-ascii-unconditional')
  })
})

// Keep PROJECT_ROOT referenced so the fixture stays tied to this worktree.
void PROJECT_ROOT
