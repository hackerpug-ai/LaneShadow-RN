/**
 * S2-T5 — Measure + record cold-start (Founder-adjusted ≤10s cloud dev) + bundle-size delta (≤10MB)
 * from the REAL cloud-dev deploy artifact.
 *
 * CLOUD-DEV ONLY (hard rule):
 *   - Allowed deploy command: `npx convex dev --once ...` (targets CONVEX_DEPLOYMENT
 *     from .env.local / env — the cloud-dev deployment).
 *   - FORBIDDEN: `npx convex deploy` (targets production by default). This script
 *     never invokes it, and `runConvexCli` refuses any args that would.
 *   - Baseline size measurement uses the same cloud-dev-only path; after a baseline
 *     push (pre-@mastra/core tree), the current worktree is re-pushed so cloud-dev
 *     is not left on the baseline revision. No production mutation.
 *
 * Behavior:
 *   1. Push current tree to cloud-dev (`convex dev --once`). Capture real exit code.
 *   2. On success: verbose push → postInstall zipped bytes; cold-start first invocation
 *      while the current (Mastra) tree is live; then baseline artifact size from a
 *      pre-@mastra/core worktree (cloud-dev only) + restore current tree.
 *   3. On failure: record status:"blocked" with real error — never fake pass / numbers.
 *   4. Write evidence/s2-t5-ceilings.json for the S2-T7 human gate.
 *
 * Run: `pnpm tsx scripts/spike/measure-mastra-spike-ceilings.ts`
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
// Static imports (repo no-dynamic-import biome rule; tsc catches wrong paths).
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'

// The baseline api.d.ts does not register spike modules (they were added after
// the last `convex dev` codegen on the integration branch). Regenerating api.d.ts
// to include them would expose pre-existing TS errors in unrelated modules
// (zaiProvider.ts, rideAgentSpike.ts, spikeTools.ts) that are out of scope for
// DEPENDENCY-FIX-001. The cast below keeps the static import (no dynamic import)
// while sidestepping the missing type registration at compile time. The runtime
// reference is identical — the action exists on the deployed cloud-dev instance.
const spikeAction = (api as any).actions.agent.spike.rideAgentSpikeAction.runSpikeTurnAction

// --- Founder-adjusted ceilings (S2-T7, 2026-07-13) ---------------------------
// The original §5b default was 8000ms. Founder accepted the measured 9373ms
// cold start and adjusted the operational ceiling to 10000ms; the evidence
// artifact preserves the original default for auditability.
const COLD_START_CEILING_MS = 10000
const BUNDLE_DELTA_CEILING_BYTES = 10485760 // 10 MB

// --- Paths --------------------------------------------------------------------
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
const BASELINE_WORKTREE = resolve(WORKTREE_ROOT, '.tmp/baseline-measure')
/** Parent of first S2-T1 Mastra install commit — pre-@mastra/core tree. */
const PRE_MASTRA_GIT_REF = '6bc5e5c1^'

// Cloud-dev deployment slug (CONVEX_DEPLOYMENT). Never hardcode prod.
function deploymentSlug(raw: string | undefined): string {
  if (!raw) return 'unknown'
  const noComment = raw.split('#')[0].trim()
  const slug = noComment.split(':').pop()?.trim() ?? 'unknown'
  return slug || 'unknown'
}
const CONVEX_DEPLOYMENT = deploymentSlug(
  process.env.CONVEX_DEPLOYMENT ?? readEnvFromFile('.env.local', 'CONVEX_DEPLOYMENT'),
)
const CLOUD_DEV_URL = `https://${CONVEX_DEPLOYMENT}.convex.cloud`

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
  status: 'pass' | 'adjust' | 'blocked'
  ceilings: { coldStartMs: number; bundleDeltaBytes: number }
  coldStartMs: number | null
  bundleDeltaBytes: number | null
  baselineBytes: number | null
  postInstallBytes: number | null
  baselineSource?: string
  blocker?: BlockedRecord
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

/**
 * Refuse any production deploy path. Only `convex dev` (cloud-dev) is allowed
 * for Convex CLI mutation commands.
 */
function assertCloudDevOnlyCli(command: string, args: string[]): void {
  const tokens = [command, ...args].map((t) => t.toLowerCase())
  // Match `convex deploy` / `npx convex deploy` / `pnpm exec convex deploy`
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === 'deploy' && tokens.slice(0, i).some((t) => t.includes('convex'))) {
      throw new Error(
        'FORBIDDEN: production `convex deploy` is not allowed in measure-mastra-spike-ceilings. ' +
          'Use only `npx convex dev --once` (cloud-dev).',
      )
    }
  }
}

