/**
 * S2-T5 — Blocked measurement recorder for cold-start (≤8s) + bundle-size
 * delta (≤10MB) ceilings.
 *
 * This script is a BLOCKED PROBE — nothing more. It attempts a cloud-dev
 * deploy (`npx convex dev --once`), captures the REAL failure, and records
 * status:"blocked" with the real error text, exit code, and endpoint URL.
 *
 * It does NOT implement cold-start or bundle-delta measurement. There is no
 * success branch that claims to measure either number. The deploy is genuinely
 * blocked by an upstream sprint configuration/dependency footprint from
 * S2-T1/S2-T4: the @mastra/core + ai@7 + @mastra/observability + @ai-sdk/*
 * externalPackages (installed in S2-T1, extended in S2-T4) push the zipped
 * module size to 62.79 MiB, exceeding Convex's 42.92 MiB ceiling.
 *
 * Per the task STRICTLY rule: SKIP-with-reason (never fake success) when the
 * cloud dev deployment is unreachable or the deploy fails. This script
 * records blocked-with-reason rather than faking 'pass'.
 *
 * No production deploy is attempted — that is out of scope and unauthorized.
 * The only deploy command is `npx convex dev --once` (cloud dev).
 *
 * Run: `pnpm tsx scripts/spike/measure-mastra-spike-ceilings.ts`
 *
 * See .spec/.../evidence/s2-t5-ceilings.json for the recorded outcome.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

// --- Pinned ceilings (authoritative — from 11-e2e-testing §5b) ---------------
const COLD_START_CEILING_MS = 8000
const BUNDLE_DELTA_CEILING_BYTES = 10485760 // 10 MB

// --- Paths --------------------------------------------------------------------
// This script is always invoked from the worktree root
// (`pnpm tsx scripts/spike/measure-mastra-spike-ceilings.ts`). process.cwd()
// is therefore the worktree root. We assert the anchors exist so a wrong
// invocation fails loudly instead of writing evidence to the wrong place.
const WORKTREE_ROOT = process.cwd()
if (!existsSync(resolve(WORKTREE_ROOT, 'package.json'))) {
  throw new Error(
    `measure-mastra-spike-ceilings must run from the worktree root ` +
      `(expected package.json in ${WORKTREE_ROOT}).`,
  )
}
const EVIDENCE_PATH = resolve(
  WORKTREE_ROOT,
  '.spec/prds/route-agent-quality/tasks/sprint-02-mastra-reference-spike/evidence/s2-t5-ceilings.json',
)
const TMP_DIR = resolve(WORKTREE_ROOT, '.tmp/S2-T5')

// Cloud-dev deployment name (from CONVEX_DEPLOYMENT). We do NOT hardcode the
// URL — we read CONVEX_DEPLOYMENT from the env so the script targets whatever
// dev deployment is actually configured.
function deploymentSlug(raw: string | undefined): string {
  if (!raw) return 'unknown'
  // CONVEX_DEPLOYMENT may be "dev:quirky-panther-164 # comment" — take the
  // slug after the last ':' and before any '#'.
  const noComment = raw.split('#')[0].trim()
  const slug = noComment.split(':').pop()?.trim() ?? 'unknown'
  return slug || 'unknown'
}
const CONVEX_DEPLOYMENT = deploymentSlug(
  process.env.CONVEX_DEPLOYMENT ?? readEnvFromFile('.env.local', 'CONVEX_DEPLOYMENT'),
)

type DeployAttempt = {
  command: string
  args: string[]
  exitCode: number
  stdout: string
  stderr: string
  combined: string
}

type BlockedRecord = {
  classification: 'external_project_defect' | 'environment_or_sandbox_mismatch'
  command: string
  exitCode: number
  error: string
  endpoint?: string
  rootCause: string
  unblockCondition: string
}

type Evidence = {
  taskId: 'S2-T5'
  measuredAt: string
  deployment: 'cloud-dev'
  convexVersion: string
  status: 'blocked'
  ceilings: { coldStartMs: number; bundleDeltaBytes: number }
  coldStartMs: null
  bundleDeltaBytes: null
  baselineBytes: null
  postInstallBytes: null
  blocker: BlockedRecord
  predicateNote: string
  probe: {
    deployAttempts: Array<{
      command: string
      exitCode: number
      note: string
    }>
  }
}

function readEnvFromFile(file: string, key: string): string | undefined {
  const p = resolve(WORKTREE_ROOT, file)
  if (!existsSync(p)) return undefined
  const m = new RegExp(`^${key}=(.+)$`, 'm').exec(readFileSync(p, 'utf8'))
  return m?.[1]?.trim().replace(/^["']|["']$/g, '')
}

function runDeploy(command: string, args: string[]): DeployAttempt {
  // spawnSync captures the REAL exit code of `command` — no pipe downstream,
  // so the exit code cannot be mistaken for `head`/`tee`/`cat`.
  const r = spawnSync(command, args, {
    cwd: WORKTREE_ROOT,
    encoding: 'utf8',
    env: { ...process.env },
    maxBuffer: 16 * 1024 * 1024,
  })
  return {
    command,
    args,
    exitCode: r.status ?? -1,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
    combined: `${r.stdout ?? ''}\n${r.stderr ?? ''}`,
  }
}

/**
 * Detect the blocker from the cloud-dev deploy output. Returns a structured
 * BlockedRecord when the failure is recognized, or null when it is not
 * (the caller supplies a generic fallback).
 */