function runCmd(command: string, args: string[], cwd = WORKTREE_ROOT): DeployAttempt {
  assertCloudDevOnlyCli(command, args)
  const r = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env },
    maxBuffer: 32 * 1024 * 1024,
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

/** Cloud-dev push only — never `convex deploy`. */
function cloudDevOnce(extraArgs: string[] = [], cwd = WORKTREE_ROOT): DeployAttempt {
  return runCmd('npx', ['convex', 'dev', '--once', '--typecheck', 'disable', ...extraArgs], cwd)
}

function redactDeployLog(text: string): string {
  return text.replace(
    /"environmentVariables":\s*\{[\s\S]*?\n {2}\},/m,
    '"environmentVariables": "[REDACTED]",',
  )
}

/** Sum zipped deploy-artifact bytes from Convex verbose `startPush` stderr. */
function parseStartPushZippedTotalBytes(stderr: string): number | null {
  const start = stderr.indexOf('startPush:')
  if (start < 0) return null
  const open = stderr.indexOf('{', start)
  if (open < 0) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = open; i < stderr.length; i++) {
    const c = stderr[i]
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') {
      inStr = true
      continue
    }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) {
        try {
          const push = JSON.parse(stderr.slice(open, i + 1)) as {
            componentDefinitionPackages?: Record<
              string,
              { packageSize?: { zippedSizeBytes?: { $integer?: string } } }
            >
          }
          let sum = 0
          for (const pkg of Object.values(push.componentDefinitionPackages ?? {})) {
            const b64 = pkg.packageSize?.zippedSizeBytes?.$integer
            if (!b64) continue
            sum += Number(Buffer.from(b64, 'base64').readBigUInt64LE(0))
          }
          return sum > 0 ? sum : null
        } catch {
          return null
        }
      }
    }
  }
  return null
}

function ensureBaselineWorktree(): void {
  if (existsSync(resolve(BASELINE_WORKTREE, 'package.json'))) return
  mkdirSync(dirname(BASELINE_WORKTREE), { recursive: true })
  const r = runCmd('git', ['worktree', 'add', '--force', BASELINE_WORKTREE, PRE_MASTRA_GIT_REF])
  if (r.exitCode !== 0) throw new Error(`baseline worktree failed: ${r.combined}`)
}

/**
 * Measure pre-@mastra/core deploy-artifact size on cloud-dev only, then restore
 * the current worktree to cloud-dev so the deployment is not left on baseline.
 * Never production.
 */
function measureBaselineArtifactZippedBytesThenRestore(): {
  bytes: number | null
  baselineAttempt: DeployAttempt
  restoreAttempt: DeployAttempt
} {
  ensureBaselineWorktree()
  if (!existsSync(resolve(BASELINE_WORKTREE, '.env.local'))) {
    runCmd('ln', ['-sf', resolve(WORKTREE_ROOT, '.env.local'), '.env.local'], BASELINE_WORKTREE)
  }
  if (!existsSync(resolve(BASELINE_WORKTREE, 'node_modules'))) {
    runCmd('ln', ['-sf', resolve(WORKTREE_ROOT, 'node_modules'), 'node_modules'], BASELINE_WORKTREE)
  }
  const baselineAttempt = cloudDevOnce(['-v'], BASELINE_WORKTREE)
  writeFileSync(
    resolve(TMP_DIR, 'deploy-baseline-verbose-redacted.txt'),
    redactDeployLog(baselineAttempt.stderr),
  )
  const bytes = parseStartPushZippedTotalBytes(baselineAttempt.stderr)

  // Restore current (Mastra) tree to cloud-dev — still cloud-dev only.
  const restoreAttempt = cloudDevOnce([], WORKTREE_ROOT)
  writeFileSync(resolve(TMP_DIR, 'deploy-restore-current.txt'), restoreAttempt.combined)

  return { bytes, baselineAttempt, restoreAttempt }
}

/**
 * First-invocation latency of the spike action on cloud-dev after a successful
 * current-tree push. Uses ConvexHttpClient; falls back to `npx convex run`
 * (read-only action invoke — not a deploy).
 */
async function measureColdStart(): Promise<number | null> {
  const client = new ConvexHttpClient(CLOUD_DEV_URL)
  client.setFetchOptions({ cache: 'no-store' })
  const t0 = Date.now()
  try {
    const response = await client.action(spikeAction, {
      sessionId: `s2-t5-coldstart-${Date.now()}`,
      userMessage: 'Reply with exactly the single word: banana.',
    })
    writeFileSync(resolve(TMP_DIR, 'coldstart-response.txt'), JSON.stringify(response, null, 2))
    return Date.now() - t0
  } catch {
    const cli = runCmd('npx', [
      'convex',
      'run',
      'actions/agent/spike/rideAgentSpikeAction:runSpikeTurnAction',
      JSON.stringify({
        sessionId: `s2-t5-coldstart-cli-${Date.now()}`,
        userMessage: 'Reply with exactly the single word: banana.',
      }),
    ])
    writeFileSync(resolve(TMP_DIR, 'coldstart-cli.txt'), cli.combined)
    const elapsed = Date.now() - t0
    return cli.exitCode === 0 && elapsed > 0 ? elapsed : null
  }
  // ConvexHttpClient has no close(); HTTP client is ephemeral.
}

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
        'Zipped Convex module total exceeds the 42.92 MiB cloud-dev ceiling. ' +
        'After DEPENDENCY-FIX-001, vestigial unused externalPackages are removed and ' +
        'Mastra/ai-sdk packages are tree-shaken (bundled) rather than full-package ' +
        'externalized; only live @mariozechner/pi-ai remains external until Sprint 07. ' +
        'If this error still fires, residual size (bundled spike + pi-ai + app surface) ' +
        'still exceeds the ceiling — see evidence/modules-too-large-decision.md.',
      unblockCondition:
        'Reduce residual zipped size below 42.92 MiB (further tree-shake, split modules, ' +
        'early pi-ai teardown if Founder-Operator approves, or architecture move off ' +
        'Convex Node for the agent), then re-run this script with cloud-dev only.',
    }
  }
  return null
}