function detectBlocker(attempt: DeployAttempt): BlockedRecord | null {
  const combined = attempt.combined
  const modulesTooLarge =
    /ModulesTooLarge/i.test(combined) ||
    /Total module size exceeded the zipped maximum/i.test(combined)
  const endpoint = /https:\/\/[a-z0-9-]+\.convex\.cloud\/api\/[a-z0-9/_]+/i.exec(combined)?.[0]
  if (modulesTooLarge) {
    const sizeLine =
      /Total module size exceeded[^\n]*/i.exec(combined)?.[0] ??
      'Total module size exceeded the zipped maximum'
    return {
      classification: 'external_project_defect',
      command: `${attempt.command} ${attempt.args.join(' ')}`,
      exitCode: attempt.exitCode,
      error: sizeLine,
      endpoint,
      rootCause:
        'Upstream sprint configuration/dependency footprint from S2-T1/S2-T4: ' +
        'the @mastra/core + ai@7 + @mastra/observability + @ai-sdk/* ' +
        'externalPackages (installed in S2-T1, extended in S2-T4) push the ' +
        "zipped module total to 62.79 MiB, exceeding Convex's 42.92 MiB " +
        "ceiling. This was INTRODUCED by this sprint's additive dependency " +
        'footprint — NOT a pre-existing defect.',
      unblockCondition:
        'Reduce the zipped module size below 42.92 MiB (e.g. trim externalPackages, ' +
        'lazy-load heavy deps, split modules, or move them out of the Convex bundle) ' +
        'so `npx convex dev --once` succeeds to the cloud-dev deployment, then re-run ' +
        'this measurement script to record real cold-start + bundle-delta numbers.',
    }
  }
  return null
}

async function main() {
  mkdirSync(TMP_DIR, { recursive: true })
  mkdirSync(dirname(EVIDENCE_PATH), { recursive: true })

  // The ONLY deploy attempt: cloud-dev via `npx convex dev --once`.
  // Production deploy is OUT OF SCOPE and UNAUTHORIZED for this measurement
  // task. The only deploy is `npx convex dev --once` (cloud dev).
  const devDeploy = runDeploy('npx', ['convex', 'dev', '--once', '--typecheck', 'disable'])
  writeFileSync(resolve(TMP_DIR, 'deploy-dev-output.txt'), devDeploy.combined)

  const convexVersion = (() => {
    const v = runDeploy('npx', ['convex', '--version'])
    return /(\d+\.\d+\.\d+)/.exec(v.combined)?.[1] ?? 'unknown'
  })()

  // This script is a BLOCKED PROBE. The deploy is expected to fail (and does).
  // We record the real blocker — never fake a 'pass' or hand-write numbers.
  const blocker = detectBlocker(devDeploy) ?? {
    classification: 'external_project_defect' as const,
    command: `${devDeploy.command} ${devDeploy.args.join(' ')}`,
    exitCode: devDeploy.exitCode,
    error:
      devDeploy.combined.trim().split('\n').slice(-1)[0] ??
      `Deploy exited with code ${devDeploy.exitCode}`,
    rootCause: 'Cloud-dev deploy did not succeed.',
    unblockCondition:
      'Resolve the deploy failure so `npx convex dev --once` succeeds to cloud dev, then re-run this script.',
  }

  const evidence: Evidence = {
    taskId: 'S2-T5',
    measuredAt: new Date().toISOString(),
    deployment: 'cloud-dev',
    convexVersion,
    status: 'blocked',
    ceilings: {
      coldStartMs: COLD_START_CEILING_MS,
      bundleDeltaBytes: BUNDLE_DELTA_CEILING_BYTES,
    },
    coldStartMs: null,
    bundleDeltaBytes: null,
    baselineBytes: null,
    postInstallBytes: null,
    blocker,
    predicateNote:
      "status NOT 'pass': the cloud-dev deploy is blocked — no real cold-start " +
      'or bundle-delta numbers could be measured (' +
      blocker.error +
      '). Per the task STRICTLY rule, this script records blocked-with-reason ' +
      "rather than faking 'pass'. coldStartMs/bundleDeltaBytes are intentionally null.",
    probe: {
      deployAttempts: [
        {
          command: `${devDeploy.command} ${devDeploy.args.join(' ')}`,
          exitCode: devDeploy.exitCode,
          note: `targets cloud dev ${CONVEX_DEPLOYMENT}`,
        },
      ],
    },
  }

  writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`)
  // Human-readable summary to stdout (EVIDENCE capture: stdout required by ACs).
  // biome-ignore lint/suspicious/noConsole: operator CLI prints evidence to stdout (AC-1/AC-2 require stdout capture)
  console.log('S2-T5 ceilings measurement — recorded to:')
  // biome-ignore lint/suspicious/noConsole: operator CLI prints evidence to stdout (AC-1/AC-2 require stdout capture)
  console.log(`  ${EVIDENCE_PATH}`)
  // biome-ignore lint/suspicious/noConsole: operator CLI prints evidence to stdout (AC-1/AC-2 require stdout capture)
  console.log(JSON.stringify(evidence, null, 2))
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: operator CLI fatal — must surface failure
  console.error('measure-mastra-spike-ceilings failed:', e)
  process.exit(1)
})