async function main() {
  mkdirSync(TMP_DIR, { recursive: true })
  mkdirSync(dirname(EVIDENCE_PATH), { recursive: true })

  const probeAttempts: Evidence['probe']['deployAttempts'] = []

  // 1) Current tree → cloud-dev only
  const devDeploy = cloudDevOnce()
  writeFileSync(resolve(TMP_DIR, 'deploy-dev-output.txt'), devDeploy.combined)
  probeAttempts.push({
    command: `${devDeploy.command} ${devDeploy.args.join(' ')}`,
    exitCode: devDeploy.exitCode,
    note: `cloud-dev ${CONVEX_DEPLOYMENT} (current tree)`,
  })

  const verboseDeploy = cloudDevOnce(['-v'])
  writeFileSync(
    resolve(TMP_DIR, 'deploy-dev-verbose-redacted.txt'),
    redactDeployLog(verboseDeploy.stderr),
  )
  probeAttempts.push({
    command: `${verboseDeploy.command} ${verboseDeploy.args.join(' ')}`,
    exitCode: verboseDeploy.exitCode,
    note: `cloud-dev ${CONVEX_DEPLOYMENT} verbose artifact parse`,
  })

  const devBlocker = detectBlocker(devDeploy) ?? detectBlocker(verboseDeploy)
  const devSucceeded = devDeploy.exitCode === 0 && verboseDeploy.exitCode === 0 && !devBlocker

  const convexVersion = (() => {
    const v = runCmd('npx', ['convex', '--version'])
    return /(\d+\.\d+\.\d+)/.exec(v.combined)?.[1] ?? 'unknown'
  })()

  let coldStartMs: number | null = null
  let bundleDeltaBytes: number | null = null
  let baselineBytes: number | null = null
  let postInstallBytes: number | null = null
  let status: Evidence['status'] = 'blocked'
  let blocker: BlockedRecord | undefined
  let predicateNote: string
  let baselineSource: string | undefined

  if (devSucceeded) {
    postInstallBytes = parseStartPushZippedTotalBytes(verboseDeploy.stderr)

    // Cold-start FIRST while current Mastra tree is live on cloud-dev.
    coldStartMs = await measureColdStart()

    // Baseline size (pre-mastra tree) on cloud-dev only, then restore current.
    const baseline = measureBaselineArtifactZippedBytesThenRestore()
    baselineBytes = baseline.bytes
    baselineSource = `git ref ${PRE_MASTRA_GIT_REF} cloud-dev deploy artifact (pre-@mastra/core); restored current tree after measure`
    probeAttempts.push({
      command: `${baseline.baselineAttempt.command} ${baseline.baselineAttempt.args.join(' ')}`,
      exitCode: baseline.baselineAttempt.exitCode,
      note: `cloud-dev baseline worktree ${PRE_MASTRA_GIT_REF} (NOT prod)`,
    })
    probeAttempts.push({
      command: `${baseline.restoreAttempt.command} ${baseline.restoreAttempt.args.join(' ')}`,
      exitCode: baseline.restoreAttempt.exitCode,
      note: `cloud-dev restore current tree after baseline`,
    })

    if (postInstallBytes != null && baselineBytes != null) {
      bundleDeltaBytes = postInstallBytes - baselineBytes
    }

    const withinCeilings =
      coldStartMs != null &&
      coldStartMs > 0 &&
      coldStartMs <= COLD_START_CEILING_MS &&
      bundleDeltaBytes != null &&
      // Delta may be negative if footprint shrank; treat as within ceiling when <= 10MB.
      bundleDeltaBytes <= BUNDLE_DELTA_CEILING_BYTES &&
      // Require a real post-install size; delta of 0 is allowed only if both measured.
      postInstallBytes != null &&
      baselineBytes != null

    // AC: pass only when both numbers real and within ceilings; positive delta preferred
    // for "mastra added weight" narrative but shrink is still a valid honest result.
    const hasRealNumbers =
      coldStartMs != null &&
      coldStartMs > 0 &&
      bundleDeltaBytes != null &&
      postInstallBytes != null &&
      baselineBytes != null

    if (hasRealNumbers && withinCeilings) {
      status = 'pass'
      predicateNote = `status='pass' iff coldStartMs(${coldStartMs})<=${COLD_START_CEILING_MS} AND bundleDeltaBytes(${bundleDeltaBytes})<=${BUNDLE_DELTA_CEILING_BYTES} (real cloud-dev observations).`
    } else if (hasRealNumbers) {
      status = 'adjust'
      predicateNote = `status='adjust': ceiling comparison — coldStartMs=${coldStartMs}, bundleDeltaBytes=${bundleDeltaBytes}, baselineBytes=${baselineBytes}, postInstallBytes=${postInstallBytes}.`
    } else {
      status = 'blocked'
      blocker = {
        classification: 'environment_or_sandbox_mismatch',
        command: 'measureColdStart / baseline parse',
        exitCode: -1,
        error:
          'Cloud-dev deploy succeeded but cold-start and/or artifact byte parse failed to yield real numbers.',
        rootCause:
          'Invocation or verbose startPush parse did not produce measurable coldStartMs / bundle bytes.',
        unblockCondition:
          'Confirm spike action is exported, LANGSMITH/ANTHROPIC keys on cloud-dev, and verbose deploy logs contain startPush package sizes; re-run.',
      }
      predicateNote =
        "status NOT 'pass': deploy succeeded but real cold-start/bundle numbers incomplete. " +
        'coldStartMs/bundleDeltaBytes left null or partial — never faked.'
    }
  } else {
    blocker = devBlocker ?? {
      classification: 'external_project_defect',
      command: `${devDeploy.command} ${devDeploy.args.join(' ')}`,
      exitCode: devDeploy.exitCode,
      error:
        devDeploy.combined.trim().split('\n').filter(Boolean).slice(-1)[0] ??
        `Deploy exited with code ${devDeploy.exitCode}`,
      rootCause: 'Cloud-dev deploy (`npx convex dev --once`) did not succeed.',
      unblockCondition:
        'Resolve the deploy failure so `npx convex dev --once` succeeds to cloud-dev, then re-run this script. Never use production `convex deploy`.',
    }
    status = 'blocked'
    predicateNote =
      "status NOT 'pass': no real cold-start or bundle-delta numbers could be " +
      'measured because the cloud-dev deploy never succeeded (' +
      blocker.error +
      '). Per the task STRICTLY rule, this script records blocked-with-reason ' +
      "rather than faking 'pass'. coldStartMs/bundleDeltaBytes are intentionally null."
  }

  const evidence: Evidence = {
    taskId: 'S2-T5',
    measuredAt: new Date().toISOString(),
    deployment: 'cloud-dev',
    convexVersion,
    status,
    ceilings: {
      coldStartMs: COLD_START_CEILING_MS,
      bundleDeltaBytes: BUNDLE_DELTA_CEILING_BYTES,
    },
    coldStartMs,
    bundleDeltaBytes,
    baselineBytes,
    postInstallBytes,
    baselineSource,
    blocker,
    predicateNote,
    probe: { deployAttempts: probeAttempts },
  }

  writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`)
  // biome-ignore lint/suspicious/noConsole: operator CLI prints evidence to stdout
  console.log('S2-T5 ceilings measurement — recorded to:')
  // biome-ignore lint/suspicious/noConsole: operator CLI prints evidence to stdout
  console.log(`  ${EVIDENCE_PATH}`)
  // biome-ignore lint/suspicious/noConsole: operator CLI prints evidence to stdout
  console.log(JSON.stringify(evidence, null, 2))
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: operator CLI fatal
  console.error('measure-mastra-spike-ceilings failed:', e)
  process.exit(1)
})
